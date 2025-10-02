document.addEventListener('DOMContentLoaded', function () {
    console.log('=== MAIN.JS DOMContentLoaded ===');
    
    // Always initialize main.js functionality regardless of app.js initialization
    // This ensures proper event handling for view switching
    
    // Initialize calendar variables
    window.currentMonthIndex = new Date().getMonth();
    window.currentYear = new Date().getFullYear();
    window.currentMonthIndexModal = new Date().getMonth();
    window.currentYearModal = new Date().getFullYear();
    
    // Initialize all views - using correct IDs from HTML
    const views = {
        booking: document.getElementById('bookingView'),
        analytics: document.getElementById('analyticsView'),
        'active-deliveries': document.getElementById('activeDeliveriesView'),
        'delivery-history': document.getElementById('deliveryHistoryView'),
        customers: document.getElementById('customersView'),
        'warehouse-map': document.getElementById('warehouseMapView'),
        settings: document.getElementById('settingsView'),
        'e-pod': document.getElementById('ePodView')
    };
    
    console.log('Views initialized:', views);
    
    // Ensure at least the booking view is active initially
    if (views.booking && !document.querySelector('.view.active')) {
        views.booking.classList.add('active');
        console.log('Booking view set to active');
    }

    // Initialize sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const sidebar = document.querySelector('.sidebar');

    console.log('Sidebar elements:', { sidebarLinks, mobileToggle, sidebar });

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
            console.log('Sidebar link clicked:', this.dataset.view);

            // Update active state in sidebar
            sidebarLinks.forEach(l => {
                l.classList.remove('active');
            });
            this.classList.add('active');

            // Hide all views
            Object.values(views).forEach(view => {
                if (view) {
                    view.classList.remove('active');
                }
            });

            // Show selected view
            const viewName = this.dataset.view;
            console.log('Showing view:', viewName);
            console.log('Available views:', Object.keys(views));
            if (views[viewName]) {
                // Hide all views first
                console.log('Hiding all views');
                Object.values(views).forEach(view => {
                    if (view) {
                        console.log('Hiding view:', view.id);
                        view.classList.remove('active');
                        // Force reflow
                        view.offsetHeight;
                    }
                });
                
                // Force a small delay to ensure DOM updates
                setTimeout(() => {
                    console.log('Adding active class to view:', viewName);
                    views[viewName].classList.add('active');
                    
                    // Force reflow again
                    views[viewName].offsetHeight;
                    
                    // Check computed styles after
                    const computedStyleAfter = window.getComputedStyle(views[viewName]);
                    console.log('View element computed display after:', computedStyleAfter.display);
                    console.log('View element computed visibility after:', computedStyleAfter.visibility);
                    console.log('View element class list after:', views[viewName].classList);
                }, 10);

                // Special handling for analytics view
                if (viewName === 'analytics') {
                    // Initialize charts when analytics view is shown
                    console.log('Initializing analytics charts');
                    if (typeof initAnalyticsCharts === 'function') {
                        initAnalyticsCharts();
                    }
                }

                // Special handling for active deliveries view
                if (viewName === 'active-deliveries') {
                    console.log('Loading active deliveries');
                    console.log('typeof loadActiveDeliveries:', typeof loadActiveDeliveries);
                    if (typeof loadActiveDeliveries === 'function') {
                        console.log('Calling loadActiveDeliveries function');
                        loadActiveDeliveries();
                        console.log('loadActiveDeliveries function completed');
                    } else {
                        console.log('loadActiveDeliveries function not available');
                    }
                }

                // Special handling for delivery history view
                if (viewName === 'delivery-history') {
                    console.log('Loading delivery history');
                    if (typeof loadDeliveryHistory === 'function') {
                        loadDeliveryHistory();
                    }
                }

                // Special handling for customers view
                if (viewName === 'customers') {
                    console.log('Loading customers');
                    if (typeof loadCustomers === 'function') {
                        loadCustomers();
                    }
                }

                // Special handling for warehouse map view
                if (viewName === 'warehouse-map') {
                    console.log('Loading warehouses');
                    if (typeof loadWarehouses === 'function') {
                        loadWarehouses();
                    }
                }
                
                // Special handling for E-POD view
                if (viewName === 'e-pod') {
                    console.log('Loading E-POD deliveries');
                    if (typeof loadEPodDeliveries === 'function') {
                        loadEPodDeliveries();
                    }
                    if (typeof initEPod === 'function') {
                        initEPod(); // Initialize E-POD functionality when view is loaded
                    }
                }
                
                // Special handling for booking view - initialize calendar
                if (viewName === 'booking') {
                    // Ensure calendar is initialized when booking view is shown
                    console.log('Booking view activated, initializing calendar');
                    console.log('Checking if initCalendar function exists:', typeof initCalendar);
                    
                    // Check if calendar.js is loaded
                    console.log('calendarJsLoaded flag at booking view activation:', window.calendarJsLoaded);
                    
                    // Also check if openBookingModal is available
                    console.log('openBookingModal function exists:', typeof openBookingModal);
                    
                    // Also initialize booking modal interactions
                    console.log('Initializing booking modal interactions for booking view');
                    if (typeof initBookingModal === 'function') {
                        console.log('Calling initBookingModal function for booking view');
                        try {
                            initBookingModal();
                            console.log('initBookingModal function executed successfully for booking view');
                        } catch (error) {
                            console.error('Error calling initBookingModal function for booking view:', error);
                        }
                    } else {
                        console.log('initBookingModal function not found for booking view');
                        // Check if it's available in window object
                        console.log('initBookingModal in window:', window.initBookingModal);
                        console.log('typeof window.initBookingModal:', typeof window.initBookingModal);
                    }
                    
                    if (typeof initCalendar === 'function') {
                        console.log('Calling initCalendar function');
                        try {
                            initCalendar();
                            console.log('initCalendar function executed successfully');
                        } catch (error) {
                            console.error('Error calling initCalendar function:', error);
                        }
                    } else {
                        console.log('initCalendar function not found');
                        // Let's check what functions are available
                        console.log('Available functions:', Object.keys(window).filter(key => typeof window[key] === 'function'));
                        
                        // Check if we can find initCalendar in a different way
                        console.log('initCalendar in window:', window.initCalendar);
                        console.log('typeof window.initCalendar:', typeof window.initCalendar);
                    }
                    
                    // Ensure openBookingModal is available
                    if (typeof openBookingModal !== 'function') {
                        console.error('openBookingModal function is not available even after calendar initialization');
                    }
                    
                    // Also ensure calendar is updated
                    setTimeout(() => {
                        if (typeof window.updateCalendarFromCalendarJs === 'function') {
                            window.updateCalendarFromCalendarJs();
                            console.log('Calendar updated after booking view activation');
                        }
                    }, 100);
                }
            } else {
                console.log('View not found:', viewName);
            }

            // Close sidebar on mobile after selection
            if (window.innerWidth < 768) {
                console.log('Closing sidebar on mobile');
                sidebar.classList.remove('show');
            }
        });
    });
    
    // Initialize the calendar on page load if booking view exists
    if (views.booking) {
        console.log('Initializing calendar on page load');
        // Small delay to ensure DOM is fully ready
        setTimeout(() => {
            if (typeof initCalendar === 'function') {
                console.log('Calling initCalendar on page load');
                initCalendar();
            } else {
                console.log('initCalendar not available on page load');
            }
        }, 100);
    }
    
    // Add a test button for modal functionality
    const testBtn = document.createElement('button');
    testBtn.id = 'testModalBtn';
    testBtn.textContent = 'Test Modal';
    testBtn.style.position = 'fixed';
    testBtn.style.top = '10px';
    testBtn.style.right = '10px';
    testBtn.style.zIndex = '9999';
    testBtn.style.padding = '10px';
    testBtn.style.backgroundColor = '#007bff';
    testBtn.style.color = 'white';
    testBtn.style.border = 'none';
    testBtn.style.borderRadius = '4px';
    testBtn.style.cursor = 'pointer';
    testBtn.style.display = 'none'; // Hidden by default, only for debugging
    
    document.body.appendChild(testBtn);
    
    testBtn.addEventListener('click', function() {
        console.log('Test modal button clicked');
        if (typeof window.testBookingModal === 'function') {
            window.testBookingModal();
        } else {
            console.error('testBookingModal function not available');
        }
    });
    
    console.log('Main.js initialization completed');
});

// Ensure functions are properly exposed globally
window.addEventListener('load', function() {
    console.log('Main.js: Window load event fired');
});