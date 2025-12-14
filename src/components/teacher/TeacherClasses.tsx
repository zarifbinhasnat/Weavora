import { motion } from "framer-motion";
import { BookOpen, Users, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeacherClassesProps {
  limit?: number;
  onCreateClass: () => void;
}

const classes = [
  {
    id: 1,
    name: "Machine Learning Fundamentals",
    code: "CS 4501",
    students: 45,
    nextSession: "Today, 2:00 PM",
    progress: 68,
  },
  {
    id: 2,
    name: "Data Structures",
    code: "CS 2100",
    students: 52,
    nextSession: "Tomorrow, 10:00 AM",
    progress: 82,
  },
  {
    id: 3,
    name: "Web Development",
    code: "CS 3200",
    students: 38,
    nextSession: "Wed, 3:30 PM",
    progress: 45,
  },
  {
    id: 4,
    name: "Database Systems",
    code: "CS 3100",
    students: 41,
    nextSession: "Thu, 1:00 PM",
    progress: 91,
  },
];

export function TeacherClasses({ limit, onCreateClass }: TeacherClassesProps) {
  const displayClasses = limit ? classes.slice(0, limit) : classes;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Add New Class Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        onClick={onCreateClass}
        className="group relative bg-card rounded-xl border-2 border-dashed border-border p-5 cursor-pointer shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary"
      >
        <div className="flex flex-col items-center justify-center h-full min-h-[180px]">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-foreground text-lg mb-2">Create New Class</h3>
          <p className="text-sm text-muted-foreground text-center">
            Start a new course and manage students
          </p>
        </div>
      </motion.div>

      {/* Existing Classes */}
      {displayClasses.map((classItem, index) => (
        <motion.div
          key={classItem.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (index + 1) * 0.05 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-card rounded-xl border border-border p-5 cursor-pointer shadow-card transition-all duration-300 hover:shadow-card-hover"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground text-base mb-0.5">
                  {classItem.name}
                </h3>
                <p className="text-sm text-muted-foreground">{classItem.code}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{classItem.students} students</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{classItem.nextSession}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-foreground">{classItem.progress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${classItem.progress}%` }}
                  transition={{ duration: 1, delay: (index + 1) * 0.1 }}
                  className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
