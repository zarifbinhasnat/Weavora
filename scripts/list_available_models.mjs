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
    console.error("❌ No VITE_GEMINI_API_KEY found");
    process.exit(1);
}

// Directly fetch the list of available models for this API key
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log(`📡 Fetching available models for key: ${apiKey.substring(0, 8)}...`);

fetch(url)
    .then(res => {
        if (!res.ok) {
            console.error(`❌ HTTP Error: ${res.status} ${res.statusText}`);
            return res.text().then(text => {
                console.error("Response Body:", text);
                throw new Error("Failed to fetch models");
            });
        }
        return res.json();
    })
    .then(data => {
        if (data.models && data.models.length > 0) {
            console.log("✅ AVAILABLE MODELS:");
            data.models.forEach(m => console.log(` - ${m.name}`));
        } else {
            console.log("⚠️ No models found for this API key.");
        }
    })
    .catch(err => {
        console.error("❌ FATAL ERROR:", err.message);
    });
