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
    
    // Log all view elements to check if they exist
    Object.keys(views).forEach(viewName => {
        console.log(`View ${viewName} exists:`, !!views[viewName]);
        if (views[viewName]) {
            console.log(`View ${viewName} initial class list:`, views[viewName].classList);
        }
    });
    
    // Ensure at least the booking view is active initially
    if (views.booking && !document.querySelector('.content-view.active')) {
        views.booking.classList.add('active');
        console.log('Booking view set to active');
    }

    // Initialize sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const sidebar = document.querySelector('.sidebar');

    console.log('Sidebar elements:', { sidebarLinks, mobileToggle, sidebar });
    
    // Check if sidebar links were found
    if (sidebarLinks.length === 0) {
        console.error('No sidebar links found!');
        return;
    }

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
            
            // Log current state before changes
            console.log('Current active sidebar link:', document.querySelector('.sidebar .nav-link.active'));
            console.log('Current active view:', document.querySelector('.content-view.active'));

            // Update active state in sidebar
            sidebarLinks.forEach(l => {
                l.classList.remove('active');
            });
            this.classList.add('active');
            console.log('New active sidebar link:', this);

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
                    
                    // Log all content views to see their states
                    document.querySelectorAll('.content-view').forEach(view => {
                        console.log(`View ${view.id} active:`, view.classList.contains('active'));
                    });
                }, 10);

                // Special handling for analytics view
                if (viewName === 'analytics') {
                    // Initialize charts when analytics view is shown
                    console.log('Initializing analytics charts');
                    if (typeof initAnalyticsCharts === 'function') {
                        initAnalyticsCharts('day');
                    }
                }

                // Special handling for active deliveries view
                if (viewName === 'active-deliveries') {
                    console.log('Switching to active deliveries view');
                    // Don't reload data, just refresh the display to preserve status changes
                    if (typeof populateActiveDeliveriesTable === 'function') {
                        console.log('Refreshing display with existing data');
                        populateActiveDeliveriesTable();
                    } else if (typeof loadActiveDeliveries === 'function') {
                        // Only load data if no data exists
                        if (!window.activeDeliveries || window.activeDeliveries.length === 0) {
                            console.log('No data exists, loading from source');
                            loadActiveDeliveries();
                        } else {
                            console.log('Data exists, skipping reload to preserve changes');
                        }
                    } else {
                        console.log('No display functions available');
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
                    // Update booking view dashboard with real data
                    // Add a small delay to ensure DOM is fully loaded
                    setTimeout(() => {
                        updateBookingViewDashboard();
                    }, 100);
                    
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
            
            // Update booking view dashboard on initial load
            updateBookingViewDashboard();
        }, 100);
    }
    
    // Test button for modal functionality has been removed as requested
    
    console.log('Main.js initialization completed');
});

// Function to update booking view dashboard cards with real data
function updateBookingViewDashboard() {
    try {
        // Get the actual data from global variables
        const activeDeliveries = window.activeDeliveries || [];
        const deliveryHistory = window.deliveryHistory || [];
        
        // Calculate metrics from actual data
        const totalBookings = activeDeliveries.length + deliveryHistory.length;
        const activeDeliveriesCount = activeDeliveries.length;
        
        // Calculate total distance
        let totalDistance = 0;
        [...activeDeliveries, ...deliveryHistory].forEach(delivery => {
            if (delivery.distance) {
                // Extract numeric value from distance string (e.g., "12.5 km" -> 12.5)
                const distanceMatch = delivery.distance.match(/(\d+\.?\d*)/);
                if (distanceMatch) {
                    totalDistance += parseFloat(distanceMatch[1]) || 0;
                }
            }
        });
        
        // Update the booking view dashboard cards
        const bookingView = document.getElementById('bookingView');
        if (bookingView) {
            // Booked Deliveries card (total bookings)
            const bookedDeliveriesCard = bookingView.querySelector('.dashboard-cards .card:nth-child(1) .stat-value');
            if (bookedDeliveriesCard) {
                bookedDeliveriesCard.textContent = totalBookings;
            }
            
            // Active Deliveries card
            const activeDeliveriesCard = bookingView.querySelector('.dashboard-cards .card:nth-child(2) .stat-value');
            if (activeDeliveriesCard) {
                activeDeliveriesCard.textContent = activeDeliveriesCount;
            }
            
            // Total Distance card
            const totalDistanceCard = bookingView.querySelector('.dashboard-cards .card:nth-child(3) .stat-value');
            if (totalDistanceCard) {
                totalDistanceCard.textContent = `${totalDistance.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
            }
            
            // Revenue card (optional - could be updated with cost data if needed)
            // const revenueCard = bookingView.querySelector('.dashboard-cards .card:nth-child(4) .crossed-out');
            // if (revenueCard) {
            //     // Calculate total additional costs
            //     let totalAdditionalCost = 0;
            //     [...activeDeliveries, ...deliveryHistory].forEach(delivery => {
            //         if (typeof delivery.additionalCosts === 'number') {
            //             totalAdditionalCost += delivery.additionalCosts;
            //         }
            //     });
            //     revenueCard.textContent = `₱${totalAdditionalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
            // }
        }
        
        console.log('Booking view dashboard updated:', {
            totalBookings,
            activeDeliveriesCount,
            totalDistance
        });
    } catch (error) {
        console.error('Error updating booking view dashboard:', error);
    }
}

// Switch to Active Deliveries view (for DR upload integration)
function switchToActiveDeliveriesView() {
    console.log('Switching to Active Deliveries view...');
    
    try {
        // Find the active deliveries navigation link
        const activeDeliveriesLink = document.querySelector('a[data-view="active-deliveries"]');
        
        if (activeDeliveriesLink) {
            // Simulate click on the Active Deliveries tab
            activeDeliveriesLink.click();
            console.log('✅ Successfully switched to Active Deliveries view');
        } else {
            console.warn('Active Deliveries navigation link not found');
            
            // Fallback: manually show the active deliveries view
            const views = document.querySelectorAll('.view');
            views.forEach(view => view.classList.remove('active'));
            
            const activeDeliveriesView = document.getElementById('activeDeliveriesView');
            if (activeDeliveriesView) {
                activeDeliveriesView.classList.add('active');
                console.log('✅ Manually switched to Active Deliveries view');
            }
        }
        
    } catch (error) {
        console.error('Error switching to Active Deliveries view:', error);
    }
}

// Expose functions globally
window.updateBookingViewDashboard = updateBookingViewDashboard;
window.switchToActiveDeliveriesView = switchToActiveDeliveriesView;

// Ensure functions are properly exposed globally
window.addEventListener('load', function() {
    console.log('Main.js: Window load event fired');
});