import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

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
