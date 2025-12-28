import { useMemo, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchCourseById, 
  fetchCourseMaterials, 
  fetchCourseAssignments,
  fetchCourseAnnouncements,
  uploadMaterialFile,
  submitAssignment,
  fetchAssignmentSubmissions,
  markAnnouncementAsRead,
  fetchReadAnnouncements
} from "../../../lib/courses";
import {
  ArrowLeft,
  Search,
  User,
  BookOpen,
  Clock,
  Users,
  FileText,
  ClipboardList,
  Bell,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  Send,
  File,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { Announcements } from "@/components/dashboard/Announcements";
import { useToast } from "@/hooks/use-toast";

type TabKey = "overview" | "materials" | "assignments" | "announcements";
type MaterialType = "lecture" | "reading" | "reference" | "other";

export default function CourseDetails() {
  const navigate = useNavigate();
  const { code } = useParams();
  const courseId = decodeURIComponent(code || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Material upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialDesc, setMaterialDesc] = useState("");
  const [materialType, setMaterialType] = useState<MaterialType>("lecture");
  const [materialWeek, setMaterialWeek] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Assignment submission modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionComments, setSubmissionComments] = useState("");
  const submissionInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [materialFilter, setMaterialFilter] = useState<MaterialType | "all">("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");

  // Mock user ID (replace with actual auth)
  const userId = "currentUser123";

  // Fetch course data
  const { data: course, isLoading, isError, error } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => fetchCourseById(courseId),
    enabled: !!courseId,
  });

  // Fetch materials
  const { data: materials = [] } = useQuery({
    queryKey: ["materials", courseId],
    queryFn: () => fetchCourseMaterials(courseId),
    enabled: !!courseId,
  });

  // Fetch assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", courseId],
    queryFn: () => fetchCourseAssignments(courseId),
    enabled: !!courseId,
  });

  // Fetch submissions
  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions", courseId, userId],
    queryFn: () => fetchAssignmentSubmissions(courseId, userId),
    enabled: !!courseId,
  });

  // Fetch announcements
  const { data: courseAnnouncements = [] } = useQuery({
    queryKey: ["courseAnnouncements", courseId],
    queryFn: () => fetchCourseAnnouncements(courseId),
    enabled: !!courseId,
  });

  // Fetch read announcements
  const { data: readAnnouncementIds = [] } = useQuery({
    queryKey: ["readAnnouncements", courseId, userId],
    queryFn: () => fetchReadAnnouncements(courseId, userId),
    enabled: !!courseId,
  });

  // Upload material mutation
  const uploadMutation = useMutation({
    mutationFn: (data: { file: File; materialData: any }) =>
      uploadMaterialFile(courseId, data.file, data.materialData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials", courseId] });
      toast({
        title: "Material uploaded",
        description: "The material has been uploaded successfully.",
      });
      setShowUploadModal(false);
      resetUploadForm();
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit assignment mutation
  const submitMutation = useMutation({
    mutationFn: (data: { file: File; comments: string }) =>
      submitAssignment(
        courseId,
        selectedAssignment.id,
        userId,
        data.file,
        data.comments
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions", courseId, userId] });
      toast({
        title: "Assignment submitted",
        description: "Your assignment has been submitted successfully.",
      });
      setShowSubmitModal(false);
      resetSubmissionForm();
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark announcement as read mutation
  const markReadMutation = useMutation({
    mutationFn: (announcementId: string) =>
      markAnnouncementAsRead(courseId, announcementId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readAnnouncements", courseId, userId] });
    },
  });

  const resetUploadForm = () => {
    setUploadFile(null);
    setMaterialTitle("");
    setMaterialDesc("");
    setMaterialType("lecture");
    setMaterialWeek("");
  };

  const resetSubmissionForm = () => {
    setSubmissionFile(null);
    setSubmissionComments("");
    setSelectedAssignment(null);
  };

  const handleUpload = () => {
    if (!uploadFile || !materialTitle) {
      toast({
        title: "Missing information",
        description: "Please provide a file and title.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      file: uploadFile,
      materialData: {
        title: materialTitle,
        description: materialDesc,
        type: materialType,
        week: materialWeek || undefined,
      },
    });
  };

  const handleSubmit = () => {
    if (!submissionFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to submit.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({
      file: submissionFile,
      comments: submissionComments,
    });
  };

  const handleAnnouncementClick = (announcementId: string) => {
    if (!readAnnouncementIds.includes(announcementId)) {
      markReadMutation.mutate(announcementId);
    }
  };

  const tabs = useMemo(
    () => [
      { key: "overview" as const, label: "Overview", icon: BookOpen },
      { key: "materials" as const, label: "Materials", icon: FileText },
      { key: "assignments" as const, label: "Assignments", icon: ClipboardList },
      { key: "announcements" as const, label: "Announcements", icon: Bell },
    ],
    []
  );

  // Get unique weeks from materials
  const availableWeeks = useMemo(() => {
    const weeks = new Set(
      materials
        .map((m: any) => m.week)
        .filter(Boolean)
    );
    return Array.from(weeks).sort();
  }, [materials]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    let filtered = [...materials];

    if (materialFilter !== "all") {
      filtered = filtered.filter((m: any) => m.type === materialFilter);
    }

    if (weekFilter !== "all") {
      filtered = filtered.filter((m: any) => m.week === weekFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((m: any) =>
        m.title?.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [materials, materialFilter, weekFilter, searchQuery]);

  // Format date helper
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "—";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Calculate days until due
  const getDaysUntil = (timestamp: any) => {
    if (!timestamp) return null;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Check if assignment is submitted
  const isAssignmentSubmitted = (assignmentId: string) => {
    return submissions.some((s: any) => s.assignmentId === assignmentId);
  };

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading course…</div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Link
          to="/courses"
          className="text-primary hover:underline inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>

        <div className="mt-4 bg-card border border-border rounded-xl p-5">
          <p className="text-red-500 font-medium">Failed to load course</p>
          <p className="text-sm text-muted-foreground mt-2">
            {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <Link
          to="/courses"
          className="text-primary hover:underline inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>

        <div className="mt-4 bg-card border border-border rounded-xl p-5">
          <p className="font-medium">Course not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Course id: <span className="font-mono">{courseId}</span>
          </p>
        </div>
      </div>
    );
  }

  const title = (course as any).title ?? "Untitled course";
  const codeText = (course as any).code ?? (course as any).id ?? courseId;
  const instructor = (course as any).instructor ?? "—";
  const nextClass = (course as any).nextClass;
  const students = Number((course as any).students ?? 0);
  const progress = Math.max(0, Math.min(100, Number((course as any).progress ?? 0)));
  const description = (course as any).description ?? "No description provided.";
  const section = (course as any).section;

  const unreadCount = courseAnnouncements.filter(
    (a: any) => !readAnnouncementIds.includes(a.id)
  ).length;

  return (
    <>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-semibold text-foreground"
            >
              {title}
            </motion.h1>
            <p className="text-sm text-muted-foreground">
              {codeText} {section ? `• ${section}` : ""} • {instructor}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search materials, assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-secondary/50 border-0 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors">
              <User className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/courses")}
            className="text-primary hover:underline inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {/* Course Info Card */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {codeText} {section ? `• ${section}` : ""}
                  </p>
                  <h2 className="text-lg font-display font-semibold text-foreground mt-1">
                    {title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    {description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
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
                </div>

                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-card border border-border rounded-xl p-2 flex gap-2">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.key;

                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={
                      "flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors relative " +
                      (isActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                    {t.key === "announcements" && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-base font-semibold mb-3">Course Overview</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">About this course</p>
                        <p className="text-muted-foreground mt-1">{description}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Instructor</p>
                        <p className="text-muted-foreground mt-1">{instructor}</p>
                      </div>
                    </div>
                    {nextClass && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Next Class</p>
                          <p className="text-muted-foreground mt-1">{nextClass}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-base font-semibold mb-3">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-foreground">{materials.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Materials</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-foreground">{assignments.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Assignments</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "materials" && (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold">Course Materials</h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-4">
                  <select
                    value={materialFilter}
                    onChange={(e) => setMaterialFilter(e.target.value as any)}
                    className="px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="lecture">Lecture Notes</option>
                    <option value="reading">Reading</option>
                    <option value="reference">Reference</option>
                    <option value="other">Other</option>
                  </select>

                  {availableWeeks.length > 0 && (
                    <select
                      value={weekFilter}
                      onChange={(e) => setWeekFilter(e.target.value)}
                      className="px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm"
                    >
                      <option value="all">All Weeks</option>
                      {availableWeeks.map((week) => (
                        <option key={week} value={week}>
                          {week}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {filteredMaterials.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No materials available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMaterials.map((material: any) => (
                      <div
                        key={material.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{material.title || "Untitled"}</h4>
                            {material.type && (
                              <span className="px-2 py-0.5 text-xs bg-muted rounded-full capitalize">
                                {material.type}
                              </span>
                            )}
                            {material.week && (
                              <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                                {material.week}
                              </span>
                            )}
                          </div>
                          {material.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {material.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{formatDate(material.createdAt)}</span>
                            {material.fileSize && <span>{material.fileSize}</span>}
                          </div>
                        </div>
                        {material.url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={material.url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "assignments" && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-base font-semibold mb-4">Assignments</h3>

                {assignments.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No assignments available yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignments.map((assignment: any) => {
                      const daysUntil = getDaysUntil(assignment.dueDate);
                      const isOverdue = daysUntil !== null && daysUntil < 0;
                      const isDueSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 3;
                      const submitted = isAssignmentSubmitted(assignment.id);

                      return (
                        <div
                          key={assignment.id}
                          className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{assignment.title || "Untitled Assignment"}</h4>
                                {submitted && (
                                  <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Submitted
                                  </span>
                                )}
                                {assignment.status === "published" && !submitted && (
                                  <span className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
                                    Active
                                  </span>
                                )}
                              </div>
                              {assignment.instructions && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {assignment.instructions}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-3 text-xs">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>Due: {formatDate(assignment.dueDate)}</span>
                                </div>
                                {assignment.points && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <span>{assignment.points} points</span>
                                  </div>
                                )}
                                {daysUntil !== null && !submitted && (
                                  <div
                                    className={`flex items-center gap-1 ${
                                      isOverdue
                                        ? "text-red-500"
                                        : isDueSoon
                                        ? "text-yellow-500"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {isOverdue ? (
                                      <AlertCircle className="w-3.5 h-3.5" />
                                    ) : (
                                      <Clock className="w-3.5 h-3.5" />
                                    )}
                                    <span>
                                      {isOverdue
                                        ? `${Math.abs(daysUntil)} days overdue`
                                        : daysUntil === 0
                                        ? "Due today"
                                        : `${daysUntil} days left`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant={submitted ? "outline" : "default"}
                              size="sm"
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setShowSubmitModal(true);
                              }}
                              disabled={submitted}
                            >
                              {submitted ? "Submitted" : "Submit"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "announcements" && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-base font-semibold mb-4">Course Announcements</h3>

                {courseAnnouncements.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No announcements yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courseAnnouncements.map((announcement: any) => {
                      const isRead = readAnnouncementIds.includes(announcement.id);

                      return (
                        <div
                          key={announcement.id}
                          className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                            isRead
                              ? "border-border bg-muted/30"
                              : "border-primary/30 bg-primary/5"
                          }`}
                          onClick={() => handleAnnouncementClick(announcement.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Bell className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-medium text-sm ${!isRead ? "font-semibold" : ""}`}>
                                  {announcement.title || "Announcement"}
                                </h4>
                                {!isRead && (
                                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                                )}
                              </div>
                              {announcement.message && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {announcement.message}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDate(announcement.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <UpcomingDeadlines />
            <Announcements onViewAll={() => navigate("/announcements")} />
          </div>
        </div>
      </div>

      {/* Upload Material Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upload Material</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Title *</label>
                  <input
                    type="text"
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    placeholder="e.g., Week 1 Lecture Notes"
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Description</label>
                  <textarea
                    value={materialDesc}
                    onChange={(e) => setMaterialDesc(e.target.value)}
                    placeholder="Brief description..."
                    rows={3}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-2">Type *</label>
                    <select
                      value={materialType}
                      onChange={(e) => setMaterialType(e.target.value as MaterialType)}
                      className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm"
                    >
                      <option value="lecture">Lecture Notes</option>
                      <option value="reading">Reading</option>
                      <option value="reference">Reference</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Week</label>
                    <input
                      type="text"
                      value={materialWeek}
                      onChange={(e) => setMaterialWeek(e.target.value)}
                      placeholder="e.g., Week 1"
                      className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">File *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 bg-secondary/50 border-2 border-dashed border-border rounded-lg text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadFile ? uploadFile.name : "Choose file"}
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Assignment Modal */}
      <AnimatePresence>
        {showSubmitModal && selectedAssignment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Submit Assignment</h3>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">{selectedAssignment.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Due: {formatDate(selectedAssignment.dueDate)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Upload File *</label>
                  <input
                    ref={submissionInputRef}
                    type="file"
                    onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    onClick={() => submissionInputRef.current?.click()}
                    className="w-full px-4 py-3 bg-secondary/50 border-2 border-dashed border-border rounded-lg text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <File className="w-4 h-4" />
                    {submissionFile ? submissionFile.name : "Choose file to submit"}
                  </button>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Comments (optional)</label>
                  <textarea
                    value={submissionComments}
                    onChange={(e) => setSubmissionComments(e.target.value)}
                    placeholder="Any comments for your instructor..."
                    rows={3}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowSubmitModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}