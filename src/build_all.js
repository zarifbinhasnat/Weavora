import fs from "fs";
import path from "path";
import { buildVectorStore } from "./rag.js";

function getCourses() {
    return fs
        .readdirSync("data")
        .filter(name =>
            fs.statSync(path.join("data", name)).isDirectory()
        );
}

async function run() {
    const courses = getCourses();
    console.log("📚 Found courses:", courses);

    for (const course of courses) {
        await buildVectorStore(course);
    }
}

run().catch(err => {
    console.error("❌ Build failed:", err);
});
