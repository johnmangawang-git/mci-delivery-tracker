/**
 * ErrorHandler - Centralized error management for the application
 * 
 * Provides consistent error handling, categorization, and user feedback
 * across all database operations and application workflows.
 * 
 * Requirements: 3.3, 6.5
 */

class ErrorHandler {
    /**
     * Main error handling method that categorizes and processes errors
     * @param {Error} error - The error object to handle
     * @param {string} context - Context where the error occurred (e.g., 'saveDelivery', 'loadCustomers')
     * @returns {Object} Error metadata including type and recoverability
     */
    static handle(error, context) {
        console.error(`Error in ${context}:`, error);
        
        // Categorize error based on type and characteristics
        if (this.isNetworkError(error)) {
            return this.handleNetworkError(error);
        } else if (this.isDuplicateError(error)) {
            return this.handleDuplicateError(error);
        } else if (this.isValidationError(error)) {
            return this.handleValidationError(error);
        } else {
            return this.handleGenericError(error);
        }
    }

    /**
     * Check if error is network-related
     * @param {Error} error - The error to check
     * @returns {boolean}
     */
    static isNetworkError(error) {
        const networkIndicators = [
            'network',
            'fetch',
            'timeout',
            'connection',
            'offline',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'NetworkError'
        ];
        
        const errorMessage = error.message?.toLowerCase() || '';
        const errorName = error.name?.toLowerCase() || '';
        
        return networkIndicators.some(indicator => 
            errorMessage.includes(indicator.toLowerCase()) || 
            errorName.includes(indicator.toLowerCase())
        ) || !navigator.onLine;
    }

    /**
     * Check if error is a duplicate/constraint violation
     * @param {Error} error - The error to check
     * @returns {boolean}
     */
    static isDuplicateError(error) {
        // PostgreSQL duplicate key error code
        if (error.code === '23505') return true;
        
        // Supabase duplicate error patterns
        const duplicateIndicators = [
            'duplicate',
            'already exists',
            'unique constraint',
            'violates unique',
            'duplicate key value'
        ];
        
        const errorMessage = error.message?.toLowerCase() || '';
        const errorDetails = error.details?.toLowerCase() || '';
        
        return duplicateIndicators.some(indicator =>
            errorMessage.includes(indicator) || 
            errorDetails.includes(indicator)
        );
    }

    /**
     * Check if error is validation-related
     * @param {Error} error - The error to check
     * @returns {boolean}
     */
    static isValidationError(error) {
        const validationIndicators = [
            'validation',
            'invalid',
            'required',
            'missing',
            'must be',
            'should be',
            'cannot be empty'
        ];
        
        const errorMessage = error.message?.toLowerCase() || '';
        
        return validationIndicators.some(indicator =>
            errorMessage.includes(indicator)
        ) || error.name === 'ValidationError';
    }

    /**
     * Handle network-related errors
     * @param {Error} error - The network error
     * @returns {Object} Error metadata
     */
    static handleNetworkError(error) {
        const message = 'Network connection lost. Please check your internet connection and try again.';
        
        // Show user-friendly error message
        if (typeof showToast === 'function') {
            showToast(message, 'danger');
        } else {
            console.warn('showToast function not available');
            alert(message);
        }
        
        return {
            type: 'network',
            recoverable: true,
            message: message,
            originalError: error
        };
    }

    /**
     * Handle duplicate record errors
     * @param {Error} error - The duplicate error
     * @returns {Object} Error metadata
     */
    static handleDuplicateError(error) {
        // Extract field name from error message if available
        let fieldName = 'record';
        const match = error.message?.match(/Key \(([^)]+)\)/);
        if (match) {
            fieldName = match[1];
        }
        
        const message = `This ${fieldName} already exists in the database. Please use a different value.`;
        
        // Show user-friendly error message
        if (typeof showToast === 'function') {
            showToast(message, 'warning');
        } else {
            console.warn('showToast function not available');
            alert(message);
        }
        
        return {
            type: 'duplicate',
            recoverable: true,
            message: message,
            field: fieldName,
            originalError: error
        };
    }

    /**
     * Handle validation errors
     * @param {Error} error - The validation error
     * @returns {Object} Error metadata
     */
    static handleValidationError(error) {
        const message = `Validation error: ${error.message}`;
        
        // Show user-friendly error message
        if (typeof showToast === 'function') {
            showToast(message, 'warning');
        } else {
            console.warn('showToast function not available');
            alert(message);
        }
        
        return {
            type: 'validation',
            recoverable: true,
            message: message,
            originalError: error
        };
    }

    /**
     * Handle generic/unexpected errors
     * @param {Error} error - The generic error
     * @returns {Object} Error metadata
     */
    static handleGenericError(error) {
        const message = 'An unexpected error occurred. Please try again or contact support if the problem persists.';
        
        // Show user-friendly error message
        if (typeof showToast === 'function') {
            showToast(message, 'danger');
        } else {
            console.warn('showToast function not available');
            alert(message);
        }
        
        // Log detailed error for debugging
        console.error('Generic error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
        });
        
        return {
            type: 'generic',
            recoverable: false,
            message: message,
            originalError: error
        };
    }

    /**
     * Handle authentication errors
     * @param {Error} error - The authentication error
     * @returns {Object} Error metadata
     */
    static handleAuthError(error) {
        const message = 'Authentication failed. Please log in again.';
        
        if (typeof showToast === 'function') {
            showToast(message, 'danger');
        } else {
            console.warn('showToast function not available');
            alert(message);
        }
        
        // Optionally redirect to login page
        // window.location.href = '/login.html';
        
        return {
            type: 'authentication',
            recoverable: true,
            message: message,
            originalError: error
        };
    }

    /**
     * Handle permission/authorization errors
     * @param {Error} error - The authorization error
     * @returns {Object} Error metadata
     */
    static handleAuthorizationError(error) {
        const message = 'You do not have permission to perform this action.';
        
        if (typeof showToast === 'function') {
            showToast(message, 'warning');
        } else {
            console.warn('showToast function not available');
            alert(message);
        }
        
        return {
            type: 'authorization',
            recoverable: false,
            message: message,
            originalError: error
        };
    }

    /**
     * Log error with context for debugging and monitoring
     * @param {string} context - Context where error occurred
     * @param {Error} error - The error object
     * @param {Object} additionalData - Additional data for debugging
     */
    static logError(context, error, additionalData = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            context: context,
            error: {
                message: error.message,
                name: error.name,
                code: error.code,
                stack: error.stack
            },
            additionalData: additionalData
        };
        
        console.error('Error Log:', logEntry);
        
        // Send to monitoring service if available
        if (window.monitoringService && typeof window.monitoringService.logError === 'function') {
            window.monitoringService.logError(logEntry);
        }
        
        return logEntry;
    }
}

// Make ErrorHandler available globally
if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
