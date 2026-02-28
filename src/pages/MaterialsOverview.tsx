import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { FileText, BookOpen, Loader2, Download, ExternalLink } from "lucide-react";
import { auth, db } from "@/components/backend/firebase";
import { getUserCourses } from "@/components/backend/courses";
import { collection, query, where, getDocs } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

interface MaterialFile {
  id: string;
  name: string;
  title: string;
  courseCode: string;
  courseName: string;
  pdfUrl: string;
  uploadedAt: string;
  fileSize: string;
}

export function MaterialsOverview() {
  const [files, setFiles] = useState<MaterialFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllMaterials() {
      const user = auth?.currentUser;
      if (!auth || !db) {
        console.warn("Firestore or Auth not initialized — skipping materials overview load.");
        setLoading(false);
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 1. Get all courses the student is enrolled in
        const enrolledCourses = await getUserCourses(user.uid);

        // 2. For each course, fetch all documents
        const allFiles: MaterialFile[] = [];

        await Promise.all(
          enrolledCourses.map(async (course: any) => {
            const firestoreId = course.id; // Firestore document ID
            const cCode = course.courseCode || "";
            const cName = course.name || course.title || cCode || firestoreId;

            // Documents may be stored with courseId = Firestore doc ID OR courseCode
            // Try both to catch all files
            const idsToTry = [firestoreId, cCode].filter(Boolean);
            const seenDocIds = new Set<string>();

            for (const cid of idsToTry) {
              try {
                const q = query(
                  collection(db, "Documents"),
                  where("courseId", "==", cid)
                );
                const snap = await getDocs(q);

                snap.docs.forEach((d) => {
                  if (seenDocIds.has(d.id)) return; // deduplicate
                  seenDocIds.add(d.id);
                  const data = d.data();
                  const createdAt = data.createdAt?.toDate?.();

                  allFiles.push({
                    id: d.id,
                    name: data.fileName || data.title || "Untitled",
                    title: data.title || data.fileName || "Untitled",
                    courseCode: cCode || firestoreId,
                    courseName: cName,
                    pdfUrl: data.pdfUrl || "",
                    uploadedAt: createdAt
                      ? formatDistanceToNow(createdAt, { addSuffix: true })
                      : "Recently",
                    fileSize: data.fileSize
                      ? typeof data.fileSize === "number"
                        ? `${(data.fileSize / 1024).toFixed(0)} KB`
                        : data.fileSize
                      : "",
                  });
                });
              } catch {
                // Skip on error
              }
            }
          })
        );

        // Sort by most recent first (approximation — "recently" first)
        allFiles.sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));

        setFiles(allFiles);
      } catch (error) {
        console.error("Error loading materials:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllMaterials();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-semibold text-foreground">
          Course Materials
        </h1>
        <p className="text-sm text-muted-foreground">
          {files.length} {files.length === 1 ? "file" : "files"} across your courses
        </p>
      </motion.div>

      {files.length === 0 ? (
        <div className="text-center py-12 border rounded-xl border-dashed bg-secondary/20">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No materials uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card
                className="hover:shadow-md transition-all cursor-pointer hover:border-primary/40 group"
                onClick={() => {
                  if (file.pdfUrl) window.open(file.pdfUrl, "_blank");
                }}
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file.courseName}
                      {file.fileSize && ` • ${file.fileSize}`}
                      {file.uploadedAt && ` • ${file.uploadedAt}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (file.pdfUrl) {
                          const a = document.createElement("a");
                          a.href = file.pdfUrl;
                          a.download = file.name;
                          a.target = "_blank";
                          a.click();
                        }
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
