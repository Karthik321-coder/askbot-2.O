import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from 'cors';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// CORS middleware function
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Main serverless function handler
export default async function handler(req, res) {
  // Enable CORS
  await runMiddleware(req, res, cors({
    origin: true,
    credentials: true
  }));

  // Handle different routes
  const { method, url } = req;

  try {
    if (method === 'GET' && url === '/api') {
      return res.status(200).json({ message: "AskBot API is running!" });
    }

    if (method === 'GET' && url === '/api/hello') {
      return res.status(200).json({ message: "Hello from the backend!" });
    }

    if (method === 'GET' && url === '/api/users') {
      return res.status(200).json([
        { id: 1, name: 'Alice' }, 
        { id: 2, name: 'Bob' }
      ]);
    }

    if (method === 'POST' && url === '/api/generate') {
      const { messages } = req.body;

      // Validate input
      if (!Array.isArray(messages)) {
        return res.status(400).json({ 
          error: "'messages' must be an array of objects [{role, content}]" 
        });
      }

      // Check API key
      if (!process.env.API_KEY) {
        return res.status(500).json({ 
          error: "API_KEY not configured" 
        });
      }

      // Convert to prompt format
      const prompt = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      return res.status(200).json({ reply: text });
    }

    if (method === 'POST' && url === '/api/analytics') {
      const { userId, event, properties } = req.body;
      
      // Log analytics (you can add database storage later)
      console.log('📊 User Analytics:', {
        userId,
        event,
        properties,
        timestamp: new Date()
      });
      
      return res.json({ success: true });
    }

    // Handle 404 for unknown routes
    return res.status(404).json({ error: "Route not found" });

  } catch (error) {
    console.error("❌ API Error:", error);
    return res.status(500).json({ 
      error: "Internal server error: " + error.message 
    });
  }
}
