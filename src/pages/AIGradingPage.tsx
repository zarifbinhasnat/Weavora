import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    GraduationCap,
    Upload,
    FileText,
    X,
    Loader2,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    ArrowLeft,
    ArrowRight,
    Download,
    BarChart3,
    AlertCircle,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, db } from "@/components/backend/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
    runGradingPipeline,
    extractRubricText,
    StudentResult,
} from "@/components/backend/grading";

type Step = 1 | 2 | 3;

interface ScriptFile {
    file: File;
    studentName: string;
    preview?: string;
}

export function AIGradingPage() {
    const [step, setStep] = useState<Step>(1);
    const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const rubricInputRef = useRef<HTMLInputElement>(null);

    // Step 1 — Setup
    const [selectedCourse, setSelectedCourse] = useState("");
    const [sessionTitle, setSessionTitle] = useState("");
    const [maxMarks, setMaxMarks] = useState(100);
    const [rubricMode, setRubricMode] = useState<"file" | "text">("text");
    const [rubricText, setRubricText] = useState("");
    const [rubricFile, setRubricFile] = useState<File | null>(null);
    const [extractingRubric, setExtractingRubric] = useState(false);

    // Step 2 — Scripts
    const [scripts, setScripts] = useState<ScriptFile[]>([]);

    // Step 3 — Results
    const [grading, setGrading] = useState(false);
    const [progress, setProgress] = useState({ index: 0, total: 0, name: "", stage: "" });
    const [results, setResults] = useState<StudentResult[]>([]);
    const [expandedResult, setExpandedResult] = useState<number | null>(null);

    // Fetch teacher's courses (courses they created)
    useEffect(() => {
        async function load() {
            const user = auth.currentUser;
            if (!user) return;
            try {
                const q = query(collection(db, "courses"), where("teacherId", "==", user.uid));
                const snap = await getDocs(q);
                const list = snap.docs.map((d) => ({
                    id: d.id,
                    name: (d.data().name || d.data().courseCode || d.id) as string,
                }));
                setCourses(list);
                if (list.length > 0) setSelectedCourse(list[0].id);
            } catch (err) {
                console.error("Error fetching teacher courses:", err);
            }
        }
        load();
    }, []);

    // Handle rubric file upload
    const handleRubricUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setRubricFile(file);
        setExtractingRubric(true);
        try {
            const text = await extractRubricText(file);
            setRubricText(text);
        } catch (err: any) {
            console.error("Rubric extraction failed:", err);
            alert("Failed to extract rubric text. Please paste it manually.");
        } finally {
            setExtractingRubric(false);
        }
    };

    // Handle script files upload
    const handleScriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newScripts: ScriptFile[] = Array.from(files).map((f) => ({
            file: f,
            studentName: f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
        }));
        setScripts((prev) => [...prev, ...newScripts]);
    };

    const removeScript = (index: number) => {
        setScripts((prev) => prev.filter((_, i) => i !== index));
    };

    // Start grading
    const handleStartGrading = async () => {
        const user = auth.currentUser;
        if (!user) return;

        setGrading(true);
        setStep(3);

        try {
            const { results: gradedResults } = await runGradingPipeline({
                teacherId: user.uid,
                courseId: selectedCourse,
                title: sessionTitle || "Untitled Grading Session",
                rubricText,
                maxMarks,
                scripts: scripts.map((s) => ({ file: s.file, studentName: s.studentName })),
                onProgress: (index, total, name, stage) => {
                    setProgress({ index, total, name, stage });
                    // Update results in real-time
                    setResults((prev) => {
                        const copy = [...prev];
                        if (!copy[index]) {
                            copy[index] = {
                                studentName: name,
                                scriptFileUrl: "",
                                extractedText: "",
                                score: 0,
                                maxScore: maxMarks,
                                percentage: 0,
                                breakdown: [],
                                overallFeedback: "",
                                strengths: [],
                                improvements: [],
                                status: "grading",
                            };
                        }
                        return copy;
                    });
                },
            });

            setResults(gradedResults);
        } catch (err: any) {
            console.error("Grading pipeline error:", err);
        } finally {
            setGrading(false);
        }
    };

    // Export as CSV
    const exportCSV = () => {
        const headers = ["Student Name", "Score", "Max Score", "Percentage", "Feedback"];
        const rows = results.map((r) => [
            r.studentName,
            r.score,
            r.maxScore,
            r.percentage,
            `"${r.overallFeedback.replace(/"/g, '""')}"`,
        ]);
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${sessionTitle || "grading"}_results.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Stats
    const completedResults = results.filter((r) => r.status === "completed");
    const avgScore = completedResults.length
        ? Math.round(completedResults.reduce((s, r) => s + r.percentage, 0) / completedResults.length)
        : 0;
    const highest = completedResults.length ? Math.max(...completedResults.map((r) => r.score)) : 0;
    const lowest = completedResults.length ? Math.min(...completedResults.map((r) => r.score)) : 0;

    const canProceedStep1 = rubricText.trim().length > 10 && maxMarks > 0;
    const canProceedStep2 = scripts.length > 0;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-1">
                    <GraduationCap className="w-7 h-7 text-primary" />
                    <h1 className="text-2xl font-display font-semibold text-foreground">
                        AI Grading Assistant
                    </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                    Upload student scripts and a grading rubric — AI will OCR and grade each script
                </p>
            </motion.div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2">
                {[
                    { num: 1, label: "Setup Rubric" },
                    { num: 2, label: "Upload Scripts" },
                    { num: 3, label: "Results" },
                ].map((s, i) => (
                    <div key={s.num} className="flex items-center gap-2 flex-1">
                        <div
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                                step >= s.num
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-muted-foreground"
                            )}
                        >
                            {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                        </div>
                        <span
                            className={cn(
                                "text-sm font-medium hidden sm:inline",
                                step >= s.num ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {s.label}
                        </span>
                        {i < 2 && <div className={cn("flex-1 h-0.5", step > s.num ? "bg-primary" : "bg-secondary")} />}
                    </div>
                ))}
            </div>

            {/* Step 1: Setup */}
            {step === 1 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Grading Setup</CardTitle>
                            <CardDescription>Configure the grading session and upload your rubric</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                        Session Title
                                    </label>
                                    <input
                                        type="text"
                                        value={sessionTitle}
                                        onChange={(e) => setSessionTitle(e.target.value)}
                                        placeholder="e.g., Midterm Exam Grading"
                                        className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                        Total Marks
                                    </label>
                                    <input
                                        type="number"
                                        value={maxMarks}
                                        onChange={(e) => setMaxMarks(Number(e.target.value))}
                                        min={1}
                                        className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                        Course
                                    </label>
                                    <select
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        {courses.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Rubric */}
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <label className="text-sm font-medium text-foreground">Grading Rubric / Guideline *</label>
                                    <div className="flex bg-secondary rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => setRubricMode("text")}
                                            className={cn(
                                                "px-3 py-1 text-xs font-medium transition-colors",
                                                rubricMode === "text" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                            )}
                                        >
                                            Paste Text
                                        </button>
                                        <button
                                            onClick={() => setRubricMode("file")}
                                            className={cn(
                                                "px-3 py-1 text-xs font-medium transition-colors",
                                                rubricMode === "file" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                            )}
                                        >
                                            Upload File
                                        </button>
                                    </div>
                                </div>

                                {rubricMode === "text" ? (
                                    <textarea
                                        value={rubricText}
                                        onChange={(e) => setRubricText(e.target.value)}
                                        placeholder="Paste your marking rubric here...&#10;&#10;Example:&#10;Question 1 (10 marks): Explain the concept of...&#10;- Full marks for clear definition (4)&#10;- At least 2 examples (3)&#10;- Correct diagram (3)"
                                        rows={8}
                                        className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y font-mono"
                                    />
                                ) : (
                                    <div>
                                        <input
                                            ref={rubricInputRef}
                                            type="file"
                                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                            onChange={handleRubricUpload}
                                            className="hidden"
                                        />
                                        <div
                                            onClick={() => rubricInputRef.current?.click()}
                                            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                        >
                                            {extractingRubric ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                    <p className="text-sm text-muted-foreground">Extracting rubric text...</p>
                                                </div>
                                            ) : rubricFile ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                                    <p className="text-sm font-medium">{rubricFile.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {rubricText.length} characters extracted
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                                    <p className="text-sm font-medium">Upload rubric/guideline</p>
                                                    <p className="text-xs text-muted-foreground">PDF, DOC, or image</p>
                                                </div>
                                            )}
                                        </div>
                                        {rubricText && (
                                            <div className="mt-3">
                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                    Extracted text (editable):
                                                </label>
                                                <textarea
                                                    value={rubricText}
                                                    onChange={(e) => setRubricText(e.target.value)}
                                                    rows={5}
                                                    className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                                    Next: Upload Scripts <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Step 2: Upload Scripts */}
            {step === 2 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Student Scripts</CardTitle>
                            <CardDescription>
                                Upload answer sheets as images or PDFs. Student names are auto-detected from filenames.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.webp"
                                multiple
                                onChange={handleScriptUpload}
                                className="hidden"
                            />

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
                            >
                                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-sm font-medium">Drop student scripts here or click to browse</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Supports PDF, JPG, PNG, WEBP — one file per student
                                </p>
                            </div>

                            {/* Scripts List */}
                            {scripts.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium">{scripts.length} script(s) uploaded</h4>
                                        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                                            <Upload className="w-3 h-3 mr-1" /> Add More
                                        </Button>
                                    </div>
                                    {scripts.map((s, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                                            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                                            <input
                                                type="text"
                                                value={s.studentName}
                                                onChange={(e) => {
                                                    setScripts((prev) => {
                                                        const copy = [...prev];
                                                        copy[i] = { ...copy[i], studentName: e.target.value };
                                                        return copy;
                                                    });
                                                }}
                                                className="flex-1 bg-transparent text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-2 py-1"
                                                placeholder="Student name"
                                            />
                                            <span className="text-xs text-muted-foreground flex-shrink-0">
                                                {(s.file.size / 1024).toFixed(0)} KB
                                            </span>
                                            <button onClick={() => removeScript(i)} className="text-muted-foreground hover:text-destructive">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(1)}>
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                </Button>
                                <Button onClick={handleStartGrading} disabled={!canProceedStep2}>
                                    <Sparkles className="w-4 h-4 mr-2" /> Start Grading ({scripts.length} scripts)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Step 3: Results */}
            {step === 3 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    {/* Progress */}
                    {grading && (
                        <Card className="border-primary/30">
                            <CardContent className="py-6">
                                <div className="flex items-center gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            Grading {progress.name} ({progress.index + 1}/{progress.total})
                                        </p>
                                        <p className="text-xs text-muted-foreground">{progress.stage}</p>
                                        <div className="mt-2 w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all"
                                                style={{ width: `${((progress.index + 1) / Math.max(progress.total, 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stats summary */}
                    {completedResults.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: "Average", value: `${avgScore}%`, icon: BarChart3 },
                                { label: "Highest", value: `${highest}/${maxMarks}`, icon: ChevronUp },
                                { label: "Lowest", value: `${lowest}/${maxMarks}`, icon: ChevronDown },
                                { label: "Graded", value: `${completedResults.length}/${results.length}`, icon: CheckCircle },
                            ].map((stat) => (
                                <Card key={stat.label} className="p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <stat.icon className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                                    </div>
                                    <p className="text-xl font-bold">{stat.value}</p>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Export */}
                    {completedResults.length > 0 && !grading && (
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={exportCSV}>
                                <Download className="w-4 h-4 mr-2" /> Export CSV
                            </Button>
                        </div>
                    )}

                    {/* Results list */}
                    <div className="space-y-3">
                        {results.map((r, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card
                                    className={cn(
                                        "cursor-pointer transition-all hover:shadow-md",
                                        r.status === "failed" && "border-destructive/30"
                                    )}
                                    onClick={() => setExpandedResult(expandedResult === i ? null : i)}
                                >
                                    <CardContent className="py-4">
                                        {/* Summary row */}
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                                    r.status === "completed"
                                                        ? r.percentage >= 70
                                                            ? "bg-green-500/10 text-green-500"
                                                            : r.percentage >= 50
                                                                ? "bg-yellow-500/10 text-yellow-500"
                                                                : "bg-red-500/10 text-red-500"
                                                        : r.status === "grading"
                                                            ? "bg-primary/10 text-primary"
                                                            : r.status === "failed"
                                                                ? "bg-destructive/10 text-destructive"
                                                                : "bg-secondary text-muted-foreground"
                                                )}
                                            >
                                                {r.status === "completed" ? (
                                                    <CheckCircle className="w-5 h-5" />
                                                ) : r.status === "grading" ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : r.status === "failed" ? (
                                                    <XCircle className="w-5 h-5" />
                                                ) : (
                                                    <FileText className="w-5 h-5" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{r.studentName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {r.status === "completed"
                                                        ? r.overallFeedback.slice(0, 80) + "..."
                                                        : r.status === "grading"
                                                            ? "Grading in progress..."
                                                            : r.status === "failed"
                                                                ? r.error || "Failed"
                                                                : "Pending"}
                                                </p>
                                            </div>

                                            {r.status === "completed" && (
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-lg font-bold">
                                                        {r.score}/{r.maxScore}
                                                    </p>
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            "text-xs",
                                                            r.percentage >= 70
                                                                ? "text-green-500 bg-green-500/10"
                                                                : r.percentage >= 50
                                                                    ? "text-yellow-500 bg-yellow-500/10"
                                                                    : "text-red-500 bg-red-500/10"
                                                        )}
                                                    >
                                                        {r.percentage}%
                                                    </Badge>
                                                </div>
                                            )}

                                            <ChevronDown
                                                className={cn(
                                                    "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0",
                                                    expandedResult === i && "rotate-180"
                                                )}
                                            />
                                        </div>

                                        {/* Expanded details */}
                                        <AnimatePresence>
                                            {expandedResult === i && r.status === "completed" && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-4 pt-4 border-t space-y-4">
                                                        {/* Breakdown */}
                                                        {r.breakdown.length > 0 && (
                                                            <div>
                                                                <h4 className="text-sm font-semibold mb-2">Marks Breakdown</h4>
                                                                <div className="space-y-2">
                                                                    {r.breakdown.map((b, bi) => (
                                                                        <div key={bi} className="flex items-start gap-3 p-2 bg-secondary/30 rounded-lg">
                                                                            <div className="text-right flex-shrink-0 w-16">
                                                                                <span className="text-sm font-bold">
                                                                                    {b.marks}/{b.maxMarks}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-medium">{b.criteria}</p>
                                                                                <p className="text-xs text-muted-foreground">{b.comment}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Feedback */}
                                                        <div>
                                                            <h4 className="text-sm font-semibold mb-1">Overall Feedback</h4>
                                                            <p className="text-sm text-muted-foreground">{r.overallFeedback}</p>
                                                        </div>

                                                        {/* Strengths & Improvements */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {r.strengths.length > 0 && (
                                                                <div>
                                                                    <h4 className="text-sm font-semibold text-green-500 mb-1">✅ Strengths</h4>
                                                                    <ul className="text-xs text-muted-foreground space-y-1">
                                                                        {r.strengths.map((s, si) => (
                                                                            <li key={si}>• {s}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {r.improvements.length > 0 && (
                                                                <div>
                                                                    <h4 className="text-sm font-semibold text-yellow-500 mb-1">💡 Areas to Improve</h4>
                                                                    <ul className="text-xs text-muted-foreground space-y-1">
                                                                        {r.improvements.map((im, ii) => (
                                                                            <li key={ii}>• {im}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Back button */}
                    {!grading && (
                        <div className="flex justify-start">
                            <Button variant="outline" onClick={() => { setStep(1); setResults([]); }}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> New Grading Session
                            </Button>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
