import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

export default async function handler(req, res) {
  // Enable CORS for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method, url = '' } = req;

    // Health check endpoint
    if (method === 'GET' && (url === '/' || url.includes('hello'))) {
      return res.status(200).json({ 
        message: "AskBot API is working!",
        timestamp: new Date().toISOString()
      });
    }

    // AI Chat endpoint
    if (method === 'POST' && url.includes('generate')) {
      const { messages } = req.body || {};

      // Validate input
      if (!Array.isArray(messages)) {
        return res.status(400).json({ 
          error: "Messages must be an array of objects [{role, content}]" 
        });
      }

      // Check API key
      if (!process.env.API_KEY) {
        return res.status(500).json({ 
          error: "API_KEY not configured in environment variables" 
        });
      }

      // Create prompt
      const prompt = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      console.log("🤖 Processing prompt:", prompt);

      // Generate AI response
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      console.log("✅ Generated response:", text.substring(0, 100) + "...");

      return res.status(200).json({ reply: text });
    }

    // Analytics endpoint
    if (method === 'POST' && url.includes('analytics')) {
      const { userId, event, properties } = req.body || {};
      
      console.log('📊 Analytics tracked:', {
        userId,
        event,
        properties,
        timestamp: new Date()
      });
      
      return res.status(200).json({ success: true });
    }

    // Users endpoint (for testing)
    if (method === 'GET' && url.includes('users')) {
      return res.status(200).json([
        { id: 1, name: 'Alice' }, 
        { id: 2, name: 'Bob' }
      ]);
    }

    // 404 for unknown routes
    return res.status(404).json({ 
      error: "Route not found",
      availableRoutes: ['/generate', '/analytics', '/users', '/hello']
    });

  } catch (error) {
    console.error("❌ Server Error:", error);
    return res.status(500).json({ 
      error: "Internal server error: " + error.message,
      timestamp: new Date().toISOString()
    });
  }
}
