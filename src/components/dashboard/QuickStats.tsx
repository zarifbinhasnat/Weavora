import { motion } from "framer-motion";
import { BookCheck } from "lucide-react";

interface QuickStatsProps {
  courseCount: number;
}

export function QuickStats({ courseCount }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border shadow-card p-4 hover:shadow-card-hover transition-shadow"
      >
        <div className="flex items-center justify-between mb-2">
          <BookCheck className="w-5 h-5 text-primary" />
        </div>
        <p className="text-2xl font-display font-bold text-foreground">{courseCount}</p>
        <p className="text-sm text-muted-foreground">Courses Enrolled</p>
      </motion.div>
    </div>
  );
}
