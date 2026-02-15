import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { CourseMaterialsChat } from "@/components/dashboard/CourseMaterialsChat";
import { ArrowLeft, FileText, Download, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { collection, query, where, onSnapshot, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/components/backend/firebase";
import { formatDistanceToNow } from "date-fns";

type ViewType = "materials" | "pastpapers";

export default function MaterialsPage() {
  const { courseCode } = useParams<{ courseCode: string }>();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ViewType>("materials");
  const [materials, setMaterials] = useState<any[]>([]);
  const [pastPapers, setPastPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState<string>(courseCode || "");

  useEffect(() => {
    if (!courseCode) return;

    // Fetch the real course name from Firestore
    const cleanCode = decodeURIComponent(courseCode);
    const courseQuery = query(
      collection(db, "courses"),
      where("courseCode", "==", cleanCode)
    );
    getDocs(courseQuery).then(snap => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setCourseName(data.name || cleanCode);
      }
    }).catch(() => { });
  }, [courseCode]);

  useEffect(() => {
    if (!courseCode) return;

    // Remove percent encoding if present for Firestore query if stored as plain text
    // Assuming courseId is stored as "CS 4501" or "CS4501" depending on consistency
    // Let's try to match exactly what is in URL first
    const cleanCourseCode = decodeURIComponent(courseCode); // "STAT 3100"

    const q = query(
      collection(db, "Documents"),
      where("courseId", "==", cleanCourseCode)
      // orderBy("createdAt", "desc") // Requires index, skipping for now
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        title: doc.data().title || "Untitled",
        // Format date
        uploadedAt: doc.data().createdAt?.toDate
          ? formatDistanceToNow(doc.data().createdAt.toDate(), { addSuffix: true })
          : "Just now",
        // Fallback for fields
        name: doc.data().fileName || doc.data().title || "Untitled",
        size: doc.data().fileSize || "Unknown size",
      }));

      // Simple filter logic - in real app, might have a 'type' field
      const papers = allDocs.filter(d =>
        d.title.toLowerCase().includes("exam") ||
        d.title.toLowerCase().includes("test") ||
        d.title.toLowerCase().includes("midterm")
      );

      const mats = allDocs.filter(d => !papers.includes(d));

      setMaterials(mats);
      setPastPapers(papers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [courseCode]);

  const currentData = activeView === "materials" ? materials : pastPapers;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab="courses" onTabChange={() => navigate("/")} />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
          <div className="px-6 py-4">
            <Button
              variant="ghost"
              className="mb-3 -ml-2"
              onClick={() => navigate(`/course/${courseCode}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-muted-foreground">{courseCode}</span>
                <h1 className="text-3xl font-display font-bold text-foreground mt-1">
                  {activeView === "materials" ? "Course Materials" : "Past Papers"}
                </h1>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={activeView === "materials" ? "default" : "outline"}
                  onClick={() => setActiveView("materials")}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Course Materials
                </Button>
                <Button
                  variant={activeView === "pastpapers" ? "default" : "outline"}
                  onClick={() => setActiveView("pastpapers")}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Past Papers
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Materials/Past Papers List */}
            <div className="xl:col-span-2">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  {activeView === "materials" ? "Lecture Materials & Notes" : "Previous Examinations"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeView === "materials"
                    ? "Access course materials, lecture slides, and assignments"
                    : "Review past exam papers and practice questions"}
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center p-8">Loading materials...</div>
              ) : (
                <div className="space-y-3">
                  {currentData.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open(item.pdfUrl, '_blank')}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${activeView === "materials"
                              ? "bg-red-100 dark:bg-red-900/20"
                              : "bg-blue-100 dark:bg-blue-900/20"
                              }`}>
                              {activeView === "materials" ? (
                                <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                              ) : (
                                <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.size} • Uploaded {item.uploadedAt}
                                {"year" in item && ` • ${item.year}`}
                              </p>
                            </div>
                          </div>

                          <Button variant="ghost" size="sm" asChild>
                            <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {currentData.length === 0 && (
                <div className="text-center py-12">
                  {activeView === "materials" ? (
                    <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  ) : (
                    <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  )}
                  <p className="text-muted-foreground">
                    {activeView === "materials" ? "No materials uploaded yet" : "No past papers available yet"}
                  </p>
                </div>
              )}
            </div>

            {/* Chat Sidebar */}
            <div className="xl:col-span-1">
              <div className="sticky top-24 h-[calc(100vh-8rem)]">
                <CourseMaterialsChat
                  courseCode={courseCode || ""}
                  courseName={courseName}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
