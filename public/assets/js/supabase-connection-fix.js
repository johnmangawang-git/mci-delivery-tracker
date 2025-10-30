/**
 * SUPABASE CONNECTION FIX
 * Prevents Supabase connection timeouts that cause slow modal loading
 */

console.log('🔧 SUPABASE CONNECTION FIX: Loading...');

// Disable Supabase auto-connection to prevent blocking
window.DISABLE_SUPABASE_AUTO_CONNECT = true;

// Override Supabase initialization to prevent blocking
if (typeof window.supabase !== 'undefined') {
    console.log('⚠️ Supabase already loaded, applying connection fix...');
    
    // Wrap Supabase calls to prevent blocking
    const originalSupabase = window.supabase;
    window.supabase = new Proxy(originalSupabase, {
        get(target, prop) {
            if (typeof target[prop] === 'function') {
                return function(...args) {
                    try {
                        const result = target[prop].apply(target, args);
                        // If it's a promise, add timeout
                        if (result && typeof result.then === 'function') {
                            return Promise.race([
                                result,
                                new Promise((_, reject) => 
                                    setTimeout(() => reject(new Error('Supabase timeout')), 5000)
                                )
                            ]);
                        }
                        return result;
                    } catch (error) {
                        console.warn('Supabase operation failed:', error);
                        return Promise.resolve(null);
                    }
                };
            }
            return target[prop];
        }
    });
}

// Prevent Supabase from blocking page load
window.addEventListener('DOMContentLoaded', function() {
    // Delay Supabase initialization
    setTimeout(() => {
        if (typeof window.initSupabase === 'function') {
            try {
                window.initSupabase();
            } catch (error) {
                console.warn('Supabase initialization failed:', error);
            }
        }
    }, 2000);
});

console.log('✅ SUPABASE CONNECTION FIX: Loaded');