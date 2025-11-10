/**
 * RealtimeService - Manages real-time data synchronization with Supabase
 * 
 * This service handles:
 * - Real-time subscriptions to database tables
 * - Automatic reconnection on connection drops
 * - Subscription lifecycle management
 * - Event callbacks for data changes
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

class RealtimeService {
    constructor(dataService) {
        if (!dataService) {
            throw new Error('DataService instance is required');
        }
        
        this.dataService = dataService;
        this.subscriptions = new Map();
        this.reconnectAttempts = new Map();
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // 2 seconds
        this.isOnline = navigator.onLine;
        
        // Monitor network status
        this._setupNetworkMonitoring();
        
        console.log('RealtimeService initialized');
    }

    /**
     * Subscribe to real-time changes on a specific table
     * 
     * @param {string} table - The table name to subscribe to
     * @param {Function} callback - Callback function to handle changes
     * @param {Object} options - Optional configuration
     * @returns {Object} Subscription object
     * 
     * Requirement 4.1: Real-time updates across all connected clients
     * Requirement 4.2: Use Supabase real-time features
     */
    subscribeToTable(table, callback, options = {}) {
        if (!table || typeof table !== 'string') {
            throw new Error('Table name is required and must be a string');
        }
        
        if (!callback || typeof callback !== 'function') {
            throw new Error('Callback function is required');
        }

        // Check if already subscribed
        if (this.subscriptions.has(table)) {
            console.warn(`Already subscribed to table: ${table}. Unsubscribing previous subscription.`);
            this.unsubscribeFromTable(table);
        }

        try {
            const client = this.dataService.client;
            if (!client) {
                throw new Error('Supabase client not available. Ensure DataService is initialized.');
            }

            // Create channel name
            const channelName = `realtime:${table}`;
            
            // Set up subscription with event filters
            const channel = client
                .channel(channelName)
                .on(
                    'postgres_changes',
                    {
                        event: options.event || '*', // INSERT, UPDATE, DELETE, or * for all
                        schema: options.schema || 'public',
                        table: table,
                        filter: options.filter || undefined
                    },
                    (payload) => {
                        console.log(`Real-time change detected in ${table}:`, payload);
                        
                        // Call the user-provided callback with the payload
                        try {
                            callback(payload);
                        } catch (error) {
                            console.error(`Error in callback for table ${table}:`, error);
                        }
                    }
                )
                .subscribe((status, error) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`Successfully subscribed to ${table}`);
                        this.reconnectAttempts.set(table, 0); // Reset reconnect attempts
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error(`Channel error for ${table}:`, error);
                        this._handleSubscriptionError(table, callback, options);
                    } else if (status === 'TIMED_OUT') {
                        console.warn(`Subscription timed out for ${table}`);
                        this._handleSubscriptionError(table, callback, options);
                    } else if (status === 'CLOSED') {
                        console.log(`Subscription closed for ${table}`);
                    }
                });

            // Store subscription info
            this.subscriptions.set(table, {
                channel,
                callback,
                options,
                subscribedAt: new Date()
            });

            console.log(`Subscribed to real-time updates for table: ${table}`);
            
            return {
                table,
                channel,
                unsubscribe: () => this.unsubscribeFromTable(table)
            };

        } catch (error) {
            console.error(`Failed to subscribe to table ${table}:`, error);
            throw error;
        }
    }

    /**
     * Unsubscribe from a specific table
     * 
     * @param {string} table - The table name to unsubscribe from
     * @returns {boolean} True if unsubscribed successfully
     * 
     * Requirement 4.4: Handle subscription lifecycle
     */
    unsubscribeFromTable(table) {
        if (!table || typeof table !== 'string') {
            throw new Error('Table name is required and must be a string');
        }

        const subscription = this.subscriptions.get(table);
        
        if (!subscription) {
            console.warn(`No active subscription found for table: ${table}`);
            return false;
        }

        try {
            // Unsubscribe from the channel
            subscription.channel.unsubscribe();
            
            // Remove from subscriptions map
            this.subscriptions.delete(table);
            
            // Clear reconnect attempts
            this.reconnectAttempts.delete(table);
            
            console.log(`Unsubscribed from table: ${table}`);
            return true;

        } catch (error) {
            console.error(`Error unsubscribing from table ${table}:`, error);
            return false;
        }
    }

    /**
     * Cleanup all subscriptions
     * Should be called when the application is closing or user logs out
     * 
     * Requirement 4.4: Handle subscription lifecycle
     */
    cleanup() {
        console.log('Cleaning up all real-time subscriptions...');
        
        const tables = Array.from(this.subscriptions.keys());
        
        tables.forEach(table => {
            this.unsubscribeFromTable(table);
        });

        this.subscriptions.clear();
        this.reconnectAttempts.clear();
        
        console.log('All subscriptions cleaned up');
    }

    /**
     * Get list of active subscriptions
     * 
     * @returns {Array} Array of table names with active subscriptions
     */
    getActiveSubscriptions() {
        return Array.from(this.subscriptions.keys());
    }

    /**
     * Check if subscribed to a specific table
     * 
     * @param {string} table - The table name to check
     * @returns {boolean} True if subscribed
     */
    isSubscribed(table) {
        return this.subscriptions.has(table);
    }

    /**
     * Handle subscription errors and attempt reconnection
     * 
     * @private
     * @param {string} table - The table name
     * @param {Function} callback - Original callback function
     * @param {Object} options - Original subscription options
     * 
     * Requirement 4.4: Add reconnection logic for dropped connections
     */
    _handleSubscriptionError(table, callback, options) {
        const attempts = this.reconnectAttempts.get(table) || 0;
        
        if (attempts >= this.maxReconnectAttempts) {
            console.error(`Max reconnection attempts reached for ${table}. Giving up.`);
            this.subscriptions.delete(table);
            this.reconnectAttempts.delete(table);
            
            // Notify user of connection failure
            if (window.showToast) {
                window.showToast(
                    `Failed to maintain real-time connection for ${table}. Please refresh the page.`,
                    'danger'
                );
            }
            return;
        }

        // Increment reconnect attempts
        this.reconnectAttempts.set(table, attempts + 1);
        
        console.log(`Attempting to reconnect to ${table} (attempt ${attempts + 1}/${this.maxReconnectAttempts})...`);
        
        // Wait before reconnecting (exponential backoff)
        const delay = this.reconnectDelay * Math.pow(2, attempts);
        
        setTimeout(() => {
            // First unsubscribe the failed subscription
            const subscription = this.subscriptions.get(table);
            if (subscription) {
                try {
                    subscription.channel.unsubscribe();
                } catch (error) {
                    console.error('Error unsubscribing failed channel:', error);
                }
                this.subscriptions.delete(table);
            }
            
            // Try to resubscribe
            try {
                this.subscribeToTable(table, callback, options);
            } catch (error) {
                console.error(`Failed to reconnect to ${table}:`, error);
                this._handleSubscriptionError(table, callback, options);
            }
        }, delay);
    }

    /**
     * Set up network monitoring to handle online/offline events
     * 
     * @private
     * 
     * Requirement 4.4: Handle reconnection on network restore
     */
    _setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            console.log('Network connection restored');
            this.isOnline = true;
            this._reconnectAllSubscriptions();
        });

        window.addEventListener('offline', () => {
            console.log('Network connection lost');
            this.isOnline = false;
            
            if (window.showToast) {
                window.showToast('Network connection lost. Real-time updates paused.', 'warning');
            }
        });
    }

    /**
     * Reconnect all active subscriptions
     * Called when network connection is restored
     * 
     * @private
     * 
     * Requirement 4.4: Automatic reconnection
     */
    _reconnectAllSubscriptions() {
        console.log('Reconnecting all subscriptions...');
        
        const subscriptionsToReconnect = Array.from(this.subscriptions.entries());
        
        subscriptionsToReconnect.forEach(([table, subscription]) => {
            console.log(`Reconnecting to ${table}...`);
            
            // Unsubscribe old connection
            try {
                subscription.channel.unsubscribe();
            } catch (error) {
                console.error(`Error unsubscribing from ${table}:`, error);
            }
            
            // Remove from map
            this.subscriptions.delete(table);
            
            // Resubscribe
            try {
                this.subscribeToTable(table, subscription.callback, subscription.options);
            } catch (error) {
                console.error(`Failed to reconnect to ${table}:`, error);
            }
        });
        
        if (window.showToast) {
            window.showToast('Real-time connection restored', 'success');
        }
    }

    /**
     * Get subscription statistics
     * 
     * @returns {Object} Statistics about subscriptions
     */
    getStats() {
        return {
            activeSubscriptions: this.subscriptions.size,
            tables: this.getActiveSubscriptions(),
            isOnline: this.isOnline,
            reconnectAttempts: Object.fromEntries(this.reconnectAttempts)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeService;
}
