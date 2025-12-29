import express from "express";
import {
  getMaterialsByCourse,
  getMaterialFile,
} from "../controllers/materials.controller.js";

const router = express.Router();

router.get("/", getMaterialsByCourse);
router.get("/:id", getMaterialFile);

export default router;
