import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Pin, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, db } from "@/components/backend/firebase";
import { getUserCourses } from "@/components/backend/courses";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  preview: string;
  course: string;
  date: string;
  pinned: boolean;
  unread: boolean;
}

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 1. Get all courses the student is enrolled in
        const enrolledCourses = await getUserCourses(user.uid);

        if (enrolledCourses.length === 0) {
          setLoading(false);
          return;
        }

        // 2. Get course IDs (Firestore doc IDs)
        const courseIds = enrolledCourses.map((c: any) => c.id);

        // 3. Build a map of courseId -> courseName for display
        const courseNameMap: Record<string, string> = {};
        enrolledCourses.forEach((c: any) => {
          courseNameMap[c.id] = c.name || c.courseCode || c.id;
        });

        // 4. Fetch announcements from classroomPosts for enrolled courses
        // Firestore 'in' queries support max 30 items, chunk if needed
        const allAnnouncements: Announcement[] = [];
        const chunks = [];
        for (let i = 0; i < courseIds.length; i += 10) {
          chunks.push(courseIds.slice(i, i + 10));
        }

        for (const chunk of chunks) {
          const q = query(
            collection(db, "classroomPosts"),
            where("courseId", "in", chunk),
            where("type", "==", "announcement")
          );

          const snap = await getDocs(q);
          snap.docs.forEach((d) => {
            const data = d.data();
            const createdAt = data.createdAt?.toDate?.();
            const dateStr = createdAt
              ? formatDistanceToNow(createdAt, { addSuffix: true })
              : "Recently";

            allAnnouncements.push({
              id: d.id,
              title: data.title || "Untitled",
              preview: data.content || data.text || "",
              course: courseNameMap[data.courseId] || data.courseId || "",
              date: dateStr,
              pinned: Boolean(data.pinned),
              unread: createdAt ? (Date.now() - createdAt.getTime()) < 48 * 60 * 60 * 1000 : false, // unread if < 48h old
            });
          });
        }

        // Sort: pinned first, then by most recent
        allAnnouncements.sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return 0; // Firestore already orders by time
        });

        setAnnouncements(allAnnouncements);
      } catch (error) {
        console.error("Error fetching student announcements:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnnouncements();
  }, []);

  const unreadCount = announcements.filter(a => a.unread).length;

  return (
    <div className="bg-card rounded-xl border shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-semibold text-foreground">
            Announcements
          </h2>
          {unreadCount > 0 && (
            <span className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full font-medium">
              {unreadCount} new
            </span>
          )}
        </div>
        <Bell className="w-5 h-5 text-muted-foreground" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-6">
          <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group p-3 rounded-lg border transition-all hover:bg-secondary/50",
                announcement.unread
                  ? "bg-primary/5 border-primary/20"
                  : "bg-card border-border"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {announcement.pinned && (
                      <Pin className="w-3 h-3 text-accent flex-shrink-0" />
                    )}
                    <h4
                      className={cn(
                        "text-sm truncate",
                        announcement.unread
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground"
                      )}
                    >
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
                    <span className="text-primary/70 font-medium">
                      {announcement.course}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {announcement.date}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-1" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
