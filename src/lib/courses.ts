import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../components/firebase";

/* ---------------- COURSES ---------------- */

export async function fetchCourseById(courseId: string) {
  const refDoc = doc(db, "courses", courseId);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) throw new Error("Course not found");

  const data = snap.data();
  return {
    id: snap.id,
    title: data.title ?? "Untitled course",
    code: data.code ?? snap.id,
    instructor: data.instructor ?? "—",
    progress: Number(data.progress ?? 0),
    nextClass: data.nextClass ?? "—",
    students: Number(data.students ?? 0),
    section: data.section ?? null,
    description: data.description ?? "",
  };
}

export async function fetchCourses() {
  const refCol = collection(db, "courses");
  const snap = await getDocs(refCol);

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title ?? "Untitled course",
      code: data.code ?? d.id,
      instructor: data.instructor ?? "—",
      progress: Number(data.progress ?? 0),
      nextClass: data.nextClass ?? "—",
      students: Number(data.students ?? 0),
      section: data.section ?? null,
      avatarUrl: data.avatarUrl ?? null,
    };
  });
}

/* ---------------- MATERIALS ---------------- */

export async function fetchCourseMaterials(courseId: string) {
  const refCol = collection(db, "courses", courseId, "materials");
  const q = query(refCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function uploadMaterialFile(
  courseId: string,
  file: File,
  materialData: any
) {
  const storageRef = ref(
    storage,
    `courses/${courseId}/materials/${Date.now()}_${file.name}`
  );

  const uploadSnap = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(uploadSnap.ref);

  const materialsRef = collection(db, "courses", courseId, "materials");
  const docRef = await addDoc(materialsRef, {
    ...materialData,
    fileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    url,
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, url };
}

/* ---------------- ASSIGNMENTS ---------------- */

export async function fetchCourseAssignments(courseId: string) {
  const refCol = collection(db, "courses", courseId, "assignments");
  const q = query(refCol, orderBy("dueDate", "asc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchAssignmentSubmissions(courseId: string, userId: string) {
  const refCol = collection(db, "submissions");
  const q = query(
    refCol,
    where("courseId", "==", courseId),
    where("userId", "==", userId)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function submitAssignment(
  courseId: string,
  assignmentId: string,
  userId: string,
  file: File,
  comments?: string
) {
  const storageRef = ref(
    storage,
    `submissions/${courseId}/${assignmentId}/${userId}/${file.name}`
  );

  const uploadSnap = await uploadBytes(storageRef, file);
  const fileUrl = await getDownloadURL(uploadSnap.ref);

  const submissionsRef = collection(db, "submissions");
  const docRef = await addDoc(submissionsRef, {
    courseId,
    assignmentId,
    userId,
    fileName: file.name,
    fileUrl,
    comments: comments ?? "",
    submittedAt: serverTimestamp(),
    status: "submitted",
  });

  return { id: docRef.id, fileUrl };
}

/* ---------------- ANNOUNCEMENTS ---------------- */

export async function fetchCourseAnnouncements(courseId: string) {
  const refCol = collection(db, "courses", courseId, "announcements");
  const q = query(refCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function markAnnouncementAsRead(
  courseId: string,
  announcementId: string,
  userId: string
) {
  await addDoc(collection(db, "announcementReads"), {
    courseId,
    announcementId,
    userId,
    readAt: serverTimestamp(),
  });
}

export async function fetchReadAnnouncements(courseId: string, userId: string) {
  const refCol = collection(db, "announcementReads");
  const q = query(
    refCol,
    where("courseId", "==", courseId),
    where("userId", "==", userId)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().announcementId);
}
