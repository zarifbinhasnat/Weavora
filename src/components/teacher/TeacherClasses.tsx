import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Users, Calendar, Plus, Copy } from "lucide-react";

import { auth } from "../backend/firebase.js";
import { db } from "../backend/firebase.js";
import { collection, onSnapshot, query, where } from "firebase/firestore";

interface TeacherClassesProps {
  limit?: number;
  onCreateClass: () => void;
}

type CourseDoc = {
  name?: string;
  title?: string;
  courseCode?: string;
  code?: string;

  joinCode?: string; // ✅ add

  students?: number;
  nextClass?: string;
  nextSession?: string;
  progress?: number;
  teacherId?: string;
  createdAt?: unknown;
};

type ClassCard = {
  id: string;
  name: string;
  code: string;
  joinCode: string; // ✅
  students: number;
  nextSession: string;
  progress: number;
};

export function TeacherClasses({ limit, onCreateClass }: TeacherClassesProps) {
  const [classes, setClasses] = useState<ClassCard[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setClasses([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, "courses"), where("teacherId", "==", user.uid));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: ClassCard[] = snap.docs.map((d) => {
          const data = d.data() as CourseDoc;

          return {
            id: d.id,
            name: (data.name ?? data.title ?? "Untitled Class") as string,
            code: (data.courseCode ?? data.code ?? d.id) as string,
            joinCode: (data.joinCode ?? "") as string, // ✅ add
            students: Number(data.students ?? 0),
            nextSession: (data.nextSession ?? data.nextClass ?? "") as string,
            progress: Number(data.progress ?? 0),
          };
        });

        setClasses(rows);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load courses:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const displayClasses = useMemo(
    () => (limit ? classes.slice(0, limit) : classes),
    [classes, limit]
  );

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Join code copied!");
    } catch {
      // fallback
      window.prompt("Copy join code:", text);
    }
  };

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
          <h3 className="font-display font-semibold text-foreground text-lg mb-2">
            Create New Class
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Start a new course and manage students
          </p>
        </div>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Loading classes…</p>
        </div>
      )}

      {/* Existing Classes */}
      {!loading &&
        displayClasses.map((classItem, index) => (
          <motion.div
            key={classItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index + 1) * 0.05 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => navigate(`/teacher/course/${classItem.id}`)}
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

                  {/* ✅ Join code line */}
                  {classItem.joinCode && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        Join code:{" "}
                        <span className="font-semibold text-foreground">
                          {classItem.joinCode}
                        </span>
                      </p>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(classItem.joinCode);
                        }}
                        title="Copy join code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}
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
                  <span>{classItem.nextSession || "—"}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground">
                    {classItem.progress}%
                  </span>
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
 
