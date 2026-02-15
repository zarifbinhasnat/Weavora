import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { AIAssistant } from "@/components/dashboard/AIAssistant";
import { JoinClass } from "@/components/dashboard/JoinClass";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { Announcements } from "@/components/dashboard/Announcements";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { StudentAnnouncementsPage } from "./StudentAnnouncementsPage";
import { SchedulePage } from "./SchedulePage";
import { MaterialsOverview } from "./MaterialsOverview";
import { Search, User, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserCourses } from "@/components/backend/courses";

// Define better type for Course
interface Course {
  id: string; // Firestore Document ID
  title: string;
  code: string;
  instructor: string;
  progress: number;
  nextClass?: string;
  students: number;
}

export default function Index() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user } = useAuth();
  const navigate = useNavigate();
  const coursesRef = useRef<HTMLElement>(null);
  const assistantRef = useRef<HTMLElement>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const fetchCourses = async () => {
    if (!user) return;
    setLoadingCourses(true);
    try {
      const data = await getUserCourses(user.uid);

      const formattedCourses = data.map((d: any) => ({
        id: d.id,
        title: d.name || "Untitled Course",
        code: d.courseCode || d.joinCode || "No Code", // Prefer courseCode (e.g., CS 101)
        instructor: d.teacherName || "Unknown Instructor",
        progress: d.progress || Math.floor(Math.random() * 100), // specific progress or random
        nextClass: d.nextClass || "TBA",
        students: d.students || 0
      }));
      setCourses(formattedCourses);
    } catch (error) {
      console.error("Failed to load courses", error);
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    // Scroll to courses section when Courses tab is clicked
    if (tab === "courses" && coursesRef.current) {
      coursesRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    // Scroll to AI Assistant section when AI Assistant tab is clicked
    if (tab === "assistant" && assistantRef.current) {
      assistantRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  const renderContent = () => {
    if (activeTab === "announcements") {
      return (
        <div className="p-6">
          <StudentAnnouncementsPage />
        </div>
      );
    }

    if (activeTab === "schedule") {
      return (
        <div className="p-6">
          <SchedulePage />
        </div>
      );
    }

    if (activeTab === "materials") {
      return (
        <div className="p-6">
          <MaterialsOverview />
        </div>
      );
    }

    // Default dashboard view
    return (
      <>
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-display font-semibold text-foreground"
              >
                Welcome back, {user?.name || user?.displayName || "Student"}
              </motion.h1>
              <p className="text-sm text-muted-foreground">Here's what's happening with your courses today.</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search courses, materials..."
                  className="w-64 pl-10 pr-4 py-2 bg-secondary/50 border-0 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors">
                <User className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Stats */}
          <section className="mb-8">
            <QuickStats />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-6">
              {/* Courses */}
              <section ref={coursesRef}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-semibold text-foreground">Your Courses</h2>
                  {/* Keep the generic 'View All' if user wants it, or remove */}
                  <button className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                    View All →
                  </button>
                </div>

                {/* Join Class Component Integration */}
                <div className="mb-6">
                  <JoinClass onJoinSuccess={fetchCourses} />
                </div>

                {loadingCourses ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center p-8 border rounded-xl border-dashed">
                    <p className="text-muted-foreground">You haven't joined any courses yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map((course, index) => (
                      <CourseCard key={course.id} {...course} delay={index} />
                    ))}
                  </div>
                )}
              </section>

              {/* AI Assistant */}
              <section ref={assistantRef}>
                <h2 className="text-lg font-display font-semibold text-foreground mb-4">AI Learning Assistant</h2>
                <div className="h-[500px]">
                  <AIAssistant />
                </div>
              </section>
            </div>

            {/* Sidebar Content */}
            <div className="space-y-6">
              <UpcomingDeadlines />
              <Announcements />

              {/* Chat & Discussion Card - Example Static Link */}
              <div className="bg-card rounded-xl border shadow-card p-5 cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                onClick={() => navigate('/course/CS%204501/chat')}>
                {/* Note: This is a static link to CS 4501, should probably depend on active course or be removed/generalized */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Chat & Discussion</h3>
                    <p className="text-xs text-muted-foreground">Join conversations with classmates</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}
