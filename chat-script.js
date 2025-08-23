// ====== Chat Page Script ======
const BASE_URL = "https://askbot-backend-cfl7.onrender.com";
let chatHistory = [];

// DOM Elements for Chat Page
const chatElements = {
  messagesContainer: document.querySelector('.chat-messages') || document.getElementById('chatMessages'),
  messageInput: document.querySelector('.message-input') || document.getElementById('messageInput'),
  sendButton: document.querySelector('.send-button') || document.getElementById('sendButton')
};

// Initialize Chat Page
document.addEventListener("DOMContentLoaded", () => {
  initializeChat();
});

function initializeChat() {
  if (chatElements.sendButton) {
    chatElements.sendButton.addEventListener("click", sendMessage);
  }
  
  if (chatElements.messageInput) {
    chatElements.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }
  
  // Add welcome message
  addChatMessage("Hello! I'm AskBot. How can I help you today?", "bot");
}

// Send Message Function
async function sendMessage() {
  const input = chatElements.messageInput?.value?.trim();
  if (!input) return;
  
  // Add user message
  addChatMessage(input, "user");
  
  // Clear input
  chatElements.messageInput.value = "";
  
  // Show typing indicator
  const typingElement = addChatMessage("Typing...", "bot");
  
  try {
    // Get AI response
    const response = await generateAIResponse(input);
    
    // Remove typing indicator
    if (typingElement) {
      typingElement.remove();
    }
    
    // Add bot response
    addChatMessage(response, "bot");
  } catch (error) {
    // Remove typing indicator
    if (typingElement) {
      typingElement.remove();
    }
    
    addChatMessage("❌ Could not contact the bot. Please try again.", "bot");
  }
}

// Add Message to Chat
function addChatMessage(message, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;
  
  const messageContent = document.createElement("div");
  messageContent.className = "message-content";
  messageContent.textContent = message;
  
  const icon = document.createElement("i");
  icon.className = sender === "bot" ? "fas fa-robot" : "fas fa-user";
  
  messageDiv.appendChild(icon);
  messageDiv.appendChild(messageContent);
  
  if (chatElements.messagesContainer) {
    chatElements.messagesContainer.appendChild(messageDiv);
    chatElements.messagesContainer.scrollTop = chatElements.messagesContainer.scrollHeight;
  }
  
  return messageDiv;
}

// Generate AI Response Function (Same as main script)
async function generateAIResponse(userInput) {
  try {
    console.log("🤖 Sending to backend:", userInput);
    
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
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("✅ Backend response:", data);
    
    return data.reply || "I'm having trouble thinking right now. Try again!";
  } catch (error) {
    console.error("❌ Connection error:", error);
    throw error;
  }
}
