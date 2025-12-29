import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

const ROOT = process.cwd();

const DB_PATH = path.join(ROOT, "src/db/materials.db.json");
const STORAGE_PATH = path.join(ROOT, "storage/materials");

const readDB = () => {
  if (!fs.existsSync(DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
};

const writeDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// 🔥 Sync PDFs → DB
export const syncStorageToDB = () => {
  if (!fs.existsSync(STORAGE_PATH)) return;

  let db = readDB();
  let changed = false;

  const courses = fs.readdirSync(STORAGE_PATH);

  courses.forEach((courseId) => {
    const courseDir = path.join(STORAGE_PATH, courseId);
    if (!fs.statSync(courseDir).isDirectory()) return;

    fs.readdirSync(courseDir).forEach((file) => {
      if (!file.endsWith(".pdf")) return;

      const filePath = `storage/materials/${courseId}/${file}`;

      if (!db.find((m) => m.path === filePath)) {
        db.push({
          id: uuid(),
          courseId,
          title: file,
          type: "material",
          uploadedBy: "teacher",
          path: filePath,
          createdAt: new Date().toISOString(),
        });
        changed = true;
      }
    });
  });

  if (changed) writeDB(db);
};

export const getMaterials = (courseId) => {
  const db = readDB();
  return courseId ? db.filter((m) => m.courseId === courseId) : db;
};

export const getMaterialById = (id) => {
  const db = readDB();
  return db.find((m) => m.id === id);
};
