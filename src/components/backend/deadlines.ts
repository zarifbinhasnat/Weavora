import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Deadline {
    id: string;
    title: string;
    course: string;
    type: "assignment" | "quiz" | "exam" | "project" | "reading";
    dueDate: Date;
    priority: "high" | "medium" | "low";
    completed: boolean;
    userId: string;
    createdAt?: any;
}

// Create a new deadline
export async function createDeadline(params: {
    title: string;
    course: string;
    type: Deadline["type"];
    dueDate: Date;
    priority: Deadline["priority"];
    userId: string;
}) {
    const ref = await addDoc(collection(db, "deadlines"), {
        title: params.title.trim(),
        course: params.course.trim(),
        type: params.type,
        dueDate: Timestamp.fromDate(params.dueDate),
        priority: params.priority,
        completed: false,
        userId: params.userId,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

// Delete a deadline
export async function deleteDeadline(deadlineId: string) {
    await deleteDoc(doc(db, "deadlines", deadlineId));
}

// Toggle deadline completion
export async function toggleDeadlineComplete(deadlineId: string, completed: boolean) {
    await updateDoc(doc(db, "deadlines", deadlineId), { completed });
}

// Listen to deadlines for a user (real-time)
export function listenToDeadlines(
    userId: string,
    callback: (deadlines: Deadline[]) => void,
    onError?: (err: unknown) => void
) {
    const q = query(
        collection(db, "deadlines"),
        where("userId", "==", userId),
        orderBy("dueDate", "asc")
    );

    return onSnapshot(
        q,
        (snap) => {
            const items: Deadline[] = snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    title: data.title ?? "",
                    course: data.course ?? "",
                    type: data.type ?? "assignment",
                    dueDate: data.dueDate?.toDate?.() ?? new Date(),
                    priority: data.priority ?? "medium",
                    completed: Boolean(data.completed),
                    userId: data.userId,
                    createdAt: data.createdAt,
                };
            });
            callback(items);
        },
        (err) => {
            console.error("Deadlines listener error:", err);
            onError?.(err);
        }
    );
}
