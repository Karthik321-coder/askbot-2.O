// analytics.js - Add to your project
class UserAnalytics {
    constructor() {
        this.userId = this.generateUserId();
        this.sessionStart = Date.now();
        this.events = [];
    }

    generateUserId() {
        return localStorage.getItem('userId') || 
               this.setUserId('user_' + Math.random().toString(36).substr(2, 9));
    }

    setUserId(id) {
        localStorage.setItem('userId', id);
        return id;
    }

    track(event, properties = {}) {
        const eventData = {
            userId: this.userId,
            event: event,
            properties: properties,
            timestamp: Date.now(),
            session: this.sessionStart,
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        // Store locally
        this.events.push(eventData);
        
        // Send to your backend
        this.sendToBackend(eventData);
    }

    async sendToBackend(data) {
        try {
            await fetch('https://askbot-2-o.onrender.com/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.log('Analytics error:', error);
        }
    }
}

// Initialize analytics
const analytics = new UserAnalytics();

// Track key events
analytics.track('page_view');
analytics.track('app_loaded');

// Export for use in other files
window.userAnalytics = analytics;
