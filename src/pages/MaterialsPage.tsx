import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { CourseMaterialsChat } from "@/components/dashboard/CourseMaterialsChat";
import { ArrowLeft, FileText, Download, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Mock course data
const coursesData = {
  "CS 4501": { title: "Machine Learning Fundamentals" },
  "PHIL 3200": { title: "Data Ethics & Society" },
  "STAT 3100": { title: "Statistical Analysis" },
  "CS 3501": { title: "AI Fundamentals" }
};

type ViewType = "materials" | "pastpapers";

export default function MaterialsPage() {
  const { courseCode } = useParams<{ courseCode: string }>();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ViewType>("materials");

  // Mock materials data
  const materials = [
    { id: 1, name: "Lecture 1 - Introduction to ML.pdf", size: "2.5 MB", uploadedAt: "2 weeks ago" },
    { id: 2, name: "Assignment 3 - Neural Networks.pdf", size: "1.2 MB", uploadedAt: "1 week ago" },
    { id: 3, name: "Reading Material - Chapter 5.pdf", size: "4.8 MB", uploadedAt: "3 days ago" },
  ];

  // Mock past papers data
  const pastPapers = [
    { id: 1, name: "Final Exam 2024 - Machine Learning.pdf", size: "1.8 MB", uploadedAt: "3 months ago", year: "2024" },
    { id: 2, name: "Midterm 2024 - Neural Networks.pdf", size: "950 KB", uploadedAt: "5 months ago", year: "2024" },
    { id: 3, name: "Final Exam 2023 - ML Fundamentals.pdf", size: "2.1 MB", uploadedAt: "1 year ago", year: "2023" },
    { id: 4, name: "Midterm 2023 - Deep Learning.pdf", size: "1.5 MB", uploadedAt: "1 year ago", year: "2023" },
  ];

  const courseName = courseCode ? coursesData[courseCode as keyof typeof coursesData]?.title : undefined;
  
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

              <div className="space-y-3">
                {currentData.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            activeView === "materials"
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
                        
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

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
