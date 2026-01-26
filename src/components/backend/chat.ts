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

export interface ChatMessage {
  id?: string;
  courseCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  message: string;
  timestamp: Timestamp;
  createdAt?: any;
}

export interface DiscussionPost {
  id?: string;
  courseCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  content: string;
  timestamp: Timestamp;
  createdAt?: any;
  comments?: Comment[];
}

export interface Comment {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  text: string;
  timestamp: Timestamp;
  createdAt?: any;
}

/**
 * Send a chat message to a specific course
 */
export async function sendChatMessage(
  courseCode: string,
  userId: string,
  userName: string,
  userEmail: string,
  message: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "chatMessages"), {
      courseCode,
      userId,
      userName,
      userEmail,
      message,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
}

/**
 * Listen to chat messages for a specific course in real-time
 */
export function listenToChatMessages(
  courseCode: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const q = query(
    collection(db, "chatMessages"),
    where("courseCode", "==", courseCode),
    orderBy("timestamp", "asc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
    });
    callback(messages);
  });

  return unsubscribe;
}

/**
 * Create a new discussion post
 */
export async function createDiscussionPost(
  courseCode: string,
  userId: string,
  userName: string,
  userEmail: string,
  title: string,
  content: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "discussionPosts"), {
      courseCode,
      userId,
      userName,
      userEmail,
      title,
      content,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
      comments: [],
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating discussion post:", error);
    throw error;
  }
}

/**
 * Listen to discussion posts for a specific course in real-time
 */
export function listenToDiscussionPosts(
  courseCode: string,
  callback: (posts: DiscussionPost[]) => void
): () => void {
  const q = query(
    collection(db, "discussionPosts"),
    where("courseCode", "==", courseCode),
    orderBy("timestamp", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const posts: DiscussionPost[] = [];
    snapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() } as DiscussionPost);
    });
    callback(posts);
  });

  return unsubscribe;
}

/**
 * Add a comment to a discussion post
 */
export async function addCommentToPost(
  postId: string,
  userId: string,
  userName: string,
  userEmail: string,
  text: string
): Promise<void> {
  try {
    await addDoc(collection(db, "discussionPosts", postId, "comments"), {
      userId,
      userName,
      userEmail,
      text,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
}

/**
 * Listen to comments for a specific post
 */
export function listenToComments(
  postId: string,
  callback: (comments: Comment[]) => void
): () => void {
  const q = query(
    collection(db, "discussionPosts", postId, "comments"),
    orderBy("timestamp", "asc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const comments: Comment[] = [];
    snapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() } as Comment);
    });
    callback(comments);
  });

  return unsubscribe;
}

/**
 * Get all chat messages for a course (one-time fetch)
 */
export async function getChatMessages(
  courseCode: string
): Promise<ChatMessage[]> {
  try {
    const q = query(
      collection(db, "chatMessages"),
      where("courseCode", "==", courseCode),
      orderBy("timestamp", "asc")
    );

    const snapshot = await getDocs(q);
    const messages: ChatMessage[] = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
    });
    return messages;
  } catch (error) {
    console.error("Error getting chat messages:", error);
    throw error;
  }
}

/**
 * Get all discussion posts for a course (one-time fetch)
 */
export async function getDiscussionPosts(
  courseCode: string
): Promise<DiscussionPost[]> {
  try {
    const q = query(
      collection(db, "discussionPosts"),
      where("courseCode", "==", courseCode),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    const posts: DiscussionPost[] = [];
    snapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() } as DiscussionPost);
    });
    return posts;
  } catch (error) {
    console.error("Error getting discussion posts:", error);
    throw error;
  }
}
