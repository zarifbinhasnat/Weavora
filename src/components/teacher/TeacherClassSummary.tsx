import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getClassSummaries,
  listenToClassSummaries,
  approveSummary,
  rejectSummary,
  ClassSummaryWithTimestamps,
} from "@/components/backend/classSummaries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TeacherClassSummaryProps {
  classId: string;
  className: string;
}

export function TeacherClassSummary({
  classId,
  className,
}: TeacherClassSummaryProps) {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<ClassSummaryWithTimestamps[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Load summaries
  useEffect(() => {
    setLoading(true);
    setError("");

    const filter =
      statusFilter === "all" ? undefined : statusFilter;
    
    getClassSummaries(classId, filter as any)
      .then((data) => {
        console.log("✅ Loaded summaries:", data.length);
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
      const unsubscribe = listenToClassSummaries(
        classId,
        filter as any,
        (data) => {
          console.log("🔄 Summaries updated:", data.length);
          setSummaries(data);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.error("❌ Error setting up listener:", err);
      return () => {};
    }
  }, [classId, statusFilter]);

  const handleApprove = async (summaryId: string) => {
    if (!user?.uid) {
      setError("You must be logged in");
      return;
    }

    setError("");
    setProcessingId(summaryId);

    try {
      await approveSummary(summaryId, user.uid);
      setSuccessMessage("Summary approved successfully!");
      setExpandedId(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (summaryId: string) => {
    if (!user?.uid) {
      setError("You must be logged in");
      return;
    }

    const feedback = feedbackText[summaryId];

    if (!feedback?.trim()) {
      setError("Feedback is required when rejecting");
      return;
    }

    setError("");
    setProcessingId(summaryId);

    try {
      await rejectSummary(summaryId, user.uid, feedback);
      setSuccessMessage("Summary rejected with feedback");
      setFeedbackText((prev) => {
        const newFeedback = { ...prev };
        delete newFeedback[summaryId];
        return newFeedback;
      });
      setExpandedId(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusStats = () => {
    const stats = {
      pending: summaries.filter((s) => s.status === "pending").length,
      approved: summaries.filter((s) => s.status === "approved").length,
      rejected: summaries.filter((s) => s.status === "rejected").length,
    };
    return stats;
  };

  const stats = getStatusStats();

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

  const displayedSummaries =
    statusFilter === "all"
      ? summaries
      : summaries.filter((s) => s.status === statusFilter);

  // Debug logging
  console.log("🔐 TeacherClassSummary - user:", user);
  console.log("🔐 User role:", user?.role);
  console.log("🔐 User UID:", user?.uid);

  // Check role-based access - also check if user is dev-teacher-123 as fallback
  const isTeacher = user?.role === "teacher" || user?.uid === "dev-teacher-123";
  
  if (!isTeacher) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">
            Only teachers can verify class summaries. (Current role: {user?.role || "none"})
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Filter & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className={`p-4 cursor-pointer transition-all ${
            statusFilter === "all"
              ? "bg-gray-100 border-gray-400"
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => setStatusFilter("all")}
        >
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-600 mb-1">
              All Summaries
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.pending + stats.approved + stats.rejected}
            </p>
          </div>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all ${
            statusFilter === "pending"
              ? "bg-amber-100 border-amber-400"
              : "border-gray-200 hover:border-amber-300"
          }`}
          onClick={() => setStatusFilter("pending")}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-semibold text-amber-700">Pending</p>
            </div>
            <p className="text-2xl font-bold text-amber-900">
              {stats.pending}
            </p>
          </div>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all ${
            statusFilter === "approved"
              ? "bg-green-100 border-green-400"
              : "border-gray-200 hover:border-green-300"
          }`}
          onClick={() => setStatusFilter("approved")}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-xs font-semibold text-green-700">Approved</p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {stats.approved}
            </p>
          </div>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all ${
            statusFilter === "rejected"
              ? "bg-red-100 border-red-400"
              : "border-gray-200 hover:border-red-300"
          }`}
          onClick={() => setStatusFilter("rejected")}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <p className="text-xs font-semibold text-red-700">Rejected</p>
            </div>
            <p className="text-2xl font-bold text-red-900">
              {stats.rejected}
            </p>
          </div>
        </Card>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800 text-sm">{successMessage}</p>
        </motion.div>
      )}

      {/* Summaries List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : displayedSummaries.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>
            No {statusFilter !== "all" ? statusFilter : ""} summaries to
            review
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {displayedSummaries.map((summary) => (
              <motion.div
                key={summary.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card
                  className={`border-l-4 transition-all ${getStatusColor(summary.status)}`}
                >
                  <button
                    onClick={() =>
                      setExpandedId(
                        expandedId === summary.id ? null : summary.id
                      )
                    }
                    className="w-full p-4 text-left hover:bg-opacity-50 transition-colors"
                  >
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
                            {summary.status
                              .charAt(0)
                              .toUpperCase() +
                              summary.status.slice(1)}
                          </Badge>
                          <span className="text-sm font-medium text-gray-700">
                            {summary.studentName}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          Submitted: {formatDate(summary.createdAt)}
                        </p>

                        <p className="text-sm text-gray-700 line-clamp-2">
                          {summary.content}
                        </p>
                      </div>

                      {summary.status === "pending" && (
                        <div className="flex-shrink-0">
                          {expandedId === summary.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedId === summary.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t px-4 py-4 space-y-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            Full Summary:
                          </p>
                          <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                            {summary.content}
                          </p>
                        </div>

                        {summary.status === "pending" && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Feedback (if rejecting):
                              </label>
                              <Textarea
                                placeholder="Provide constructive feedback for the student..."
                                value={feedbackText[summary.id] || ""}
                                onChange={(e) =>
                                  setFeedbackText((prev) => ({
                                    ...prev,
                                    [summary.id]: e.target.value,
                                  }))
                                }
                                disabled={processingId === summary.id}
                                className="min-h-[100px] resize-none"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Required only if rejecting
                              </p>
                            </div>

                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleApprove(summary.id!)}
                                disabled={processingId === summary.id}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                {processingId === summary.id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </>
                                )}
                              </Button>

                              <Button
                                onClick={() => handleReject(summary.id!)}
                                disabled={
                                  processingId === summary.id ||
                                  !feedbackText[summary.id]?.trim()
                                }
                                variant="destructive"
                                className="flex-1"
                              >
                                {processingId === summary.id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Rejecting...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </>
                                )}
                              </Button>
                            </div>
                          </>
                        )}

                        {summary.status === "approved" && (
                          <div className="p-3 bg-green-100 border border-green-300 rounded">
                            <p className="text-sm text-green-800">
                              ✓ Approved by {summary.verifiedBy}
                            </p>
                            {summary.verifiedAt && (
                              <p className="text-xs text-green-700 mt-1">
                                {formatDate(summary.verifiedAt)}
                              </p>
                            )}
                          </div>
                        )}

                        {summary.status === "rejected" && (
                          <div className="p-3 bg-red-100 border border-red-300 rounded space-y-2">
                            <p className="text-sm text-red-800">
                              ✗ Rejected by {summary.verifiedBy}
                            </p>
                            {summary.feedback && (
                              <div>
                                <p className="text-xs font-semibold text-red-800 mb-1">
                                  Feedback:
                                </p>
                                <p className="text-sm text-red-800">
                                  {summary.feedback}
                                </p>
                              </div>
                            )}
                            {summary.verifiedAt && (
                              <p className="text-xs text-red-700">
                                {formatDate(summary.verifiedAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
