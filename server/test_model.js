
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.argv[2];
if (!apiKey) {
    console.error("Please provide API key as argument");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        // There isn't a direct listModels on genAI instance in some versions, 
        // but let's try to just run a dummy generation to see if it works, 
        // or use the model manager if available.
        // Actually, the error message said "Call ListModels".
        // In the Node SDK, it might be via GoogleAIFileManager or just not easily exposed.

        // Let's try to just generate content with a known model to see if it works.
        console.log("Testing gemini-1.5-pro...");
        const result = await model.generateContent("Hello");
        console.log("Success:", result.response.text());
    } catch (e) {
        console.error("Error:", e.message);
    }
}

listModels();
