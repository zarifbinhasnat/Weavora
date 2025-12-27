import { motion } from "framer-motion";
import { Bell, Pin, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  preview: string;
  course: string;
  date: string;
  pinned: boolean;
  unread: boolean;
}

const announcements: Announcement[] = [
  {
    id: "1",
    title: "Office Hours Update",
    preview: "My office hours this week will be moved to Thursday 3-5 PM due to the faculty meeting...",
    course: "Machine Learning",
    date: "2 hours ago",
    pinned: true,
    unread: true,
  },
  {
    id: "2",
    title: "Guest Lecture Next Week",
    preview: "We have an exciting guest speaker from Google AI joining us next Wednesday to discuss...",
    course: "AI Fundamentals",
    date: "Yesterday",
    pinned: false,
    unread: true,
  },
  {
    id: "3",
    title: "Assignment 3 Clarification",
    preview: "Several students asked about the data preprocessing section. Here's some additional guidance...",
    course: "Data Ethics",
    date: "2 days ago",
    pinned: false,
    unread: false,
  },
];

interface AnnouncementsProps {
  onViewAll?: () => void;
}

export function Announcements({ onViewAll }: AnnouncementsProps) {
  return (
    <div className="bg-card rounded-xl border shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-semibold text-foreground">Announcements</h2>
          <span className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full font-medium">
            2 new
          </span>
        </div>
        <Bell className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="space-y-3">
        {announcements.map((announcement, index) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={onViewAll}
            className={cn(
              "group p-3 rounded-lg border transition-all hover:bg-secondary/50 cursor-pointer",
              announcement.unread ? "bg-primary/5 border-primary/20" : "bg-card border-border"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {announcement.pinned && (
                    <Pin className="w-3 h-3 text-accent flex-shrink-0" />
                  )}
                  <h4 className={cn(
                    "text-sm truncate",
                    announcement.unread ? "font-semibold text-foreground" : "font-medium text-foreground"
                  )}>
                    {announcement.title}
                  </h4>
                  {announcement.unread && (
                    <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {announcement.preview}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-primary/70 font-medium">{announcement.course}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{announcement.date}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-1" />
            </div>
          </motion.div>
        ))}
      </div>

      <button 
        onClick={onViewAll}
        className="w-full mt-4 text-center text-sm text-primary hover:text-primary/80 font-medium transition-colors"
      >
        View All Announcements →
      </button>
    </div>
  );
}
