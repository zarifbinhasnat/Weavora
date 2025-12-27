import { motion } from "framer-motion";
import { Bell, Pin, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  course: string;
  date: string;
  pinned: boolean;
  unread: boolean;
  instructor: string;
  fullDate: string;
}

const allAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "Office Hours Update",
    content: "My office hours this week will be moved to Thursday 3-5 PM due to the faculty meeting. Please plan accordingly. If you need to meet outside these hours, feel free to email me to schedule an appointment. I'll be available via email throughout the week for any urgent questions.",
    course: "Machine Learning",
    date: "2 hours ago",
    pinned: true,
    unread: true,
    instructor: "Dr. Sarah Chen",
    fullDate: "Dec 8, 2025 at 2:30 PM",
  },
  {
    id: "2",
    title: "Guest Lecture Next Week",
    content: "We have an exciting guest speaker from Google AI joining us next Wednesday to discuss the latest developments in large language models and their practical applications. This will be a fantastic opportunity to learn from industry experts. Attendance is highly recommended as this material will be covered in the final exam.",
    course: "AI Fundamentals",
    date: "Yesterday",
    pinned: false,
    unread: true,
    instructor: "Dr. James Liu",
    fullDate: "Dec 7, 2025 at 10:15 AM",
  },
  {
    id: "3",
    title: "Assignment 3 Clarification",
    content: "Several students asked about the data preprocessing section. Here's some additional guidance: Make sure to normalize your data before feeding it into the model. You can use StandardScaler from sklearn. Also, remember to split your data into training and testing sets with an 80-20 ratio. If you have any questions, don't hesitate to ask on the discussion forum.",
    course: "Data Ethics",
    date: "2 days ago",
    pinned: false,
    unread: false,
    instructor: "Prof. Michael Torres",
    fullDate: "Dec 6, 2025 at 4:45 PM",
  },
  {
    id: "4",
    title: "Midterm Exam Schedule",
    content: "The midterm exam will be held on December 15th at 2:00 PM in the main lecture hall. The exam will cover all material from weeks 1-8. You are allowed to bring one page of notes (both sides). Make sure to arrive 10 minutes early for seating arrangements. Good luck with your preparation!",
    course: "Statistical Analysis",
    date: "3 days ago",
    pinned: true,
    unread: false,
    instructor: "Dr. Emily Watson",
    fullDate: "Dec 5, 2025 at 9:00 AM",
  },
  {
    id: "5",
    title: "Project Team Formation",
    content: "It's time to form teams for the final project. Teams should consist of 3-4 members. Please submit your team composition through the course portal by the end of this week. If you're having trouble finding teammates, use the discussion forum to connect with others. Projects will be assigned next Monday.",
    course: "Machine Learning",
    date: "4 days ago",
    pinned: false,
    unread: false,
    instructor: "Dr. Sarah Chen",
    fullDate: "Dec 4, 2025 at 1:20 PM",
  },
  {
    id: "6",
    title: "Reading Week Reminder",
    content: "Just a reminder that we have a reading week next week, so there will be no lectures. Use this time to catch up on assignments and prepare for the upcoming midterms. Office hours will still be held as scheduled. The library will have extended hours during this period.",
    course: "AI Fundamentals",
    date: "5 days ago",
    pinned: false,
    unread: false,
    instructor: "Dr. James Liu",
    fullDate: "Dec 3, 2025 at 3:30 PM",
  },
  {
    id: "7",
    title: "Research Paper Discussion",
    content: "Next week we'll be discussing the recent paper on 'Algorithmic Fairness in Machine Learning Systems'. Please read the paper before class and come prepared with questions and thoughts. You can find the paper link in the course materials section. This is a crucial topic for understanding ethical implications in AI.",
    course: "Data Ethics",
    date: "1 week ago",
    pinned: false,
    unread: false,
    instructor: "Prof. Michael Torres",
    fullDate: "Dec 1, 2025 at 11:00 AM",
  },
  {
    id: "8",
    title: "Lab Session Update",
    content: "The lab session scheduled for Friday has been cancelled due to equipment maintenance. We'll have a make-up session next week. In the meantime, you can work on the practice problems available in the course portal. If you have any questions about the lab material, please post them on the forum.",
    course: "Statistical Analysis",
    date: "1 week ago",
    pinned: false,
    unread: false,
    instructor: "Dr. Emily Watson",
    fullDate: "Nov 30, 2025 at 5:15 PM",
  },
];

export function AnnouncementsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-display font-bold text-foreground">
            All Announcements
          </h1>
        </div>
        <p className="text-muted-foreground">
          Stay updated with the latest news from your courses
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          All
        </button>
        <button className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
          Unread
        </button>
        <button className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
          Pinned
        </button>
      </div>

      {/* Announcements Grid */}
      <div className="space-y-4">
        {allAnnouncements.map((announcement, index) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "bg-card rounded-xl border shadow-card p-6 transition-all hover:shadow-lg",
              announcement.unread && "border-primary/30 bg-primary/5"
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {announcement.pinned && (
                    <Pin className="w-4 h-4 text-accent" />
                  )}
                  <h3 className="text-xl font-display font-semibold text-foreground">
                    {announcement.title}
                  </h3>
                  {announcement.unread && (
                    <span className="w-2.5 h-2.5 bg-accent rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="text-primary font-medium">{announcement.course}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{announcement.instructor}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{announcement.fullDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground/90 leading-relaxed">
                {announcement.content}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{announcement.date}</span>
              {announcement.unread && (
                <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                  Mark as read
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      <div className="mt-8 text-center">
        <button className="px-6 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors">
          Load More Announcements
        </button>
      </div>
    </div>
  );
}
