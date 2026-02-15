import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  FileText,
  BookOpen,
  AlertCircle,
  ChevronRight,
  Plus,
  X,
  PenTool,
  Trash2,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/components/backend/firebase";
import { getUserCourses } from "@/components/backend/courses";
import {
  Deadline,
  createDeadline,
  deleteDeadline,
  toggleDeadlineComplete,
  listenToDeadlines,
} from "@/components/backend/deadlines";

const typeIcons: Record<string, any> = {
  assignment: FileText,
  exam: AlertCircle,
  project: BookOpen,
  reading: BookOpen,
  quiz: PenTool,
};

const typeColors: Record<string, string> = {
  assignment: "bg-blue-500",
  exam: "bg-red-500",
  project: "bg-purple-500",
  reading: "bg-green-500",
  quiz: "bg-yellow-500",
};

const priorityColors: Record<string, string> = {
  high: "text-red-500 bg-red-500/10",
  medium: "text-yellow-500 bg-yellow-500/10",
  low: "text-green-500 bg-green-500/10",
};

export function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [courses, setCourses] = useState<string[]>([]);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formCourse, setFormCourse] = useState("");
  const [formType, setFormType] = useState<Deadline["type"]>("assignment");
  const [formPriority, setFormPriority] = useState<Deadline["priority"]>("medium");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("23:59");
  const [submitting, setSubmitting] = useState(false);

  // Fetch enrolled courses for the dropdown
  useEffect(() => {
    async function fetchCourses() {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const enrolled = await getUserCourses(user.uid);
        const names = enrolled.map((c: any) => c.name || c.courseCode || c.id);
        setCourses(names);
        if (names.length > 0) setFormCourse(names[0]);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    }
    fetchCourses();
  }, []);

  // Listen to deadlines in real-time
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const unsub = listenToDeadlines(
      user.uid,
      (items) => {
        setDeadlines(items);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, []);

  // Add deadline handler
  const handleAddDeadline = async () => {
    const user = auth.currentUser;
    if (!user || !formTitle.trim() || !formDate) return;

    setSubmitting(true);
    try {
      const [year, month, day] = formDate.split("-").map(Number);
      const [hours, minutes] = formTime.split(":").map(Number);
      const dueDate = new Date(year, month - 1, day, hours, minutes);

      await createDeadline({
        title: formTitle,
        course: formCourse,
        type: formType,
        dueDate,
        priority: formPriority,
        userId: user.uid,
      });

      // Reset form
      setFormTitle("");
      setFormDate("");
      setFormTime("23:59");
      setFormType("assignment");
      setFormPriority("medium");
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to create deadline:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Helpers
  const getDeadlinesForDate = (date: Date) =>
    deadlines.filter(
      (d) => d.dueDate.toDateString() === date.toDateString() && !d.completed
    );

  const selectedDateDeadlines = selectedDate ? getDeadlinesForDate(selectedDate) : [];

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const upcomingDeadlines = deadlines
    .filter((d) => d.dueDate >= today && d.dueDate <= nextWeek && !d.completed)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              Schedule
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your assignments and upcoming deadlines
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? (
              <><X className="w-4 h-4 mr-2" /> Cancel</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> Add Deadline</>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Add Deadline Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 border-primary/30">
            <h3 className="text-lg font-semibold mb-4">New Deadline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Research Paper Draft"
                  className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Course</label>
                <select
                  value={formCourse}
                  onChange={(e) => setFormCourse(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {courses.length > 0 ? (
                    courses.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))
                  ) : (
                    <option value="">No courses</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Due Date *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Due Time</label>
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as Deadline["type"])}
                  className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                  <option value="quiz">Quiz</option>
                  <option value="project">Project</option>
                  <option value="reading">Reading</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Priority</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as Deadline["priority"])}
                  className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddDeadline}
                disabled={submitting || !formTitle.trim() || !formDate}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Deadline
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
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
                    const deadlinesOnDate = getDeadlinesForDate(date);
                    const hasDeadlines = deadlinesOnDate.length > 0;

                    return (
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <button {...props} className={cn(props.className, "w-full h-full")}>
                          {date.getDate()}
                        </button>
                        {hasDeadlines && (
                          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {deadlinesOnDate.slice(0, 3).map((d) => (
                              <div
                                key={d.id}
                                className={cn(
                                  "w-1 h-1 rounded-full",
                                  typeColors[d.type] || "bg-blue-500"
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
                  {selectedDateDeadlines.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateDeadlines.map((deadline) => {
                        const Icon = typeIcons[deadline.type] || FileText;
                        return (
                          <div
                            key={deadline.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                          >
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                typeColors[deadline.type] || "bg-blue-500"
                              )}
                            >
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {deadline.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {deadline.course}
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                priorityColors[deadline.priority]
                              )}
                            >
                              {deadline.priority}
                            </Badge>
                            <div className="flex gap-1">
                              <button
                                onClick={() => toggleDeadlineComplete(deadline.id, true)}
                                className="p-1 text-muted-foreground hover:text-green-500 transition-colors"
                                title="Mark complete"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteDeadline(deadline.id)}
                                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No deadlines on this date
                    </p>
                  )}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Upcoming Deadlines */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Upcoming (7 days)</h2>
              <div className="space-y-3">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.map((deadline) => {
                    const Icon = typeIcons[deadline.type] || FileText;
                    const daysUntil = Math.ceil(
                      (deadline.dueDate.getTime() - today.getTime()) /
                      (1000 * 60 * 60 * 24)
                    );

                    return (
                      <div
                        key={deadline.id}
                        className="group p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                              typeColors[deadline.type] || "bg-blue-500"
                            )}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium mb-1 truncate">
                              {deadline.title}
                            </p>
                            <p className="text-xs text-muted-foreground mb-2">
                              {deadline.course}
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
                                {daysUntil <= 0
                                  ? "Due today"
                                  : daysUntil === 1
                                    ? "Due tomorrow"
                                    : `Due in ${daysUntil} days`}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => toggleDeadlineComplete(deadline.id, true)}
                              className="p-1 text-muted-foreground hover:text-green-500 transition-colors"
                              title="Mark complete"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteDeadline(deadline.id)}
                              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No upcoming deadlines — add one above!
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
