import express from "express";
import cors from "cors";
import { runRAG } from "./rag.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/ask", async (req, res) => {
    try {
        const { question, course } = req.body;

        if (!question || !course) {
            return res.status(400).json({ error: "question and course required" });
        }

        const answer = await runRAG(question, course);
        res.json({ answer });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3001, () => {
    console.log("✅ RAG server running on http://localhost:3001");
});
