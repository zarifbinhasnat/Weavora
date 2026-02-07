import { db } from "./firebase.js";
import { collection, getDocs } from "firebase/firestore";

export type CourseMember = {
  uid: string;
  role: "teacher" | "student";
};

export async function listCourseMembers(courseId: string) {
  const snap = await getDocs(collection(db, "courses", courseId, "members"));
  return snap.docs.map(d => d.data() as CourseMember);
}
