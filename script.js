// ====== Global Variables ======
let isLoggedIn = false;
let currentUser = '';
let fuse;
let dataset = [];
let chatHistory = [];

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

// ====== Backend Configuration ======
const BASE_URL = "https://askbot-backend.vercel.app";
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

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
    })
    .catch(err => {
      console.log("Dataset not found, using API only");
    });
}

// ====== Event Listeners ======
function setupEventListeners() {
  // Login/Logout
  elements.loginBtn?.addEventListener("click", () => elements.loginModal.style.display = "block");
  elements.logoutBtn?.addEventListener("click", logout);
  elements.closeModal?.addEventListener("click", () => elements.loginModal.style.display = "none");
  elements.loginForm?.addEventListener("submit", handleLogin);
  elements.passwordToggle?.addEventListener("click", togglePassword);
  
  // Theme Toggle
  elements.themeToggle?.addEventListener("click", toggleTheme);
  
  // 🔥 FIXED: Start Chatting Button with Analytics
  elements.startChatting?.addEventListener("click", () => {
    console.log('Redirecting to chat.html...');
    
    // Track analytics event
    if (window.va) {
      window.va('track', 'StartChat', { location: 'homepage' });
    }
    
    window.location.href = 'chat.html';
  });
  
  // Chatbot Toggle (for embedded popup)
  elements.chatbotToggle?.addEventListener("click", () => {
    elements.chatbotContainer.classList.toggle("active");
    if (elements.messageInput) {
      elements.messageInput.focus();
    }
  });
  
  // Minimize Chat
  elements.minimizeChat?.addEventListener("click", () => {
    elements.chatbotContainer.classList.remove("active");
  });
  
  // Send Message (for embedded chat)
  elements.sendMessage?.addEventListener("click", sendChatMessage);
  elements.messageInput?.addEventListener("keypress", e => {
    if (e.key === "Enter") sendChatMessage();
  });
  
  // Close modal on outside click
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
  
  // Track login analytics
  if (window.va) {
    window.va('track', 'UserLogin', { method: 'admin' });
  }
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

  if (elements.themeToggle) {
    elements.themeToggle.style.transform = "scale(0.8)";
    setTimeout(() => {
      elements.themeToggle.style.transform = "scale(1)";
    }, 150);
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.body.classList.add("dark-mode");
  }
}

// ====== Chatbot Message Handling (for embedded chat) ======
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

// 🔥 FIXED: Corrected sendChatMessage function with Analytics
async function sendChatMessage() {
  const input = elements.messageInput.value.trim();
  if (!input) return;

  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    addMessage("Please wait a moment before sending another message.", "bot");
    return;
  }
  lastRequestTime = now;

  // Show user message
  addMessage(input, "user");
  
  // Track analytics event
  if (window.va) {
    window.va('track', 'MessageSent', { 
      messageLength: input.length,
      timestamp: new Date().toISOString()
    });
  }

  // Clear input field
  elements.messageInput.value = "";

  // Show typing indicator
  const typingDiv = document.createElement("div");
  typingDiv.className = "message bot-message typing";
  typingDiv.innerHTML = `
    <i class="fas fa-robot"></i>
    <div class="message-content">Typing...</div>
  `;
  elements.chatbotMessages.appendChild(typingDiv);
  elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;

  try {
    // Get bot response from backend
    const reply = await generateAIResponse(input);
    
    // Remove typing indicator
    typingDiv.remove();
    
    // Show bot reply
    addMessage(reply, "bot");
  } catch (error) {
    // Remove typing indicator
    typingDiv.remove();
    
    // Show error message
    addMessage("❌ Sorry, I'm having trouble connecting right now. Please try again.", "bot");
    console.error("Chat error:", error);
  }
}

// ====== Generate AI Response ======
async function generateAIResponse(userInput) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    console.log('🚀 Sending request to:', `${BASE_URL}/generate`);
    console.log('📤 Request body:', { messages: [{ role: "user", content: userInput }] });
    
    const response = await fetch(`${BASE_URL}/generate`, {
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
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Backend response data:', data);
    
    if (!data.reply) {
      console.error('❌ No reply field in response:', data);
      throw new Error('Invalid response format from backend');
    }
    
    return data.reply;
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("❌ API Error details:", error);
    
    if (error.name === 'AbortError') {
      return "⏱️ Response took too long. Please try a shorter message.";
    }
    
    if (error.message.includes('Failed to fetch')) {
      return "🌐 Network error. Please check your internet connection.";
    }
    
    if (error.message.includes('HTTP 400')) {
      return "📝 Invalid message format. Please try again.";
    }
    
    if (error.message.includes('HTTP 500')) {
      return "🔧 Backend server error. Please try again in a moment.";
    }
    
    return `💥 Error: ${error.message}`;
  }
}

// ====== Utility Functions ======
function parseMarkdown(text) {
  return text
    .replace(/^### (.*)$/gim, '<h3>$1</h3>')
    .replace(/^## (.*)$/gim, '<h2>$1</h2>')
    .replace(/^# (.*)$/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`{3}([\s\S]*?)`{3}/gim, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

function togglePassword() {
  const passwordField = document.getElementById("password");
  const toggleIcon = elements.passwordToggle;
  
  if (passwordField && toggleIcon) {
    if (passwordField.type === "password") {
      passwordField.type = "text";
      toggleIcon.className = "fas fa-eye-slash password-toggle";
    } else {
      passwordField.type = "password";
      toggleIcon.className = "fas fa-eye password-toggle";
    }
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

// ====== Analytics Functions ======
function trackEvent(eventName, parameters = {}) {
  // Support both gtag and Vercel Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, parameters);
  }
  
  if (window.va) {
    window.va('track', eventName, parameters);
  }
}

function trackLogin() {
  trackEvent('login', { method: 'admin' });
}

function trackChatMessage() {
  trackEvent('chat_message_sent', {
    event_category: 'engagement',
    event_label: 'ai_chat'
  });
}

function trackUpgradeAttempt() {
  trackEvent('upgrade_attempted', {
    event_category: 'conversion',
    current_tier: 'free'
  });
}
