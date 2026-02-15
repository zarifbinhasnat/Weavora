import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, FileText, BookOpen, PenTool, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/components/backend/firebase";
import { Deadline, listenToDeadlines } from "@/components/backend/deadlines";

const typeIcons: Record<string, any> = {
  assignment: FileText,
  quiz: PenTool,
  exam: AlertCircle,
  project: BookOpen,
  reading: BookOpen,
};

const urgencyColors = {
  urgent: "border-destructive/30 bg-destructive/5",
  soon: "border-accent/30 bg-accent/5",
  normal: "border-border bg-card",
};

export function UpcomingDeadlines() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const unsub = listenToDeadlines(
      user.uid,
      (items) => {
        // Only show upcoming, non-completed deadlines
        const now = new Date();
        const upcoming = items
          .filter((d) => d.dueDate >= now && !d.completed)
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
          .slice(0, 5); // Show top 5
        setDeadlines(upcoming);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, []);

  const getUrgency = (dueDate: Date) => {
    const daysLeft = Math.ceil(
      (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 1) return "urgent";
    if (daysLeft <= 3) return "soon";
    return "normal";
  };

  const getDaysLeft = (dueDate: Date) => {
    return Math.ceil(
      (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  };

  return (
    <div className="bg-card rounded-xl border shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-foreground">Upcoming Deadlines</h2>
        <Clock className="w-5 h-5 text-muted-foreground" />
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : deadlines.length === 0 ? (
        <div className="text-center py-6">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add deadlines from the Schedule tab
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {deadlines.map((deadline, index) => {
            const Icon = typeIcons[deadline.type] || FileText;
            const urgency = getUrgency(deadline.dueDate);
            const daysLeft = getDaysLeft(deadline.dueDate);

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
                    {daysLeft <= 0
                      ? "Today"
                      : daysLeft === 1
                        ? "Tomorrow"
                        : `${daysLeft} days`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {deadline.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
