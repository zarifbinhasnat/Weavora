import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ No VITE_GEMINI_API_KEY found in .env");
    process.exit(1);
}

console.log(`🔑 Using API Key: ${apiKey.substring(0, 8)}...`);

async function listModels() {
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // There isn't a direct listModels method on the client instance in some versions, 
        // but let's try to infer availability or use the model manager if available in this version.
        // Actually, for the JS SDK, we often just try to use a model.
        // BUT, we can try to fetch the models list via REST if the SDK doesn't expose it easily,
        // or just try a simple generation with a known stable model.

        // Let's try to 'touch' the API with a simple request to see if the key is valid at all for ANY model.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Attempting to generate content with gemini-1.5-flash...");
        const result = await model.generateContent("Test");
        console.log("✅ gemini-1.5-flash is WORKING!");

    } catch (error) {
        console.error("❌ gemini-1.5-flash FAILED:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
        }
    }

    try {
        const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log("Attempting to generate content with gemini-pro...");
        const resultPro = await modelPro.generateContent("Test");
        console.log("✅ gemini-pro is WORKING!");
    } catch (error) {
        console.error("❌ gemini-pro FAILED:", error.message);
    }
}

listModels();
