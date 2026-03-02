import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  submitClassSummary,
  getStudentSummaries,
  listenToStudentSummaries,
  ClassSummaryWithTimestamps,
} from "@/components/backend/classSummaries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, XCircle, Send } from "lucide-react";
import { motion } from "framer-motion";

interface StudentClassSummaryProps {
  classId: string;
  className: string;
}

export function StudentClassSummary({
  classId,
  className,
}: StudentClassSummaryProps) {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<ClassSummaryWithTimestamps[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Load existing summaries
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    getStudentSummaries(user.uid, classId)
      .then((data) => {
        setSummaries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error loading summaries:", err);
        setError(err.message || "Failed to load summaries");
        setLoading(false);
      });

    // Set up real-time listener
    try {
      const unsubscribe = listenToStudentSummaries(
        user.uid,
        classId,
        setSummaries
      );
      return unsubscribe;
    } catch (err) {
      console.error("❌ Error setting up listener:", err);
      return () => {};
    }
  }, [user?.uid, classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!user) {
      setError("You must be logged in to submit a summary");
      return;
    }

    if (!content.trim()) {
      setError("Summary content cannot be empty");
      return;
    }

    if (content.trim().length < 10) {
      setError("Summary must be at least 10 characters long");
      return;
    }

    setSubmitting(true);

    try {
      await submitClassSummary({
        studentId: user.uid,
        studentName: user.displayName || user.email || "Unknown",
        classId,
        className,
        content,
      });

      setContent("");
      setSuccessMessage("✓ Summary submitted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit summary"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-50 border-green-200";
      case "rejected":
        return "bg-red-50 border-red-200";
      case "pending":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-gray-50";
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Submission Form */}
      <Card className="p-6 border-2">
        <h3 className="text-lg font-semibold mb-4">Submit Class Summary</h3>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 text-sm">{successMessage}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Summary Content
            </label>
            <Textarea
              placeholder="Write a comprehensive summary of today's class. Include key points, concepts discussed, and your understanding..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={submitting}
              className="min-h-[150px] resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              {content.length} characters (minimum 10)
            </p>
          </div>

          <Button
            type="submit"
            disabled={submitting || !content.trim()}
            className="w-full"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Summary
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Summaries History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Your Submissions</h3>

        {summaries.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No summaries submitted yet for this class</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {summaries.map((summary) => (
              <motion.div
                key={summary.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`p-4 border-l-4 ${getStatusColor(summary.status)}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(summary.status)}
                        <Badge
                          variant={
                            summary.status === "approved"
                              ? "default"
                              : summary.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {summary.status.charAt(0).toUpperCase() +
                            summary.status.slice(1)}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        Submitted: {formatDate(summary.createdAt)}
                      </p>

                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {summary.content}
                      </p>

                      {summary.feedback && (
                        <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 mb-1">
                            Teacher Feedback:
                          </p>
                          <p className="text-sm text-gray-700">
                            {summary.feedback}
                          </p>
                          {summary.verifiedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              Reviewed: {formatDate(summary.verifiedAt)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
