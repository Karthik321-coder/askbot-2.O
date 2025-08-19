// ====== Backend API Connection ======
const BASE_URL = "https://askbot-2-o.onrender.com";

async function generateAIResponse(userInput) {
  try {
    console.log("Sending request to backend:", userInput);
    
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
    console.log("Backend response:", data);
    
    return data.reply || "I'm having trouble thinking right now. Try again!";
  } catch (error) {
    console.error("Connection error:", error);
    
    // Fallback responses when backend is unreachable
    const fallbackResponses = [
      "I'm currently offline, but I'll be back soon! 🤖",
      "Having some connection issues. Please try again in a moment.",
      "My brain is taking a quick break. Try refreshing the page!",
      "Experiencing some technical difficulties. Your message is important to me!"
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

// ====== Add missing helper functions ======
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
  const toggleIcon = document.getElementById("passwordToggle");
  
  if (passwordInput && toggleIcon) {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    toggleIcon.classList.toggle("fa-eye");
    toggleIcon.classList.toggle("fa-eye-slash");
  }
}
