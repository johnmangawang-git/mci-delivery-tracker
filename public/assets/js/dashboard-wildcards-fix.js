/**
 * DASHBOARD WILDCARDS FIX
 * Replaces all hardcoded values with real data from deliveries
 */

console.log('🔧 Loading Dashboard Wildcards Fix...');

(function() {
    'use strict';
    
    /**
     * Calculate real booking statistics
     */
    function calculateBookingStats() {
        try {
            const activeDeliveries = window.activeDeliveries || JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            const deliveryHistory = window.deliveryHistory || JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            const allDeliveries = [...activeDeliveries, ...deliveryHistory];
            
            // Calculate total bookings
            const totalBookings = allDeliveries.length;
            
            // Calculate this month vs last month for percentage change
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            const thisMonthBookings = allDeliveries.filter(delivery => {
                const deliveryDate = new Date(delivery.created_at || delivery.timestamp || delivery.deliveryDate || delivery.created_date);
                return deliveryDate.getMonth() === currentMonth && deliveryDate.getFullYear() === currentYear;
            }).length;
            
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            
            const lastMonthBookings = allDeliveries.filter(delivery => {
                const deliveryDate = new Date(delivery.created_at || delivery.timestamp || delivery.deliveryDate || delivery.created_date);
                return deliveryDate.getMonth() === lastMonth && deliveryDate.getFullYear() === lastMonthYear;
            }).length;
            
            // Calculate percentage change
            let changePercent = 0;
            let changeDirection = 'up';
            let changeClass = 'positive';
            
            if (lastMonthBookings > 0) {
                changePercent = Math.round(((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100);
                if (changePercent < 0) {
                    changeDirection = 'down';
                    changeClass = 'negative';
                    changePercent = Math.abs(changePercent);
                }
            } else if (thisMonthBookings > 0) {
                changePercent = 100;
            }
            
            return {
                total: totalBookings,
                thisMonth: thisMonthBookings,
                change: changePercent,
                direction: changeDirection,
                class: changeClass
            };
            
        } catch (error) {
            console.error('❌ Error calculating booking stats:', error);
            return { total: 0, thisMonth: 0, change: 0, direction: 'up', class: 'positive' };
        }
    }
    
    /**
     * Calculate real cost statistics
     */
    function calculateCostStats() {
        try {
            const activeDeliveries = window.activeDeliveries || JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            const deliveryHistory = window.deliveryHistory || JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            const allDeliveries = [...activeDeliveries, ...deliveryHistory];
            
            // Calculate total additional costs
            let totalCosts = 0;
            allDeliveries.forEach(delivery => {
                const cost = parseFloat(delivery.additional_costs || delivery.additionalCosts || 0);
                totalCosts += cost;
            });
            
            // Calculate this month vs last month
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            let thisMonthCosts = 0;
            allDeliveries.forEach(delivery => {
                const deliveryDate = new Date(delivery.created_at || delivery.timestamp || delivery.deliveryDate || delivery.created_date);
                if (deliveryDate.getMonth() === currentMonth && deliveryDate.getFullYear() === currentYear) {
                    const cost = parseFloat(delivery.additional_costs || delivery.additionalCosts || 0);
                    thisMonthCosts += cost;
                }
            });
            
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            
            let lastMonthCosts = 0;
            allDeliveries.forEach(delivery => {
                const deliveryDate = new Date(delivery.created_at || delivery.timestamp || delivery.deliveryDate || delivery.created_date);
                if (deliveryDate.getMonth() === lastMonth && deliveryDate.getFullYear() === lastMonthYear) {
                    const cost = parseFloat(delivery.additional_costs || delivery.additionalCosts || 0);
                    lastMonthCosts += cost;
                }
            });
            
            // Calculate percentage change
            let changePercent = 0;
            let changeDirection = 'up';
            let changeClass = 'positive';
            
            if (lastMonthCosts > 0) {
                changePercent = Math.round(((thisMonthCosts - lastMonthCosts) / lastMonthCosts) * 100);
                if (changePercent < 0) {
                    changeDirection = 'down';
                    changeClass = 'negative';
                    changePercent = Math.abs(changePercent);
                }
            } else if (thisMonthCosts > 0) {
                changePercent = 100;
            }
            
            return {
                total: totalCosts,
                thisMonth: thisMonthCosts,
                change: changePercent,
                direction: changeDirection,
                class: changeClass
            };
            
        } catch (error) {
            console.error('❌ Error calculating cost stats:', error);
            return { total: 0, thisMonth: 0, change: 0, direction: 'up', class: 'positive' };
        }
    }
    
    /**
     * Calculate active deliveries count
     */
    function calculateActiveDeliveries() {
        try {
            const activeDeliveries = window.activeDeliveries || JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            return activeDeliveries.length;
        } catch (error) {
            console.error('❌ Error calculating active deliveries:', error);
            return 0;
        }
    }
    
    /**
     * Update main dashboard wildcards (Booking View)
     */
    function updateMainDashboardWildcards() {
        console.log('🔄 Updating main dashboard wildcards...');
        
        try {
            const bookingStats = calculateBookingStats();
            const costStats = calculateCostStats();
            const activeCount = calculateActiveDeliveries();
            
            // Update Booked Deliveries card (first card)
            const bookedValueEl = document.querySelector('.dashboard-cards .card:nth-child(1) .stat-value');
            const bookedDescEl = document.querySelector('.dashboard-cards .card:nth-child(1) .stat-desc');
            
            if (bookedValueEl) {
                bookedValueEl.textContent = bookingStats.total;
            }
            
            if (bookedDescEl) {
                const arrow = bookingStats.direction === 'up' ? 'bi-arrow-up text-success' : 'bi-arrow-down text-danger';
                bookedDescEl.innerHTML = `<i class="bi ${arrow}"></i> ${bookingStats.change}% from last month`;
            }
            
            // Update Active Deliveries card (second card)
            const activeValueEl = document.querySelector('.dashboard-cards .card:nth-child(2) .stat-value');
            const activeDescEl = document.querySelector('.dashboard-cards .card:nth-child(2) .stat-desc');
            
            if (activeValueEl) {
                activeValueEl.textContent = activeCount;
            }
            
            if (activeDescEl) {
                // Calculate change based on active deliveries trend
                const changePercent = Math.floor(Math.random() * 10) + 1; // Placeholder calculation
                activeDescEl.innerHTML = `<i class="bi bi-truck text-primary"></i> Currently active`;
            }
            
            console.log('✅ Main dashboard wildcards updated:', {
                totalBookings: bookingStats.total,
                activeDeliveries: activeCount,
                totalCosts: costStats.total
            });
            
        } catch (error) {
            console.error('❌ Error updating main dashboard wildcards:', error);
        }
    }
    
    /**
     * Update analytics dashboard wildcards
     */
    function updateAnalyticsDashboardWildcards() {
        console.log('🔄 Updating analytics dashboard wildcards...');
        
        try {
            const bookingStats = calculateBookingStats();
            const costStats = calculateCostStats();
            
            // Update Total Bookings metric (first metric card)
            const totalBookingsValueEl = document.querySelector('#analyticsView .metric-card:nth-child(1) .metric-value');
            const totalBookingsChangeEl = document.querySelector('#analyticsView .metric-card:nth-child(1) .metric-change');
            
            if (totalBookingsValueEl) {
                totalBookingsValueEl.textContent = bookingStats.total;
            }
            
            if (totalBookingsChangeEl) {
                const arrow = bookingStats.direction === 'up' ? 'bi-arrow-up' : 'bi-arrow-down';
                totalBookingsChangeEl.className = `metric-change ${bookingStats.class}`;
                totalBookingsChangeEl.innerHTML = `<i class="bi ${arrow}"></i> ${bookingStats.change}% from last month`;
            }
            
            // Update Total Additional Cost metric (second metric card)
            const totalCostValueEl = document.querySelector('#analyticsView .metric-card:nth-child(2) .metric-value');
            const totalCostChangeEl = document.querySelector('#analyticsView .metric-card:nth-child(2) .metric-change');
            
            if (totalCostValueEl) {
                totalCostValueEl.textContent = `₱${costStats.total.toLocaleString()}`;
            }
            
            if (totalCostChangeEl) {
                const arrow = costStats.direction === 'up' ? 'bi-arrow-up' : 'bi-arrow-down';
                totalCostChangeEl.className = `metric-change ${costStats.class}`;
                totalCostChangeEl.innerHTML = `<i class="bi ${arrow}"></i> ${costStats.change}% from last month`;
            }
            
            console.log('✅ Analytics dashboard wildcards updated:', {
                totalBookings: bookingStats.total,
                totalCosts: costStats.total,
                bookingChange: bookingStats.change,
                costChange: costStats.change
            });
            
        } catch (error) {
            console.error('❌ Error updating analytics dashboard wildcards:', error);
        }
    }
    
    /**
     * Update all wildcards
     */
    function updateAllWildcards() {
        console.log('🔄 Updating all dashboard wildcards...');
        
        // Update main dashboard
        updateMainDashboardWildcards();
        
        // Update analytics dashboard
        updateAnalyticsDashboardWildcards();
        
        // Also trigger the existing dashboard stats update
        if (typeof window.updateDashboardStats === 'function') {
            window.updateDashboardStats();
        }
        
        console.log('✅ All dashboard wildcards updated');
    }
    
    /**
     * Setup auto-update system
     */
    function setupWildcardsAutoUpdate() {
        // Update immediately
        setTimeout(updateAllWildcards, 1000);
        
        // Update every 30 seconds
        setInterval(updateAllWildcards, 30000);
        
        // Update when switching views
        const viewObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('view') && target.classList.contains('active')) {
                        setTimeout(updateAllWildcards, 500);
                    }
                }
            });
        });
        
        // Observe all view elements
        document.querySelectorAll('.view').forEach(view => {
            viewObserver.observe(view, { attributes: true });
        });
        
        // Update when data changes
        window.addEventListener('deliveryDataUpdated', updateAllWildcards);
        
        console.log('✅ Wildcards auto-update system enabled');
    }
    
    /**
     * Initialize wildcards fix
     */
    function initializeWildcardsFix() {
        console.log('🚀 Initializing dashboard wildcards fix...');
        
        // Setup auto-update system
        setupWildcardsAutoUpdate();
        
        // Export functions globally
        window.updateAllWildcards = updateAllWildcards;
        window.updateMainDashboardWildcards = updateMainDashboardWildcards;
        window.updateAnalyticsDashboardWildcards = updateAnalyticsDashboardWildcards;
        
        console.log('✅ Dashboard wildcards fix initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWildcardsFix);
    } else {
        // Wait for other scripts to load
        setTimeout(initializeWildcardsFix, 2000);
    }
    
    console.log('✅ Dashboard Wildcards Fix loaded');
    
})();

// Export module info
window.dashboardWildcardsFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};