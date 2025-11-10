/**
 * NetworkStatusService
 * 
 * Monitors network connectivity and provides user feedback for offline/online states.
 * Handles automatic reconnection when network is restored.
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

class NetworkStatusService {
    constructor() {
        this.isOnline = navigator.onLine;
        this.listeners = new Set();
        this.reconnectCallbacks = new Set();
        this.offlineIndicator = null;
        this.checkInterval = null;
        this.initialized = false;
    }

    /**
     * Initialize the network status service
     */
    initialize() {
        if (this.initialized) {
            console.warn('NetworkStatusService already initialized');
            return;
        }

        // Create offline indicator UI
        this.createOfflineIndicator();

        // Listen to browser online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Periodic connectivity check (backup for unreliable browser events)
        this.startPeriodicCheck();

        // Set initial state
        this.updateStatus(navigator.onLine);

        this.initialized = true;
        console.log('NetworkStatusService initialized');
    }

    /**
     * Create the offline indicator UI element
     */
    createOfflineIndicator() {
        // Check if indicator already exists
        if (document.getElementById('offline-indicator')) {
            this.offlineIndicator = document.getElementById('offline-indicator');
            return;
        }

        // Create indicator element
        const indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.className = 'offline-indicator';
        indicator.innerHTML = `
            <div class="offline-indicator-content">
                <i class="fas fa-wifi-slash"></i>
                <span class="offline-message">You are offline</span>
                <span class="reconnecting-message" style="display: none;">
                    <i class="fas fa-sync fa-spin"></i> Reconnecting...
                </span>
            </div>
        `;

        // Add styles
        this.addStyles();

        // Append to body
        document.body.appendChild(indicator);
        this.offlineIndicator = indicator;
    }

    /**
     * Add CSS styles for offline indicator
     */
    addStyles() {
        // Check if styles already exist
        if (document.getElementById('network-status-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'network-status-styles';
        style.textContent = `
            .offline-indicator {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 20px;
                text-align: center;
                z-index: 10000;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                transform: translateY(-100%);
                transition: transform 0.3s ease-in-out;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }

            .offline-indicator.show {
                transform: translateY(0);
            }

            .offline-indicator-content {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                font-size: 14px;
                font-weight: 500;
            }

            .offline-indicator i {
                font-size: 16px;
            }

            .offline-message,
            .reconnecting-message {
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }

            .offline-indicator.reconnecting {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                animation: pulse 2s ease-in-out infinite;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Handle online event
     */
    handleOnline() {
        console.log('Network connection restored');
        this.updateStatus(true);
        this.showReconnectingState();
        
        // Attempt to reconnect services
        this.attemptReconnection();
    }

    /**
     * Handle offline event
     */
    handleOffline() {
        console.log('Network connection lost');
        this.updateStatus(false);
        this.showOfflineIndicator();
    }

    /**
     * Update internal status and notify listeners
     */
    updateStatus(isOnline) {
        const wasOnline = this.isOnline;
        this.isOnline = isOnline;

        // Notify all listeners
        this.listeners.forEach(callback => {
            try {
                callback(isOnline, wasOnline);
            } catch (error) {
                console.error('Error in network status listener:', error);
            }
        });
    }

    /**
     * Show offline indicator
     */
    showOfflineIndicator() {
        if (!this.offlineIndicator) return;

        this.offlineIndicator.classList.remove('reconnecting');
        this.offlineIndicator.querySelector('.offline-message').style.display = 'inline-flex';
        this.offlineIndicator.querySelector('.reconnecting-message').style.display = 'none';
        this.offlineIndicator.classList.add('show');
    }

    /**
     * Show reconnecting state
     */
    showReconnectingState() {
        if (!this.offlineIndicator) return;

        this.offlineIndicator.classList.add('reconnecting');
        this.offlineIndicator.querySelector('.offline-message').style.display = 'none';
        this.offlineIndicator.querySelector('.reconnecting-message').style.display = 'inline-flex';
    }

    /**
     * Hide offline indicator
     */
    hideOfflineIndicator() {
        if (!this.offlineIndicator) return;

        this.offlineIndicator.classList.remove('show', 'reconnecting');
        
        // Reset after animation
        setTimeout(() => {
            if (this.offlineIndicator) {
                this.offlineIndicator.querySelector('.offline-message').style.display = 'inline-flex';
                this.offlineIndicator.querySelector('.reconnecting-message').style.display = 'none';
            }
        }, 300);
    }

    /**
     * Attempt to reconnect services
     */
    async attemptReconnection() {
        console.log('Attempting to reconnect services...');

        // Execute all reconnect callbacks
        const promises = Array.from(this.reconnectCallbacks).map(async callback => {
            try {
                await callback();
            } catch (error) {
                console.error('Error during reconnection:', error);
                throw error;
            }
        });

        try {
            await Promise.all(promises);
            console.log('All services reconnected successfully');
            this.hideOfflineIndicator();
            this.showSuccessToast('Connection restored');
        } catch (error) {
            console.error('Failed to reconnect some services:', error);
            this.showErrorToast('Failed to reconnect. Please refresh the page.');
            // Keep indicator visible
        }
    }

    /**
     * Start periodic connectivity check
     */
    startPeriodicCheck() {
        // Check every 30 seconds
        this.checkInterval = setInterval(() => {
            this.checkConnectivity();
        }, 30000);
    }

    /**
     * Stop periodic connectivity check
     */
    stopPeriodicCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Check actual connectivity by making a lightweight request
     */
    async checkConnectivity() {
        try {
            // Try to fetch a small resource with no-cache
            const response = await fetch('/favicon.ico', {
                method: 'HEAD',
                cache: 'no-cache',
                mode: 'no-cors'
            });
            
            // If we were offline and now we can connect, trigger online event
            if (!this.isOnline) {
                this.handleOnline();
            }
        } catch (error) {
            // If we were online and now we can't connect, trigger offline event
            if (this.isOnline) {
                this.handleOffline();
            }
        }
    }

    /**
     * Register a listener for network status changes
     * @param {Function} callback - Called with (isOnline, wasOnline)
     */
    addListener(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this.listeners.add(callback);
    }

    /**
     * Remove a network status listener
     * @param {Function} callback
     */
    removeListener(callback) {
        this.listeners.delete(callback);
    }

    /**
     * Register a reconnection callback
     * @param {Function} callback - Async function to call when reconnecting
     */
    addReconnectCallback(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this.reconnectCallbacks.add(callback);
    }

    /**
     * Remove a reconnection callback
     * @param {Function} callback
     */
    removeReconnectCallback(callback) {
        this.reconnectCallbacks.delete(callback);
    }

    /**
     * Check if currently online
     * @returns {boolean}
     */
    getStatus() {
        return this.isOnline;
    }

    /**
     * Show error toast for offline operations
     * @param {string} message
     */
    showOfflineError(message = 'This operation requires an internet connection') {
        this.showErrorToast(message);
    }

    /**
     * Show error toast
     * @param {string} message
     */
    showErrorToast(message) {
        if (typeof showToast === 'function') {
            showToast(message, 'danger');
        } else {
            console.error(message);
            alert(message);
        }
    }

    /**
     * Show success toast
     * @param {string} message
     */
    showSuccessToast(message) {
        if (typeof showToast === 'function') {
            showToast(message, 'success');
        } else {
            console.log(message);
        }
    }

    /**
     * Cleanup and remove event listeners
     */
    cleanup() {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        this.stopPeriodicCheck();
        this.listeners.clear();
        this.reconnectCallbacks.clear();
        
        if (this.offlineIndicator && this.offlineIndicator.parentNode) {
            this.offlineIndicator.parentNode.removeChild(this.offlineIndicator);
        }
        
        this.initialized = false;
        console.log('NetworkStatusService cleaned up');
    }
}

// Create global instance
window.networkStatusService = new NetworkStatusService();
