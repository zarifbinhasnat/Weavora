// ================= IMPORTS =================
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// Interface for the bug report
export interface BugReport {
  title: string;
  category: string;
  priority: string;
  description: string;
  userId: string;
}

// Function to submit a bug report
export async function submitBugReport(report: BugReport) {
  try {
    console.log("Attempting to save bug report:", report);

    // Save the bug in 'bugs' collection
    const bugDocRef = await addDoc(collection(db, "bugs"), {
      title: report.title,
      category: report.category,
      priority: report.priority,
      description: report.description,
      reportedBy: report.userId,
      status: "Open",
      timestamp: serverTimestamp()
    });

    console.log("Bug saved with ID:", bugDocRef.id);

    // Optional: notify admin/teacher
    const notifDocRef = await addDoc(collection(db, "teacherNotifications"), {
      teacherId: "adminAll",
      title: "Bug Report",
      message: `A new bug was reported: ${report.title}`,
      type: "bug",
      read: false,
      createdAt: serverTimestamp()
    });

    console.log("Notification saved with ID:", notifDocRef.id);

    return { success: true };

  } catch (error) {
    console.error("Bug submission error:", error);
    return { success: false };
  }
}