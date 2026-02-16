import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Upload,
  Loader2,
  X,
  Users,
  ChevronDown,
  BarChart3,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "dummy");

// ==============================
// Types
// ==============================

interface Submission {
  name: string;
  text: string;
  file?: File;
}

interface PairResult {
  studentA: string;
  studentB: string;
  similarity: number;
  matchedPhrases: string[];
}

interface AnalysisResult {
  overallStatus: "original" | "suspicious" | "plagiarized";
  pairs: PairResult[];
  aiAnalysis: string;
}

// ==============================
// Helpers
// ==============================

async function getEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent({
    content: { role: "user", parts: [{ text }] },
  });
  return result.embedding.values;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 30);
}

async function extractTextFromFile(file: File): Promise<string> {
  // For PDFs/images use Gemini multimodal
  if (file.type.includes("pdf") || file.type.includes("image")) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const CHUNK_SIZE = 8192;
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent([
      { inlineData: { mimeType: file.type, data: base64 } },
      "Extract ALL text from this document. Return ONLY the raw text, preserving paragraphs.",
    ]);
    return result.response.text();
  }

  // For text files, read directly
  return file.text();
}

// ==============================
// Cross-check submissions
// ==============================

async function crossCheckSubmissions(
  submissions: Submission[],
  onProgress?: (msg: string) => void
): Promise<AnalysisResult> {
  const n = submissions.length;
  const pairs: PairResult[] = [];

  // Step 1: Generate embeddings for each submission in chunks (paragraphs)
  onProgress?.("Generating embeddings...");
  const paragraphEmbeddings: { name: string; paragraphs: string[]; embeddings: number[][] }[] = [];

  for (const sub of submissions) {
    const paragraphs = splitIntoParagraphs(sub.text);
    const truncatedParagraphs = paragraphs.slice(0, 20); // Max 20 paragraphs per submission
    const embeddings: number[][] = [];

    for (const para of truncatedParagraphs) {
      try {
        const emb = await getEmbedding(para.slice(0, 2000)); // Limit per chunk
        embeddings.push(emb);
        await new Promise((r) => setTimeout(r, 150)); // Rate limit
      } catch {
        continue;
      }
    }

    paragraphEmbeddings.push({ name: sub.name, paragraphs: truncatedParagraphs, embeddings });
  }

  // Step 2: Compare every pair of submissions
  onProgress?.("Comparing submissions...");
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = paragraphEmbeddings[i];
      const b = paragraphEmbeddings[j];

      let totalSim = 0;
      let comparisons = 0;
      const matchedPhrases: string[] = [];

      for (let ai = 0; ai < a.embeddings.length; ai++) {
        for (let bi = 0; bi < b.embeddings.length; bi++) {
          const sim = cosineSimilarity(a.embeddings[ai], b.embeddings[bi]);
          totalSim += sim;
          comparisons++;

          if (sim > 0.92) {
            matchedPhrases.push(
              `"${a.paragraphs[ai].slice(0, 80)}..." ↔ "${b.paragraphs[bi].slice(0, 80)}..."`
            );
          }
        }
      }

      const avgSim = comparisons > 0 ? totalSim / comparisons : 0;
      // Scale to percentage (cosine sim for different docs is typically 0.5–1.0)
      const percentSim = Math.min(100, Math.max(0, Math.round((avgSim - 0.5) * 200)));

      pairs.push({
        studentA: a.name,
        studentB: b.name,
        similarity: percentSim,
        matchedPhrases: matchedPhrases.slice(0, 5),
      });
    }
  }

  // Sort by highest similarity
  pairs.sort((a, b) => b.similarity - a.similarity);

  // Step 3: AI analysis summary
  onProgress?.("Generating analysis report...");
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const pairsSummary = pairs
    .slice(0, 10)
    .map((p) => `${p.studentA} vs ${p.studentB}: ${p.similarity}% similarity`)
    .join("\n");

  const aiResult = await model.generateContent(
    `You are an academic integrity analyst. Given these cross-submission similarity scores, write a brief analysis (3-5 sentences). Focus on which pairs are suspicious (>40%) and which are fine (<30%). Be direct and professional.

Similarity Scores:
${pairsSummary}

Total submissions: ${n}
Highest similarity: ${pairs[0]?.similarity ?? 0}%`
  );

  const maxSim = pairs.length > 0 ? pairs[0].similarity : 0;
  const overallStatus: AnalysisResult["overallStatus"] =
    maxSim >= 60 ? "plagiarized" : maxSim >= 35 ? "suspicious" : "original";

  return {
    overallStatus,
    pairs,
    aiAnalysis: aiResult.response.text(),
  };
}

// ==============================
// Single text AI plagiarism analysis
// ==============================

async function analyzeForPlagiarism(text: string): Promise<{
  score: number;
  assessment: string;
  flags: string[];
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(
    `You are an expert academic integrity reviewer. Analyze the following text for signs of plagiarism or AI-generated content.

Look for:
1. Inconsistent writing style within the text
2. Unusually sophisticated vocabulary mixed with simple passages
3. Lack of personal voice or original thought
4. Generic or overly polished phrasing
5. Factual claims without citations
6. Abrupt topic transitions

TEXT TO ANALYZE:
---
${text.slice(0, 8000)}
---

Respond with ONLY valid JSON (no markdown fences):
{
  "score": <0-100 originality score, 100 means fully original>,
  "assessment": "<2-3 sentence assessment>",
  "flags": ["<specific concern 1>", "<specific concern 2>"]
}`
  );

  const responseText = result.response.text().trim();
  let jsonStr = responseText;
  const match = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) jsonStr = match[1].trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    return { score: 50, assessment: "Analysis could not be completed.", flags: [] };
  }
}

// ==============================
// Component
// ==============================

export function CopyChecker() {
  const [mode, setMode] = useState<"single" | "multi">("multi");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single mode
  const [singleText, setSingleText] = useState("");
  const [singleResult, setSingleResult] = useState<{
    score: number;
    assessment: string;
    flags: string[];
  } | null>(null);

  // Multi mode
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [multiResult, setMultiResult] = useState<AnalysisResult | null>(null);
  const [expandedPair, setExpandedPair] = useState<number | null>(null);

  // Shared
  const [checking, setChecking] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");

  // Handle file uploads for multi mode
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newSubs: Submission[] = [];
    for (const file of Array.from(files)) {
      try {
        const text = await extractTextFromFile(file);
        newSubs.push({
          name: file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
          text,
          file,
        });
      } catch (err) {
        console.error(`Failed to extract text from ${file.name}:`, err);
      }
    }
    setSubmissions((prev) => [...prev, ...newSubs]);
    e.target.value = "";
  };

  // Add text submission manually
  const addTextSubmission = () => {
    setSubmissions((prev) => [...prev, { name: `Student ${prev.length + 1}`, text: "" }]);
  };

  const removeSubmission = (index: number) => {
    setSubmissions((prev) => prev.filter((_, i) => i !== index));
  };

  // Run single check
  const handleSingleCheck = async () => {
    setChecking(true);
    setSingleResult(null);
    try {
      const result = await analyzeForPlagiarism(singleText);
      setSingleResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  // Run multi check
  const handleMultiCheck = async () => {
    if (submissions.length < 2) return;
    setChecking(true);
    setMultiResult(null);
    try {
      const result = await crossCheckSubmissions(submissions, setProgressMsg);
      setMultiResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
      setProgressMsg("");
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <FileText className="w-7 h-7 text-purple-500" />
          <h1 className="text-2xl font-display font-semibold text-foreground">
            AI Copy Checker
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Detect plagiarism across student submissions or analyze a single text
        </p>
      </motion.div>

      {/* Mode Toggle */}
      <div className="flex bg-secondary rounded-lg overflow-hidden w-fit">
        <button
          onClick={() => setMode("multi")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
            mode === "multi" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
        >
          <Users className="w-4 h-4" /> Cross-Check Submissions
        </button>
        <button
          onClick={() => setMode("single")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
            mode === "single" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
        >
          <Eye className="w-4 h-4" /> Single Text Analysis
        </button>
      </div>

      {/* SINGLE MODE */}
      {mode === "single" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <textarea
                value={singleText}
                onChange={(e) => setSingleText(e.target.value)}
                placeholder="Paste student submission text here..."
                rows={10}
                className="w-full px-4 py-3 bg-secondary/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
              <Button
                onClick={handleSingleCheck}
                disabled={singleText.length < 50 || checking}
                className="w-full"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...
                  </>
                ) : (
                  "Check for Plagiarism / AI Content"
                )}
              </Button>
            </CardContent>
          </Card>

          {singleResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Analysis Result</h3>
                    <Badge
                      variant="secondary"
                      className={cn(
                        singleResult.score >= 70
                          ? "text-green-500 bg-green-500/10"
                          : singleResult.score >= 40
                            ? "text-yellow-500 bg-yellow-500/10"
                            : "text-red-500 bg-red-500/10"
                      )}
                    >
                      {singleResult.score >= 70 ? "Likely Original" : singleResult.score >= 40 ? "Needs Review" : "Suspicious"}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Originality Score</span>
                      <span className="text-2xl font-bold">{singleResult.score}%</span>
                    </div>
                    <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          singleResult.score >= 70 ? "bg-green-500" : singleResult.score >= 40 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${singleResult.score}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">Assessment</h4>
                    <p className="text-sm text-muted-foreground">{singleResult.assessment}</p>
                  </div>

                  {singleResult.flags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">⚠️ Flags</h4>
                      <ul className="space-y-1">
                        {singleResult.flags.map((f, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* MULTI MODE */}
      {mode === "multi" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Upload student submissions</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, TXT, DOCX, or images — one file per student</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button variant="outline" size="sm" onClick={addTextSubmission} className="w-full">
                + Add Text Submission Manually
              </Button>

              {/* Submissions list */}
              {submissions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">{submissions.length} submissions</h4>
                  {submissions.map((sub, i) => (
                    <div key={i} className="p-3 bg-secondary/50 rounded-lg space-y-2">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => {
                            setSubmissions((prev) => {
                              const copy = [...prev];
                              copy[i] = { ...copy[i], name: e.target.value };
                              return copy;
                            });
                          }}
                          className="flex-1 bg-transparent text-sm font-medium focus:outline-none rounded px-1"
                          placeholder="Student name"
                        />
                        <span className="text-xs text-muted-foreground">
                          {sub.text.length} chars
                        </span>
                        <button onClick={() => removeSubmission(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {!sub.file && (
                        <textarea
                          value={sub.text}
                          onChange={(e) => {
                            setSubmissions((prev) => {
                              const copy = [...prev];
                              copy[i] = { ...copy[i], text: e.target.value };
                              return copy;
                            });
                          }}
                          placeholder="Paste student's text here..."
                          rows={3}
                          className="w-full px-3 py-2 bg-background border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 resize-y"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleMultiCheck}
                disabled={submissions.filter((s) => s.text.length > 30).length < 2 || checking}
                className="w-full"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> {progressMsg || "Analyzing..."}
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" /> Cross-Check {submissions.length} Submissions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Multi results */}
          {multiResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Overall status */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Cross-Check Results</h3>
                    <Badge
                      variant="secondary"
                      className={cn(
                        multiResult.overallStatus === "original"
                          ? "text-green-500 bg-green-500/10"
                          : multiResult.overallStatus === "suspicious"
                            ? "text-yellow-500 bg-yellow-500/10"
                            : "text-red-500 bg-red-500/10"
                      )}
                    >
                      {multiResult.overallStatus === "original" && <><CheckCircle className="w-3 h-3 mr-1" /> All Clear</>}
                      {multiResult.overallStatus === "suspicious" && <><AlertTriangle className="w-3 h-3 mr-1" /> Suspicious Matches</>}
                      {multiResult.overallStatus === "plagiarized" && <><AlertTriangle className="w-3 h-3 mr-1" /> High Similarity Detected</>}
                    </Badge>
                  </div>

                  <div className="p-3 bg-secondary/30 rounded-lg mb-4">
                    <p className="text-sm text-muted-foreground">{multiResult.aiAnalysis}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Pair results */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Pairwise Similarity ({multiResult.pairs.length} comparisons)
                </h4>
                {multiResult.pairs.map((pair, i) => (
                  <Card
                    key={i}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      pair.similarity >= 60 && "border-red-500/30",
                      pair.similarity >= 35 && pair.similarity < 60 && "border-yellow-500/30"
                    )}
                    onClick={() => setExpandedPair(expandedPair === i ? null : i)}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                            pair.similarity >= 60
                              ? "bg-red-500/10 text-red-500"
                              : pair.similarity >= 35
                                ? "bg-yellow-500/10 text-yellow-500"
                                : "bg-green-500/10 text-green-500"
                          )}
                        >
                          {pair.similarity}%
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {pair.studentA} <span className="text-muted-foreground mx-1">↔</span> {pair.studentB}
                          </p>
                          <div className="w-full h-1.5 bg-secondary rounded-full mt-1">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                pair.similarity >= 60 ? "bg-red-500" : pair.similarity >= 35 ? "bg-yellow-500" : "bg-green-500"
                              )}
                              style={{ width: `${pair.similarity}%` }}
                            />
                          </div>
                        </div>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform",
                            expandedPair === i && "rotate-180"
                          )}
                        />
                      </div>

                      <AnimatePresence>
                        {expandedPair === i && pair.matchedPhrases.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t space-y-2">
                              <h5 className="text-xs font-medium text-muted-foreground">Similar Passages</h5>
                              {pair.matchedPhrases.map((phrase, pi) => (
                                <div key={pi} className="p-2 bg-secondary/50 rounded text-xs text-muted-foreground font-mono">
                                  {phrase}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
