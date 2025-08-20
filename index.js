import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
// Add after existing imports
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

app.post('/api/analytics', async (req, res) => {
    try {
        await client.connect();
        const db = client.db('askbot');
        await db.collection('events').insertOne({
            ...req.body,
            createdAt: new Date()
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Initialize Firebase Admin (for server-side)
initializeApp();
const db = getFirestore();

// Enhanced generate endpoint with analytics
app.post("/generate", async (req, res) => {
  try {
    const { messages, userId, metadata } = req.body;
    // Add after existing routes
app.post('/api/analytics', (req, res) => {
    const { userId, event, properties, timestamp } = req.body;
    
    // Log to console for now (later: save to database)
    console.log('📊 User Event:', {
        userId,
        event,
        properties,
        timestamp: new Date(timestamp)
    });
    
    // TODO: Save to database
    // await db.collection('events').add(req.body);
    
    res.json({ success: true });
});

// Get user stats
app.get('/api/user-stats', (req, res) => {
    // Mock data - replace with real database queries
    res.json({
        totalUsers: 150,
        activeUsers: 45,
        messagesPerDay: 234,
        averageSessionTime: '4.2 minutes'
    });
});

    
    // Log user interaction
    await db.collection('chat_sessions').add({
      userId: userId || 'anonymous',
      messages: messages,
      metadata: metadata || {},
      timestamp: new Date(),
      ip: req.ip
    });

    // Your existing AI generation code
    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    return res.status(200).json({ reply: text });
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Analytics endpoint
app.get("/api/analytics", async (req, res) => {
  try {
    const stats = await db.collection('chat_sessions').count().get();
    res.json({ 
      totalChats: stats.data().count,
      status: "active" 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000; // ✅ Render default port

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

// ✅ ROOT ROUTE - Fixes "Cannot GET /" 
app.get("/", (req, res) => {
  res.json({ 
    message: "AskBot Backend API is running! 🤖",
    status: "online",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/hello",
      users: "/api/users", 
      chat: "/generate"
    }
  });
});

// Health check endpoint
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

app.get("/api/users", (req, res) => {
  res.json([{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]);
});

// AI generation endpoint
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
    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    return res.status(200).json({ reply: text });
  } catch (error) {
    console.error("❌ Gemini API error:", error);
    return res
      .status(500)
      .json({ error: "Gemini API failed: " + (error?.message || "Unknown error") });
  }
});

// ✅ CRITICAL: Bind to 0.0.0.0 for Render deployment
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ AskBot backend running on 0.0.0.0:${PORT}`);
});



