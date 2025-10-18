/**
 * USER MENU MODULE
 * Handles user dropdown menu with logout functionality
 */

console.log('🔧 Loading User Menu...');

(function() {
    'use strict';
    
    /**
     * Create user dropdown menu
     */
    function createUserDropdown() {
        console.log('🎨 Creating user dropdown menu...');
        
        // Find the user profile element
        const userProfile = document.querySelector('.user-profile');
        if (!userProfile) {
            console.warn('⚠️ User profile element not found');
            return;
        }
        
        // Make user profile clickable
        userProfile.style.cursor = 'pointer';
        userProfile.style.position = 'relative';
        
        // Create dropdown menu
        const dropdown = document.createElement('div');
        dropdown.id = 'userDropdownMenu';
        dropdown.className = 'user-dropdown-menu';
        dropdown.innerHTML = `
            <div class="dropdown-header">
                <div class="user-info">
                    <div class="user-avatar-small" id="dropdownUserAvatar">JS</div>
                    <div class="user-details">
                        <div class="user-name" id="dropdownUserName">SMEG warehouse</div>
                        <div class="user-role" id="dropdownUserRole">Logistics Manager</div>
                    </div>
                </div>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-body">
                <a href="#" class="dropdown-item" id="userProfileItem">
                    <i class="bi bi-person-circle"></i>
                    <span>Profile Settings</span>
                </a>
                <a href="#" class="dropdown-item" id="userPreferencesItem">
                    <i class="bi bi-gear"></i>
                    <span>Preferences</span>
                </a>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item logout-item" id="logoutItem">
                    <i class="bi bi-box-arrow-right"></i>
                    <span>Sign Out</span>
                </a>
            </div>
        `;
        
        // Add dropdown to user profile
        userProfile.appendChild(dropdown);
        
        console.log('✅ User dropdown menu created');
    }
    
    /**
     * Add CSS styles for dropdown
     */
    function addDropdownStyles() {
        if (document.getElementById('userMenuStyles')) {
            return; // Already added
        }
        
        const styles = document.createElement('style');
        styles.id = 'userMenuStyles';
        styles.textContent = `
            /* User Profile Hover Effect */
            .user-profile {
                transition: all 0.2s ease;
                border-radius: 8px;
                padding: 8px;
            }
            
            .user-profile:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            .user-profile.active {
                background-color: rgba(255, 255, 255, 0.15);
            }
            
            /* Dropdown Menu */
            .user-dropdown-menu {
                position: absolute;
                top: 100%;
                right: 0;
                width: 280px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                border: 1px solid rgba(0, 0, 0, 0.1);
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                margin-top: 8px;
            }
            
            .user-dropdown-menu.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            /* Dropdown Header */
            .dropdown-header {
                padding: 1rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px 12px 0 0;
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .user-avatar-small {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                border: 2px solid rgba(255, 255, 255, 0.3);
            }
            
            .user-details {
                flex: 1;
            }
            
            .user-name {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 2px;
            }
            
            .user-role {
                font-size: 12px;
                opacity: 0.9;
            }
            
            /* Dropdown Body */
            .dropdown-body {
                padding: 8px 0;
            }
            
            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                color: #333;
                text-decoration: none;
                transition: all 0.2s ease;
                font-size: 14px;
            }
            
            .dropdown-item:hover {
                background-color: #f8f9fa;
                color: #333;
                text-decoration: none;
            }
            
            .dropdown-item i {
                width: 16px;
                font-size: 16px;
                color: #6c757d;
            }
            
            .dropdown-item.logout-item {
                color: #dc3545;
            }
            
            .dropdown-item.logout-item:hover {
                background-color: #fff5f5;
                color: #dc3545;
            }
            
            .dropdown-item.logout-item i {
                color: #dc3545;
            }
            
            /* Dropdown Divider */
            .dropdown-divider {
                height: 1px;
                background-color: #e9ecef;
                margin: 8px 0;
            }
            
            /* Loading State */
            .dropdown-item.loading {
                pointer-events: none;
                opacity: 0.6;
            }
            
            .dropdown-item.loading i {
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Mobile Responsive */
            @media (max-width: 768px) {
                .user-dropdown-menu {
                    width: 260px;
                    right: -10px;
                }
            }
        `;
        
        document.head.appendChild(styles);
        console.log('✅ User menu styles added');
    }
    
    /**
     * Handle dropdown toggle
     */
    function setupDropdownToggle() {
        const userProfile = document.querySelector('.user-profile');
        const dropdown = document.getElementById('userDropdownMenu');
        
        if (!userProfile || !dropdown) {
            console.warn('⚠️ User profile or dropdown not found');
            return;
        }
        
        // Toggle dropdown on click
        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const isVisible = dropdown.classList.contains('show');
            
            if (isVisible) {
                hideDropdown();
            } else {
                showDropdown();
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userProfile.contains(e.target)) {
                hideDropdown();
            }
        });
        
        // Close dropdown on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideDropdown();
            }
        });
        
        console.log('✅ Dropdown toggle setup complete');
    }
    
    /**
     * Show dropdown menu
     */
    function showDropdown() {
        const userProfile = document.querySelector('.user-profile');
        const dropdown = document.getElementById('userDropdownMenu');
        
        if (dropdown) {
            dropdown.classList.add('show');
            userProfile.classList.add('active');
            
            // Update dropdown user info
            updateDropdownUserInfo();
        }
    }
    
    /**
     * Hide dropdown menu
     */
    function hideDropdown() {
        const userProfile = document.querySelector('.user-profile');
        const dropdown = document.getElementById('userDropdownMenu');
        
        if (dropdown) {
            dropdown.classList.remove('show');
            userProfile.classList.remove('active');
        }
    }
    
    /**
     * Update dropdown user information
     */
    function updateDropdownUserInfo() {
        const userName = document.getElementById('userName')?.textContent || 'User';
        const userRole = document.getElementById('userRole')?.textContent || 'Staff';
        const userAvatar = document.getElementById('userAvatar')?.textContent || 'U';
        
        // Update dropdown elements
        const dropdownUserName = document.getElementById('dropdownUserName');
        const dropdownUserRole = document.getElementById('dropdownUserRole');
        const dropdownUserAvatar = document.getElementById('dropdownUserAvatar');
        
        if (dropdownUserName) dropdownUserName.textContent = userName;
        if (dropdownUserRole) dropdownUserRole.textContent = userRole;
        if (dropdownUserAvatar) dropdownUserAvatar.textContent = userAvatar;
    }
    
    /**
     * Handle logout functionality
     */
    function setupLogoutHandler() {
        const logoutItem = document.getElementById('logoutItem');
        
        if (!logoutItem) {
            console.warn('⚠️ Logout item not found');
            return;
        }
        
        logoutItem.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Show loading state
            logoutItem.classList.add('loading');
            logoutItem.innerHTML = `
                <i class="bi bi-arrow-repeat"></i>
                <span>Signing Out...</span>
            `;
            
            try {
                console.log('🚪 User logout initiated...');
                
                // Call Supabase logout if available
                if (typeof window.signOut === 'function') {
                    await window.signOut();
                    console.log('✅ Supabase logout successful');
                } else if (typeof window.logout === 'function') {
                    await window.logout();
                    console.log('✅ Logout function called');
                }
                
                // Clear local storage
                localStorage.removeItem('mci-user');
                console.log('🧹 Local storage cleared');
                
                // Show success message briefly
                logoutItem.innerHTML = `
                    <i class="bi bi-check-circle"></i>
                    <span>Signed Out</span>
                `;
                
                // Redirect to login page after short delay
                setTimeout(() => {
                    console.log('🔄 Redirecting to login page...');
                    window.location.href = '/login.html';
                }, 1000);
                
            } catch (error) {
                console.error('❌ Logout error:', error);
                
                // Show error state
                logoutItem.innerHTML = `
                    <i class="bi bi-exclamation-triangle"></i>
                    <span>Error - Refreshing...</span>
                `;
                
                // Force refresh after error
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
            }
        });
        
        console.log('✅ Logout handler setup complete');
    }
    
    /**
     * Handle profile settings (placeholder)
     */
    function setupProfileHandler() {
        const profileItem = document.getElementById('userProfileItem');
        
        if (profileItem) {
            profileItem.addEventListener('click', function(e) {
                e.preventDefault();
                hideDropdown();
                
                // For now, just show an alert - can be expanded later
                alert('Profile settings coming soon!');
            });
        }
    }
    
    /**
     * Handle preferences (placeholder)
     */
    function setupPreferencesHandler() {
        const preferencesItem = document.getElementById('userPreferencesItem');
        
        if (preferencesItem) {
            preferencesItem.addEventListener('click', function(e) {
                e.preventDefault();
                hideDropdown();
                
                // For now, just show an alert - can be expanded later
                alert('User preferences coming soon!');
            });
        }
    }
    
    /**
     * Initialize user menu
     */
    function initializeUserMenu() {
        console.log('🚀 Initializing user menu...');
        
        // Add styles
        addDropdownStyles();
        
        // Create dropdown
        createUserDropdown();
        
        // Setup event handlers
        setupDropdownToggle();
        setupLogoutHandler();
        setupProfileHandler();
        setupPreferencesHandler();
        
        console.log('✅ User menu initialized successfully');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUserMenu);
    } else {
        // Wait a bit for other scripts to load
        setTimeout(initializeUserMenu, 1000);
    }
    
    // Export functions globally
    window.showUserDropdown = showDropdown;
    window.hideUserDropdown = hideDropdown;
    window.initializeUserMenu = initializeUserMenu;
    
    console.log('✅ User Menu module loaded');
    
})();

// Export module info
window.userMenu = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};