import { motion } from "framer-motion";
import { CourseCard } from "@/components/dashboard/student_dashboard/CourseCard";
import { AIAssistant } from "@/components/dashboard/AIAssistant";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { Announcements } from "@/components/dashboard/Announcements";
import { QuickStats } from "@/components/dashboard/student_dashboard/QuickStats";
import { Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const courses = [
  { title: "Machine Learning Fundamentals", code: "CS 4501", instructor: "Dr. Sarah Chen", progress: 68, nextClass: "Today, 2:00 PM", students: 45 },
  { title: "Data Ethics & Society", code: "PHIL 3200", instructor: "Prof. Michael Torres", progress: 82, nextClass: "Tomorrow, 10:00 AM", students: 32 },
  { title: "Statistical Analysis", code: "STAT 3100", instructor: "Dr. Emily Watson", progress: 45, nextClass: "Wed, 3:30 PM", students: 58 },
  { title: "AI Fundamentals", code: "CS 3501", instructor: "Dr. James Liu", progress: 91, nextClass: "Thu, 1:00 PM", students: 41 },
];

export default function Index() {
  const navigate = useNavigate();

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
              Welcome back, Zarif
            </motion.h1>
            <p className="text-sm text-muted-foreground">
              Here's what's happening with your courses today.
            </p>
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
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-foreground">Your Courses</h2>

                {/* ✅ go to /courses */}
                <button
                  onClick={() => navigate("/courses")}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  View All →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course, index) => (
                  <CourseCard key={course.code} {...course} delay={index} />
                ))}
              </div>
            </section>

            {/* AI Assistant */}
            <section>
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                AI Learning Assistant
              </h2>
              <div className="h-[500px]">
                <AIAssistant />
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <UpcomingDeadlines />

            {/* ✅ route to announcements page if you have it */}
            <Announcements onViewAll={() => navigate("/announcements")} />
          </div>
        </div>
      </div>
    </>
  );
}
