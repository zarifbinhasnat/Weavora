import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { CourseCard } from "./CourseCard";
import { fetchCourses } from "../../../lib/courses";

export default function CoursesPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const {
    data: coursesData = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  // ✅ ALWAYS call useMemo (no early return before it)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return coursesData;

    return coursesData.filter((c: any) => {
      const title = (c.title ?? "").toLowerCase();
      const code = (c.code ?? c.id ?? "").toLowerCase();
      const instructor = (c.instructor ?? "").toLowerCase();
      return (
        title.includes(s) ||
        code.includes(s) ||
        instructor.includes(s)
      );
    });
  }, [coursesData, q]);

  // ⬇️ RETURNS COME AFTER ALL HOOKS
  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading courses…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <p className="text-red-500 font-medium">Failed to load courses</p>
        <p className="text-sm text-muted-foreground mt-2">
          {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">Courses</h1>
      </div>

      {/* Search */}
      <div className="relative max-w-lg mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses..."
          className="w-full pl-10 pr-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="font-medium">No courses found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add documents to the{" "}
            <span className="font-mono">courses</span> collection in Firestore.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c: any, i: number) => (
            <CourseCard
              key={c.id}
              title={c.title ?? "Untitled course"}
              code={c.code ?? c.id}
              instructor={c.instructor ?? "—"}
              progress={Number(c.progress ?? 0)}
              nextClass={c.nextClass}
              students={Number(c.students ?? 0)}
              section={c.section}
              avatarUrl={c.avatarUrl}
              delay={i}
              onClick={() =>
                navigate(`/courses/${encodeURIComponent(c.id)}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
