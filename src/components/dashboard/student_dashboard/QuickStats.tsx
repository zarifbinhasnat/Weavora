import { motion } from "framer-motion";
import { TrendingUp, BookCheck, Clock, Target } from "lucide-react";

interface Stat {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon: React.ElementType;
}

const stats: Stat[] = [
  { label: "Overall Progress", value: "73%", change: "+5% this week", positive: true, icon: TrendingUp },
  { label: "Courses Enrolled", value: "4", icon: BookCheck },
  { label: "Study Hours", value: "12.5h", change: "this week", icon: Clock },
  { label: "Goals Met", value: "8/10", change: "this month", positive: true, icon: Target },
];

export function QuickStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card rounded-xl border shadow-card p-4 hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <stat.icon className="w-5 h-5 text-primary" />
            {stat.positive !== undefined && (
              <span className={stat.positive ? "text-success text-xs font-medium" : "text-destructive text-xs font-medium"}>
                {stat.change}
              </span>
            )}
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          {stat.change && stat.positive === undefined && (
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
