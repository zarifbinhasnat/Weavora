import { db } from "./firebase";
import { getDocs, collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc, deleteDoc, setDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { getAllRecentAnnouncements, CourseAnnouncement } from "./announcements";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time?: string | number;
  read?: boolean;
  type: "announcement" | "deadline" | "message" | "member" | "other";
  meta?: any;
};

export async function fetchTeacherNotifications(userId?: string): Promise<NotificationItem[]> {
  // Aggregate announcements and upcoming deadlines. If `db` is not initialized, return empty array.
  const results: NotificationItem[] = [];

  try {
    // Announcements
    const anns: CourseAnnouncement[] = await getAllRecentAnnouncements();
    anns.forEach((a) => {
      results.push({
        id: `ann_${a.id}`,
        title: a.title || "Announcement",
        message: a.text || "",
        time: a.createdAt || Date.now(),
        read: false,
        type: "announcement",
        meta: a,
      });
    });
  } catch (err) {
    console.debug("No announcements available or fetch failed:", err);
  }

  // Deadlines (upcoming for this teacher)
  try {
    if (!db || !userId) throw new Error("No db or userId");

    const q = query(collection(db, "deadlines"), where("userId", "==", userId), orderBy("dueDate", "asc"), limit(10));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      const data = d.data() as any;
      const dueDate = data.dueDate?.toDate?.() ?? null;
      results.push({
        id: `dl_${d.id}`,
        title: data.title ?? "Upcoming deadline",
        message: `Due ${dueDate ? dueDate.toLocaleString() : "soon"} — ${data.course ?? ""}`,
        time: dueDate ?? Date.now(),
        read: false,
        type: "deadline",
        meta: { ...data, id: d.id },
      });
    });
  } catch (err) {
    console.debug("Deadlines fetch skipped or failed:", err);
  }

  // Sort by time (newest first)
  results.sort((a, b) => {
    const ta = typeof a.time === "number" ? a.time : (a.time as any)?.seconds ? (a.time as any).seconds * 1000 : Date.parse(String(a.time) || "0");
    const tb = typeof b.time === "number" ? b.time : (b.time as any)?.seconds ? (b.time as any).seconds * 1000 : Date.parse(String(b.time) || "0");
    return tb - ta;
  });

  return results;
}

export function listenTeacherNotifications(userId: string | undefined, onChange: (items: NotificationItem[]) => void) {
  if (!db) {
    return () => {};
  }

  const unsubscribes: Array<() => void> = [];

  // keep latest arrays and merge on updates
  let latestAnns: NotificationItem[] = [];
  let latestDls: NotificationItem[] = [];
  let latestTeacherNotifs: NotificationItem[] = [];
  // per-user read flags
  let latestReads: Record<string, boolean> = {};
  // per-user dismissed flags
  let latestDismissed: Record<string, boolean> = {};

  // Helper function to merge and filter notifications
  const emitCombined = () => {
    const combined = [
      ...latestAnns.map(a => ({ ...a, read: latestReads[a.id] ?? a.read })),
      ...latestDls.map(d => ({ ...d, read: latestReads[d.id] ?? d.read })),
      ...latestTeacherNotifs.map(t => ({ ...t, read: latestReads[t.id] ?? t.read }))
    ]
      .filter(n => !latestDismissed[n.id]) // Filter out dismissed notifications
      .sort((a, b) => (b.time as any) - (a.time as any));
    onChange(combined);
  };

  // Listen to teacher-specific notifications (from student actions)
  try {
    if (userId) {
      const qTeacher = query(
        collection(db, "teacherNotifications"),
        where("teacherId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const unT = onSnapshot(qTeacher, (snap) => {
        latestTeacherNotifs = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: `tn_${d.id}`,
            title: data.title ?? "Notification",
            message: data.message ?? "",
            time: data.createdAt ?? Date.now(),
            read: latestReads[`tn_${d.id}`] ?? data.read ?? false,
            type: data.type ?? "other",
            meta: data.meta ?? {},
          } as NotificationItem;
        });
        emitCombined();
      }, (err) => console.error(err));
      unsubscribes.push(unT);
    }
  } catch (err) {
    console.error("listenTeacherNotifications: teacher notifs listener failed", err);
  }

  // announcements - listen to latest classroomPosts type=announcement
  try {
    const q = query(collection(db, "classroomPosts"), where("type", "==", "announcement"), orderBy("createdAt", "desc"), limit(20));
    const unA = onSnapshot(q, (snap) => {
      latestAnns = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: `ann_${d.id}`,
          title: data.title ?? "Announcement",
          message: data.content ?? data.text ?? "",
          time: data.createdAt ?? Date.now(),
          read: latestReads[`ann_${d.id}`] ?? data.read ?? false,
          type: "announcement",
          meta: { id: d.id, ...data },
        } as NotificationItem;
      });
      emitCombined();
    }, (err) => console.error(err));
    unsubscribes.push(unA);
  } catch (err) {
    console.error("listenTeacherNotifications: announcements listener failed", err);
  }

  // deadlines for user
  try {
    if (userId) {
      const qd = query(collection(db, "deadlines"), where("userId", "==", userId), orderBy("dueDate", "asc"));
      const unD = onSnapshot(qd, (snap) => {
        latestDls = snap.docs.map((d) => {
          const data = d.data() as any;
          const dueDate = data.dueDate?.toDate?.() ?? null;
          return {
            id: `dl_${d.id}`,
            title: data.title ?? "Upcoming deadline",
            message: `Due ${dueDate ? dueDate.toLocaleString() : "soon"} — ${data.course ?? ""}`,
            time: dueDate ?? Date.now(),
            read: latestReads[`dl_${d.id}`] ?? data.read ?? false,
            type: "deadline",
            meta: { id: d.id, ...data },
          };
        });
        emitCombined();
      }, (err) => console.error(err));
      unsubscribes.push(unD);
    }
  } catch (err) {
    console.error("listenTeacherNotifications: deadlines listener failed", err);
  }

  // listen to per-user read flags to merge into items
  try {
    if (userId) {
      const qr = query(collection(db, "notificationReads"), where("userId", "==", userId));
      const unR = onSnapshot(qr, (snap) => {
        latestReads = {};
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          if (data && data.notificationId) latestReads[data.notificationId] = !!data.read;
        });
        emitCombined();
      }, (err) => console.error(err));
      unsubscribes.push(unR);
    }
  } catch (err) {
    console.error("listenTeacherNotifications: notificationReads listener failed", err);
  }

  // listen to per-user dismissed flags to filter out items
  try {
    if (userId) {
      const qDismiss = query(collection(db, "notificationDismissed"), where("userId", "==", userId));
      const unDismiss = onSnapshot(qDismiss, (snap) => {
        latestDismissed = {};
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          if (data && data.notificationId) latestDismissed[data.notificationId] = !!data.dismissed;
        });
        emitCombined();
      }, (err) => console.error(err));
      unsubscribes.push(unDismiss);
    }
  } catch (err) {
    console.error("listenTeacherNotifications: notificationDismissed listener failed", err);
  }

  return () => {
    unsubscribes.forEach((u) => u());
  };
}

export async function markNotificationRead(notificationId: string, userId?: string) {
  try {
    if (!db) {
      return;
    }

    // If deadline doc exists, try to mark it read there too (backwards-compat)
    if (notificationId.startsWith("dl_")) {
      const id = notificationId.replace(/^dl_/, "");
      try {
        await updateDoc(doc(db, "deadlines", id), { read: true });
      } catch (err) {
        // Silent fail for backwards compatibility
      }
    }

    // Persist per-user read state into `notificationReads` collection so badge is per-user
    if (userId) {
      const key = `${userId}_${notificationId}`;
      try {
        await setDoc(doc(db, "notificationReads", key), {
          userId,
          notificationId,
          read: true,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("markNotificationRead: failed to persist notificationReads", err);
      }
    }
  } catch (err) {
    console.error("markNotificationRead failed", err);
  }
}

export async function removeNotification(notificationId: string, userId?: string) {
  try {
    if (!db) {
      return;
    }

    // For deadline notifications, actually delete the document
    if (notificationId.startsWith("dl_")) {
      const id = notificationId.replace(/^dl_/, "");
      try {
        await deleteDoc(doc(db, "deadlines", id));
      } catch (err) {
        console.error("Failed to delete deadline:", err);
      }
    }

    // For all notification types, persist the dismissed state per user
    // This ensures the notification won't appear again for this user
    if (userId) {
      const key = `${userId}_${notificationId}`;
      try {
        await setDoc(doc(db, "notificationDismissed", key), {
          userId,
          notificationId,
          dismissed: true,
          dismissedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Failed to persist dismissal:", err);
      }
    }
  } catch (err) {
    console.error("removeNotification failed:", err);
  }
}

/**
 * Create a teacher notification (for student actions)
 */
export async function createTeacherNotification(
  teacherId: string,
  title: string,
  message: string,
  type: "announcement" | "deadline" | "message" | "member" | "other",
  meta?: any
) {
  try {
    if (!db) {
      return;
    }

    await addDoc(collection(db, "teacherNotifications"), {
      teacherId,
      title,
      message,
      type,
      read: false,
      createdAt: serverTimestamp(),
      meta: meta || {},
    });
  } catch (err) {
    console.error("Failed to create teacher notification:", err);
  }
}

/**
 * Notify teacher when student sends a message
 */
export async function notifyTeacherOfMessage(
  courseId: string,
  studentName: string,
  messagePreview: string
) {
  try {
    if (!db) return;

    // Get the course to find the teacher
    const courseDoc = await getDocs(query(collection(db, "courses"), where("code", "==", courseId)));
    
    if (courseDoc.empty) return;

    const courseData = courseDoc.docs[0].data();
    const teacherId = courseData.teacherId || courseData.instructorId;

    if (!teacherId) return;

    await createTeacherNotification(
      teacherId,
      `New message in ${courseId}`,
      `${studentName}: ${messagePreview}`,
      "message",
      { courseId, studentName }
    );
  } catch (err) {
    console.error("Failed to notify teacher of message:", err);
  }
}

/**
 * Notify teacher when student creates a post
 */
export async function notifyTeacherOfPost(
  courseId: string,
  studentName: string,
  postTitle: string,
  postType: "discussion" | "announcement"
) {
  try {
    if (!db) return;

    // Get the course to find the teacher
    const courseDoc = await getDocs(query(collection(db, "courses"), where("code", "==", courseId)));
    
    if (courseDoc.empty) return;

    const courseData = courseDoc.docs[0].data();
    const teacherId = courseData.teacherId || courseData.instructorId;

    if (!teacherId) return;

    await createTeacherNotification(
      teacherId,
      `New ${postType} in ${courseId}`,
      `${studentName} posted: ${postTitle}`,
      postType === "announcement" ? "announcement" : "message",
      { courseId, studentName, postTitle, postType }
    );
  } catch (err) {
    console.error("Failed to notify teacher of post:", err);
  }
}

/**
 * Notify teacher when student comments on a post
 */
export async function notifyTeacherOfComment(
  courseId: string,
  studentName: string,
  commentText: string
) {
  try {
    if (!db) return;

    // Get the course to find the teacher
    const courseDoc = await getDocs(query(collection(db, "courses"), where("code", "==", courseId)));
    
    if (courseDoc.empty) return;

    const courseData = courseDoc.docs[0].data();
    const teacherId = courseData.teacherId || courseData.instructorId;

    if (!teacherId) return;

    const commentPreview = commentText.length > 50 ? commentText.substring(0, 50) + "..." : commentText;

    await createTeacherNotification(
      teacherId,
      `New comment in ${courseId}`,
      `${studentName} commented: ${commentPreview}`,
      "message",
      { courseId, studentName, commentText: commentPreview }
    );
  } catch (err) {
    console.error("Failed to notify teacher of comment:", err);
  }
}
