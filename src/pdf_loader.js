import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import Tesseract from "tesseract.js";
import { exec } from "child_process";

export async function extractTextFromPDF(pdfPath) {
    const buffer = fs.readFileSync(pdfPath);


    const parsed = await pdfParse(buffer);
    let selectableText = parsed.text || "";

    console.log("📄 Extracted selectable text length:", selectableText.length);

    let ocrText = "";

   
    if (selectableText.trim().length < 1000) {
        console.log("⚠ Scanned or weak-text PDF detected, running OCR");

        try {
            const imgDir = path.join(
                path.dirname(pdfPath),
                path.basename(pdfPath, ".pdf") + "_imgs"
            );

            fs.mkdirSync(imgDir, { recursive: true });

            await new Promise((resolve, reject) => {
                exec(
                    `pdftoppm "${pdfPath}" "${path.join(imgDir, "page")}" -png -r 200`,
                    { shell: true },
                    (err) => (err ? reject(err) : resolve())
                );
            });

            const images = fs.readdirSync(imgDir).filter(f => f.endsWith(".png"));

            for (const img of images) {
                const { data } = await Tesseract.recognize(
                    path.join(imgDir, img),
                    "eng"
                );
                ocrText += data.text + "\n";
            }

            console.log("OCR text length:", ocrText.length);

            // 👉 comment this line if you want to KEEP images
            fs.rmSync(imgDir, { recursive: true, force: true });

        } catch (err) {
            console.warn("⚠ OCR skipped:", err.message);
        }
    }

    return cleanText(`${selectableText}\n${ocrText}`);
}

function cleanText(text) {
    return text
        .replace(/\s+/g, " ")
        .replace(/\n+/g, "\n")
        .replace(/Page\s+\d+/gi, "")
        .trim();
}
