/**
 * Simple Logout Functionality
 * Clean implementation to ensure logout works properly
 */

// Simple logout function
function performLogout() {
    console.log('🔴 LOGOUT: Starting logout process...');
    
    try {
        // Clear all localStorage data
        console.log('🔴 LOGOUT: Clearing localStorage...');
        localStorage.removeItem('mci-user');
        localStorage.removeItem('mci-activeDeliveries');
        localStorage.removeItem('mci-deliveryHistory');
        localStorage.removeItem('mci-customers');
        localStorage.removeItem('ePodRecords');
        localStorage.removeItem('mci-user-profile');
        
        // Clear sessionStorage
        console.log('🔴 LOGOUT: Clearing sessionStorage...');
        sessionStorage.clear();
        
        // Try Supabase logout if available
        if (window.supabase && window.supabase.auth && typeof window.supabase.auth.signOut === 'function') {
            console.log('🔴 LOGOUT: Signing out from Supabase...');
            window.supabase.auth.signOut().then(() => {
                console.log('🔴 LOGOUT: Supabase signout complete');
                redirectToLogin();
            }).catch((error) => {
                console.error('🔴 LOGOUT: Supabase signout error:', error);
                redirectToLogin(); // Still redirect even if Supabase fails
            });
        } else {
            console.log('🔴 LOGOUT: No Supabase available, proceeding with redirect...');
            redirectToLogin();
        }
        
    } catch (error) {
        console.error('🔴 LOGOUT: Error during logout:', error);
        redirectToLogin(); // Still redirect even if there's an error
    }
}

// Redirect to login page
function redirectToLogin() {
    console.log('🔴 LOGOUT: Redirecting to login page...');
    window.location.href = '/login.html';
}

// Setup logout button event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔴 LOGOUT: Setting up logout functionality...');
    
    // Setup Settings logout button
    setupSettingsLogoutButton();
    
    // Setup user dropdown logout
    setupUserDropdownLogout();
    
    // Setup global event delegation as backup
    setupGlobalLogoutDelegation();
    
    console.log('🔴 LOGOUT: All logout event listeners setup complete');
});

// Setup Settings page logout button
function setupSettingsLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        console.log('🔴 LOGOUT: Found Settings logout button, attaching listener');
        
        logoutBtn.addEventListener('click', function(e) {
            console.log('🔴 LOGOUT: Settings logout button clicked!');
            e.preventDefault();
            e.stopPropagation();
            performLogout();
        });
        
        // Also add a backup using onclick
        logoutBtn.onclick = function(e) {
            console.log('🔴 LOGOUT: Settings logout button clicked (onclick backup)!');
            e.preventDefault();
            performLogout();
        };
        
    } else {
        console.log('🔴 LOGOUT: Settings logout button not found, will retry...');
        // Retry after a delay
        setTimeout(setupSettingsLogoutButton, 1000);
    }
}

// Setup user dropdown logout functionality
function setupUserDropdownLogout() {
    const userRole = document.getElementById('userRole');
    const userDropdown = document.getElementById('userDropdown');
    const logoutOption = document.getElementById('logoutOption');
    
    if (userRole && userDropdown && logoutOption) {
        console.log('🔴 LOGOUT: Found user dropdown elements, setting up...');
        
        // Show dropdown when clicking on user role
        userRole.addEventListener('click', function(e) {
            console.log('🔴 LOGOUT: User role clicked, toggling dropdown');
            e.stopPropagation();
            const isVisible = userDropdown.style.display === 'block';
            userDropdown.style.display = isVisible ? 'none' : 'block';
        });
        
        // Handle logout option click
        logoutOption.addEventListener('click', function(e) {
            console.log('🔴 LOGOUT: Dropdown logout option clicked!');
            e.preventDefault();
            e.stopPropagation();
            userDropdown.style.display = 'none';
            performLogout();
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userRole.contains(e.target)) {
                userDropdown.style.display = 'none';
            }
        });
        
    } else {
        console.log('🔴 LOGOUT: User dropdown elements not found, will retry...');
        setTimeout(setupUserDropdownLogout, 1000);
    }
}

// Global event delegation as backup
function setupGlobalLogoutDelegation() {
    document.addEventListener('click', function(e) {
        // Check for logout button clicks
        if (e.target && (e.target.id === 'logoutBtn' || e.target.id === 'logoutOption')) {
            console.log('🔴 LOGOUT: Logout clicked via global delegation!');
            e.preventDefault();
            e.stopPropagation();
            performLogout();
        }
    });
}

// Make logout function globally available
window.performLogout = performLogout;
window.logout = performLogout; // Alias for compatibility

console.log('🔴 LOGOUT: logout.js loaded successfully');