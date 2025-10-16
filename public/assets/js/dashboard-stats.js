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
            // Normalize status values to match expected categories
            let normalizedStatus = status;
            
            // Map common status variations to standard categories
            switch (status.toLowerCase()) {
                case 'in transit':
                case 'in-transit':
                    normalizedStatus = 'In Transit';
                    break;
                case 'on schedule':
                case 'on-schedule':
                    normalizedStatus = 'On Schedule';
                    break;
                case 'delayed':
                    normalizedStatus = 'Delayed';
                    break;
                case 'active':
                    normalizedStatus = 'Active';
                    break;
                case 'completed':
                    normalizedStatus = 'Completed';
                    break;
                default:
                    // For any other status, try to match it to existing categories
                    if (statusCounts.hasOwnProperty(status)) {
                        normalizedStatus = status;
                    } else {
                        normalizedStatus = 'Active'; // Default fallback
                    }
                    break;
            }
            
            // Increment the count for the normalized status
            if (statusCounts.hasOwnProperty(normalizedStatus)) {
                statusCounts[normalizedStatus]++;
            } else {
                statusCounts['Active']++; // Fallback to Active for unrecognized statuses
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
    
    // Check if required elements exist
    const inTransitEl = document.getElementById('inTransitCount');
    const onScheduleEl = document.getElementById('onScheduleCount');
    const delayedEl = document.getElementById('delayedCount');
    
    console.log('📊 Dashboard elements check:', {
        inTransitEl: !!inTransitEl,
        onScheduleEl: !!onScheduleEl,
        delayedEl: !!delayedEl
    });
    
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
        console.log('📊 Status stats:', statusStats);
        
        const inTransitEl = document.getElementById('inTransitCount');
        const onScheduleEl = document.getElementById('onScheduleCount');
        const delayedEl = document.getElementById('delayedCount');
        
        console.log('📊 Updating status elements:', {
            inTransitEl: !!inTransitEl,
            onScheduleEl: !!onScheduleEl,
            delayedEl: !!delayedEl,
            inTransitValue: statusStats['In Transit'],
            onScheduleValue: statusStats['On Schedule'],
            delayedValue: statusStats['Delayed']
        });
        
        if (inTransitEl) inTransitEl.textContent = statusStats['In Transit'];
        if (onScheduleEl) onScheduleEl.textContent = statusStats['On Schedule'];
        if (delayedEl) delayedEl.textContent = statusStats['Delayed'];
        
        // Also update Analytics Dashboard if visible
        updateAnalyticsDashboard(completedStats, statusStats);
        
        // Update Analytics Dashboard elements directly to ensure they're always updated
        const analyticsView = document.getElementById('analyticsView');
        console.log('📊 Analytics view check:', {
            analyticsView: !!analyticsView,
            analyticsViewActive: analyticsView ? analyticsView.classList.contains('active') : false
        });
        
        if (analyticsView) {
            // Update Delayed Deliveries count
            const analyticsDelayedEl = document.getElementById('analyticsDelayedCount');
            if (analyticsDelayedEl) {
                analyticsDelayedEl.textContent = statusStats['Delayed'] || 0;
            }
            
            // Update Delayed Deliveries percentage
            const analyticsDelayedChangeEl = document.getElementById('analyticsDelayedChange');
            if (analyticsDelayedChangeEl) {
                const delayedCount = statusStats['Delayed'] || 0;
                const totalActive = (statusStats['In Transit'] || 0) + (statusStats['On Schedule'] || 0) + (statusStats['Delayed'] || 0);
                const delayedPercentage = totalActive > 0 ? Math.round((delayedCount / totalActive) * 100) : 0;
                
                analyticsDelayedChangeEl.className = delayedCount > 0 ? 'metric-change negative' : 'metric-change positive';
                analyticsDelayedChangeEl.innerHTML = `
                    <i class="bi ${delayedCount > 0 ? 'bi-exclamation-triangle' : 'bi-check-circle'}"></i> 
                    ${delayedPercentage}% of active deliveries
                `;
            }
        }
        
        console.log('✅ Dashboard statistics updated');
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('deliveryDataUpdated'));
        
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
    setupAnalyticsAutoUpdate();
    
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
// =============================================================================
// 6. UPDATE ANALYTICS DASHBOARD
// =============================================================================

function updateAnalyticsDashboard(completedStats, statusStats) {
    try {
        // Completed Deliveries wildcard removed as requested
        // No longer updating analyticsCompletedCount and analyticsCompletedChange elements
        
        // Update Analytics Delayed Deliveries
        const analyticsDelayedEl = document.getElementById('analyticsDelayedCount');
        const analyticsDelayedChangeEl = document.getElementById('analyticsDelayedChange');
        
        if (analyticsDelayedEl) {
            analyticsDelayedEl.textContent = statusStats['Delayed'] || 0;
        }
        
        if (analyticsDelayedChangeEl) {
            const delayedCount = statusStats['Delayed'] || 0;
            const totalActive = (statusStats['In Transit'] || 0) + (statusStats['On Schedule'] || 0) + (statusStats['Delayed'] || 0);
            const delayedPercentage = totalActive > 0 ? Math.round((delayedCount / totalActive) * 100) : 0;
            
            analyticsDelayedChangeEl.className = delayedCount > 0 ? 'metric-change negative' : 'metric-change positive';
            analyticsDelayedChangeEl.innerHTML = `
                <i class="bi ${delayedCount > 0 ? 'bi-exclamation-triangle' : 'bi-check-circle'}"></i> 
                ${delayedPercentage}% of active deliveries
            `;
        }
        
        console.log('✅ Analytics Dashboard updated');
        
    } catch (error) {
        console.error('❌ Error updating Analytics Dashboard:', error);
    }
}

// Update analytics when switching to analytics view
function setupAnalyticsAutoUpdate() {
    const analyticsViewObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const analyticsView = document.getElementById('analyticsView');
                if (analyticsView && analyticsView.classList.contains('active')) {
                    setTimeout(() => {
                        const completedStats = calculateCompletedDeliveries();
                        const statusStats = calculateStatusBreakdown();
                        updateAnalyticsDashboard(completedStats, statusStats);
                    }, 500);
                }
            }
        });
    });
    
    const analyticsView = document.getElementById('analyticsView');
    if (analyticsView) {
        analyticsViewObserver.observe(analyticsView, { attributes: true });
        console.log('✅ Analytics Dashboard auto-update enabled');
    }
    
    // Also update analytics dashboard when data changes
    const updateAnalyticsOnDataChange = () => {
        const analyticsView = document.getElementById('analyticsView');
        if (analyticsView && analyticsView.classList.contains('active')) {
            const completedStats = calculateCompletedDeliveries();
            const statusStats = calculateStatusBreakdown();
            updateAnalyticsDashboard(completedStats, statusStats);
        }
    };
    
    // Listen for custom data update events
    window.addEventListener('deliveryDataUpdated', updateAnalyticsOnDataChange);
}