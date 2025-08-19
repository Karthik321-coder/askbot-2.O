const BASE_URL = "https://askbot-2-o.onrender.com";

async function generateAIResponse(userInput) {
  try {
    const response = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        messages: [{ role: "user", content: userInput }] 
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.reply || "No response received";
  } catch (error) {
    console.error("API Error:", error);
    return `Error: ${error.message}`;
  }
}
