import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, BookOpen, Users, Calendar, MessageSquare, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/components/backend/firebase";

// Import existing manager components
import ClassroomPosts from "@/components/teacher/ClassroomPosts";
import DocumentsManager from "@/components/teacher/DocumentsManager";

export default function TeacherCoursePage() {
    const { courseCode } = useParams<{ courseCode: string }>();
    // Use courseCode as the ID or fetch the mapped ID if needed. 
    // Assuming route is /teacher/course/:courseId to match Firestore ID for easier data fetching

    const navigate = useNavigate();
    const { user } = useAuth();
    const [courseData, setCourseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            if (!courseCode) return;
            try {
                if (!db) {
                    console.warn("Firestore not initialized — cannot fetch teacher course data");
                    setCourseData({
                        title: "Course " + courseCode,
                        code: courseCode,
                        description: "Managed Course"
                    });
                    setLoading(false);
                    return;
                }
                const docRef = doc(db, "courses", courseCode);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setCourseData({ id: snap.id, ...snap.data() });
                } else {
                    // Fallback for demo purposes if ID doesn't exist in DB yet
                    setCourseData({
                        title: "Course " + courseCode,
                        code: courseCode,
                        description: "Managed Course"
                    })
                }
            } catch (err) {
                console.error("Error fetching course:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [courseCode]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!courseData) {
        return (
            <div className="flex h-screen flex-col items-center justify-center">
                <h1 className="text-2xl font-bold">Course Not Found</h1>
                <Button onClick={() => navigate("/teacher-dashboard")}>Back to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar activeTab="courses" onTabChange={() => navigate("/teacher-dashboard")} isTeacher={true} />

            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
                    <div className="px-6 py-4">
                        <Button
                            variant="ghost"
                            className="mb-3 -ml-2"
                            onClick={() => navigate("/teacher-dashboard")}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>

                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">{courseData.code || courseCode}</span>
                                <h1 className="text-3xl font-display font-bold text-foreground mt-1">
                                    {courseData.title || courseData.name || "Untitled Course"}
                                </h1>
                                <p className="text-muted-foreground mt-2">{courseData.description || "No description provided."}</p>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Quick Stats or Actions */}
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
                                    <MessageSquare className="w-4 h-4" /> Posts & Announcements
                                </TabsTrigger>
                                <TabsTrigger value="materials" className="gap-2">
                                    <FileText className="w-4 h-4" /> Materials & Uploads
                                </TabsTrigger>
                                {/* Add more tabs like 'Students', 'Assignments' later */}
                            </TabsList>

                            {/* POSTS TAB */}
                            <TabsContent value="posts">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Classroom Stream</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Reusing the existing ClassroomPosts component */}
                                        {/* Ensure it can accept a courseId prop if you update it later, currently global mock/test */}
                                        <ClassroomPosts courseId={courseCode || ""} userRole="teacher" />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* MATERIALS TAB */}
                            <TabsContent value="materials">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle>Course Materials</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Reusing DocumentsManager. It needs to know which courseId to upload to. */}
                                        <DocumentsManager courseId={courseCode} />
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
