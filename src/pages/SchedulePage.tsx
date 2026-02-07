import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  FileText, 
  BookOpen, 
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  title: string;
  course: string;
  courseCode: string;
  dueDate: Date;
  type: "assignment" | "exam" | "project" | "reading";
  priority: "high" | "medium" | "low";
}

// Mock data - replace with real data from Firebase
const assignments: Assignment[] = [
  {
    id: "1",
    title: "ML Algorithm Implementation",
    course: "Machine Learning Fundamentals",
    courseCode: "CS 4501",
    dueDate: new Date(2025, 11, 29), // Dec 29, 2025
    type: "assignment",
    priority: "high",
  },
  {
    id: "2",
    title: "Ethics Paper Draft",
    course: "Data Ethics & Society",
    courseCode: "PHIL 3200",
    dueDate: new Date(2025, 11, 30), // Dec 30, 2025
    type: "assignment",
    priority: "medium",
  },
  {
    id: "3",
    title: "Statistical Analysis Project",
    course: "Statistical Analysis",
    courseCode: "STAT 3100",
    dueDate: new Date(2025, 11, 31), // Dec 31, 2025
    type: "project",
    priority: "high",
  },
  {
    id: "4",
    title: "Chapter 8-10 Reading",
    course: "AI Fundamentals",
    courseCode: "CS 3501",
    dueDate: new Date(2026, 0, 2), // Jan 2, 2026
    type: "reading",
    priority: "low",
  },
  {
    id: "5",
    title: "Midterm Exam",
    course: "Machine Learning Fundamentals",
    courseCode: "CS 4501",
    dueDate: new Date(2026, 0, 5), // Jan 5, 2026
    type: "exam",
    priority: "high",
  },
];

const typeIcons = {
  assignment: FileText,
  exam: AlertCircle,
  project: BookOpen,
  reading: BookOpen,
};

const typeColors = {
  assignment: "bg-blue-500",
  exam: "bg-red-500",
  project: "bg-purple-500",
  reading: "bg-green-500",
};

const priorityColors = {
  high: "text-red-500 bg-red-500/10",
  medium: "text-yellow-500 bg-yellow-500/10",
  low: "text-green-500 bg-green-500/10",
};

export function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Get assignments for a specific date
  const getAssignmentsForDate = (date: Date) => {
    return assignments.filter(
      (assignment) =>
        assignment.dueDate.toDateString() === date.toDateString()
    );
  };

  // Get all dates that have assignments
  const datesWithAssignments = assignments.map((a) => a.dueDate);

  // Get assignments for selected date
  const selectedDateAssignments = selectedDate
    ? getAssignmentsForDate(selectedDate)
    : [];

  // Get upcoming assignments (next 7 days)
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const upcomingAssignments = assignments
    .filter((a) => a.dueDate >= today && a.dueDate <= nextWeek)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-semibold text-foreground">
          Schedule
        </h1>
        <p className="text-sm text-muted-foreground">
          View your assignments and upcoming deadlines
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Calendar</h2>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-muted-foreground">Assignment</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">Exam</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-xs text-muted-foreground">Project</span>
                </div>
              </div>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              components={{
                Day: ({ date, ...props }) => {
                  const assignmentsOnDate = getAssignmentsForDate(date);
                  const hasAssignments = assignmentsOnDate.length > 0;

                  return (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <button {...props} className={cn(props.className, "w-full h-full")}>
                        {date.getDate()}
                      </button>
                      {hasAssignments && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {assignmentsOnDate.slice(0, 3).map((assignment) => (
                            <div
                              key={assignment.id}
                              className={cn(
                                "w-1 h-1 rounded-full",
                                typeColors[assignment.type]
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                },
              }}
            />

            {/* Selected Date Details */}
            {selectedDate && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium mb-3">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                {selectedDateAssignments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateAssignments.map((assignment) => {
                      const Icon = typeIcons[assignment.type];
                      return (
                        <div
                          key={assignment.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              typeColors[assignment.type]
                            )}
                          >
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {assignment.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {assignment.courseCode}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              priorityColors[assignment.priority]
                            )}
                          >
                            {assignment.priority}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No assignments due on this date
                  </p>
                )}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Upcoming Assignments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Upcoming (7 days)</h2>
            <div className="space-y-3">
              {upcomingAssignments.length > 0 ? (
                upcomingAssignments.map((assignment) => {
                  const Icon = typeIcons[assignment.type];
                  const daysUntil = Math.ceil(
                    (assignment.dueDate.getTime() - today.getTime()) /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={assignment.id}
                      className="group p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                            typeColors[assignment.type]
                          )}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-1 truncate">
                            {assignment.title}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {assignment.courseCode}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span
                              className={cn(
                                "font-medium",
                                daysUntil <= 1
                                  ? "text-red-500"
                                  : daysUntil <= 3
                                  ? "text-yellow-500"
                                  : "text-muted-foreground"
                              )}
                            >
                              {daysUntil === 0
                                ? "Due today"
                                : daysUntil === 1
                                ? "Due tomorrow"
                                : `Due in ${daysUntil} days`}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No upcoming assignments
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
