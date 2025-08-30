// Free version - no payment needed
document.addEventListener('DOMContentLoaded', function() {
    // Add welcome message
    setTimeout(() => {
        addMessageToChat('bot', '👋 Hi! I\'m AskBot. Ask me anything!');
    }, 500);
    
    // Setup chat functionality
    setupChat();
});

function setupChat() {
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessageToChat('user', message);
    input.value = '';
    
    // Show typing indicator
    const typingId = addMessageToChat('bot', '💭 Thinking...', 'typing');
    
    try {
        // ← CONNECT TO YOUR BACKEND HERE
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: message,
                isPremium: false  // Free version
            })
        });
        
        if (!response.ok) throw new Error('Network error');
        
        const data = await response.json();
        
        // Remove typing indicator
        document.getElementById(typingId)?.remove();
        
        // Add AI response
        addMessageToChat('bot', data.response || data.reply || data.answer);
        
    } catch (error) {
        document.getElementById(typingId)?.remove();
        addMessageToChat('bot', 'Sorry, something went wrong. Please try again.');
    }
}

function addMessageToChat(sender, message, className = '') {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    messageDiv.id = messageId;
    messageDiv.className = `message ${sender} ${className}`;
    messageDiv.textContent = message;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageId;
}
