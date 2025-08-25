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
    const input = messageInput?.value?.trim();
    if (!input) return;
    
    addMessage(input, "user");
    messageInput.value = "";
    
    const typingDiv = addMessage("Typing...", "bot");
    
    try {
      const response = await fetch('https://askbot-backend.vercel.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: input }] }),
        mode: 'cors'
      });
      
      const data = await response.json();
      typingDiv.remove();
      addMessage(data.reply || "Sorry, I couldn't process that.", "bot");
      
    } catch (error) {
      typingDiv.remove();
      addMessage("I'm having connection issues. Please try again.", "bot");
    }
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
