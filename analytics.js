// analytics.js - Add this file to your project
class AskBotAnalytics {
    constructor() {
        this.userId = this.generateUserId();
        this.sessionStart = Date.now();
        this.messageCount = 0;
        this.initTracking();
    }

    generateUserId() {
        let userId = localStorage.getItem('askbot_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 12);
            localStorage.setItem('askbot_user_id', userId);
        }
        return userId;
    }

    initTracking() {
        // Track page views
        this.track('page_view', {
            page: window.location.pathname,
            referrer: document.referrer
        });

        // Track session duration
        window.addEventListener('beforeunload', () => {
            this.track('session_end', {
                duration: Date.now() - this.sessionStart,
                messages_sent: this.messageCount
            });
        });
    }

    track(event, properties = {}) {
        const eventData = {
            userId: this.userId,
            event: event,
            properties: {
                ...properties,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                screen: `${screen.width}x${screen.height}`,
                language: navigator.language
            }
        };

        // Store locally for offline capability
        this.storeLocally(eventData);
        
        // Send to backend
        this.sendToBackend(eventData);
    }

    storeLocally(data) {
        let events = JSON.parse(localStorage.getItem('askbot_events') || '[]');
        events.push(data);
        
        // Keep only last 100 events
        if (events.length > 100) {
            events = events.slice(-100);
        }
        
        localStorage.setItem('askbot_events', JSON.stringify(events));
    }

    async sendToBackend(data) {
        try {
            await fetch('https://askbot-2-o.onrender.com/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.log('Analytics queued for retry:', error);
        }
    }

    trackMessage() {
        this.messageCount++;
        this.track('message_sent', {
            message_number: this.messageCount,
            session_duration: Date.now() - this.sessionStart
        });
    }

    trackUpgradeAttempt() {
        this.track('upgrade_attempted', {
            current_tier: 'free',
            messages_today: this.getTodayMessageCount()
        });
    }

    getTodayMessageCount() {
        const today = new Date().toDateString();
        return parseInt(localStorage.getItem(`messages_${today}`) || '0');
    }
}

// Initialize analytics
window.askBotAnalytics = new AskBotAnalytics();
