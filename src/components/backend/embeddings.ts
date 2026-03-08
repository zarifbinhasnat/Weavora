import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "./firebase.js";
import { addDoc, collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const storage = getStorage();
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
console.log("Gemini API Key Check:", apiKey ? `Present (ends with ...${apiKey.slice(-4)})` : "Missing");
const genAI = new GoogleGenerativeAI(apiKey || "dummy");

export type EmbeddingChunk = {
  text: string;
  embedding: number[];
  chunkIndex: number;
};

export type EmbeddingMetadata = {
  id: string;
  documentId: string;
  storageUrl: string;
  chunkCount: number;
  status: "processing" | "completed" | "failed";
  createdAt: any;
  error?: string;
};

// ============================================
// Safe base64 encoding (handles large files without stack overflow)
// ============================================
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

// ============================================
// Read File as ArrayBuffer (no CORS needed)
// ============================================
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

// ============================================
// Timeout wrapper
// ============================================
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

// ============================================
// Extract text from PDF using Gemini (multimodal)
// ============================================
async function extractTextFromPDFBytes(arrayBuffer: ArrayBuffer): Promise<string> {
  console.log("🤖 Extracting text from PDF using Gemini...");
  const base64 = arrayBufferToBase64(arrayBuffer);

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await withTimeout(
    model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64,
        },
      },
      "Extract ALL the text content from this PDF document. Return ONLY the raw text, preserving paragraphs. Do not summarize, do not add commentary, do not skip any section. Include all headings, body text, bullet points, and any other textual content.",
    ]),
    60000,
    "PDF text extraction"
  );

  const text = result.response.text();
  console.log(`✅ Extracted ${text.length} characters from PDF via Gemini`);
  return text;
}

// ============================================
// Generate embeddings from uploaded file or URL
// ============================================
export async function generateEmbeddingsFromLink(
  courseId: string,
  documentId: string,
  pdfUrl: string,
  documentTitle: string,
  file?: File | null
): Promise<void> {
  try {
    console.log("🚀 Starting embedding generation for:", documentTitle);

    // 1. Get PDF bytes — prefer raw File (no CORS), fall back to fetch
    let arrayBuffer: ArrayBuffer;

    if (file) {
      console.log("📂 Reading PDF from uploaded File object (no CORS)");
      arrayBuffer = await readFileAsArrayBuffer(file);
    } else if (pdfUrl) {
      console.log("🌐 Fetching PDF from URL:", pdfUrl);
      const response = await withTimeout(
        fetch(pdfUrl),
        30000,
        "PDF download"
      );
      if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);
      arrayBuffer = await response.arrayBuffer();
    } else {
      throw new Error("No file or URL provided");
    }

    console.log(`📄 PDF size: ${(arrayBuffer.byteLength / 1024).toFixed(1)} KB`);

    // 2. Extract text using Gemini multimodal
    const fullText = await extractTextFromPDFBytes(arrayBuffer);

    if (!fullText || fullText.trim().length === 0) {
      throw new Error("No text extracted from PDF");
    }

    console.log(`📝 Extracted ${fullText.length} characters from PDF`);

    // 3. Split text into chunks (500 words per chunk)
    const chunks = splitIntoChunks(fullText, 500);
    console.log(`🔪 Split into ${chunks.length} chunks`);

    // 4. Generate embeddings for each chunk using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embeddingChunks: EmbeddingChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Generating embedding for chunk ${i + 1}/${chunks.length}`);

      try {
        const result = await withTimeout(
          model.embedContent({
            content: { role: "user", parts: [{ text: chunks[i] }] },
          }),
          15000,
          `Embedding chunk ${i + 1}`
        );

        embeddingChunks.push({
          text: chunks[i],
          embedding: result.embedding.values,
          chunkIndex: i,
        });
      } catch (embError: any) {
        console.warn(`⚠️ Embedding failed for chunk ${i + 1}:`, embError.message);
        continue;
      }

      // Rate limiting: wait 200ms between requests
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    if (embeddingChunks.length === 0) {
      throw new Error("All embedding chunks failed. Check API key permissions.");
    }

    console.log(`✅ Generated ${embeddingChunks.length}/${chunks.length} embeddings`);

    // 5. Store embeddings as JSON in Firebase Storage
    const embeddingsData = {
      documentId,
      documentTitle,
      courseId,
      chunks: embeddingChunks,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(embeddingsData)], {
      type: "application/json",
    });

    const storageRef = ref(
      storage,
      `embeddings/${courseId}/${documentId}.json`
    );
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);

    console.log("📦 Embeddings stored in Firebase Storage");

    // 6. Store metadata in Firestore
    await addDoc(collection(db, "embeddingMetadata"), {
      courseId,
      documentId,
      documentTitle,
      storageUrl: downloadUrl,
      chunkCount: embeddingChunks.length,
      status: "completed",
      createdAt: new Date(),
    });

    console.log("💾 Embedding metadata saved to Firestore");

    // 7. Update document to mark embeddings as generated
    const docRef = doc(db, "Documents", documentId);
    await updateDoc(docRef, {
      embeddingsGenerated: true,
      embeddingsGeneratedAt: new Date(),
    });

    console.log("✅ Embedding generation complete for:", documentTitle);

  } catch (error) {
    console.error("❌ Error generating embeddings:", error);

    // Store error in metadata
    try {
      await addDoc(collection(db, "embeddingMetadata"), {
        courseId,
        documentId,
        documentTitle,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        createdAt: new Date(),
      });
    } catch (metaError) {
      console.error("Failed to save error metadata:", metaError);
    }

    throw error;
  }
}

// Split text into chunks
function splitIntoChunks(text: string, wordsPerChunk: number): string[] {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const chunk = words.slice(i, i + wordsPerChunk).join(" ");
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

// Retrieve all embeddings (for "ALL" courses or specific one)
export async function getCourseEmbeddings(
  courseId: string
): Promise<EmbeddingChunk[]> {
  let q;

  if (courseId === "ALL") {
    q = query(
      collection(db, "embeddingMetadata"),
      where("status", "==", "completed")
    );
  } else {
    q = query(
      collection(db, "embeddingMetadata"),
      where("courseId", "==", courseId),
      where("status", "==", "completed")
    );
  }

  const metadataSnap = await getDocs(q);

  const allEmbeddings = await Promise.all(
    metadataSnap.docs.map(async (docSnap) => {
      const data = docSnap.data();
      try {
        const response = await fetch((data as any).storageUrl);
        const embeddingData = await response.json();
        return embeddingData.chunks as EmbeddingChunk[];
      } catch (error) {
        console.error("Error fetching embeddings from storage:", error);
        return [];
      }
    })
  );

  return allEmbeddings.flat();
}

// Cosine similarity calculation
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magA === 0 || magB === 0) return 0;

  return dotProduct / (magA * magB);
}

// Query RAG system
export async function queryRAG(
  courseId: string,
  userQuestion: string,
  topK = 5
): Promise<Array<{ text: string; score: number }>> {
  try {
    // 1. Generate embedding for user question
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent({
      content: { role: "user", parts: [{ text: userQuestion }] },
    });
    const questionEmbedding = result.embedding.values;

    // 2. Get all course embeddings
    const allChunks = await getCourseEmbeddings(courseId);

    if (allChunks.length === 0) {
      console.warn("No embeddings found for course:", courseId);
      return [];
    }

    // 3. Calculate similarity for each chunk
    const scored = allChunks.map((chunk) => ({
      text: chunk.text,
      score: cosineSimilarity(questionEmbedding, chunk.embedding),
    }));

    // 4. Sort by score and return top K
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  } catch (error) {
    console.error("Error querying RAG:", error);
    throw error;
  }
}

// Helper to try multiple models
async function generateWithFallback(prompt: string) {
  // Verified available models from ListModels API
  const models = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
  ];

  for (const modelName of models) {
    try {
      console.log(`Attempting to use model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.warn(`Model ${modelName} failed:`, error.message);

      // Check for specific 404 Model Not Found error
      if (error.message?.includes("404") && error.message?.includes("not found")) {
        console.warn(`Model ${modelName} not found/enabled for this API key.`);
      }

      // If it's the last model, return a user-friendly error instead of throwing
      if (modelName === models[models.length - 1]) {
        console.error("All AI models failed.");
        return "I am unable to access the AI models right now. Please check if the 'Generative Language API' is enabled in your Google Cloud Console for this API Key.";
      }
    }
  }
  return "AI service unavailable.";
}

// Answer question using RAG
export async function answerWithRAG(
  courseId: string,
  userQuestion: string
): Promise<string> {
  let context = "";

  try {
    // 1. Get relevant context from RAG
    const relevantChunks = await queryRAG(courseId, userQuestion, 5);
    context = relevantChunks.length > 0
      ? relevantChunks.map((chunk, i) => `[Context ${i + 1}]\n${chunk.text}`).join("\n\n")
      : "No specific course materials found for this query.";
  } catch (ragError: any) {
    console.warn("RAG retrieval failed, falling back to general knowledge:", ragError);
    if (ragError?.message?.includes("Failed to fetch") || ragError?.code === "failed-precondition") {
      console.error("RAG BLOCKED: Likely AdBlocker or Missing Index");
    }
    context = "Note: Course materials could not be accessed. Answer based on general knowledge.";
  }

  try {
    const prompt = `You are a helpful and intelligent AI learning assistant ${courseId === "ALL" ? "with access to all course materials" : "for a specific course"}. 
    
    Student Question: ${userQuestion}

    Here is the relevant context from the course materials (if any):
    ${context}

    Instructions:
    - If the context contains the answer, use it and cite it implicitly.
    - If the context matches the question partially, combine it with your general knowledge.
    - If the context is empty or irrelevant, ANSWER FROM YOUR GENERAL KNOWLEDGE as an expert tutor.
    - Do NOT say "I don't have information" or "I cannot access materials" unless it's a very specific obscure course administrative detail not in the context.
    - Be concise, friendly, and educational.`;

    return await generateWithFallback(prompt);
  } catch (error: any) {
    if (error.message?.includes("Failed to fetch")) {
      console.error("NETWORK BLOCKED: Please disable AdBlock/Privacy extensions for localhost.");
    }
    console.error("Error answering with RAG:", error);
    return "I'm having trouble connecting to the AI. Please disable any AdBlockers and check your internet.";
  }
}

// Planner AI
export async function askPlanner(
  userQuery: string,
  announcements: any[]
): Promise<string> {
  try {
    console.log(`📋 Planner: received ${announcements.length} announcements`);

    const announcementsText = announcements.length > 0
      ? announcements.map(a => {
        const date = a.createdAt?.toDate
          ? a.createdAt.toDate().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
          : 'Recent';
        const pinLabel = a.pinned ? ' [PINNED]' : '';
        return `- [${date}]${pinLabel} "${a.title}" by ${a.authorName}: ${a.text}`;
      }).join("\n")
      : "No recent announcements found.";

    console.log("📋 Announcements text for planner:\n", announcementsText);

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const prompt = `You are a friendly and helpful AI Study Planner for a university student. Today is ${today}.

Recent Course Announcements:
${announcementsText}

Student Request: "${userQuery}"

Your task is to answer the student's request based ONLY on the announcements provided.
- If they ask for the *next* or *upcoming* exam/deadline, give them exactly that. Do NOT dump all deadlines.
- If they ask for a general plan, extract all deadlines and create a prioritized study timeline.
- Always calculate actual dates if announcements mention relative times (e.g., "due next Friday") based on their post dates.
- Keep your answer short, conversational, and directly address their request.
- If appropriate, politely offer to show other deadlines or create a full study plan if they want one.
- Use clean formatting for readability but don't use bullet points and bold text.`;

    return await generateWithFallback(prompt);
  } catch (error) {
    console.error("Error with Planner AI:", error);
    return "I couldn't generate a plan right now. Please check your connection.";
  }
}

// Check if embeddings exist for a document
export async function checkEmbeddingsExist(
  courseId: string,
  documentId: string
): Promise<boolean> {
  const snap = await getDocs(
    query(
      collection(db, "embeddingMetadata"),
      where("courseId", "==", courseId),
      where("documentId", "==", documentId),
      where("status", "==", "completed")
    )
  );

  return !snap.empty;
}
 
 
