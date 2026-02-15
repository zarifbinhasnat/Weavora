import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

/* ---------------- POSTS ---------------- */

/* ---------------- POSTS ---------------- */

export const createPost = async (
  title: string,
  content: string,
  author: string,
  type: "announcement" | "discussion",
  courseId: string
) => {
  await addDoc(collection(db, "classroomPosts"), {
    title,
    content,
    author,
    type,
    courseId,
    createdAt: serverTimestamp(),
  });
};

export const deletePost = async (postId: string) => {
  await deleteDoc(doc(db, "classroomPosts", postId));
};

export const listenToPosts = (
  courseId: string,
  type: "announcement" | "discussion",
  callback: (posts: any[]) => void
) => {
  // Query posts for this course
  // Removed server-side orderBy to avoid index requirement for now. Sorting client-side.
  const q = query(
    collection(db, "classroomPosts"),
    where("courseId", "==", courseId)
  );

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      // Client-side filter for type
      .filter((p: any) => p.type === type)
      // Client-side sort by createdAt descending
      .sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });

    callback(posts);
  });
};
