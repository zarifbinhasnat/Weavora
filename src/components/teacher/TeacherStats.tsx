import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Users } from "lucide-react";
import { auth, db } from "../backend/firebase.js";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";

export function TeacherStats() {
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "courses"), where("teacherId", "==", user.uid));

    const unsub = onSnapshot(q, async (snap) => {
      setTotalClasses(snap.size);

      // Count students across all courses
      let studentCount = 0;
      const promises = snap.docs.map(async (courseDoc) => {
        const membersSnap = await getDocs(
          query(
            collection(db, "courses", courseDoc.id, "members"),
            where("role", "==", "student")
          )
        );
        return membersSnap.size;
      });

      const counts = await Promise.all(promises);
      studentCount = counts.reduce((sum, c) => sum + c, 0);
      setTotalStudents(studentCount);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const stats = [
    { title: "Total Classes", value: loading ? "…" : String(totalClasses), icon: BookOpen, color: "bg-[#3F3F46]" },
    { title: "Total Students", value: loading ? "…" : String(totalStudents), icon: Users, color: "bg-[#3F3F46]" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-xl border border-border p-5 shadow-card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-display font-bold text-foreground">{stat.value}</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
 
 
