/**
 * Logger Integration Examples
 * 
 * This file demonstrates how to integrate the Logger class
 * with existing services in the application.
 */

// ============================================================================
// Example 1: Integration with DataService
// ============================================================================

class DataService {
    async saveDelivery(delivery) {
        // Log operation start
        Logger.logDatabaseOperation('saveDelivery', 'started', { 
            drNumber: delivery.dr_number 
        });

        const timer = Logger.startTimer('saveDelivery');

        try {
            // Validate data
            const validation = DataValidator.validateDelivery(delivery);
            if (!validation.isValid) {
                Logger.warn('Delivery validation failed', {
                    drNumber: delivery.dr_number,
                    errors: validation.errors
                });
                throw new Error(validation.errors.join(', '));
            }

            // Perform database operation
            const { data, error } = await this.client
                .from('deliveries')
                .insert(delivery)
                .select()
                .single();

            if (error) throw error;

            // Log success
            const duration = timer.stop();
            Logger.logDatabaseOperation('saveDelivery', 'success', {
                drNumber: delivery.dr_number,
                duration: duration
            });

            return data;

        } catch (error) {
            // Log failure
            timer.stop();
            Logger.logDatabaseOperation('saveDelivery', 'failed', {
                drNumber: delivery.dr_number,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async getDeliveries(filters = {}) {
        Logger.info('Fetching deliveries', { filters });
        const timer = Logger.startTimer('getDeliveries');

        try {
            let query = this.client.from('deliveries').select('*');

            if (filters.status) {
                query = query.in('status', filters.status);
            }

            const { data, error } = await query;
            if (error) throw error;

            const duration = timer.stop();
            Logger.info('Deliveries fetched successfully', {
                count: data.length,
                duration: duration,
                filters: filters
            });

            return data;

        } catch (error) {
            timer.stop();
            Logger.error('Failed to fetch deliveries', {
                filters: filters,
                error: error.message
            });
            throw error;
        }
    }
}

// ============================================================================
// Example 2: Integration with ErrorHandler
// ============================================================================

class ErrorHandler {
    static handle(error, context) {
        // Log the error with full context
        Logger.error(`Error in ${context}`, {
            context: context,
            errorMessage: error.message,
            errorCode: error.code,
            errorStack: error.stack,
            timestamp: new Date().toISOString()
        });

        // Categorize and handle error
        if (error.message?.includes('network')) {
            return this.handleNetworkError(error);
        } else if (error.code === '23505') {
            return this.handleDuplicateError(error);
        } else {
            return this.handleGenericError(error);
        }
    }

    static handleNetworkError(error) {
        Logger.logNetworkError('Database connection', error, {
            type: 'network',
            recoverable: true
        });
        showToast('Network connection lost. Please check your internet connection.', 'danger');
        return { type: 'network', recoverable: true };
    }
}

// ============================================================================
// Example 3: Integration with RealtimeService
// ============================================================================

class RealtimeService {
    subscribeToTable(table, callback) {
        Logger.info('Subscribing to table changes', { table });

        try {
            const subscription = this.dataService.client
                .channel(`public:${table}`)
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: table },
                    (payload) => {
                        Logger.info('Real-time update received', {
                            table: table,
                            event: payload.eventType,
                            recordId: payload.new?.id || payload.old?.id
                        });
                        callback(payload);
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        Logger.info('Successfully subscribed to table', { table });
                    } else if (status === 'CHANNEL_ERROR') {
                        Logger.error('Subscription error', { table, status });
                    }
                });

            this.subscriptions.set(table, subscription);

        } catch (error) {
            Logger.error('Failed to subscribe to table', {
                table: table,
                error: error.message
            });
            throw error;
        }
    }

    cleanup() {
        Logger.info('Cleaning up real-time subscriptions', {
            count: this.subscriptions.size
        });

        this.subscriptions.forEach((sub, table) => {
            Logger.info('Unsubscribing from table', { table });
            sub.unsubscribe();
        });

        this.subscriptions.clear();
        Logger.info('All subscriptions cleaned up');
    }
}

// ============================================================================
// Example 4: Integration with App.js User Actions
// ============================================================================

async function saveDelivery(delivery) {
    // Log user action
    Logger.logUserAction('save_delivery', {
        drNumber: delivery.dr_number,
        customerName: delivery.customer_name,
        page: 'deliveries'
    });

    try {
        await dataService.saveDelivery(delivery);
        
        Logger.info('Delivery saved successfully', {
            drNumber: delivery.dr_number
        });
        
        showToast('Delivery saved successfully');
        await loadActiveDeliveries();

    } catch (error) {
        Logger.error('Failed to save delivery', {
            drNumber: delivery.dr_number,
            error: error.message
        });
        
        ErrorHandler.handle(error, 'saveDelivery');
    }
}

function handleFormSubmit(formId) {
    Logger.logUserAction('form_submit', {
        formId: formId,
        timestamp: Date.now()
    });

    // Form handling logic...
}

// ============================================================================
// Example 5: Integration with CacheService
// ============================================================================

class CacheService {
    set(key, value) {
        Logger.info('Setting cache entry', {
            key: key,
            valueType: typeof value,
            size: JSON.stringify(value).length
        });

        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            Logger.info('Cache miss', { key });
            return null;
        }

        // Check if expired
        if (Date.now() - item.timestamp > this.ttl) {
            Logger.info('Cache entry expired', {
                key: key,
                age: Date.now() - item.timestamp,
                ttl: this.ttl
            });
            this.cache.delete(key);
            return null;
        }

        Logger.info('Cache hit', { key });
        return item.value;
    }

    clear() {
        const size = this.cache.size;
        Logger.info('Clearing cache', { entriesCleared: size });
        this.cache.clear();
    }
}

// ============================================================================
// Example 6: Application Initialization Logging
// ============================================================================

async function initializeApp() {
    Logger.info('Application initialization started', {
        version: '1.0.0',
        environment: window.location.hostname
    });

    const timer = Logger.startTimer('app_initialization');

    try {
        // Initialize services
        Logger.info('Initializing DataService');
        await dataService.initialize();

        Logger.info('Initializing RealtimeService');
        realtimeService = new RealtimeService(dataService);

        Logger.info('Loading initial data');
        await loadActiveDeliveries();
        await loadCustomers();

        const duration = timer.stop();
        Logger.info('Application initialized successfully', {
            duration: duration
        });

    } catch (error) {
        timer.stop();
        Logger.error('Application initialization failed', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// ============================================================================
// Example 7: Performance Monitoring
// ============================================================================

async function loadDeliveriesWithPagination(page = 1, pageSize = 50) {
    const timer = Logger.startTimer(`loadDeliveries_page_${page}`);

    try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await dataService.client
            .from('deliveries')
            .select('*', { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const duration = timer.stop();

        // Log performance metrics
        Logger.logPerformance('pagination_load', duration, 'ms');
        Logger.info('Page loaded', {
            page: page,
            pageSize: pageSize,
            recordsLoaded: data.length,
            totalRecords: count,
            duration: duration
        });

        return { data, totalCount: count, currentPage: page };

    } catch (error) {
        timer.stop();
        Logger.error('Failed to load page', {
            page: page,
            error: error.message
        });
        throw error;
    }
}

// ============================================================================
// Example 8: Network Status Monitoring
// ============================================================================

window.addEventListener('online', () => {
    Logger.info('Network connection restored', {
        timestamp: new Date().toISOString()
    });
    showToast('Connection restored', 'success');
});

window.addEventListener('offline', () => {
    Logger.warn('Network connection lost', {
        timestamp: new Date().toISOString()
    });
    showToast('You are offline', 'warning');
});

// ============================================================================
// Example 9: Setting up Monitoring Service Integration
// ============================================================================

// Example: Integrate with a monitoring service like Sentry, LogRocket, etc.
window.monitoringService = {
    log: function(logEntry) {
        // Send to external monitoring service
        if (logEntry.level === 'error') {
            // Send errors to error tracking service
            console.log('Sending error to monitoring service:', logEntry);
            // Sentry.captureException(new Error(logEntry.message), { extra: logEntry.data });
        }
        
        // Send all logs to analytics
        // analytics.track('Application Log', logEntry);
    }
};

// ============================================================================
// Example 10: Production vs Development Logging
// ============================================================================

// In production, you might want to reduce logging
if (window.location.hostname === 'production-domain.com') {
    // Only log warnings and errors in production
    const originalInfo = Logger.info;
    Logger.info = function(message, data) {
        // Silently skip info logs in production
        // Or send only to monitoring service without console output
        if (window.monitoringService) {
            window.monitoringService.log({
                timestamp: new Date().toISOString(),
                level: 'info',
                message: message,
                data: data
            });
        }
    };
}

console.log('Logger integration examples loaded');
console.log('Use these patterns to integrate Logger throughout the application');
