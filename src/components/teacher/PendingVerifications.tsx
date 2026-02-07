import { motion } from "framer-motion";
import { Bell, CheckCircle, Clock, FileText } from "lucide-react";

interface PendingVerificationsProps {
  onClearNotification: () => void;
}

const pendingItems = [
  {
    id: 1,
    title: "AI Summary - Machine Learning Lecture 5",
    description: "Neural networks and deep learning fundamentals",
    timestamp: "2 hours ago",
    type: "summary",
  },
  {
    id: 2,
    title: "AI Summary - Data Structures Lab 3",
    description: "Binary trees and traversal algorithms",
    timestamp: "5 hours ago",
    type: "summary",
  },
  {
    id: 3,
    title: "Copy Check Alert - Assignment 2",
    description: "Possible similarities detected in 3 submissions",
    timestamp: "1 day ago",
    type: "alert",
  },
];

export function PendingVerifications({ onClearNotification }: PendingVerificationsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card rounded-xl border border-border p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Pending Verifications</h3>
        </div>
        <span className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs rounded-full font-medium">
          {pendingItems.length}
        </span>
      </div>

      <div className="space-y-3">
        {pendingItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                item.type === 'summary' ? 'bg-blue-500' : 'bg-orange-500'
              }`}>
                {item.type === 'summary' ? (
                  <FileText className="w-4 h-4 text-white" />
                ) : (
                  <Bell className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{item.timestamp}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onClearNotification();
                }}
                className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                Verify
              </button>
              <button className="px-3 py-1.5 border border-border rounded-md text-xs font-medium hover:bg-secondary transition-colors">
                Dismiss
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <button className="w-full mt-4 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
        View All Notifications →
      </button>
    </motion.div>
  );
}
