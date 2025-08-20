// Add this at the TOP of your script.js file
const BASE_URL = "https://askbot-2-o.vercel.app/api";

// Your existing code continues below...
// (don't change anything else)


// ====== API Configuration ====== 
// Add this BEFORE your existing code in script.js
const BASE_URL = window.location.hostname.includes('vercel.app') 
  ? `${window.location.origin}/api`  // Vercel production
  : 'https://askbot-2-o.onrender.com'; // Your existing Render backend

// Your existing code continues below...
let isLoggedIn = false;
let currentUser = '';
// ... rest of your existing script



// ====== Global Variables ======
let isLoggedIn = false;
let currentUser = '';
let fuse;
let dataset = [];

let chatHistory = []; // 🔥 Add this line to fix the issue

// Add these functions to your existing script.js

// User tier management
const USER_LIMITS = {
    free: {
        dailyMessages: 10,
        features: ['basic_chat'],
        waitTime: 3000 // 3 seconds between messages
    },
    premium: {
        dailyMessages: 500,
        features: ['unlimited_chat', 'priority_support', 'export_chats'],
        waitTime: 0
    }
};

function checkMessageLimit() {
    const today = new Date().toDateString();
    const messageCount = parseInt(localStorage.getItem(`messages_${today}`) || '0');
    const userTier = localStorage.getItem('userTier') || 'free';
    
    if (messageCount >= USER_LIMITS[userTier].dailyMessages) {
        showUpgradeModal();
        return false;
    }
    
    // Increment message count
    localStorage.setItem(`messages_${today}`, messageCount + 1);
    return true;
}

function showUpgradeModal() {
    const modal = document.createElement('div');
    modal.className = 'upgrade-modal-overlay';
    modal.innerHTML = `
        <div class="upgrade-modal">
            <div class="upgrade-header">
                <h2>🚀 Upgrade to Premium</h2>
                <span class="close-upgrade" onclick="this.parentElement.parentElement.parentElement.remove()">×</span>
            </div>
            <div class="upgrade-content">
                <p>You've reached your daily limit of ${USER_LIMITS.free.dailyMessages} messages.</p>
                <div class="upgrade-features">
                    <h3>Premium Features:</h3>
                    <ul>
                        <li>✅ 500 messages per day</li>
                        <li>✅ Priority responses</li>
                        <li>✅ Chat history</li>
                        <li>✅ Export conversations</li>
                        <li>✅ No waiting time</li>
                    </ul>
                </div>
                <div class="upgrade-pricing">
                    <div class="price">$9.99<span>/month</span></div>
                    <button onclick="upgradeToPremium()" class="upgrade-btn">
                        Upgrade Now
                    </button>
                </div>
                <p class="upgrade-trial">7-day free trial • Cancel anytime</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Track upgrade attempt
    if (window.askBotAnalytics) {
        window.askBotAnalytics.trackUpgradeAttempt();
    }
}

function upgradeToPremium() {
    // For now, just simulate upgrade (implement payment later)
    localStorage.setItem('userTier', 'premium');
    showNotification('🎉 Upgraded to Premium! Enjoy unlimited access.', 'success');
    document.querySelector('.upgrade-modal-overlay').remove();
}

// Update your existing sendChatMessage function
async function sendChatMessage() {
    const input = elements.messageInput.value.trim();
    if (!input) return;
    
    // Check message limits
    if (!checkMessageLimit()) {
        return;
    }
    
    // Track message analytics
    if (window.askBotAnalytics) {
        window.askBotAnalytics.trackMessage();
    }
    
    // Add rate limiting for free users
    const userTier = localStorage.getItem('userTier') || 'free';
    if (USER_LIMITS[userTier].waitTime > 0) {
        elements.sendMessage.disabled = true;
        elements.messageInput.disabled = true;
        
        setTimeout(() => {
            elements.sendMessage.disabled = false;
            elements.messageInput.disabled = false;
        }, USER_LIMITS[userTier].waitTime);
    }
    
    // Your existing chat logic continues here...
    addMessage(input, "user");
    elements.messageInput.value = "";
    
    const typingDiv = document.createElement("div");
    typingDiv.className = "message bot-message";
    typingDiv.textContent = "Typing...";
    elements.chatbotMessages.appendChild(typingDiv);
    elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
    
    const reply = await generateAIResponse(input);
    
    typingDiv.remove();
    addMessage(reply, "bot");
}



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

// Add to your existing script.js
const userLimits = {
    free: {
        dailyMessages: 10,
        features: ['basic_chat']
    },
    premium: {
        dailyMessages: 100,
        features: ['unlimited_chat', 'chat_history', 'export_chats', 'priority_support']
    }
};

function checkUserLimit() {
    const today = new Date().toDateString();
    const messageCount = parseInt(localStorage.getItem(`messages_${today}`) || '0');
    const userTier = localStorage.getItem('userTier') || 'free';
    
    if (messageCount >= userLimits[userTier].dailyMessages) {
        showUpgradeModal();
        return false;
    }
    
    localStorage.setItem(`messages_${today}`, messageCount + 1);
    return true;
}

function showUpgradeModal() {
    // Create upgrade modal
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div class="upgrade-modal">
            <h3>🚀 Upgrade to Premium</h3>
            <p>You've reached your daily limit. Upgrade for unlimited access!</p>
            <button onclick="upgradeToPremium()">Upgrade for $9.99/month</button>
        </div>
    `;
    document.body.appendChild(modal);
}


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

async function sendChatMessage() {
  const input = elements.messageInput.value.trim();
  if (!input) return;

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



// ====== Generate AI-Like Response ======
async function generateAIResponse(userMessage) {
  chatHistory.push({ role: "user", content: userMessage });

  try {
    const res = await fetch("http://localhost:3001/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory })
    });

    const data = await res.json();

    if (data.reply) {
      chatHistory.push({ role: "bot", content: data.reply });
      return data.reply;
    } else {
      return "⚠️ I didn't get a response from Gemini.";
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return "❌ Could not contact the bot.";
  }
}

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
const BASE_URL = "https://askbot-2-o.onrender.com";

// Generate AI Response Function
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
    
    // Fallback responses when backend is unreachable
    const fallbackResponses = [
      "I'm currently offline, but I'll be back soon! 🤖",
      "Having some connection issues. Please try again in a moment.",
      "My brain is taking a quick break. Try refreshing the page!",
      "Could not contact the bot. Please check your connection."
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
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

// Add these functions at the END of your script.js file

// Generate AI Response Function
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
      throw new Error(`Backend error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.reply || "I'm having trouble thinking right now. Try again!";
  } catch (error) {
    console.error("❌ Connection error:", error);
    return "❌ Could not contact the bot. Please try again.";
  }
}

// Show Notification Function
function showNotification(message, type = "success") {
  if (!elements.notification) return;
  
  elements.notification.textContent = message;
  elements.notification.className = `notification ${type}`;
  elements.notification.classList.add("show");
  
  setTimeout(() => {
    elements.notification.classList.remove("show");
  }, 3000);
}

// Toggle Password Function
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








