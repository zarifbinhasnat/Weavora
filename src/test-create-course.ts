// Test script to create a sample course with valid joinCode
// Run this in browser console if needed, or import and call from test

import { createCourse } from "@/components/backend/courses";

export async function createTestCourse() {
  try {
    const result = await createCourse({
      name: "Test Class for Summary Feature",
      description: "This is a test course to verify class summary functionality",
      subject: "Computer Science",
      courseCode: "CS-101",
      session: "Spring 2026",
      teacherUid: "dev-teacher-123",
      teacherName: "Dev Teacher"
    });
    
    console.log("✅ Test course created!");
    console.log("Course ID:", result.courseId);
    console.log("Join Code:", result.joinCode);
    
    return result;
  } catch (error) {
    console.error("❌ Failed to create course:", error);
    throw error;
  }
}
