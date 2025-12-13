import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";

import { Document } from "@langchain/core/documents";
import { extractTextFromPDF } from "./pdf_loader.js";

/* =========================
   EMBEDDINGS CONFIG
========================= */
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: "text-embedding-004",
  apiVersion: "v1",
});

/* =========================
   BUILD VECTOR STORE
========================= */
export async function buildVectorStore(courseName) {
  const courseDir = path.join("data", courseName);
  if (!fs.existsSync(courseDir)) {
    console.log(`❌ Folder not found: data/${courseName}`);
    return;
  }

  const files = fs.readdirSync(courseDir);
  const docs = [];

  for (const file of files) {
    const filePath = path.join(courseDir, file);
    if (fs.statSync(filePath).isDirectory()) continue;

    let text = "";

    if (file.endsWith(".pdf")) {
      console.log(`📄 Reading PDF: ${file}`);
      text = await extractTextFromPDF(filePath);
    } else if (file.endsWith(".txt")) {
      console.log(`📄 Reading TXT: ${file}`);
      text = fs.readFileSync(filePath, "utf-8");
    } else {
      continue;
    }

    const chunks = text.match(/(.|[\r\n]){1,1000}/g) || [];
    for (const chunk of chunks) {
      docs.push(new Document({ pageContent: chunk }));
    }
  }

  if (docs.length === 0) {
    console.log(`⚠ No usable files in data/${courseName}`);
    return;
  }

  const texts = docs.map(d => d.pageContent);
  const vectors = await embeddings.embedDocuments(texts);

  const payload = texts.map((text, i) => ({
    text,
    embedding: vectors[i],
  }));

  if (!fs.existsSync("embeddings")) {
    fs.mkdirSync("embeddings");
  }

  fs.writeFileSync(
    path.join("embeddings", `${courseName}.json`),
    JSON.stringify(payload, null, 2)
  );

  console.log(`✔ Vector store built: ${courseName}`);
}

/* =========================
   RUN RAG QUERY
========================= */
export async function runRAG(question, courseName) {
  const embPath = path.join("embeddings", `${courseName}.json`);

  if (!fs.existsSync(embPath)) {
    throw new Error(`❌ No embeddings found for course: ${courseName}`);
  }

  const store = JSON.parse(fs.readFileSync(embPath, "utf-8"));
  if (store.length === 0) {
    throw new Error("❌ Embeddings file is empty");
  }

  // Embed the question
  const qVec = await embeddings.embedQuery(question);

  // Cosine similarity
  const cosine = (a, b) => {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
  };

  // Retrieve top chunks
  const top = store
    .map(x => ({
      text: x.text,
      score: cosine(qVec, x.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // IMPORTANT for multi-part questions

  console.log("\n🔍 Top Retrieved Chunks:");
  top.forEach((r, i) => {
    console.log(`\n#${i + 1} (score: ${r.score.toFixed(4)})\n${r.text}`);
  });

  const context = top.map(t => t.text).join("\n\n");

  const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-2.5-flash",
    temperature: 0.3,
    apiVersion: "v1",
  });

  /* =========================
     CORRECT EXAM PROMPT
  ========================= */
  const prompt = `
You are a university-level academic assistant.

The CONTEXT below comes from uploaded course material or exam papers.
It may contain questions, definitions, or problem statements.

If the context contains a QUESTION but not its answer,
you MUST SOLVE the question step-by-step using your own knowledge.

Use the context to understand the question correctly.
Do NOT repeat the question unless necessary.

CONTEXT:
${context}

STUDENT QUESTION:
${question}

Provide a clear, structured, exam-ready answer.
`;

  const res = await llm.invoke(prompt);

  const c = res?.content;
  if (typeof c === "string") return c;

  if (Array.isArray(c)) {
    return c
      .map(p => (typeof p === "string" ? p : p?.text || ""))
      .join("\n");
  }

  return String(c ?? "");
}
