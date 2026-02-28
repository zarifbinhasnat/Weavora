import { db } from "./firebase";
import { getDocs, collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
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
    console.debug("listenTeacherNotifications: no db initialized");
    return () => {};
  }

  const unsubscribes: Array<() => void> = [];

  // keep latest arrays and merge on updates
  let latestAnns: NotificationItem[] = [];
  let latestDls: NotificationItem[] = [];
  // per-user read flags
  let latestReads: Record<string, boolean> = {};

  // announcements - listen to latest classroomPosts type=announcement
  try {
    const q = query(collection(db, "classroomPosts"), where("type", "==", "announcement"), orderBy("createdAt", "desc"), limit(20));
    const unA = onSnapshot(q, (snap) => {
      console.debug("listenTeacherNotifications: classroomPosts snapshot, docs:", snap.docs.length);
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
      const combined = [...latestAnns, ...latestDls];
      combined.sort((a,b) => (b.time as any) - (a.time as any));
      onChange(combined);
    }, (err) => console.error(err));
    unsubscribes.push(unA);
  } catch (err) {
    console.debug("listenTeacherNotifications: announcements listener failed", err);
  }

  // deadlines for user
  try {
    if (userId) {
      const qd = query(collection(db, "deadlines"), where("userId", "==", userId), orderBy("dueDate", "asc"));
      const unD = onSnapshot(qd, (snap) => {
        console.debug("listenTeacherNotifications: deadlines snapshot, docs:", snap.docs.length);
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
        const combined = [...latestAnns, ...latestDls];
        combined.sort((a,b) => (b.time as any) - (a.time as any));
        onChange(combined);
      }, (err) => console.error(err));
      unsubscribes.push(unD);
    }
  } catch (err) {
    console.debug("listenTeacherNotifications: deadlines listener failed", err);
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
        // rebuild combined view using latest read flags
        const combined = [...latestAnns.map(a => ({ ...a, read: latestReads[a.id] ?? a.read })), ...latestDls.map(d => ({ ...d, read: latestReads[d.id] ?? d.read }))];
        combined.sort((a,b) => (b.time as any) - (a.time as any));
        console.debug("notificationReads snapshot received, merged reads:", latestReads);
        onChange(combined);
      }, (err) => console.error(err));
      unsubscribes.push(unR);
    }
  } catch (err) {
    console.debug("listenTeacherNotifications: notificationReads listener failed", err);
  }

  return () => {
    unsubscribes.forEach((u) => u());
  };
}

export async function markNotificationRead(notificationId: string, userId?: string) {
  try {
    if (!db) {
      console.debug("markNotificationRead: no db");
      return;
    }

    // If deadline doc exists, try to mark it read there too (backwards-compat)
    if (notificationId.startsWith("dl_")) {
      const id = notificationId.replace(/^dl_/, "");
      try {
        await updateDoc(doc(db, "deadlines", id), { read: true });
        console.debug(`markNotificationRead: updated deadlines/${id} read=true`);
      } catch (err) {
        console.debug("markNotificationRead: failed to update deadlines doc", err);
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
        console.debug(`markNotificationRead: persisted read for ${notificationId} as ${key}`);
      } catch (err) {
        console.error("markNotificationRead: failed to persist notificationReads", err);
      }
    } else {
      console.debug("markNotificationRead: no userId provided, skipping per-user persistence");
    }
  } catch (err) {
    console.debug("markNotificationRead failed", err);
  }
}

export async function removeNotification(notificationId: string) {
  try {
    if (!db) return;
    if (notificationId.startsWith("dl_")) {
      const id = notificationId.replace(/^dl_/, "");
      await deleteDoc(doc(db, "deadlines", id)).catch(() => {});
    }
  } catch (err) {
    console.debug("removeNotification failed", err);
  }
}
