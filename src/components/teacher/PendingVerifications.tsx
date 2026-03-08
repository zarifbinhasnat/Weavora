import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, MessageSquare, FileText, Clock } from "lucide-react";
import { auth } from "../backend/firebase.js";
import {
  listenToStudentNotifications,
  StudentNotification,
} from "../backend/notifications";

interface StudentNotificationsProps {
  onNotificationCountChange?: (count: number) => void;
}

function timeAgo(timestamp: any): string {
  if (!timestamp?.toDate) return "Just now";
  const now = Date.now();
  const then = timestamp.toDate().getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function PendingVerifications({
  onNotificationCountChange,
}: StudentNotificationsProps) {
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const unsub = listenToStudentNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
      onNotificationCountChange?.(notifs.length);
    });

    return () => unsub();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card rounded-xl border border-border p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            Notifications
          </h3>
        </div>
        {notifications.length > 0 && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full font-medium">
            {notifications.length}
          </span>
        )}
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Loading notifications…
        </p>
      )}

      {!loading && notifications.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No new activity from students yet.
        </p>
      )}

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {notifications.slice(0, 15).map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${notif.type === "chat" ? "bg-blue-500" : "bg-purple-500"
                    }`}
                >
                  {notif.type === "chat" ? (
                    <MessageSquare className="w-4 h-4 text-white" />
                  ) : (
                    <FileText className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground leading-snug group-hover:text-primary transition-colors">
                    New {notif.type === "chat" ? "message" : "post"} from{" "}
                    <span className="font-semibold">{notif.studentName}</span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    in your{" "}
                    <span className="font-medium text-foreground/80">
                      {notif.courseName}
                    </span>{" "}
                    classroom
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
                    "{notif.preview}"
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{timeAgo(notif.timestamp)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
