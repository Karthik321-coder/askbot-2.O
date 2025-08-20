// index.js or server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Ensure API_KEY exists
if (!process.env.API_KEY) {
  console.error("❌ ERROR: API_KEY not found in .env file");
  process.exit(1);
}

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Route: test proxy
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

app.get('/api/users', (req, res) => {
  res.json([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
});


// Route: Gemini AI response
app.post("/generate", async (req, res) => {
  try {
    const { messages } = req.body;

    // Validate input
    if (!Array.isArray(messages)) {
      return res
        .status(400)
        .json({ error: "'messages' must be an array of objects [{role, content}]" });
    }

    // Convert to prompt format
    const prompt = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // ✅ MATCH YOUR SUBSCRIPTION
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    res.status(200).json({ reply: text });
  } catch (error) {
    console.error("❌ Gemini API error:", error);
    res
      .status(500)
      .json({ error: "Gemini API failed: " + error?.message || "Unknown error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ AskBot backend running at http://localhost:${PORT}`);
});
