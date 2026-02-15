import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  collectionGroup,
  getDocs,
  limit,
  where,
} from "firebase/firestore";

// ... (existing code)

export async function getAllRecentAnnouncements(): Promise<CourseAnnouncement[]> {
  try {
    // Teacher creates posts in the "classroomPosts" collection with type="announcement"
    // We query that collection directly — no collection group index needed
    const q = query(
      collection(db, "classroomPosts"),
      where("type", "==", "announcement"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const snap = await getDocs(q);
    console.log(`📋 getAllRecentAnnouncements: found ${snap.docs.length} docs`);

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title ?? "",
        text: data.content ?? data.text ?? "",
        authorName: data.author ?? data.authorName ?? "",
        pinned: Boolean(data.pinned),
        createdAt: data.createdAt,
      };
    });
  } catch (error) {
    console.error("Error fetching all announcements:", error);
    return [];
  }
}

export type CourseAnnouncement = {
  id: string;
  title: string;
  text: string;
  authorName: string;
  pinned: boolean;
  createdAt?: any;
};

export async function createAnnouncement(params: {
  courseId: string;
  title: string;
  text: string;
  authorName: string;
  pinned?: boolean;
}) {
  const ref = collection(db, "courses", params.courseId, "announcements");

  await addDoc(ref, {
    title: params.title.trim(),
    text: params.text.trim(),
    authorName: params.authorName.trim(),
    pinned: Boolean(params.pinned),
    createdAt: serverTimestamp(),
  });
}

export function listenAnnouncements(
  courseId: string,
  onChange: (items: CourseAnnouncement[]) => void,
  onError?: (err: unknown) => void
) {
  // Show pinned first? easiest without indexes:
  // order by pinned desc then createdAt desc would need index.
  // So for now: order by createdAt desc, then client-sort pinned.
  const q = query(
    collection(db, "courses", courseId, "announcements"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const items: CourseAnnouncement[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          title: data.title ?? "",
          text: data.text ?? "",
          authorName: data.authorName ?? "",
          pinned: Boolean(data.pinned),
          createdAt: data.createdAt,
        };
      });

      // client-side pinned first
      items.sort((a, b) => Number(b.pinned) - Number(a.pinned));

      onChange(items);
    },
    (err) => {
      console.error(err);
      onError?.(err);
    }
  );
}
