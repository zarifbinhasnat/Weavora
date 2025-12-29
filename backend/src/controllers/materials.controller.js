import path from "path";
import {
  getMaterials,
  getMaterialById,
} from "../services/storage.service.js";

export const getMaterialsByCourse = (req, res) => {
  const { courseId } = req.query;
  const data = getMaterials(courseId);
  res.json(data);
};

export const getMaterialFile = (req, res) => {
  const material = getMaterialById(req.params.id);

  if (!material) {
    return res.status(404).json({ message: "Material not found" });
  }

  res.sendFile(path.join(process.cwd(), material.path));
};
