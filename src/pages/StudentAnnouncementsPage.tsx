import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Pin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, db } from "@/components/backend/firebase";
import { getUserCourses } from "@/components/backend/courses";
import { collection, query, where, getDocs } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

interface Announcement {
    id: string;
    title: string;
    content: string;
    course: string;
    courseId: string;
    author: string;
    date: string;
    pinned: boolean;
    unread: boolean;
    timestamp: number;
}

export function StudentAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAll() {
            if (!auth || !db) {
                console.warn("Firestore/Auth not initialized — skipping announcements fetch.");
                setLoading(false);
                return;
            }

            const user = auth.currentUser;
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const enrolledCourses = await getUserCourses(user.uid);

                if (enrolledCourses.length === 0) {
                    setLoading(false);
                    return;
                }

                const courseIds = enrolledCourses.map((c: any) => c.id);
                const courseNameMap: Record<string, string> = {};
                enrolledCourses.forEach((c: any) => {
                    courseNameMap[c.id] = c.name || c.courseCode || c.id;
                });

                const allAnnouncements: Announcement[] = [];

                // Firestore 'in' supports max 10 items per query
                const chunks = [];
                for (let i = 0; i < courseIds.length; i += 10) {
                    chunks.push(courseIds.slice(i, i + 10));
                }

                for (const chunk of chunks) {
                    if (!db) continue;
                    const q = query(
                        collection(db, "classroomPosts"),
                        where("courseId", "in", chunk),
                        where("type", "==", "announcement")
                    );

                    const snap = await getDocs(q);
                    snap.docs.forEach((d) => {
                        const data = d.data();
                        const createdAt = data.createdAt?.toDate?.();
                        const ts = createdAt ? createdAt.getTime() : 0;

                        allAnnouncements.push({
                            id: d.id,
                            title: data.title || "Untitled",
                            content: data.content || data.text || "",
                            course: courseNameMap[data.courseId] || data.courseId || "",
                            courseId: data.courseId || "",
                            author: data.author || "Instructor",
                            date: createdAt
                                ? formatDistanceToNow(createdAt, { addSuffix: true })
                                : "Recently",
                            pinned: Boolean(data.pinned),
                            unread: createdAt ? (Date.now() - ts) < 48 * 60 * 60 * 1000 : false,
                            timestamp: ts,
                        });
                    });
                }

                // Sort: pinned first, then most recent
                allAnnouncements.sort((a, b) => {
                    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                    return b.timestamp - a.timestamp;
                });

                setAnnouncements(allAnnouncements);
            } catch (error) {
                console.error("Error fetching announcements:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAll();
    }, []);

    const unreadCount = announcements.filter(a => a.unread).length;

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-display font-semibold text-foreground">
                        Announcements
                    </h1>
                    {unreadCount > 0 && (
                        <span className="bg-accent/10 text-accent text-xs px-2.5 py-1 rounded-full font-medium">
                            {unreadCount} new
                        </span>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    All announcements from your enrolled courses
                </p>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : announcements.length === 0 ? (
                <div className="text-center py-16 border rounded-xl border-dashed bg-secondary/20">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-muted-foreground">No announcements from your courses yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((a, index) => (
                        <motion.div
                            key={a.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "p-5 rounded-xl border transition-all hover:shadow-md",
                                a.unread
                                    ? "bg-primary/5 border-primary/20"
                                    : "bg-card border-border"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        {a.pinned && (
                                            <Pin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                                        )}
                                        <h3
                                            className={cn(
                                                "text-base",
                                                a.unread
                                                    ? "font-semibold text-foreground"
                                                    : "font-medium text-foreground"
                                            )}
                                        >
                                            {a.title}
                                        </h3>
                                        {a.unread && (
                                            <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
                                        )}
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                                        {a.content}
                                    </p>

                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-primary/70 font-medium bg-primary/5 px-2 py-0.5 rounded">
                                            {a.course}
                                        </span>
                                        <span className="text-muted-foreground">
                                            by {a.author}
                                        </span>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-muted-foreground">
                                            {a.date}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
