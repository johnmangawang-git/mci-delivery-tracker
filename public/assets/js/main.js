// Main application initialization
document.addEventListener('DOMContentLoaded', function () {
    // Initialize all views
    const views = {
        booking: document.getElementById('bookingView'),
        analytics: document.getElementById('analyticsView'),
        'active-deliveries': document.getElementById('activeDeliveriesView'),
        'delivery-history': document.getElementById('deliveryHistoryView'),
        customers: document.getElementById('customersView'),
        'warehouse-map': document.getElementById('warehouseMapView'),
        settings: document.getElementById('settingsView')
    };

    // Initialize sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const sidebar = document.querySelector('.sidebar');

    // Mobile sidebar toggle
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
        });
    }

    // Sidebar navigation
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Update active state in sidebar
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Hide all views
            Object.values(views).forEach(view => {
                if (view) view.classList.remove('active');
            });

            // Show selected view
            const viewName = this.dataset.view;
            if (views[viewName]) {
                views[viewName].classList.add('active');

                // Special handling for analytics view
                if (viewName === 'analytics') {
                    // Initialize charts when analytics view is shown
                    initAnalyticsCharts();
                }

                // Special handling for active deliveries view
                if (viewName === 'active-deliveries') {
                    loadActiveDeliveries();
                }

                // Special handling for delivery history view
                if (viewName === 'delivery-history') {
                    loadDeliveryHistory();
                }

                // Special handling for customers view
                if (viewName === 'customers') {
                    loadCustomers();
                }

                // Special handling for warehouse map view
                if (viewName === 'warehouse-map') {
                    loadWarehouses();
                }
            }

            // Close sidebar on mobile after selection
            if (window.innerWidth < 768) {
                sidebar.classList.remove('show');
            }
        });
    });

    // Initialize calendar
    initCalendar();

    // Initialize booking modal interactions
    initBookingModal();

    // Initialize settings panels
    initSettingsPanels();

    // Initialize analytics charts (only if analytics view is visible initially)
    if (views.analytics.classList.contains('active')) {
        initAnalyticsCharts();
    }

    // Initialize user session
    initAuth();

    // Calendar view toggle buttons
    document.querySelectorAll('.calendar-controls .btn').forEach(button => {
        button.addEventListener('click', function () {
            document.querySelectorAll('.calendar-controls .btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Add customer button
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', function () {
            const addCustomerModal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
            addCustomerModal.show();
        });
    }

    // Save customer button
    const saveCustomerBtn = document.getElementById('saveCustomerBtn');
    if (saveCustomerBtn) {
        saveCustomerBtn.addEventListener('click', function () {
            saveCustomer();
            const addCustomerModal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
            addCustomerModal.hide();
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            logout();
        });
    }
});

// Global functions
function showToast(message, type = 'success') {
    // In a real implementation, this would show a toast notification
    console.log(`Toast: ${message} [${type}]`);
}

function showError(message) {
    showToast(message, 'error');
}

// Initialize auth
function initAuth() {
    // Clear any existing user data to force recreation with new name
    localStorage.removeItem('mci-user');
    
    // Check if user is logged in
    let user = localStorage.getItem('mci-user');
    
    // For testing purposes, create mock user data if none exists
    if (!user) {
        const mockUser = {
            name: 'MCI warehouse',
            role: 'Administrator',
            email: 'admin@mci.com'
        };
        localStorage.setItem('mci-user', JSON.stringify(mockUser));
        user = JSON.stringify(mockUser);
        console.log('Created mock user for testing');
    }
    
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
    }
}