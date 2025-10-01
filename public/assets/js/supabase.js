// Supabase client configuration
// This file handles the initialization and configuration of the Supabase client

// Global Supabase client instance
let supabaseClient = null;

// Initialize Supabase client
function initSupabase() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
        console.warn('Supabase client can only be initialized in browser environment');
        return null;
    }

    // Check if Supabase is already initialized
    if (supabaseClient) {
        return supabaseClient;
    }

    // Get Supabase URL and key from environment variables or use defaults for development
    const supabaseUrl = window.SUPABASE_URL || 'YOUR_SUPABASE_URL';
    const supabaseKey = window.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

    // Validate configuration
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('Supabase URL or Key not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
        return null;
    }

    // Initialize Supabase client
    try {
        // Check if Supabase is available globally (from CDN)
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient !== 'undefined') {
            supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
            console.log('Supabase client initialized successfully');
            return supabaseClient;
        } else {
            console.error('Supabase library not found. Please include the Supabase CDN script.');
            return null;
        }
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        return null;
    }
}

// Get the Supabase client instance
function getSupabaseClient() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

// Check if user is authenticated
async function isAuthenticated() {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    } catch (error) {
        console.error('Error checking authentication status:', error);
        return false;
    }
}

// Get current user
async function getCurrentUser() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (!session) return null;

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            console.warn('Profile not found, using basic user data');
            return {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || session.user.email,
                role: 'user'
            };
        }

        return {
            id: session.user.id,
            email: session.user.email,
            name: profile.full_name || session.user.user_metadata?.full_name || session.user.email,
            role: profile.role || 'user',
            avatar_url: profile.avatar_url
        };
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Login function
async function login(email, password) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Get user profile
        const user = await getCurrentUser();

        // Store user in localStorage for backward compatibility
        if (user) {
            localStorage.setItem('mci-user', JSON.stringify(user));
        }

        return user;
    } catch (error) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Failed to login');
    }
}

// Signup function
async function signup(email, password, fullName) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Signup error:', error);
        throw new Error(error.message || 'Failed to signup');
    }
}

// Logout function
async function logout() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        // Fallback if Supabase is not available
        localStorage.removeItem('mci-user');
        return;
    }

    try {
        await supabase.auth.signOut();
        localStorage.removeItem('mci-user');
    } catch (error) {
        console.error('Logout error:', error);
        // Still remove local storage as fallback
        localStorage.removeItem('mci-user');
        throw error;
    }
}

// Handle auth state changes
function onAuthStateChange(callback) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });

    return subscription;
}

// Initialize Supabase when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initSupabase();
});

// Make functions globally accessible
window.initSupabase = initSupabase;
window.getSupabaseClient = getSupabaseClient;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.login = login;
window.signup = signup;
window.logout = logout;
window.onAuthStateChange = onAuthStateChange;

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initSupabase,
        getSupabaseClient,
        isAuthenticated,
        getCurrentUser,
        login,
        signup,
        logout,
        onAuthStateChange
    };
}