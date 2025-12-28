import { motion } from "framer-motion";
import { MoreVertical, FolderOpen, Image as ImageIcon } from "lucide-react";

interface CourseCardProps {
  title: string;
  code: string;
  instructor: string;
  progress: number;
  nextClass?: string;
  students: number;
  delay?: number;

  onClick?: () => void;

  section?: string;
  avatarUrl?: string;
}

export function CourseCard({
  title,
  code,
  instructor,
  progress,
  nextClass,
  students,
  delay = 0,
  onClick,
  section,
  avatarUrl,
}: CourseCardProps) {
  const initial = (instructor?.trim()?.[0] || title?.trim()?.[0] || "C").toUpperCase();
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.05 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && e.key === "Enter") onClick();
      }}
      className={`group rounded-xl border border-border bg-card shadow-card hover:shadow-card-hover transition-shadow overflow-hidden ${
        onClick ? "cursor-pointer" : "cursor-default"
      }`}
    >
      {/* Banner */}
      <div className="relative h-24 bg-muted">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_10%,white,transparent_45%)]" />

        <div className="absolute left-4 top-3 right-10">
          <h3 className="text-foreground font-semibold leading-tight line-clamp-1">{code}</h3>
          <p className="text-muted-foreground text-xs mt-1 line-clamp-1">{section || ""}</p>
          <p className="text-muted-foreground text-xs mt-1 line-clamp-1">{instructor}</p>
        </div>

        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2 top-2 p-2 rounded-lg hover:bg-background/60 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div className="absolute right-4 bottom-[-18px]">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Instructor"
              className="w-12 h-12 rounded-full border-2 border-card object-cover bg-muted"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full border-2 border-card bg-primary flex items-center justify-center font-semibold text-primary-foreground"
              onClick={(e) => e.stopPropagation()}
              title={instructor}
            >
              {initial}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 pt-7">
        <p className="text-sm font-semibold text-foreground line-clamp-2">{title}</p>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{safeProgress}% complete</span>
          {nextClass ? <span>{nextClass}</span> : <span>{students} students</span>}
        </div>

        <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${safeProgress}%` }} />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-4 text-muted-foreground">
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="hover:text-foreground transition-colors"
          aria-label="Add image"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="hover:text-foreground transition-colors"
          aria-label="Open folder"
        >
          <FolderOpen className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="hover:text-foreground transition-colors"
          aria-label="More"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
