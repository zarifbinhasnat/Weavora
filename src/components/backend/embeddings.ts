import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "./firebase.js";
import { addDoc, collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const storage = getStorage();
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

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

// Generate embeddings from PDF link (automated on upload)
export async function generateEmbeddingsFromLink(
  courseId: string,
  documentId: string,
  pdfUrl: string,
  documentTitle: string
): Promise<void> {
  try {
    console.log("Starting embedding generation for:", documentTitle);

    // 1. Fetch PDF from the link
    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error("Failed to fetch PDF");
    
    const arrayBuffer = await response.arrayBuffer();
    
    // 2. Extract text using pdf-parse
    const pdfParse = (await import('pdf-parse')).default;
    const pdfData = await pdfParse(Buffer.from(arrayBuffer));
    const fullText = pdfData.text;

    if (!fullText || fullText.trim().length === 0) {
      throw new Error("No text extracted from PDF");
    }

    console.log(`Extracted ${fullText.length} characters from PDF`);

    // 3. Split text into chunks (500 words per chunk)
    const chunks = splitIntoChunks(fullText, 500);
    console.log(`Split into ${chunks.length} chunks`);

    // 4. Generate embeddings for each chunk using Gemini
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingChunks: EmbeddingChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Generating embedding for chunk ${i + 1}/${chunks.length}`);
      
      const result = await model.embedContent(chunks[i]);
      
      embeddingChunks.push({
        text: chunks[i],
        embedding: result.embedding.values,
        chunkIndex: i,
      });

      // Rate limiting: wait 100ms between requests
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

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

    console.log("Embeddings stored in Firebase Storage");

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

    console.log("Embedding metadata saved to Firestore");

    // 7. Update document to mark embeddings as generated
    const docRef = doc(db, "Documents", documentId);
    await updateDoc(docRef, {
      embeddingsGenerated: true,
      embeddingsGeneratedAt: new Date(),
    });

  } catch (error) {
    console.error("Error generating embeddings:", error);
    
    // Store error in metadata
    await addDoc(collection(db, "embeddingMetadata"), {
      courseId,
      documentId,
      documentTitle,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      createdAt: new Date(),
    });

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

// Retrieve all embeddings for a course
export async function getCourseEmbeddings(
  courseId: string
): Promise<EmbeddingChunk[]> {
  const metadataSnap = await getDocs(
    query(
      collection(db, "embeddingMetadata"),
      where("courseId", "==", courseId),
      where("status", "==", "completed")
    )
  );

  const allEmbeddings = await Promise.all(
    metadataSnap.docs.map(async (docSnap) => {
      const data = docSnap.data();
      try {
        const response = await fetch(data.storageUrl);
        const embeddingData = await response.json();
        return embeddingData.chunks as EmbeddingChunk[];
      } catch (error) {
        console.error("Error fetching embeddings:", error);
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
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(userQuestion);
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

// Answer question using RAG
export async function answerWithRAG(
  courseId: string,
  userQuestion: string
): Promise<string> {
  try {
    // 1. Get relevant context from RAG
    const relevantChunks = await queryRAG(courseId, userQuestion, 5);

    if (relevantChunks.length === 0) {
      return "I don't have enough information from the course materials to answer this question. Please make sure documents have been uploaded to this course.";
    }

    // 2. Build context from top chunks
    const context = relevantChunks
      .map((chunk, i) => `[Context ${i + 1}]\n${chunk.text}`)
      .join("\n\n");

    // 3. Generate answer using Gemini with context
    const chat = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const prompt = `You are an AI learning assistant for a course. Answer the student's question based ONLY on the provided course materials.

Course Materials Context:
${context}

Student Question: ${userQuestion}

Instructions:
- Answer directly and concisely
- Only use information from the context above
- If the context doesn't contain the answer, say "I don't have information about this in the uploaded course materials"
- Be helpful and educational

Answer:`;

    const result = await chat.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error answering with RAG:", error);
    throw error;
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
