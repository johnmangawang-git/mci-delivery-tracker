// Authentication functionality
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Initialize Supabase client
const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Login function
export async function login(email, password) {
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
export function logout() {
    supabase.auth.signOut().then(() => {
        localStorage.removeItem('mci-user');
        window.location.href = '/login.html';
    });
}

// Check if user is authenticated
export function checkAuth() {
    const user = localStorage.getItem('mci-user');
    return !!user;
}

// Initialize auth on page load
export function initAuth() {
    const user = localStorage.getItem('mci-user');
    if (user) {
        const userData = JSON.parse(user);
        document.getElementById('userName').textContent = userData.name;
        document.getElementById('userRole').textContent = userData.role;
        document.getElementById('userAvatar').textContent = userData.name.charAt(0) + (userData.name.split(' ')[1] ? userData.name.split(' ')[1].charAt(0) : '');
        document.getElementById('profileName').textContent = userData.name;
        document.getElementById('profileRole').textContent = userData.role;
        document.getElementById('firstName').value = userData.name.split(' ')[0];
        document.getElementById('lastName').value = userData.name.split(' ')[1] || '';
        document.getElementById('email').value = userData.email;
    } else {
        // Redirect to login page
        window.location.href = '/login.html';
    }
}

// Handle auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        localStorage.removeItem('mci-user');
        window.location.href = '/login.html';
    }
});