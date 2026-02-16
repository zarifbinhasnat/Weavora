import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "./firebase";
import {
    addDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    doc,
    updateDoc,
    Timestamp,
} from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const storage = getStorage();
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "dummy");

// ============================================
// Types
// ============================================

export interface GradingBreakdown {
    criteria: string;
    marks: number;
    maxMarks: number;
    comment: string;
}

export interface StudentResult {
    studentName: string;
    scriptFileUrl: string;
    extractedText: string;
    score: number;
    maxScore: number;
    percentage: number;
    breakdown: GradingBreakdown[];
    overallFeedback: string;
    strengths: string[];
    improvements: string[];
    status: "pending" | "grading" | "completed" | "failed";
    error?: string;
}

export interface GradingSession {
    id?: string;
    teacherId: string;
    courseId: string;
    title: string;
    rubricText: string;
    maxMarks: number;
    createdAt?: any;
    status: "processing" | "completed" | "failed";
    results: StudentResult[];
}

// ============================================
// Helpers
// ============================================

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsArrayBuffer(file);
    });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const CHUNK_SIZE = 8192;
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
        ),
    ]);
}

// ============================================
// OCR: Extract text from student script
// ============================================

export async function extractTextFromScript(file: File): Promise<string> {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const base64 = arrayBufferToBase64(arrayBuffer);

    const mimeType = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg");

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await withTimeout(
        model.generateContent([
            {
                inlineData: { mimeType, data: base64 },
            },
            `You are an expert OCR system. Extract ALL handwritten and printed text from this document/image.
Rules:
- Return ONLY the raw extracted text, preserving the original structure
- Include all text: headings, answers, labels, question numbers, margin notes
- If text is unclear, make your best attempt and mark uncertain parts with [unclear]
- If a section is completely illegible, write [illegible]
- Preserve paragraph breaks and numbering
- Do NOT add any commentary, just the extracted text`,
        ]),
        90000,
        "Script OCR extraction"
    );

    return result.response.text();
}

// ============================================
// Grade a single student script against rubric
// ============================================

export async function gradeScript(
    studentText: string,
    rubricText: string,
    maxMarks: number
): Promise<{
    score: number;
    percentage: number;
    breakdown: GradingBreakdown[];
    overallFeedback: string;
    strengths: string[];
    improvements: string[];
}> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a fair, experienced academic grader. Grade the following student answer against the provided rubric.

MARKING RUBRIC / GUIDELINE:
---
${rubricText}
---

STUDENT'S ANSWER:
---
${studentText}
---

TOTAL MARKS AVAILABLE: ${maxMarks}

Instructions:
- Be fair and consistent
- Award partial marks where appropriate
- If student answer contains [unclear] or [illegible] marks, note this in feedback but grade what is readable
- Consider the depth, accuracy, and completeness of answers

You MUST respond with ONLY valid JSON (no markdown, no code fences):
{
  "score": <number out of ${maxMarks}>,
  "percentage": <number 0-100>,
  "breakdown": [
    { "criteria": "<rubric criterion>", "marks": <awarded>, "maxMarks": <available>, "comment": "<brief justification>" }
  ],
  "overallFeedback": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area 1>", "<area 2>"]
}`;

    const result = await withTimeout(
        model.generateContent(prompt),
        60000,
        "Script grading"
    );

    const responseText = result.response.text().trim();

    // Parse JSON — handle potential markdown code fences
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
    }

    try {
        const parsed = JSON.parse(jsonStr);
        return {
            score: parsed.score ?? 0,
            percentage: parsed.percentage ?? Math.round((parsed.score / maxMarks) * 100),
            breakdown: parsed.breakdown ?? [],
            overallFeedback: parsed.overallFeedback ?? "",
            strengths: parsed.strengths ?? [],
            improvements: parsed.improvements ?? [],
        };
    } catch (parseError) {
        console.error("Failed to parse grading response:", responseText);
        throw new Error("AI returned invalid grading format. Please try again.");
    }
}

// ============================================
// Extract rubric text from uploaded file
// ============================================

export async function extractRubricText(file: File): Promise<string> {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const base64 = arrayBufferToBase64(arrayBuffer);
    const mimeType = file.type || "application/pdf";

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await withTimeout(
        model.generateContent([
            { inlineData: { mimeType, data: base64 } },
            `Extract ALL text from this grading rubric/marking guideline document. 
Preserve the structure: criteria names, marks allocation, descriptions, and any grading scales.
Return ONLY the extracted text.`,
        ]),
        60000,
        "Rubric text extraction"
    );

    return result.response.text();
}

// ============================================
// Upload file to Firebase Storage
// ============================================

async function uploadFileToStorage(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}

// ============================================
// Save grading session to Firestore
// ============================================

export async function saveGradingSession(session: GradingSession): Promise<string> {
    const docRef = await addDoc(collection(db, "gradingSessions"), {
        teacherId: session.teacherId,
        courseId: session.courseId,
        title: session.title,
        rubricText: session.rubricText,
        maxMarks: session.maxMarks,
        status: session.status,
        results: session.results,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateGradingSession(
    sessionId: string,
    updates: Partial<GradingSession>
) {
    await updateDoc(doc(db, "gradingSessions", sessionId), updates as any);
}

// ============================================
// Get past grading sessions
// ============================================

export async function getGradingSessions(teacherId: string): Promise<GradingSession[]> {
    const q = query(
        collection(db, "gradingSessions"),
        where("teacherId", "==", teacherId),
        orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    })) as GradingSession[];
}

// ============================================
// Full grading pipeline: process all scripts
// ============================================

export async function runGradingPipeline(params: {
    teacherId: string;
    courseId: string;
    title: string;
    rubricText: string;
    maxMarks: number;
    scripts: { file: File; studentName: string }[];
    onProgress?: (index: number, total: number, studentName: string, stage: string) => void;
}): Promise<{ sessionId: string; results: StudentResult[] }> {
    const { teacherId, courseId, title, rubricText, maxMarks, scripts, onProgress } = params;

    // Initialize results
    const results: StudentResult[] = scripts.map((s) => ({
        studentName: s.studentName,
        scriptFileUrl: "",
        extractedText: "",
        score: 0,
        maxScore: maxMarks,
        percentage: 0,
        breakdown: [],
        overallFeedback: "",
        strengths: [],
        improvements: [],
        status: "pending" as const,
    }));

    // Save initial session
    const sessionId = await saveGradingSession({
        teacherId,
        courseId,
        title,
        rubricText,
        maxMarks,
        status: "processing",
        results,
    });

    // Process each script
    for (let i = 0; i < scripts.length; i++) {
        const { file, studentName } = scripts[i];

        try {
            // Step 1: Upload script
            onProgress?.(i, scripts.length, studentName, "Uploading...");
            const fileUrl = await uploadFileToStorage(
                file,
                `grading/${sessionId}/${studentName}_${file.name}`
            );
            results[i].scriptFileUrl = fileUrl;

            // Step 2: OCR
            onProgress?.(i, scripts.length, studentName, "Extracting text (OCR)...");
            results[i].status = "grading";
            const extractedText = await extractTextFromScript(file);
            results[i].extractedText = extractedText;

            if (!extractedText || extractedText.trim().length < 10) {
                results[i].status = "failed";
                results[i].error = "Could not extract sufficient text from script";
                results[i].overallFeedback = "The submitted script appears to be blank or illegible.";
                continue;
            }

            // Step 3: Grade
            onProgress?.(i, scripts.length, studentName, "Grading...");
            const grade = await gradeScript(extractedText, rubricText, maxMarks);

            results[i].score = grade.score;
            results[i].percentage = grade.percentage;
            results[i].breakdown = grade.breakdown;
            results[i].overallFeedback = grade.overallFeedback;
            results[i].strengths = grade.strengths;
            results[i].improvements = grade.improvements;
            results[i].status = "completed";

        } catch (err: any) {
            console.error(`Grading failed for ${studentName}:`, err);
            results[i].status = "failed";
            results[i].error = err.message || "Unknown error";
            results[i].overallFeedback = `Grading failed: ${err.message}`;
        }

        // Update Firestore progressively
        await updateGradingSession(sessionId, { results });

        // Rate limit: 1s between scripts
        if (i < scripts.length - 1) {
            await new Promise((r) => setTimeout(r, 1000));
        }
    }

    // Mark session as completed
    const allDone = results.every((r) => r.status === "completed" || r.status === "failed");
    await updateGradingSession(sessionId, {
        status: allDone ? "completed" : "failed",
        results,
    });

    return { sessionId, results };
}
