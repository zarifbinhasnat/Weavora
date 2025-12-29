import express from "express";
import cors from "cors";
import path from "path";

import materialsRoutes from "./src/routes/materials.routes.js";
import ragRoutes from "./src/routes/rag.routes.js";
import { syncStorageToDB } from "./src/services/storage.service.js";

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 Sync PDFs → DB on server start
syncStorageToDB();

// Routes
app.use("/api/materials", materialsRoutes);
app.use("/api/rag", ragRoutes);

// Serve PDFs
app.use("/storage", express.static(path.join(process.cwd(), "storage")));

app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});
