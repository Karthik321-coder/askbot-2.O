// Simple working chat script
let chatHistory = [];

document.addEventListener("DOMContentLoaded", () => {
  const messageInput = document.querySelector('.message-input') || document.getElementById('messageInput');
  const sendButton = document.querySelector('.send-button') || document.getElementById('sendButton');
  const messagesContainer = document.querySelector('.chat-messages') || document.getElementById('chatMessages');
  
  // Add welcome message
  addMessage("Hello! I'm AskBot. How can I help you today?", "bot");
  
  // Send button click
  if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
  }
  
  // Enter key press
  if (messageInput) {
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }
  
async function sendMessage() {
    const input = messageInput.value.trim();
    if (!input || isTyping) return;

    // Add user message to chat
    addMessage(input, "user");
    
    // Clear input and show typing
    messageInput.value = "";
    setTypingState(true);

    // Show typing indicator
    const typingMessage = addMessage("Typing...", "bot", true);

    try {
        // 🚀 Call your Vercel backend
        const response = await generateAIResponse(input);
        
        // Remove typing indicator
        if (typingMessage && typingMessage.parentNode) {
            typingMessage.remove();
        }
        
        // Add AI response
        addMessage(response, "bot");
    } catch (error) {
        // Remove typing indicator and show error
        if (typingMessage && typingMessage.parentNode) {
            typingMessage.remove();
        }
        
        addMessage("❌ Sorry, I'm having trouble connecting. Please try again.", "bot");
        console.error("Chat error:", error);
    }
    
    setTypingState(false);
}

  function addMessage(message, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;
    
    const icon = document.createElement("i");
    icon.className = sender === "bot" ? "fas fa-robot" : "fas fa-user";
    
    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = message;
    
    messageDiv.appendChild(icon);
    messageDiv.appendChild(content);
    
    if (messagesContainer) {
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    return messageDiv;
  }
});
