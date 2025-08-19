// Add this constant at the top of your script.js file
const BASE_URL = "https://askbot-2-o.onrender.com";

// Update or add the generateAIResponse function
async function generateAIResponse(userInput) {
  try {
    const response = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        messages: [{ role: "user", content: userInput }] 
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.reply || "No response received from AI";
  } catch (error) {
    console.error("Backend connection error:", error);
    return `Sorry, I'm having trouble connecting to my brain right now. Error: ${error.message}`;
  }
}
