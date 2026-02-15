import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ No VITE_GEMINI_API_KEY found in .env");
    process.exit(1);
}

console.log(`✅ Found API Key: ${apiKey.substring(0, 8)}...`);

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    console.log(`\nTesting Model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log(`✅ ${modelName} Success! Response: ${response.text().substring(0, 50)}...`);
        return true;
    } catch (error) {
        console.error(`❌ ${modelName} Failed: ${error.message}`);
        return false;
    }
}

async function run() {
    console.log("Starting Connectivity Test...");

    // Test Gemini 1.5 Flash
    await testModel("gemini-1.5-flash");

    // Test Gemini Pro
    await testModel("gemini-pro");

    // Test Embeddings
    console.log("\nTesting Embeddings (gemini-embedding-001)...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const result = await model.embedContent("Test string");
        console.log(`✅ Embeddings Success! Vector length: ${result.embedding.values.length}`);
    } catch (error) {
        console.error(`❌ Embeddings Failed: ${error.message}`);
    }
}

run();
