import { db } from "./firebase";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    getDocs,
    limit,
    Timestamp,
} from "firebase/firestore";

/* ================= TYPES ================= */

export interface StudentNotification {
    id: string;
    type: "chat" | "discussion";
    studentName: string;
    courseName: string;
    courseId: string;
    preview: string;
    timestamp: Timestamp | null;
}

/* ================= LISTENER ================= */

/**
 * Listen in real-time for new student messages and discussion posts
 * across ALL courses owned by the given teacher.
 *
 * Returns an unsubscribe function that tears down every listener.
 */
export function listenToStudentNotifications(
    teacherUid: string,
    callback: (notifications: StudentNotification[]) => void
) {
    // We'll accumulate notifications from multiple listeners
    const chatNotifs: Map<string, StudentNotification[]> = new Map();
    const postNotifs: Map<string, StudentNotification[]> = new Map();
    const courseNames: Map<string, string> = new Map();
    const unsubscribers: (() => void)[] = [];

    // Helper: merge all maps and push to callback
    const flush = () => {
        const all: StudentNotification[] = [];
        chatNotifs.forEach((arr) => all.push(...arr));
        postNotifs.forEach((arr) => all.push(...arr));

        // Sort newest first
        all.sort((a, b) => {
            const ta = a.timestamp?.toMillis?.() ?? 0;
            const tb = b.timestamp?.toMillis?.() ?? 0;
            return tb - ta;
        });

        callback(all);
    };

    // Step 1: listen to the teacher's courses
    const coursesQuery = query(
        collection(db, "courses"),
        where("teacherId", "==", teacherUid)
    );

    const unsubCourses = onSnapshot(coursesQuery, (coursesSnap) => {
        // Tear down previous per-course listeners when course list changes
        unsubscribers.forEach((fn) => fn());
        unsubscribers.length = 0;
        chatNotifs.clear();
        postNotifs.clear();

        if (coursesSnap.empty) {
            callback([]);
            return;
        }

        coursesSnap.docs.forEach((courseDoc) => {
            const courseId = courseDoc.id;
            const courseData = courseDoc.data();
            const courseName = (courseData.name ?? courseData.title ?? "Unnamed Class") as string;
            courseNames.set(courseId, courseName);

            // --- Chat messages listener (latest 15 per course) ---
            const chatQ = query(
                collection(db, "courses", courseId, "chatMessages"),
                orderBy("timestamp", "desc"),
                limit(15)
            );

            const unsubChat = onSnapshot(chatQ, (chatSnap) => {
                const items: StudentNotification[] = [];
                chatSnap.forEach((d) => {
                    const data = d.data();
                    // Skip messages from the teacher
                    if (data.userId === teacherUid) return;
                    if (typeof data.message !== "string") return;

                    items.push({
                        id: `chat-${courseId}-${d.id}`,
                        type: "chat",
                        studentName: data.userName || "A student",
                        courseName: courseNames.get(courseId) || courseName,
                        courseId,
                        preview: data.message.slice(0, 120),
                        timestamp: data.timestamp ?? null,
                    });
                });

                chatNotifs.set(courseId, items);
                flush();
            });

            unsubscribers.push(unsubChat);

            // --- Discussion posts listener (latest 10 per course) ---
            const postQ = query(
                collection(db, "courses", courseId, "discussionPosts"),
                orderBy("timestamp", "desc"),
                limit(10)
            );

            const unsubPost = onSnapshot(postQ, (postSnap) => {
                const items: StudentNotification[] = [];
                postSnap.forEach((d) => {
                    const data = d.data();
                    if (data.userId === teacherUid) return;
                    if (typeof data.title !== "string") return;

                    items.push({
                        id: `post-${courseId}-${d.id}`,
                        type: "discussion",
                        studentName: data.userName || "A student",
                        courseName: courseNames.get(courseId) || courseName,
                        courseId,
                        preview: data.title,
                        timestamp: data.timestamp ?? null,
                    });
                });

                postNotifs.set(courseId, items);
                flush();
            });

            unsubscribers.push(unsubPost);
        });
    });

    // Return master unsubscribe
    return () => {
        unsubCourses();
        unsubscribers.forEach((fn) => fn());
    };
}
