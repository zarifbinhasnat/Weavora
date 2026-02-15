import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { FileText, BookOpen, Loader2 } from "lucide-react";
import { auth, db } from "@/components/backend/firebase";
import { getUserCourses } from "@/components/backend/courses";
import { collection, query, where, getDocs } from "firebase/firestore";

interface CourseWithMaterials {
  title: string;
  code: string;
  instructor: string;
  materialCount: number;
  courseId: string;
}

export function MaterialsOverview() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseWithMaterials[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoursesWithMaterials() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 1. Get all courses the student is enrolled in
        const enrolledCourses = await getUserCourses(user.uid);

        // 2. For each course, count documents in the Documents collection
        const coursesWithCounts = await Promise.all(
          enrolledCourses.map(async (course: any) => {
            const courseId = course.courseCode || course.id;

            // Count documents for this course
            let materialCount = 0;
            try {
              const q = query(
                collection(db, "Documents"),
                where("courseId", "==", courseId)
              );
              const snap = await getDocs(q);
              materialCount = snap.size;
            } catch {
              materialCount = 0;
            }

            return {
              title: course.name || course.title || "Untitled Course",
              code: course.courseCode || course.id,
              instructor: course.teacherName || "Instructor",
              materialCount,
              courseId: courseId,
            };
          })
        );

        setCourses(coursesWithCounts);
      } catch (error) {
        console.error("Error loading courses with materials:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCoursesWithMaterials();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Course Materials
          </h1>
          <p className="text-sm text-muted-foreground">
            Access all your course materials in one place
          </p>
        </motion.div>
        <div className="text-center py-12 border rounded-xl border-dashed bg-secondary/20">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No courses found. Join a course to see materials.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-semibold text-foreground">
          Course Materials
        </h1>
        <p className="text-sm text-muted-foreground">
          Access all your course materials in one place
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, index) => (
          <motion.div
            key={course.courseId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
              onClick={() => navigate(`/course/${course.code}/materials`)}
            >
              {/* Content */}
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {course.code}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Instructor</span>
                    <span className="font-medium text-foreground">
                      {course.instructor}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Materials</span>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">
                        {course.materialCount} {course.materialCount === 1 ? "file" : "files"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* View Materials Button */}
                <div className="mt-4 pt-4 border-t">
                  <button className="w-full text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2">
                    View Materials
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
