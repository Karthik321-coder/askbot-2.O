// Enable test mode for now
const TEST_MODE = true;

console.log('Payment script loaded'); // Debug line

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded'); // Debug line
    
    const payButton = document.getElementById('payButton');
    console.log('Pay button found:', payButton); // Debug line
    
    if (payButton) {
        payButton.addEventListener('click', function() {
            console.log('Pay button clicked'); // Debug line
            simulatePayment();
        });
    }
});

function simulatePayment() {
    console.log('Starting payment simulation'); // Debug line
    
    const payButton = document.getElementById('payButton');
    payButton.textContent = '💳 Processing...';
    payButton.disabled = true;
    
    // Simulate 2-second payment processing
    setTimeout(() => {
        console.log('Payment successful, switching to chat'); // Debug line
        
        // Store access for 24 hours
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        localStorage.setItem('askbot_access', JSON.stringify({
            expiry: expiry.toISOString(),
            paymentId: 'test_' + Date.now()
        }));
        
        // Switch to chat interface
        document.getElementById('paymentSection').style.display = 'none';
        document.getElementById('chatSection').style.display = 'block';
        
        // Start timer
        startTimer(expiry);
        
        // Add welcome message
        setTimeout(() => {
            addMessageToChat('bot', '🎉 Welcome to AskBot Premium! You now have 24 hours of unlimited access!');
        }, 500);
    }, 2000);
}

function startTimer(expiry) {
    const timer = setInterval(() => {
        const remaining = new Date(expiry) - new Date();
        
        if (remaining <= 0) {
            clearInterval(timer);
            localStorage.removeItem('askbot_access');
            location.reload(); // Refresh to show payment screen
            return;
        }
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        const timeElement = document.getElementById('timeRemaining');
        if (timeElement) {
            timeElement.textContent = `⏰ ${hours}h ${minutes}m remaining`;
        }
    }, 1000);
}

function addMessageToChat(sender, message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = message;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
