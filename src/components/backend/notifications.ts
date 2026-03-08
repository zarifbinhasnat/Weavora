import { db } from "./firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  Timestamp,
} from "firebase/firestore";

/* =====================================================
   TYPES
===================================================== */

export interface StudentNotification {
  id: string;
  type: "chat" | "discussion";
  studentName: string;
  courseName: string;
  courseId: string;
  preview: string;
  timestamp: Timestamp | null;
}

/* =====================================================
   FORMAT HELPER
===================================================== */

export function formatNotificationTime(ts: Timestamp | null): string {
  if (!ts) return "";

  const date = ts.toDate();
  return date.toLocaleString();
}

/* =====================================================
   REALTIME LISTENER
===================================================== */

export function listenToStudentNotifications(
  teacherUid: string,
  callback: (notifications: StudentNotification[]) => void
) {
  const chatNotifications: Map<string, StudentNotification[]> = new Map();
  const discussionNotifications: Map<string, StudentNotification[]> = new Map();
  const courseNames: Map<string, string> = new Map();

  const unsubscribers: (() => void)[] = [];

  /* ---------- Merge and push notifications ---------- */

  const flushNotifications = () => {
    const all: StudentNotification[] = [];

    chatNotifications.forEach((items) => all.push(...items));
    discussionNotifications.forEach((items) => all.push(...items));

    all.sort((a, b) => {
      const ta = a.timestamp?.toMillis?.() ?? 0;
      const tb = b.timestamp?.toMillis?.() ?? 0;
      return tb - ta;
    });

    callback(all);
  };

  /* ---------- Listen to teacher courses ---------- */

  const coursesQuery = query(
    collection(db, "courses"),
    where("teacherId", "==", teacherUid)
  );

  const unsubscribeCourses = onSnapshot(coursesQuery, (coursesSnap) => {

    // Clear previous listeners
    unsubscribers.forEach((fn) => fn());
    unsubscribers.length = 0;

    chatNotifications.clear();
    discussionNotifications.clear();

    if (coursesSnap.empty) {
      callback([]);
      return;
    }

    coursesSnap.forEach((courseDoc) => {

      const courseId = courseDoc.id;
      const data = courseDoc.data();

      const courseName =
        (data.name ?? data.title ?? "Unnamed Course") as string;

      courseNames.set(courseId, courseName);

      /* ======================================
         CHAT MESSAGES LISTENER
      ====================================== */

      const chatQuery = query(
        collection(db, "courses", courseId, "chatMessages"),
        orderBy("timestamp", "desc"),
        limit(15)
      );

      const unsubscribeChat = onSnapshot(chatQuery, (chatSnap) => {

        const items: StudentNotification[] = [];

        chatSnap.forEach((docItem) => {
          const msg = docItem.data();

          if (msg.userId === teacherUid) return;
          if (typeof msg.message !== "string") return;

          items.push({
            id: `chat-${courseId}-${docItem.id}`,
            type: "chat",
            studentName: msg.userName || "A student",
            courseName: courseNames.get(courseId) || courseName,
            courseId,
            preview: msg.message.slice(0, 120),
            timestamp: msg.timestamp ?? null,
          });
        });

        chatNotifications.set(courseId, items);
        flushNotifications();
      });

      unsubscribers.push(unsubscribeChat);

      /* ======================================
         DISCUSSION POSTS LISTENER
      ====================================== */

      const postQuery = query(
        collection(db, "courses", courseId, "discussionPosts"),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      const unsubscribePost = onSnapshot(postQuery, (postSnap) => {

        const items: StudentNotification[] = [];

        postSnap.forEach((docItem) => {
          const post = docItem.data();

          if (post.userId === teacherUid) return;
          if (typeof post.title !== "string") return;

          items.push({
            id: `post-${courseId}-${docItem.id}`,
            type: "discussion",
            studentName: post.userName || "A student",
            courseName: courseNames.get(courseId) || courseName,
            courseId,
            preview: post.title,
            timestamp: post.timestamp ?? null,
          });
        });

        discussionNotifications.set(courseId, items);
        flushNotifications();
      });

      unsubscribers.push(unsubscribePost);

    });
  });

  /* ---------- Return master unsubscribe ---------- */

  return () => {
    unsubscribeCourses();
    unsubscribers.forEach((fn) => fn());
  };
}