// src/components/backend/courses.ts
import { db } from "./firebase"; // same pattern as users.ts
import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

export type MemberRole = "teacher" | "student";

function makeJoinCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createCourse(params: {
  name: string;
  description?: string;
  subject?: string;
  courseCode?: string;
  teacherUid: string;
  teacherName?: string;
}) {
  const joinCode = makeJoinCode(6);

  const courseRef = await addDoc(collection(db, "courses"), {
    name: params.name.trim(),
    description: (params.description ?? "").trim(),
    subject: (params.subject ?? "").trim(),
    courseCode: (params.courseCode ?? "").trim(),
    teacherId: params.teacherUid,
    teacherName: params.teacherName ?? "",
    joinCode,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", courseRef.id, "members", params.teacherUid), {
    uid: params.teacherUid,
    role: "teacher" as MemberRole,
    joinedAt: serverTimestamp(),
  });

  // Also write to user's enrolledCourses subcollection for easy listing
  await setDoc(doc(db, "users", params.teacherUid, "enrolledCourses", courseRef.id), {
    courseId: courseRef.id,
    role: "teacher" as MemberRole,
    joinedAt: serverTimestamp()
  });

  return { courseId: courseRef.id, joinCode };
}


export async function joinCourseByCode(params: { joinCode: string; uid: string }) {
  const code = params.joinCode.trim().toUpperCase();

  const q = query(collection(db, "courses"), where("joinCode", "==", code), limit(1));
  const snap = await getDocs(q);

  if (snap.empty) throw new Error("Invalid join code");

  const courseDoc = snap.docs[0];
  const courseId = courseDoc.id;

  await setDoc(doc(db, "courses", courseId, "members", params.uid), {
    uid: params.uid,
    role: "student" as MemberRole,
    joinedAt: serverTimestamp(),
  });

  // Also write to user's enrolledCourses subcollection
  await setDoc(doc(db, "users", params.uid, "enrolledCourses", courseId), {
    courseId: courseId,
    role: "student" as MemberRole,
    joinedAt: serverTimestamp()
  });

  await updateDoc(doc(db, "courses", courseId), { updatedAt: serverTimestamp() });

  return { courseId };
}

// Fetch all courses a specific user is a member of
export async function getUserCourses(uid: string) {
  const courses = [];
  try {
    // 1. Get list of enrolled course IDs from user profile
    const enrolledSnap = await getDocs(collection(db, "users", uid, "enrolledCourses"));

    // 2. Fetch course details for each enrollment
    // We use Promise.all to fetch them in parallel
    const coursePromises = enrolledSnap.docs.map(async (enrolledDoc) => {
      const courseId = enrolledDoc.id;
      const courseSnap = await getDoc(doc(db, "courses", courseId));
      if (courseSnap.exists()) {
        return { id: courseSnap.id, ...courseSnap.data() };
      }
      return null;
    });

    const results = await Promise.all(coursePromises);

    // Filter out nulls (deleted courses)
    courses.push(...results.filter(c => c !== null));

  } catch (error) {
    console.error("Error fetching user courses:", error);
    throw error;
  }
  return courses;
}
