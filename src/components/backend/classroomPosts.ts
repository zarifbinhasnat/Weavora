import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* ---------------- POSTS ---------------- */

export const createPost = async (
  title: string,
  content: string,
  author: string,
  type: "announcement" | "discussion"
) => {
  await addDoc(collection(db, "classroomPosts"), {
    title,
    content,
    author,
    type,
    createdAt: serverTimestamp(),
  });
};

export const deletePost = async (postId: string) => {
  await deleteDoc(doc(db, "classroomPosts", postId));
};

export const listenToPosts = (
  type: "announcement" | "discussion",
  callback: (posts: any[]) => void
) => {
  const q = query(
    collection(db, "classroomPosts"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const filtered = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p: any) => p.type === type);

    callback(filtered);
  });
};
