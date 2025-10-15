/**
 * DASHBOARD STATISTICS
 * Updates dashboard wildcards with real delivery data
 */

console.log('📊 DASHBOARD STATS: Loading...');

// =============================================================================
// 1. CALCULATE COMPLETED DELIVERIES
// =============================================================================

function calculateCompletedDeliveries() {
    try {
        // Get completed deliveries from history
        const deliveryHistory = window.deliveryHistory || 
                               JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
        
        // Count completed deliveries this month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const thisMonthCompleted = deliveryHistory.filter(delivery => {
            const deliveryDate = new Date(delivery.created_at || delivery.timestamp || delivery.deliveryDate);
            return deliveryDate.getMonth() === currentMonth && 
                   deliveryDate.getFullYear() === currentYear &&
                   (delivery.status === 'Completed' || delivery.status === 'Signed');
        });
        
        // Calculate last month for comparison
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        const lastMonthCompleted = deliveryHistory.filter(delivery => {
            const deliveryDate = new Date(delivery.created_at || delivery.timestamp || delivery.deliveryDate);
            return deliveryDate.getMonth() === lastMonth && 
                   deliveryDate.getFullYear() === lastMonthYear &&
                   (delivery.status === 'Completed' || delivery.status === 'Signed');
        });
        
        const thisMonthCount = thisMonthCompleted.length;
        const lastMonthCount = lastMonthCompleted.length;
        
        // Calculate percentage change
        let changePercent = 0;
        let changeDirection = 'up';
        let changeClass = 'text-success';
        
        if (lastMonthCount > 0) {
            changePercent = Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
            if (changePercent < 0) {
                changeDirection = 'down';
                changeClass = 'text-danger';
                changePercent = Math.abs(changePercent);
            }
        } else if (thisMonthCount > 0) {
            changePercent = 100;
        }
        
        console.log('📊 Completed deliveries:', {
            thisMonth: thisMonthCount,
            lastMonth: lastMonthCount,
            change: changePercent
        });
        
        return {
            count: thisMonthCount,
            change: changePercent,
            direction: changeDirection,
            class: changeClass
        };
        
    } catch (error) {
        console.error('❌ Error calculating completed deliveries:', error);
        return { count: 0, change: 0, direction: 'up', class: 'text-muted' };
    }
}

// =============================================================================
// 2. CALCULATE STATUS BREAKDOWN
// =============================================================================

function calculateStatusBreakdown() {
    try {
        // Get active deliveries
        const activeDeliveries = window.activeDeliveries || 
                                JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
        
        // Count by status
        const statusCounts = {
            'In Transit': 0,
            'On Schedule': 0,
            'Delayed': 0,
            'Active': 0
        };
        
        activeDeliveries.forEach(delivery => {
            const status = delivery.status || 'Active';
            if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status]++;
            } else {
                statusCounts['Active']++; // Default fallback
            }
        });
        
        console.log('📊 Status breakdown:', statusCounts);
        
        return statusCounts;
        
    } catch (error) {
        console.error('❌ Error calculating status breakdown:', error);
        return { 'In Transit': 0, 'On Schedule': 0, 'Delayed': 0, 'Active': 0 };
    }
}

// =============================================================================
// 3. UPDATE DASHBOARD WILDCARDS
// =============================================================================

function updateDashboardStats() {
    console.log('🔄 Updating dashboard statistics...');
    
    try {
        // Update Completed Deliveries Card
        const completedStats = calculateCompletedDeliveries();
        const completedCountEl = document.getElementById('completedDeliveriesCount');
        const completedChangeEl = document.getElementById('completedDeliveriesChange');
        
        if (completedCountEl) {
            completedCountEl.textContent = completedStats.count;
        }
        
        if (completedChangeEl) {
            const arrow = completedStats.direction === 'up' ? 'bi-arrow-up' : 'bi-arrow-down';
            completedChangeEl.innerHTML = `
                <i class="bi ${arrow} ${completedStats.class}"></i> 
                ${completedStats.change}% from last month
            `;
        }
        
        // Update Status Breakdown Card (active deliveries only)
        const statusStats = calculateStatusBreakdown();
        
        const inTransitEl = document.getElementById('inTransitCount');
        const onScheduleEl = document.getElementById('onScheduleCount');
        const delayedEl = document.getElementById('delayedCount');
        
        if (inTransitEl) inTransitEl.textContent = statusStats['In Transit'];
        if (onScheduleEl) onScheduleEl.textContent = statusStats['On Schedule'];
        if (delayedEl) delayedEl.textContent = statusStats['Delayed'];
        
        console.log('✅ Dashboard statistics updated');
        
    } catch (error) {
        console.error('❌ Error updating dashboard stats:', error);
    }
}

// =============================================================================
// 4. AUTO-UPDATE SYSTEM
// =============================================================================

// Update stats when data changes
function setupStatsAutoUpdate() {
    // Update immediately
    updateDashboardStats();
    
    // Update every 30 seconds
    setInterval(updateDashboardStats, 30000);
    
    // Update when switching to booking view
    const bookingViewObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const bookingView = document.getElementById('bookingView');
                if (bookingView && bookingView.classList.contains('active')) {
                    setTimeout(updateDashboardStats, 500);
                }
            }
        });
    });
    
    const bookingView = document.getElementById('bookingView');
    if (bookingView) {
        bookingViewObserver.observe(bookingView, { attributes: true });
    }
    
    console.log('✅ Dashboard stats auto-update enabled');
}

// =============================================================================
// 5. INITIALIZATION
// =============================================================================

function initDashboardStats() {
    console.log('🔧 Initializing dashboard statistics...');
    
    // Setup auto-update system
    setupStatsAutoUpdate();
    
    // Update stats when data loads
    setTimeout(updateDashboardStats, 2000);
    
    console.log('✅ Dashboard statistics initialized');
}

// Make functions globally available
window.updateDashboardStats = updateDashboardStats;
window.calculateCompletedDeliveries = calculateCompletedDeliveries;
window.calculateStatusBreakdown = calculateStatusBreakdown;

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboardStats);
} else {
    initDashboardStats();
}

console.log('📊 DASHBOARD STATS: Loaded');
console.log('🎯 Wildcards will show:');
console.log('   ✅ Completed Deliveries (monthly with % change)');
console.log('   📊 Status Breakdown (In Transit, On Schedule, Delayed)');