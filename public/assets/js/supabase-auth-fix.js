/**
 * SUPABASE AUTHENTICATION FIX
 * Clears invalid refresh tokens and handles auth errors gracefully
 */

console.log('🔧 Loading Supabase Auth Fix...');

(function() {
    'use strict';
    
    /**
     * Clear invalid Supabase tokens
     */
    function clearSupabaseTokens() {
        try {
            // Clear all Supabase-related localStorage items
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes('supabase')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log('🗑️ Cleared invalid token:', key);
            });
            
            // Also clear sessionStorage
            const sessionKeysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.includes('supabase')) {
                    sessionKeysToRemove.push(key);
                }
            }
            
            sessionKeysToRemove.forEach(key => {
                sessionStorage.removeItem(key);
                console.log('🗑️ Cleared invalid session token:', key);
            });
            
            console.log('✅ Supabase tokens cleared');
            
        } catch (error) {
            console.error('❌ Error clearing Supabase tokens:', error);
        }
    }
    
    /**
     * Handle Supabase auth errors gracefully
     */
    function handleSupabaseAuthError(error) {
        if (error && error.message && error.message.includes('Invalid Refresh Token')) {
            console.warn('⚠️ Invalid refresh token detected, clearing tokens...');
            clearSupabaseTokens();
            
            // Reload the page to start fresh
            setTimeout(() => {
                console.log('🔄 Reloading page with clean auth state...');
                window.location.reload();
            }, 1000);
            
            return true; // Error handled
        }
        return false; // Error not handled
    }
    
    /**
     * Override console.error to catch Supabase auth errors
     */
    const originalConsoleError = console.error;
    console.error = function(...args) {
        const errorMessage = args.join(' ');
        
        if (errorMessage.includes('Invalid Refresh Token') || 
            errorMessage.includes('AuthApiError')) {
            console.warn('🔧 Supabase auth error intercepted:', errorMessage);
            clearSupabaseTokens();
            return;
        }
        
        // Call original console.error for other errors
        originalConsoleError.apply(console, args);
    };
    
    /**
     * Override window.onerror to catch auth errors
     */
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
        if (message && (message.includes('Invalid Refresh Token') || 
                       message.includes('AuthApiError'))) {
            console.warn('🔧 Global auth error intercepted:', message);
            handleSupabaseAuthError(error);
            return true; // Prevent default error handling
        }
        
        // Call original error handler
        if (originalOnError) {
            return originalOnError.call(this, message, source, lineno, colno, error);
        }
        return false;
    };
    
    /**
     * Override Promise rejection handler
     */
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.message && 
            (event.reason.message.includes('Invalid Refresh Token') ||
             event.reason.message.includes('AuthApiError'))) {
            console.warn('🔧 Promise rejection auth error intercepted:', event.reason.message);
            handleSupabaseAuthError(event.reason);
            event.preventDefault(); // Prevent unhandled rejection
        }
    });
    
    /**
     * Initialize auth fix
     */
    function initAuthFix() {
        console.log('🚀 Initializing Supabase Auth Fix...');
        
        // Check for existing invalid tokens on page load
        try {
            const hasSupabaseTokens = Object.keys(localStorage).some(key => key.includes('supabase'));
            if (hasSupabaseTokens) {
                console.log('🔍 Found existing Supabase tokens, validating...');
                
                // Try to access Supabase to test token validity
                if (typeof window.supabase !== 'undefined' && window.supabase.auth) {
                    window.supabase.auth.getSession().catch(error => {
                        if (handleSupabaseAuthError(error)) {
                            console.log('🔧 Invalid tokens detected and cleared');
                        }
                    });
                }
            }
        } catch (error) {
            console.warn('⚠️ Error during auth validation:', error);
        }
        
        console.log('✅ Supabase Auth Fix initialized');
    }
    
    // Export functions globally
    window.clearSupabaseTokens = clearSupabaseTokens;
    window.handleSupabaseAuthError = handleSupabaseAuthError;
    
    // Initialize based on document state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthFix);
    } else {
        initAuthFix();
    }
    
    console.log('✅ Supabase Auth Fix loaded successfully');
    
})();

// Export module info
window.supabaseAuthFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};