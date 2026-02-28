import { db } from "./firebase";
import { getDocs, collection, query, where, orderBy, limit } from "firebase/firestore";
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
