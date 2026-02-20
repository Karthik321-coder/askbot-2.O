// Aqua Keeper AI - Aquarium & Water Care Assistant
const BACKEND_URL = 'https://askbot-backend.vercel.app';

const AQUA_SYSTEM_PROMPT =
    'You are Aqua Keeper AI, a specialist in aquarium care, fishkeeping, and aquatic ecosystems. ' +
    'Provide expert advice on fish species compatibility, water chemistry (pH, ammonia, nitrite, nitrate, hardness), ' +
    'tank cycling, filtration, aquatic plants, disease diagnosis, and feeding schedules. ' +
    'Keep answers practical, concise, and beginner-friendly when appropriate.';

window.addEventListener('load', function () {
    initializeChat();
    setTimeout(() => {
        addMessage('bot',
            '🐠 Welcome to <strong>Aqua Keeper AI</strong>! I\'m your dedicated aquarium and water care assistant. ' +
            'Ask me anything about fish care, water parameters, tank setup, plant maintenance, or disease treatment!'
        );
    }, 600);
});

function initializeChat() {
    const sendButton = document.getElementById('sendButton');
    const userInput = document.getElementById('userInput');

    sendButton.onclick = sendMessage;
    userInput.onkeypress = function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    userInput.focus();
}

function useSuggestion(chip) {
    const userInput = document.getElementById('userInput');
    userInput.value = chip.textContent;
    userInput.focus();
    // Hide suggestions after one is selected
    const bar = document.getElementById('suggestionsBar');
    if (bar) bar.style.display = 'none';
    sendMessage();
}

async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const message = userInput.value.trim();

    if (!message) return;

    // Hide suggestion chips once the user starts chatting
    const bar = document.getElementById('suggestionsBar');
    if (bar) bar.style.display = 'none';

    userInput.disabled = true;
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking';

    addMessage('user', message);
    userInput.value = '';

    const thinkingId = addMessage('bot', 'Thinking<span class="loading-dots"></span>', 'typing');

    try {
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                systemPrompt: AQUA_SYSTEM_PROMPT,
                isPremium: false
            })
        });

        if (!response.ok) {
            throw new Error(`Backend error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        document.getElementById(thinkingId)?.remove();

        const reply = data.reply || data.response || data.answer || '';
        if (!reply.trim()) {
            addMessage('bot', '🐠 I received your message but couldn\'t generate a response. Please try again!');
        } else {
            addMessage('bot', reply);
        }

    } catch (error) {
        document.getElementById(thinkingId)?.remove();
        addMessage('bot', `🚫 Sorry, something went wrong: ${error.message}. Please try again!`);
    } finally {
        userInput.disabled = false;
        sendButton.disabled = false;
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Ask';
        userInput.focus();
    }
}

function addMessage(sender, text, className) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    messageDiv.id = messageId;
    messageDiv.className = 'message ' + sender + (className ? ' ' + className : '');
    messageDiv.innerHTML = text;

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    return messageId;
}

document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        sendMessage();
    }
    if (event.key === 'Escape') {
        const input = document.getElementById('userInput');
        input.value = '';
        input.focus();
    }
});
