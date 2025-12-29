import express from "express";
import { askRAG } from "../controllers/rag.controller.js";

const router = express.Router();

router.post("/ask", askRAG);

export default router;
