import { motion } from "framer-motion";
import { BookOpen, Clock, Users } from "lucide-react";

interface CourseCardProps {
  title: string;
  code: string;
  instructor: string;
  progress: number;
  nextClass?: string;
  students: number;
  delay?: number;
}

export function CourseCard({ 
  title, 
  code, 
  instructor, 
  progress, 
  nextClass, 
  students,
  delay = 0 
}: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative bg-card rounded-xl border border-border p-5 cursor-pointer shadow-card transition-shadow duration-300 hover:shadow-card-hover"
    >
      {/* Progress indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-t-xl overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, delay: delay * 0.1 + 0.3 }}
          className="h-full bg-primary"
        />
      </div>

      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{code}</span>
          <h3 className="font-display font-semibold text-foreground mt-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary">
          <BookOpen className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{instructor}</p>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {nextClass && (
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{nextClass}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>{students} students</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{progress}% complete</span>
        <span className="font-medium text-primary">
          View Course →
        </span>
      </div>
    </motion.div>
  );
}
