import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyBSFgrPfjG0VFT9_CbBAZDB_JGVl41efBE"; // User's new key

async function test() {
    console.log(`Testing key ending in ...${apiKey.slice(-4)}`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        console.log("Sending request...");
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log("SUCCESS:", response.text());
    } catch (error) {
        console.error("FAILURE:", error.message);
    }
}

test();
