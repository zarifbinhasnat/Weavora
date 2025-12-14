import dotenv from "dotenv";
dotenv.config();

const key = process.env.GEMINI_API_KEY;

if (!key) {
    console.error("GEMINI_API_KEY is not set. Set it in .env or the shell and retry.");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;

async function main() {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`Request failed: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error(text);
            if (res.status === 403) {
                console.error("403 means the key is invalid or the Generative Language API is not enabled for this project.");
            }
            process.exit(1);
        }
        const data = await res.json();
        const models = data.models || [];
        console.log(`Found ${models.length} models for this key.`);
        for (const m of models.slice(0, 10)) {
            console.log("-", m.name);
        }
    } catch (err) {
        console.error("Error calling model list:", err);
        process.exit(1);
    }
}

main();
