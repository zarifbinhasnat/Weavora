import { runRAG } from "./rag.js";

async function test() {
    const courseName = "statistics";

    // This is what the STUDENT types
    const question = "Answer part (b) of question 1";

    const answer = await runRAG(question, courseName);

    console.log("\nANSWER:\n", answer);
}

test();
