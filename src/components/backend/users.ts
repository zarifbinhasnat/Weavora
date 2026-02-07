import { db } from "./firebase"; // adjust path based on actual firebase file location
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

export type UserRole = "student" | "teacher" | "admin";

export async function upsertUserProfile(params: {
  uid: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  role?: UserRole; // default teacher/student
}) {
  const ref = doc(db, "users", params.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: params.email ?? "",
      firstName: params.firstName ?? "",
      lastName: params.lastName ?? "",
      role: params.role ?? "student",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, {
      email: params.email ?? "",
      ...(params.firstName !== undefined ? { firstName: params.firstName } : {}),
      ...(params.lastName !== undefined ? { lastName: params.lastName } : {}),
      updatedAt: serverTimestamp(),
    });
  }
}
