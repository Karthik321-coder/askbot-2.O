import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.post("/generate", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "'messages' must be an array" });
    }
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    res.json({ reply: text });
  } catch (err) {
    console.error("Gemini API error:", err.message);
    res.status(500).json({ error: "Gemini API failed: " + err.message });
  }
});

// THIS IS THE CRUCIAL PART - listen on a port
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ AskBot backend running at http://localhost:${PORT}`);
});
