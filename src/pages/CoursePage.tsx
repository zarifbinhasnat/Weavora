import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, BookOpen, Calendar, FileText, Users, MessageSquare, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data - will be replaced with real data later
const coursesData = {
  "CS 4501": {
    title: "Machine Learning Fundamentals",
    code: "CS 4501",
    instructor: "Dr. Sarah Chen",
    description: "An introduction to machine learning concepts, algorithms, and applications.",
    students: 45,
    nextClass: "Today, 2:00 PM"
  },
  "PHIL 3200": {
    title: "Data Ethics & Society",
    code: "PHIL 3200",
    instructor: "Prof. Michael Torres",
    description: "Exploring ethical implications of data collection, analysis, and AI systems.",
    students: 32,
    nextClass: "Tomorrow, 10:00 AM"
  },
  "STAT 3100": {
    title: "Statistical Analysis",
    code: "STAT 3100",
    instructor: "Dr. Emily Watson",
    description: "Comprehensive introduction to statistical methods and data analysis.",
    students: 58,
    nextClass: "Wed, 3:30 PM"
  },
  "CS 3501": {
    title: "AI Fundamentals",
    code: "CS 3501",
    instructor: "Dr. James Liu",
    description: "Core concepts in artificial intelligence including search, logic, and learning.",
    students: 41,
    nextClass: "Thu, 1:00 PM"
  }
};

const mockPosts = [
  {
    id: 1,
    author: "Dr. Sarah Chen",
    date: "2 hours ago",
    content: "Reminder: Assignment 3 is due this Friday. Make sure to submit your Jupyter notebooks with all cells executed.",
    type: "announcement"
  },
  {
    id: 2,
    author: "Dr. Sarah Chen",
    date: "1 day ago",
    content: "Great class discussion today on neural networks! I've uploaded the lecture slides to the materials section.",
    type: "update"
  },
  {
    id: 3,
    author: "Dr. Sarah Chen",
    date: "3 days ago",
    content: "Office hours this week: Tuesday 3-5pm and Thursday 2-4pm. Feel free to drop by with any questions!",
    type: "announcement"
  }
];

export default function CoursePage() {
  const { courseCode } = useParams<{ courseCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("posts");
  
  const course = courseCode ? coursesData[courseCode as keyof typeof coursesData] : null;

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <Button onClick={() => navigate("/")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const handleMaterialsClick = () => {
    // For now, just navigate to a materials page (will be implemented later)
    navigate(`/course/${courseCode}/materials`);
  };

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
                <span className="text-sm font-medium text-muted-foreground">{course.code}</span>
                <h1 className="text-3xl font-display font-bold text-foreground mt-1">
                  {course.title}
                </h1>
                <p className="text-muted-foreground mt-2">{course.instructor}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{course.students} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>{course.nextClass}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6 border-b">
              <button
                onClick={() => setActiveSection("posts")}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeSection === "posts"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Posts
              </button>
              <button
                onClick={() => handleMaterialsClick()}
                className="px-4 py-2 font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Materials
              </button>
            </div>

            {/* Course Description */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>About this course</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{course.description}</p>
              </CardContent>
            </Card>

            {/* Posts Section */}
            {activeSection === "posts" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Announcements & Updates</h2>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    New Post
                  </Button>
                </div>

                {mockPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary-foreground">
                              {post.author.split(" ").map(n => n[0]).join("")}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-foreground">{post.author}</p>
                                <p className="text-sm text-muted-foreground">{post.date}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                post.type === "announcement" 
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              }`}>
                                {post.type}
                              </span>
                            </div>
                            <p className="text-muted-foreground">{post.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
