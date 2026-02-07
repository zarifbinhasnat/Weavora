import { motion } from "framer-motion";
import { Clock, FileText, BookOpen, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

interface Deadline {
  id: string;
  title: string;
  course: string;
  type: "assignment" | "quiz" | "exam" | "reading";
  dueDate: string;
  daysLeft: number;
}

const deadlines: Deadline[] = [
  { id: "1", title: "Chapter 5 Quiz", course: "Machine Learning", type: "quiz", dueDate: "Tomorrow, 2:00 PM", daysLeft: 1 },
  { id: "2", title: "Research Paper Draft", course: "Data Ethics", type: "assignment", dueDate: "Dec 8, 11:59 PM", daysLeft: 4 },
  { id: "3", title: "Midterm Exam", course: "Statistics", type: "exam", dueDate: "Dec 12, 9:00 AM", daysLeft: 8 },
  { id: "4", title: "Weekly Reading", course: "AI Fundamentals", type: "reading", dueDate: "Dec 6, 6:00 PM", daysLeft: 2 },
];

const typeIcons = {
  assignment: FileText,
  quiz: PenTool,
  exam: BookOpen,
  reading: BookOpen,
};

const urgencyColors = {
  urgent: "border-destructive/30 bg-destructive/5",
  soon: "border-accent/30 bg-accent/5",
  normal: "border-border bg-card",
};

export function UpcomingDeadlines() {
  const getUrgency = (daysLeft: number) => {
    if (daysLeft <= 1) return "urgent";
    if (daysLeft <= 3) return "soon";
    return "normal";
  };

  return (
    <div className="bg-card rounded-xl border shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-foreground">Upcoming Deadlines</h2>
        <Clock className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="space-y-3">
        {deadlines.map((deadline, index) => {
          const Icon = typeIcons[deadline.type];
          const urgency = getUrgency(deadline.daysLeft);

          return (
            <motion.div
              key={deadline.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-secondary/50 cursor-pointer",
                urgencyColors[urgency]
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                urgency === "urgent" ? "bg-destructive/10 text-destructive" :
                urgency === "soon" ? "bg-accent/10 text-accent" :
                "bg-muted text-muted-foreground"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground truncate">{deadline.title}</h4>
                <p className="text-xs text-muted-foreground">{deadline.course}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className={cn(
                  "text-xs font-medium",
                  urgency === "urgent" ? "text-destructive" :
                  urgency === "soon" ? "text-accent" :
                  "text-muted-foreground"
                )}>
                  {deadline.daysLeft === 1 ? "Tomorrow" : `${deadline.daysLeft} days`}
                </p>
                <p className="text-xs text-muted-foreground">{deadline.dueDate.split(",")[0]}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <button className="w-full mt-4 text-center text-sm text-primary hover:text-primary/80 font-medium transition-colors">
        View All Deadlines →
      </button>
    </div>
  );
}
