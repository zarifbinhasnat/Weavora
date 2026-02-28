import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { ArrowLeft, Users, Calendar, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/components/backend/firebase";

import ClassroomPosts from "@/components/teacher/ClassroomPosts";
import DocumentsManager from "@/components/teacher/DocumentsManager";

export default function CoursePage() {
  const { courseCode } = useParams<{ courseCode: string }>();
  // `courseCode` here is actually the Firestore Document ID, matching teacher route logic.

  const navigate = useNavigate();
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseCode) return;
      try {
        if (!db) {
          console.warn("Firestore not initialized — cannot fetch course data");
          setLoading(false);
          setCourseData(null);
          return;
        }
        const docRef = doc(db, "courses", courseCode);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCourseData({ id: snap.id, ...snap.data() });
        }
        // If not found, we handle it in render
      } catch (err) {
        console.error("Error fetching course:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseCode]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold">Course Not Found</h1>
        <p className="text-muted-foreground">The course you are looking for does not exist or you do not have access.</p>
        <Button onClick={() => navigate("/")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab="courses" onTabChange={() => navigate("/")} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
          <div className="px-6 py-4">
            <Button
              variant="ghost"
              className="mb-3 -ml-2"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-medium text-muted-foreground">{courseData.courseCode || "No Code"}</span>
                <h1 className="text-3xl font-display font-bold text-foreground mt-1">
                  {courseData.name || courseData.title || "Untitled Course"}
                </h1>
                <p className="text-muted-foreground mt-2">
                  Instructor: {courseData.teacherName || "Unknown"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{courseData.description}</p>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-end">
                    <Users className="w-4 h-4" />
                    <span>{courseData.students || 0} students</span>
                  </div>
                  {courseData.nextClass && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 justify-end">
                      <Calendar className="w-4 h-4" />
                      <span>{courseData.nextClass}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="posts" className="space-y-6">
              <TabsList>
                <TabsTrigger value="posts" className="gap-2">
                  <MessageSquare className="w-4 h-4" /> Posts & Discussion
                </TabsTrigger>
                <TabsTrigger value="materials" className="gap-2">
                  <FileText className="w-4 h-4" /> Materials
                </TabsTrigger>
              </TabsList>

              {/* POSTS TAB */}
              <TabsContent value="posts">
                <Card>
                  <CardHeader>
                    <CardTitle>Classroom Stream</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ClassroomPosts
                      courseId={courseCode || ""}
                      userRole="student"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MATERIALS TAB */}
              <TabsContent value="materials">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Materials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DocumentsManager
                      courseId={courseCode}
                      readOnly={true}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
