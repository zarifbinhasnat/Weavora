import { motion } from "framer-motion";
import { BookOpen, Users, FileCheck, TrendingUp } from "lucide-react";

const stats = [
  { title: "Total Classes", value: "8", icon: BookOpen, color: "bg-[#3F3F46]" },
  { title: "Total Students", value: "156", icon: Users, color: "bg-[#3F3F46]" },
  { title: "Pending Verifications", value: "3", icon: FileCheck, color: "bg-[#3F3F46]" },
  { title: "Engagement Rate", value: "87%", icon: TrendingUp, color: "bg-[#3F3F46]" },
];

export function TeacherStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
