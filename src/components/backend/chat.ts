import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  where,
  getDocs,
} from "firebase/firestore";
import { notifyTeacherOfMessage } from "./notifications";

/* ================= TYPES ================= */

export interface ChatMessage {
  id: string;
  courseCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  message: string;
  timestamp?: Timestamp;
}

export interface DiscussionPost {
  id: string;
  courseCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  content: string;
  timestamp?: Timestamp;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  text: string;
  timestamp?: Timestamp;
}

/* ================= CHAT ================= */

/**
 * Send a chat message
 */
export async function sendChatMessage(
  courseCode: string,
  userId: string,
  userName: string,
  userEmail: string,
  message: string
) {
  if (typeof message !== "string" || !message.trim()) return;

  await addDoc(
    collection(db, "courses", courseCode, "chatMessages"),
    {
      courseCode,
      userId,
      userName,
      userEmail,
      message,
      timestamp: serverTimestamp(),
    }
  );

  // Notify teacher when student sends a message
  const messagePreview = message.length > 50 ? message.substring(0, 50) + "..." : message;
  await notifyTeacherOfMessage(courseCode, userName, messagePreview);
}

/**
 * Listen to chat messages (REAL-TIME, SAFE)
 */
export function listenToChatMessages(
  courseCode: string,
  callback: (messages: ChatMessage[]) => void
) {
  const q = query(
    collection(db, "courses", courseCode, "chatMessages"),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      // 🔐 HARD SAFETY (prevents indexOf crash)
      if (typeof data.message !== "string") return;

      messages.push({
        id: doc.id,
        courseCode: data.courseCode || courseCode,
        userId: data.userId || "",
        userName: data.userName || "Unknown",
        userEmail: data.userEmail || "",
        message: data.message,
        timestamp: data.timestamp,
      });
    });

    callback(messages);
  });
}

/* ================= POSTS ================= */

/**
 * Create discussion / announcement post
 */
export async function createDiscussionPost(
  courseCode: string,
  userId: string,
  userName: string,
  userEmail: string,
  title: string,
  content: string
) {
  if (!title.trim() || !content.trim()) return;

  await addDoc(
    collection(db, "courses", courseCode, "discussionPosts"),
    {
      courseCode,
      userId,
      userName,
      userEmail,
      title,
      content,
      timestamp: serverTimestamp(),
    }
  );

  // Notify teacher when student creates a discussion post
  const { notifyTeacherOfPost } = await import("./notifications");
  await notifyTeacherOfPost(courseCode, userName, title, "discussion");
}

/**
 * Listen to discussion posts
 */
export function listenToDiscussionPosts(
  courseCode: string,
  callback: (posts: DiscussionPost[]) => void
) {
  const q = query(
    collection(db, "courses", courseCode, "discussionPosts"),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const posts: DiscussionPost[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      if (
        typeof data.title !== "string" ||
        typeof data.content !== "string"
      ) {
        return;
      }

      posts.push({
        id: doc.id,
        courseCode: data.courseCode || courseCode,
        userId: data.userId || "",
        userName: data.userName || "Unknown",
        userEmail: data.userEmail || "",
        title: data.title,
        content: data.content,
        timestamp: data.timestamp,
      });
    });

    callback(posts);
  });
}

/* ================= COMMENTS ================= */

/**
 * Add comment to a post
 */
export async function addCommentToPost(
  courseCode: string,
  postId: string,
  userId: string,
  userName: string,
  userEmail: string,
  text: string
) {
  if (typeof text !== "string" || !text.trim()) return;

  await addDoc(
    collection(
      db,
      "courses",
      courseCode,
      "discussionPosts",
      postId,
      "comments"
    ),
    {
      userId,
      userName,
      userEmail,
      text,
      timestamp: serverTimestamp(),
    }
  );

  // Notify teacher when student comments
  const { notifyTeacherOfComment } = await import("./notifications");
  await notifyTeacherOfComment(courseCode, userName, text);
}

/**
 * Listen to comments for a post
 */
export function listenToComments(
  courseCode: string,
  postId: string,
  callback: (comments: Comment[]) => void
) {
  const q = query(
    collection(
      db,
      "courses",
      courseCode,
      "discussionPosts",
      postId,
      "comments"
    ),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const comments: Comment[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      if (typeof data.text !== "string") return;

      comments.push({
        id: doc.id,
        userId: data.userId || "",
        userName: data.userName || "Unknown",
        userEmail: data.userEmail || "",
        text: data.text,
        timestamp: data.timestamp,
      });
    });

    callback(comments);
  });
}

/* ================= ONE-TIME FETCH (OPTIONAL) ================= */

export async function getChatMessages(courseCode: string) {
  const q = query(
    collection(db, "courses", courseCode, "chatMessages"),
    orderBy("timestamp", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => d.data())
    .filter((m) => typeof m.message === "string") as ChatMessage[];
}
