import { db } from "./firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  Timestamp,
  Firestore,
  onSnapshot,
} from "firebase/firestore";

// ============================================
// Types
// ============================================

export interface ClassSummary {
  id?: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  verifiedBy?: string;
  verifiedAt?: Timestamp;
  feedback?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ClassSummaryWithTimestamps extends ClassSummary {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// Student Functions
// ============================================

/**
 * Submit a class summary
 */
export async function submitClassSummary(params: {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  content: string;
}): Promise<string> {
  if (!params.content.trim()) {
    throw new Error("Summary content cannot be empty");
  }

  if (params.content.trim().length < 10) {
    throw new Error("Summary must be at least 10 characters long");
  }

  const now = serverTimestamp();

  const docRef = await addDoc(collection(db, "classSummaries"), {
    studentId: params.studentId,
    studentName: params.studentName,
    classId: params.classId,
    className: params.className,
    content: params.content.trim(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

/**
 * Get student's summaries for a specific class
 */
export async function getStudentSummaries(
  studentId: string,
  classId?: string
): Promise<ClassSummaryWithTimestamps[]> {
  let q;

  if (classId) {
    q = query(
      collection(db, "classSummaries"),
      where("studentId", "==", studentId),
      where("classId", "==", classId)
    );
  } else {
    q = query(
      collection(db, "classSummaries"),
      where("studentId", "==", studentId)
    );
  }

  const snapshot = await getDocs(q);
  const summaries = snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as any;
    return {
      id: docSnap.id,
      ...data,
    };
  }) as ClassSummaryWithTimestamps[];

  // Sort by createdAt in descending order
  return summaries.sort((a, b) => {
    const timeA = a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  });
}

/**
 * Get a single summary by ID
 */
export async function getSummaryById(
  summaryId: string
): Promise<ClassSummaryWithTimestamps | null> {
  const docRef = doc(db, "classSummaries", summaryId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data() as any;
  return {
    id: docSnap.id,
    ...data,
  } as ClassSummaryWithTimestamps;
}

// ============================================
// Teacher Functions
// ============================================

/**
 * Get all summaries for a class (teacher view)
 */
export async function getClassSummaries(
  classId: string,
  statusFilter?: "pending" | "approved" | "rejected"
): Promise<ClassSummaryWithTimestamps[]> {
  let q;

  if (statusFilter) {
    q = query(
      collection(db, "classSummaries"),
      where("classId", "==", classId),
      where("status", "==", statusFilter)
    );
  } else {
    q = query(
      collection(db, "classSummaries"),
      where("classId", "==", classId)
    );
  }

  const snapshot = await getDocs(q);
  const summaries = snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as any;
    return {
      id: docSnap.id,
      ...data,
    };
  }) as ClassSummaryWithTimestamps[];

  // Sort by createdAt in descending order
  return summaries.sort((a, b) => {
    const timeA = a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  });
}

/**
 * Approve a summary
 */
export async function approveSummary(
  summaryId: string,
  teacherId: string
): Promise<void> {
  const summary = await getSummaryById(summaryId);

  if (!summary) {
    throw new Error("Summary not found");
  }

  if (summary.status !== "pending") {
    throw new Error(`Cannot approve a ${summary.status} summary`);
  }

  const docRef = doc(db, "classSummaries", summaryId);
  await updateDoc(docRef, {
    status: "approved",
    verifiedBy: teacherId,
    verifiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Reject a summary with feedback
 */
export async function rejectSummary(
  summaryId: string,
  teacherId: string,
  feedback: string
): Promise<void> {
  if (!feedback.trim()) {
    throw new Error("Feedback is required when rejecting a summary");
  }

  if (feedback.trim().length < 10) {
    throw new Error("Feedback must be at least 10 characters long");
  }

  const summary = await getSummaryById(summaryId);

  if (!summary) {
    throw new Error("Summary not found");
  }

  if (summary.status !== "pending") {
    throw new Error(`Cannot reject a ${summary.status} summary`);
  }

  const docRef = doc(db, "classSummaries", summaryId);
  await updateDoc(docRef, {
    status: "rejected",
    verifiedBy: teacherId,
    verifiedAt: serverTimestamp(),
    feedback: feedback.trim(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Reopen a rejected summary for resubmission
 */
export async function reopenSummary(summaryId: string): Promise<void> {
  const summary = await getSummaryById(summaryId);

  if (!summary) {
    throw new Error("Summary not found");
  }

  if (summary.status !== "rejected") {
    throw new Error("Only rejected summaries can be reopened");
  }

  const docRef = doc(db, "classSummaries", summaryId);
  await updateDoc(docRef, {
    status: "pending",
    verifiedBy: undefined,
    verifiedAt: undefined,
    feedback: undefined,
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// Real-time Listeners
// ============================================

/**
 * Listen to student's summaries in real-time
 */
export function listenToStudentSummaries(
  studentId: string,
  classId: string,
  callback: (summaries: ClassSummaryWithTimestamps[]) => void
): () => void {
  const q = query(
    collection(db, "classSummaries"),
    where("studentId", "==", studentId),
    where("classId", "==", classId)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const summaries = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          ...data,
        };
      }) as ClassSummaryWithTimestamps[];
      
      // Sort by createdAt in descending order
      summaries.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      callback(summaries);
    },
    (error) => {
      console.error("Error listening to summaries:", error);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Listen to class summaries for teacher review (real-time)
 */
export function listenToClassSummaries(
  classId: string,
  statusFilter?: "pending" | "approved" | "rejected",
  callback?: (summaries: ClassSummaryWithTimestamps[]) => void
): () => void {
  let q;

  if (statusFilter) {
    q = query(
      collection(db, "classSummaries"),
      where("classId", "==", classId),
      where("status", "==", statusFilter)
    );
  } else {
    q = query(
      collection(db, "classSummaries"),
      where("classId", "==", classId)
    );
  }

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const summaries = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          ...data,
        };
      }) as ClassSummaryWithTimestamps[];
      
      // Sort by createdAt in descending order
      summaries.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      if (callback) callback(summaries);
    },
    (error) => {
      console.error("Error listening to class summaries:", error);
      if (callback) callback([]);
    }
  );

  return unsubscribe;
}
