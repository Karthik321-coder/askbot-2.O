// ====== Global Variables ======
let isLoggedIn = false;
let currentUser = '';
let fuse;
let dataset = [];

let chatHistory = []; // 🔥 Add this line to fix the issue


const chatbotResponses = {
  greetings: [
    "Hello! How can I assist you today?",
    "Hi there! What would you like to know?",
    "Welcome! I'm here to help answer your questions.",
    "Greetings! What can I help you with?"
  ],
  default: [
    "That's an interesting question! Based on my knowledge, here's what I can tell you:",
    "Let me help you with that. Here's some information:",
    "Great question! From my understanding:",
    "I'd be happy to help! Here's what I know about that:"
  ],
  technical: [
    "For technical questions like this, I recommend checking the latest documentation and best practices.",
    "This is a technical topic that requires careful consideration of various factors.",
    "Based on current industry standards and best practices:"
  ]
};

// ====== DOM Elements ======
const elements = {
  loginModal: document.getElementById('loginModal'),
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  closeModal: document.getElementById('closeModal'),
  loginForm: document.getElementById('loginForm'),
  passwordToggle: document.getElementById('passwordToggle'),
  themeToggle: document.getElementById('theme-toggle'),
  chatbotContainer: document.getElementById('chatbotContainer'),
  chatbotToggle: document.getElementById('chatbotToggle'),
  chatbotMessages: document.getElementById('chatbotMessages'),
  messageInput: document.getElementById('messageInput'),
  sendMessage: document.getElementById('sendMessage'),
  minimizeChat: document.getElementById('minimizeChat'),
  startChatting: document.getElementById('startChatting'),
  notification: document.getElementById('notification')
};

// ====== App Initialization ======
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function validateInput(input) {
    if (!input || input.trim().length === 0) {
        return "Please enter a message.";
    }
    
    if (input.length > 1000) {
        return "Message too long. Please keep it under 1000 characters.";
    }
    
    return null; // Valid input
}

// Track important events
function trackEvent(eventName, parameters = {}) {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, parameters);
  }
}

// Track user login
function trackLogin() {
  trackEvent('login', { method: 'admin' });
}

// Track chat messages (add to your existing sendChatMessage function)
function trackChatMessage() {
  trackEvent('chat_message_sent', {
    event_category: 'engagement',
    event_label: 'ai_chat'
  });
}

// Track upgrade attempts (for your freemium model)
function trackUpgradeAttempt() {
  trackEvent('upgrade_attempted', {
    event_category: 'conversion',
    current_tier: 'free'
  });
}


function initializeApp() {
  setupEventListeners();
  loadTheme();
  checkLoginStatus();
  loadDataset();
}

// ====== Load Dataset from JSON and Initialize Fuse.js ======
function loadDataset() {
  fetch("pairs_chunk_1.json")
    .then(res => res.json())
    .then(data => {
      dataset = data;
      fuse = new Fuse(dataset, {
        keys: ["q"],
        threshold: 0.4,
        includeScore: true
      });
    });
}

// ====== Event Listeners ======
function setupEventListeners() {
  elements.loginBtn?.addEventListener("click", () => elements.loginModal.style.display = "block");
  elements.logoutBtn?.addEventListener("click", logout);
  elements.closeModal?.addEventListener("click", () => elements.loginModal.style.display = "none");
  elements.loginForm?.addEventListener("submit", handleLogin);
  elements.passwordToggle?.addEventListener("click", togglePassword);
  elements.themeToggle?.addEventListener("click", toggleTheme);

  elements.chatbotToggle?.addEventListener("click", () => {
    elements.chatbotContainer.classList.toggle("active");
    elements.messageInput.focus();
  });

  elements.minimizeChat?.addEventListener("click", () => elements.chatbotContainer.classList.remove("active"));
  elements.sendMessage?.addEventListener("click", sendChatMessage);
  elements.messageInput?.addEventListener("keypress", e => {
    if (e.key === "Enter") sendChatMessage();
  });

  elements.startChatting?.addEventListener("click", () => {
    if (!isLoggedIn) {
      elements.loginModal.style.display = "block";
    }  else {
    // Open new page in a new tab:
    window.open("chat.html", "_blank", "noopener,noreferrer");
  }
  });

  window.addEventListener("click", e => {
    if (e.target === elements.loginModal) {
      elements.loginModal.style.display = "none";
    }
  });
}

// ====== Authentication Functions ======
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === "admin" && password === "admin123") {
    login(username);
    elements.loginModal.style.display = "none";
    showNotification("Welcome back! You are now logged in.", "success");
  } else {
    showNotification("Invalid credentials. Use admin/admin123", "error");
  }
}

function login(username) {
  isLoggedIn = true;
  currentUser = username;
  elements.loginBtn.style.display = "none";
  elements.logoutBtn.style.display = "flex";
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("currentUser", username);
}

function logout() {
  isLoggedIn = false;
  currentUser = "";
  elements.loginBtn.style.display = "flex";
  elements.logoutBtn.style.display = "none";
  elements.chatbotContainer.classList.remove("active");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("currentUser");
  showNotification("You have been logged out.", "success");
}

function checkLoginStatus() {
  const savedLogin = localStorage.getItem("isLoggedIn");
  const savedUser = localStorage.getItem("currentUser");

  if (savedLogin === "true" && savedUser) {
    login(savedUser);
  }
}

// ====== Theme Toggle Functions ======
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");

  elements.themeToggle.style.transform = "scale(0.8)";
  setTimeout(() => {
    elements.themeToggle.style.transform = "scale(1)";
  }, 150);
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.body.classList.add("dark-mode");
  }
}

// ====== Chatbot Message Handling ======
function addMessage(content, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}-message`;

  const icon = document.createElement("i");
  icon.className = sender === "bot" ? "fas fa-robot" : "fas fa-user";

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
 contentDiv.innerHTML = parseMarkdown(content);


  msgDiv.appendChild(icon);
  msgDiv.appendChild(contentDiv);
  elements.chatbotMessages.appendChild(msgDiv);
  elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
}

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

async function sendMessage() {
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        addMessage("Please wait a moment before sending another message.", "bot");
        return;
    }
    lastRequestTime = now;

  // Show user message
  addMessage(input, "user");

  // Clear input field
  elements.messageInput.value = "";

  // Show "Typing..."
  const typingDiv = document.createElement("div");
  typingDiv.className = "message bot-message";
  typingDiv.textContent = "Typing...";
  elements.chatbotMessages.appendChild(typingDiv);
  elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;

  // Get bot response from backend
  const reply = await generateAIResponse(input);

  // Remove "Typing..."
  typingDiv.remove();

  // Show bot reply
  addMessage(reply, "bot");
}

function parseMarkdown(text) {
  return text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`{3}([\s\S]*?)`{3}/gim, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

document.addEventListener('DOMContentLoaded', function() {
    // Try multiple ways to find the start button
    let startButton = 
        document.getElementById('startChatting') ||
        document.getElementById('startBtn') ||
        document.querySelector('.cta-primary') ||
        document.querySelector('button[onclick*="startChatting"]') ||
        Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.includes('Start Chatting')
        );
    
    if (startButton) {
        console.log('✅ Found start button:', startButton);
        
        // Remove any existing onclick
        startButton.removeAttribute('onclick');
        
        startButton.addEventListener('click', function() {
            console.log('🚀 Universal handler: Start clicked!');
            
            const chatbox = document.getElementById('chatbotContainer');
            if (chatbox) {
                chatbox.classList.add('active');
                chatbox.style.display = 'flex'; // Force show
                console.log('✅ Chatbox activated');
            }
        });
    } else {
        console.error('❌ Could not find Start Chatting button with any method!');
        console.log('Available buttons:', document.querySelectorAll('button'));
    }
});




// ====== Generate AI-Like Response ======
// Generate AI Response using your Vercel backend
async function generateAIResponse(userInput) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
        const response = await fetch('https://askbot-backend.vercel.app/generate', {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ 
                messages: [{ role: "user", content: userInput }] 
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.reply || "I'm having trouble understanding. Could you try rephrasing?";
    } catch (error) {
        clearTimeout(timeoutId);
        console.error("API Error:", error);
        return "Sorry, I'm experiencing technical difficulties. Please try again.";
    }
}

// Show typing indicator while waiting for response
const showTyping = () => {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing';
    typingDiv.innerHTML = `
        <i class="fas fa-robot"></i>
        <div class="message-content">
            <span class="typing-dots">●●●</span> Thinking...
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    return typingDiv;
};

// Add response time logging
const startTime = Date.now();
const response = await generateAIResponse(input);
const responseTime = Date.now() - startTime;
console.log(`Response time: ${responseTime}ms`);




// ====== Utility Functions ======
function togglePassword() {
  const passwordField = document.getElementById("password");
  if (passwordField.type === "password") {
    passwordField.type = "text";
    elements.passwordToggle.className = "fas fa-eye-slash password-toggle";
  } else {
    passwordField.type = "password";
    elements.passwordToggle.className = "fas fa-eye password-toggle";
  }
}

function showNotification(msg, type = "success") {
  if (!elements.notification) return;
  elements.notification.textContent = msg;
  elements.notification.className = `notification ${type}`;
  elements.notification.classList.add("show");

  setTimeout(() => {
    elements.notification.classList.remove("show");
  }, 3000);
}
// ====== Backend API Connection ======
const BASE_URL = "https://askbot-backend-cfl7.onrender.com";

async function generateAIResponseWithRetry(userInput, maxRetries = 2) {
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await generateAIResponse(userInput);
        } catch (error) {
            if (i === maxRetries) {
                throw error; // Final attempt failed
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
}



// Generate AI Response Function
// Generate AI Response using your Vercel backend
async function generateAIResponse(userInput) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
        const response = await fetch('https://askbot-backend.vercel.app/generate', {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ 
                messages: [{ role: "user", content: userInput }] 
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.reply || "I'm having trouble understanding. Could you try rephrasing?";
    } catch (error) {
        clearTimeout(timeoutId);
        console.error("API Error:", error);
        return "Sorry, I'm experiencing technical difficulties. Please try again.";
    }
}

// Missing Helper Functions
function showNotification(message, type = "success") {
  if (!elements.notification) return;
  
  elements.notification.textContent = message;
  elements.notification.className = `notification ${type}`;
  elements.notification.classList.add("show");
  
  setTimeout(() => {
    elements.notification.classList.remove("show");
  }, 3000);
}

function togglePassword() {
  const passwordInput = document.getElementById("password");
  const toggleIcon = elements.passwordToggle;
  
  if (passwordInput && toggleIcon) {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    toggleIcon.classList.toggle("fa-eye");
    toggleIcon.classList.toggle("fa-eye-slash");
  }
}







