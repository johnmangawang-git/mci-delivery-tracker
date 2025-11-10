/**
 * Logger Class
 * 
 * Provides centralized logging functionality with multiple log levels
 * and optional integration with external monitoring services.
 * 
 * Features:
 * - Multiple log levels (info, warn, error)
 * - Timestamp tracking
 * - Structured data logging
 * - Integration with monitoring services
 * - Console output with appropriate styling
 */

class Logger {
    /**
     * Log levels enum
     */
    static LogLevels = {
        INFO: 'info',
        WARN: 'warn',
        ERROR: 'error'
    };

    /**
     * Main logging method with timestamp and data
     * @param {string} level - Log level (info, warn, error)
     * @param {string} message - Log message
     * @param {Object} data - Additional data to log
     */
    static log(level, message, data = {}) {
        // Validate log level
        if (!Object.values(this.LogLevels).includes(level)) {
            console.warn(`Invalid log level: ${level}. Defaulting to 'info'.`);
            level = this.LogLevels.INFO;
        }

        // Create structured log entry
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            data: data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Output to console with appropriate method
        this._logToConsole(level, message, data, logEntry.timestamp);

        // Send to monitoring service if available
        this._sendToMonitoringService(logEntry);

        return logEntry;
    }

    /**
     * Log info level message
     * @param {string} message - Log message
     * @param {Object} data - Additional data to log
     */
    static info(message, data = {}) {
        return this.log(this.LogLevels.INFO, message, data);
    }

    /**
     * Log warning level message
     * @param {string} message - Log message
     * @param {Object} data - Additional data to log
     */
    static warn(message, data = {}) {
        return this.log(this.LogLevels.WARN, message, data);
    }

    /**
     * Log error level message
     * @param {string} message - Log message
     * @param {Object} data - Additional data to log
     */
    static error(message, data = {}) {
        return this.log(this.LogLevels.ERROR, message, data);
    }

    /**
     * Log to browser console with formatting
     * @private
     */
    static _logToConsole(level, message, data, timestamp) {
        const formattedTime = new Date(timestamp).toLocaleTimeString();
        const prefix = `[${formattedTime}] [${level.toUpperCase()}]`;

        // Use appropriate console method based on level
        switch (level) {
            case this.LogLevels.INFO:
                console.info(prefix, message, data);
                break;
            case this.LogLevels.WARN:
                console.warn(prefix, message, data);
                break;
            case this.LogLevels.ERROR:
                console.error(prefix, message, data);
                break;
            default:
                console.log(prefix, message, data);
        }
    }

    /**
     * Send log entry to monitoring service if available
     * @private
     */
    static _sendToMonitoringService(logEntry) {
        try {
            // Check if monitoring service is available
            if (window.monitoringService && typeof window.monitoringService.log === 'function') {
                window.monitoringService.log(logEntry);
            }
            
            // Check for alternative monitoring service names
            if (window.analytics && typeof window.analytics.track === 'function') {
                window.analytics.track('Application Log', logEntry);
            }
        } catch (error) {
            // Silently fail if monitoring service is not available or throws error
            // Don't use console.error here to avoid infinite loop
            console.log('Failed to send log to monitoring service:', error.message);
        }
    }

    /**
     * Log database operation
     * @param {string} operation - Operation name (e.g., 'saveDelivery', 'getCustomers')
     * @param {string} status - Operation status ('started', 'success', 'failed')
     * @param {Object} details - Additional operation details
     */
    static logDatabaseOperation(operation, status, details = {}) {
        const message = `Database operation: ${operation} - ${status}`;
        const data = {
            operation,
            status,
            ...details
        };

        if (status === 'failed') {
            this.error(message, data);
        } else {
            this.info(message, data);
        }
    }

    /**
     * Log user action
     * @param {string} action - Action name (e.g., 'button_click', 'form_submit')
     * @param {Object} details - Additional action details
     */
    static logUserAction(action, details = {}) {
        this.info(`User action: ${action}`, {
            action,
            ...details
        });
    }

    /**
     * Log performance metric
     * @param {string} metric - Metric name (e.g., 'page_load', 'api_response_time')
     * @param {number} value - Metric value
     * @param {string} unit - Unit of measurement (e.g., 'ms', 'seconds')
     */
    static logPerformance(metric, value, unit = 'ms') {
        this.info(`Performance: ${metric}`, {
            metric,
            value,
            unit
        });
    }

    /**
     * Log network error
     * @param {string} endpoint - API endpoint or resource
     * @param {Error} error - Error object
     * @param {Object} details - Additional error details
     */
    static logNetworkError(endpoint, error, details = {}) {
        this.error(`Network error: ${endpoint}`, {
            endpoint,
            errorMessage: error.message,
            errorStack: error.stack,
            ...details
        });
    }

    /**
     * Create a performance timer
     * @param {string} label - Timer label
     * @returns {Object} Timer object with stop method
     */
    static startTimer(label) {
        const startTime = performance.now();
        
        return {
            stop: () => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                this.logPerformance(label, duration.toFixed(2), 'ms');
                return duration;
            }
        };
    }

    /**
     * Enable or disable logging
     * @param {boolean} enabled - Whether logging is enabled
     */
    static setEnabled(enabled) {
        this._enabled = enabled;
    }

    /**
     * Check if logging is enabled
     * @returns {boolean}
     */
    static isEnabled() {
        return this._enabled !== false; // Default to true
    }
}

// Initialize enabled state
Logger._enabled = true;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}
