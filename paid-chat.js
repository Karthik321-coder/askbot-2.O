// Check if user already has access on page load
window.onload = function() {
    checkExistingAccess();
};

// Check if user has valid 24-hour pass
async function checkExistingAccess() {
    const accessData = localStorage.getItem('askbot_access');
    
    if (accessData) {
        const { expiry, paymentId } = JSON.parse(accessData);
        
        if (new Date() < new Date(expiry)) {
            // User has valid access
            showChatInterface();
            startTimer(expiry);
            return;
        } else {
            // Access expired
            localStorage.removeItem('askbot_access');
        }
    }
    
    showPaymentInterface();
}

// Payment button handler
document.getElementById('payButton').addEventListener('click', async function() {
    try {
        // Create payment order
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 4900 }) // ₹49 in paise
        });
        
        const order = await response.json();
        
        // Initialize Razorpay
        const options = {
            key: 'rzp_test_your_key_id', // Replace with your key
            amount: order.amount,
            currency: 'INR',
            order_id: order.id,
            name: 'AskBot',
            description: '24-Hour Premium Pass',
            handler: function(response) {
                verifyPayment(response);
            },
            prefill: {
                name: 'User',
                email: 'user@example.com'
            },
            theme: {
                color: '#cd3e51'
            }
        };
        
        const rzp = new Razorpay(options);
        rzp.open();
        
    } catch (error) {
        alert('Payment failed. Please try again.');
    }
});

// Verify payment and grant access
async function verifyPayment(paymentResponse) {
    try {
        const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentResponse)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Store access data
            const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            localStorage.setItem('askbot_access', JSON.stringify({
                expiry: expiry.toISOString(),
                paymentId: paymentResponse.razorpay_payment_id
            }));
            
            showChatInterface();
            startTimer(expiry);
        } else {
            alert('Payment verification failed');
        }
    } catch (error) {
        alert('Verification error. Contact support.');
    }
}

function showPaymentInterface() {
    document.getElementById('paymentSection').style.display = 'block';
    document.getElementById('chatSection').style.display = 'none';
}

function showChatInterface() {
    document.getElementById('paymentSection').style.display = 'none';
    document.getElementById('chatSection').style.display = 'block';
}

function startTimer(expiry) {
    const timer = setInterval(() => {
        const now = new Date();
        const remaining = new Date(expiry) - now;
        
        if (remaining <= 0) {
            clearInterval(timer);
            localStorage.removeItem('askbot_access');
            showPaymentInterface();
            return;
        }
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        document.getElementById('timeRemaining').textContent = 
            `${hours}h ${minutes}m remaining`;
    }, 1000);
}

// Chat functionality
document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat('user', message);
    input.value = '';
    
    // Show typing indicator
    addMessageToChat('bot', 'Typing...', 'typing');
    
    try {
        // Call your AI API here
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        document.querySelector('.typing').remove();
        
        // Add bot response
        addMessageToChat('bot', data.response);
        
    } catch (error) {
        document.querySelector('.typing').remove();
        addMessageToChat('bot', 'Sorry, something went wrong. Please try again.');
    }
}

function addMessageToChat(sender, message, className = '') {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender} ${className}`;
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
