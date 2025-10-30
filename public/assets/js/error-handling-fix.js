/**
 * ERROR HANDLING FIX
 * Comprehensive error handling to prevent JavaScript crashes
 */

console.log('🛡️ Loading Error Handling Fix...');

(function() {
    'use strict';
    
    /**
     * Global error handler
     */
    function setupGlobalErrorHandling() {
        // Handle uncaught errors
        window.addEventListener('error', function(event) {
            console.error('🚨 Global Error:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
            
            // Don't let errors break the app
            event.preventDefault();
            return true;
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', function(event) {
            console.error('🚨 Unhandled Promise Rejection:', event.reason);
            
            // Don't let promise rejections break the app
            event.preventDefault();
        });
        
        console.log('✅ Global error handling setup');
    }
    
    /**
     * Safe MutationObserver wrapper
     */
    function createSafeMutationObserver(callback, options = {}) {
        try {
            const observer = new MutationObserver(callback);
            
            return {
                observe: function(target, config) {
                    try {
                        if (target && typeof target.nodeType !== 'undefined') {
                            observer.observe(target, config);
                            return true;
                        } else {
                            console.warn('⚠️ Invalid target for MutationObserver:', target);
                            return false;
                        }
                    } catch (error) {
                        console.error('❌ Error setting up MutationObserver:', error);
                        return false;
                    }
                },
                disconnect: function() {
                    try {
                        observer.disconnect();
                    } catch (error) {
                        console.error('❌ Error disconnecting MutationObserver:', error);
                    }
                }
            };
        } catch (error) {
            console.error('❌ Error creating MutationObserver:', error);
            return {
                observe: () => false,
                disconnect: () => {}
            };
        }
    }
    
    /**
     * Safe DOM ready checker
     */
    function whenDOMReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }
    
    /**
     * Safe element selector
     */
    function safeQuerySelector(selector) {
        try {
            return document.querySelector(selector);
        } catch (error) {
            console.error('❌ Error selecting element:', selector, error);
            return null;
        }
    }
    
    /**
     * Safe element selector all
     */
    function safeQuerySelectorAll(selector) {
        try {
            return document.querySelectorAll(selector);
        } catch (error) {
            console.error('❌ Error selecting elements:', selector, error);
            return [];
        }
    }
    
    /**
     * Safe function caller
     */
    function safeCall(fn, ...args) {
        try {
            if (typeof fn === 'function') {
                return fn.apply(this, args);
            } else {
                console.warn('⚠️ Attempted to call non-function:', fn);
                return null;
            }
        } catch (error) {
            console.error('❌ Error calling function:', error);
            return null;
        }
    }
    
    /**
     * Safe async function caller
     */
    async function safeCallAsync(fn, ...args) {
        try {
            if (typeof fn === 'function') {
                return await fn.apply(this, args);
            } else {
                console.warn('⚠️ Attempted to call non-function:', fn);
                return null;
            }
        } catch (error) {
            console.error('❌ Error calling async function:', error);
            return null;
        }
    }
    
    /**
     * Safe JSON parser
     */
    function safeJSONParse(jsonString, defaultValue = null) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('❌ Error parsing JSON:', error);
            return defaultValue;
        }
    }
    
    /**
     * Safe localStorage getter
     */
    function safeLocalStorageGet(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (error) {
            console.error('❌ Error getting localStorage:', key, error);
            return defaultValue;
        }
    }
    
    /**
     * Safe localStorage setter
     */
    function safeLocalStorageSet(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error('❌ Error setting localStorage:', key, error);
            return false;
        }
    }
    
    /**
     * Initialize error handling
     */
    function initErrorHandling() {
        console.log('🚀 Initializing Error Handling Fix...');
        
        // Setup global error handling
        setupGlobalErrorHandling();
        
        // Make safe functions available globally
        window.safeUtils = {
            createSafeMutationObserver,
            whenDOMReady,
            safeQuerySelector,
            safeQuerySelectorAll,
            safeCall,
            safeCallAsync,
            safeJSONParse,
            safeLocalStorageGet,
            safeLocalStorageSet
        };
        
        console.log('✅ Error Handling Fix initialized');
        console.log('🛡️ Safe utilities available at window.safeUtils');
    }
    
    // Initialize immediately
    initErrorHandling();
    
    console.log('✅ Error Handling Fix loaded');
    
})();