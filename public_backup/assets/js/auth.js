// Authentication functionality
// Using Supabase UMD bundle from CDN

// Global variables
let supabase;

// Function to initialize Supabase
function initSupabase() {
    // Check if Supabase is already available globally
    if (supabase) {
        return supabase;
    }
    
    // Check if Supabase is available globally (from CDN)
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient !== 'undefined') {
        // Initialize Supabase client
        const supabaseUrl = 'https://your-supabase-url.supabase.co';
        const supabaseKey = 'your-anon-key';
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('Supabase client initialized successfully');
        return supabase;
    }
    
    console.warn('Supabase library not found. Authentication will not work.');
    return null;
}

// Initialize Supabase when script loads
document.addEventListener('DOMContentLoaded', function() {
    initSupabase();
});

// Login function
async function login(email, password) {
    if (!supabase) {
        const initialized = initSupabase();
        if (!initialized) {
            throw new Error('Supabase client not initialized');
        }
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) throw profileError;

        // Store user in localStorage
        const user = {
            id: data.user.id,
            email: data.user.email,
            name: profile.full_name,
            role: profile.role,
            avatar_url: profile.avatar_url
        };

        localStorage.setItem('mci-user', JSON.stringify(user));

        return user;
    } catch (error) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Failed to login');
    }
}

// Logout function
function logout() {
    if (!supabase) {
        initSupabase();
    }
    
    if (supabase) {
        supabase.auth.signOut().then(() => {
            localStorage.removeItem('mci-user');
            window.location.href = '/login.html';
        });
    } else {
        // Fallback if Supabase is not available
        localStorage.removeItem('mci-user');
        window.location.href = '/login.html';
    }
}

// Check if user is authenticated
function checkAuth() {
    const user = localStorage.getItem('mci-user');
    return !!user;
}

// Initialize auth on page load
function initAuth() {
    const user = localStorage.getItem('mci-user');
    if (user) {
        const userData = JSON.parse(user);
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        const userAvatarEl = document.getElementById('userAvatar');
        const profileNameEl = document.getElementById('profileName');
        const profileRoleEl = document.getElementById('profileRole');
        const firstNameEl = document.getElementById('firstName');
        const lastNameEl = document.getElementById('lastName');
        const emailEl = document.getElementById('email');
        
        if (userNameEl) userNameEl.textContent = userData.name;
        if (userRoleEl) userRoleEl.textContent = userData.role;
        if (userAvatarEl) userAvatarEl.textContent = userData.name.charAt(0) + (userData.name.split(' ')[1] ? userData.name.split(' ')[1].charAt(0) : '');
        if (profileNameEl) profileNameEl.textContent = userData.name;
        if (profileRoleEl) profileRoleEl.textContent = userData.role;
        if (firstNameEl) firstNameEl.value = userData.name.split(' ')[0];
        if (lastNameEl) lastNameEl.value = userData.name.split(' ')[1] || '';
        if (emailEl) emailEl.value = userData.email;
    } else {
        // Redirect to login page
        // window.location.href = '/login.html';
    }
}

// Handle auth state changes
function handleAuthStateChange() {
    if (supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                localStorage.removeItem('mci-user');
                window.location.href = '/login.html';
            }
        });
    }
}

// Initialize auth state change listener
document.addEventListener('DOMContentLoaded', function() {
    handleAuthStateChange();
});

// Make functions globally accessible
window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
window.initAuth = initAuth;
window.initSupabase = initSupabase;