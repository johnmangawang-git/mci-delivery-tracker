/**
 * DISABLE LOCALSTORAGE ANALYTICS FALLBACK
 * Temporarily disables localStorage fallback for analytics to force Supabase-only data usage
 * This helps identify if DR uploads are properly saving cost data to Supabase
 */

console.log('🔧 Loading Disable localStorage Analytics Fallback...');

(function() {
    'use strict';
    
    /**
     * Override the analytics data loading to use ONLY Supabase
     */
    function disableLocalStorageFallback() {
        console.log('🚫 Disabling localStorage fallback for analytics...');
        
        // Override the enhanced cost breakdown function to skip localStorage
        if (window.getEnhancedCostBreakdownData) {
            const originalFunction = window.getEnhancedCostBreakdownData;
            
            window.getEnhancedCostBreakdownData = async function(period = 'month') {
                console.log('📊 SUPABASE-ONLY: Getting cost breakdown data (localStorage disabled)...', period);
                
                const categoryTotals = {
                    'Fuel Surcharge': 0,
                    'Toll Fees': 0,
                    'Helper': 0,
                    'Special Handling': 0,
                    'Parking/Storage': 0,
                    'Other': 0
                };
                
                try {
                    // ONLY Method 1: Supabase additional_cost_items table
                    if (window.supabaseClient) {
                        console.log('🔍 SUPABASE-ONLY: Checking additional_cost_items table...');
                        
                        const client = window.supabaseClient();
                        if (client) {
                            const { data: costItems, error } = await client
                                .from('additional_cost_items')
                                .select('description, amount, category');
                            
                            if (!error && costItems && costItems.length > 0) {
                                console.log(`✅ SUPABASE-ONLY: Found ${costItems.length} cost items in additional_cost_items table`);
                                
                                costItems.forEach(item => {
                                    const category = item.category || window.categorizeCostDescription(item.description);
                                    const amount = parseFloat(item.amount) || 0;
                                    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
                                });
                                
                                console.log('📊 SUPABASE-ONLY: Cost breakdown from additional_cost_items:', categoryTotals);
                                return formatChartDataSupabaseOnly(categoryTotals);
                            } else {
                                console.log('⚠️ SUPABASE-ONLY: No cost items found in additional_cost_items table');
                            }
                        }
                    }
                    
                    // ONLY Method 2: Supabase deliveries table with JSONB cost items
                    if (window.supabaseClient) {
                        console.log('🔍 SUPABASE-ONLY: Checking deliveries table...');
                        
                        const client = window.supabaseClient();
                        if (client) {
                            const { data: deliveries, error } = await client
                                .from('deliveries')
                                .select('additional_cost_items, additional_costs, dr_number')
                                .gt('additional_costs', 0);
                            
                            if (!error && deliveries && deliveries.length > 0) {
                                console.log(`✅ SUPABASE-ONLY: Found ${deliveries.length} deliveries with costs in deliveries table`);
                                
                                deliveries.forEach(delivery => {
                                    console.log(`📋 Processing delivery ${delivery.dr_number}:`, {
                                        additional_cost_items: delivery.additional_cost_items,
                                        additional_costs: delivery.additional_costs
                                    });
                                    
                                    if (delivery.additional_cost_items && Array.isArray(delivery.additional_cost_items)) {
                                        delivery.additional_cost_items.forEach(item => {
                                            const category = item.category || window.categorizeCostDescription(item.description);
                                            const amount = parseFloat(item.amount) || 0;
                                            categoryTotals[category] = (categoryTotals[category] || 0) + amount;
                                            console.log(`  ✅ Added: ${item.description} = ₱${amount} (${category})`);
                                        });
                                    } else if (delivery.additional_costs > 0) {
                                        // Fallback: add to Other category
                                        categoryTotals['Other'] += parseFloat(delivery.additional_costs);
                                        console.log(`  ⚠️ Added to Other: ₱${delivery.additional_costs} (no breakdown available)`);
                                    }
                                });
                                
                                console.log('📊 SUPABASE-ONLY: Cost breakdown from deliveries table:', categoryTotals);
                                return formatChartDataSupabaseOnly(categoryTotals);
                            } else {
                                console.log('⚠️ SUPABASE-ONLY: No deliveries with costs found in deliveries table');
                            }
                        }
                    }
                    
                    // NO localStorage fallback - this is intentionally disabled
                    console.log('🚫 SUPABASE-ONLY: localStorage fallback is DISABLED');
                    console.log('🚫 SUPABASE-ONLY: Global variables fallback is DISABLED');
                    
                    console.log('❌ SUPABASE-ONLY: No cost data found in Supabase - returning empty data');
                    return formatChartDataSupabaseOnly(categoryTotals);
                    
                } catch (error) {
                    console.error('❌ SUPABASE-ONLY: Error getting cost breakdown data:', error);
                    return formatChartDataSupabaseOnly(categoryTotals);
                }
            };
            
            console.log('✅ Enhanced cost breakdown function overridden (localStorage disabled)');
        }
        
        // Override the main analytics data loading function
        if (window.loadAnalyticsData) {
            const originalLoadAnalyticsData = window.loadAnalyticsData;
            
            window.loadAnalyticsData = async function(period = 'month') {
                console.log('📊 SUPABASE-ONLY: Loading analytics data (localStorage disabled)...', period);
                
                try {
                    // Get deliveries from Supabase ONLY
                    let allDeliveries = [];
                    
                    if (window.dataService && typeof window.dataService.getDeliveries === 'function') {
                        try {
                            const supabaseDeliveries = await window.dataService.getDeliveries();
                            if (supabaseDeliveries && supabaseDeliveries.length > 0) {
                                allDeliveries = supabaseDeliveries;
                                console.log(`✅ SUPABASE-ONLY: Using ${allDeliveries.length} deliveries from Supabase`);
                            } else {
                                console.log('⚠️ SUPABASE-ONLY: No deliveries found in Supabase');
                                allDeliveries = [];
                            }
                        } catch (supabaseError) {
                            console.error('❌ SUPABASE-ONLY: Error loading deliveries from Supabase:', supabaseError);
                            allDeliveries = [];
                        }
                    } else {
                        console.log('❌ SUPABASE-ONLY: DataService not available');
                        allDeliveries = [];
                    }
                    
                    // NO localStorage fallback - this is intentionally disabled
                    console.log('🚫 SUPABASE-ONLY: localStorage fallback is DISABLED');
                    
                    // Process data for charts based on period using ONLY Supabase data
                    let bookingsData, costsData, originData, costBreakdownData;
                    
                    switch(period) {
                        case 'week':
                            ({ bookingsData, costsData, originData, costBreakdownData } = processDataByWeek(allDeliveries));
                            break;
                        case 'month':
                            ({ bookingsData, costsData, originData, costBreakdownData } = processDataByMonth(allDeliveries));
                            break;
                        case 'day':
                        default:
                            ({ bookingsData, costsData, originData, costBreakdownData } = processDataByDay(allDeliveries));
                            break;
                    }
                    
                    console.log('📊 SUPABASE-ONLY: Analytics data processed:', {
                        deliveries: allDeliveries.length,
                        bookings: bookingsData.values.reduce((a, b) => a + b, 0),
                        totalCosts: costsData.values.reduce((a, b) => a + b, 0),
                        costBreakdown: costBreakdownData.values.reduce((a, b) => a + b, 0)
                    });
                    
                    return {
                        bookings: bookingsData,
                        costs: costsData,
                        origin: originData,
                        costBreakdown: costBreakdownData
                    };
                    
                } catch (error) {
                    console.error('❌ SUPABASE-ONLY: Error loading analytics data:', error);
                    // Return empty data instead of falling back to localStorage
                    return {
                        bookings: { labels: [], values: [] },
                        costs: { labels: [], values: [] },
                        origin: { labels: [], values: [] },
                        costBreakdown: { labels: [], values: [] }
                    };
                }
            };
            
            console.log('✅ Main analytics data loading function overridden (localStorage disabled)');
        }
        
        // Override the dashboard metrics update to use ONLY Supabase
        if (window.updateDashboardMetrics) {
            const originalUpdateDashboardMetrics = window.updateDashboardMetrics;
            
            window.updateDashboardMetrics = async function() {
                console.log('📊 SUPABASE-ONLY: Updating dashboard metrics (localStorage disabled)...');
                
                try {
                    // Get deliveries from Supabase ONLY
                    let activeDeliveries = [];
                    let deliveryHistory = [];
                    
                    if (window.dataService && typeof window.dataService.getDeliveries === 'function') {
                        try {
                            const allDeliveries = await window.dataService.getDeliveries();
                            if (allDeliveries && allDeliveries.length > 0) {
                                // Separate active and completed deliveries
                                activeDeliveries = allDeliveries.filter(d => d.status !== 'Completed' && d.status !== 'Signed');
                                deliveryHistory = allDeliveries.filter(d => d.status === 'Completed' || d.status === 'Signed');
                                
                                console.log(`✅ SUPABASE-ONLY: Loaded ${activeDeliveries.length} active + ${deliveryHistory.length} completed deliveries`);
                            }
                        } catch (error) {
                            console.error('❌ SUPABASE-ONLY: Error loading deliveries for metrics:', error);
                        }
                    }
                    
                    // NO localStorage fallback - this is intentionally disabled
                    console.log('🚫 SUPABASE-ONLY: localStorage fallback is DISABLED for metrics');
                    
                    // Calculate metrics from Supabase data only
                    const totalBookings = activeDeliveries.length + deliveryHistory.length;
                    
                    let totalAdditionalCost = 0;
                    [...activeDeliveries, ...deliveryHistory].forEach(delivery => {
                        if (typeof delivery.additional_costs === 'number') {
                            totalAdditionalCost += delivery.additional_costs;
                        }
                    });
                    
                    const avgCostPerBooking = totalBookings > 0 ? totalAdditionalCost / totalBookings : 0;
                    
                    // Update the UI elements
                    const totalBookingsElement = document.querySelector('.metric-card:nth-child(1) .metric-value');
                    const totalAdditionalCostElement = document.querySelector('.metric-card:nth-child(2) .metric-value');
                    const avgCostPerBookingElement = document.querySelector('.metric-card:nth-child(3) .metric-value .crossed-out');
                    
                    if (totalBookingsElement) {
                        totalBookingsElement.textContent = totalBookings;
                    }
                    
                    if (totalAdditionalCostElement) {
                        totalAdditionalCostElement.textContent = `₱${totalAdditionalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                    }
                    
                    if (avgCostPerBookingElement) {
                        avgCostPerBookingElement.textContent = `₱${avgCostPerBooking.toFixed(2)}`;
                    }
                    
                    console.log('📊 SUPABASE-ONLY: Dashboard metrics updated:', {
                        totalBookings,
                        totalAdditionalCost,
                        avgCostPerBooking
                    });
                    
                } catch (error) {
                    console.error('❌ SUPABASE-ONLY: Error updating dashboard metrics:', error);
                }
            };
            
            console.log('✅ Dashboard metrics function overridden (localStorage disabled)');
        }
    }
    
    /**
     * Format data for Chart.js (Supabase-only version)
     */
    function formatChartDataSupabaseOnly(categoryTotals) {
        // Filter out categories with zero values
        const nonZeroCategories = Object.entries(categoryTotals)
            .filter(([category, amount]) => amount > 0);
        
        if (nonZeroCategories.length === 0) {
            console.log('📊 SUPABASE-ONLY: No cost data to display');
            return {
                labels: ['No Supabase Data'],
                values: [1],
                colors: ['rgba(231, 76, 60, 0.8)'] // Red to indicate no data
            };
        }
        
        const labels = nonZeroCategories.map(([category]) => category);
        const values = nonZeroCategories.map(([, amount]) => amount);
        
        const colors = [
            'rgba(243, 156, 18, 0.8)', // Fuel - Orange
            'rgba(52, 152, 219, 0.8)',  // Toll - Blue
            'rgba(46, 204, 113, 0.8)',  // Helper - Green
            'rgba(155, 89, 182, 0.8)',  // Special - Purple
            'rgba(231, 76, 60, 0.8)',   // Parking - Red
            'rgba(149, 165, 166, 0.8)'  // Other - Gray
        ];
        
        return {
            labels,
            values,
            colors: colors.slice(0, labels.length)
        };
    }
    
    /**
     * Add visual indicator that localStorage fallback is disabled (DISABLED)
     */
    function addVisualIndicator() {
        // Visual indicator disabled - no banner will be shown
        console.log('✅ Visual indicator disabled - no banner shown');
    }
    
    /**
     * Remove visual indicator and restore localStorage fallback
     */
    function enableLocalStorageFallback() {
        console.log('🔄 Re-enabling localStorage fallback...');
        
        // Remove visual indicator
        const banner = document.getElementById('supabase-only-banner');
        if (banner) {
            banner.remove();
            document.body.style.paddingTop = '';
        }
        
        // Reload the page to restore original functions
        if (confirm('localStorage fallback will be re-enabled. The page will reload to restore original functionality. Continue?')) {
            window.location.reload();
        }
    }
    
    /**
     * Initialize the localStorage fallback disabler
     */
    function initializeSupabaseOnlyMode() {
        console.log('🚀 Initializing Supabase-Only Mode...');
        
        // Wait for other scripts to load
        setTimeout(() => {
            disableLocalStorageFallback();
            // addVisualIndicator(); // Disabled - no banner shown
            
            // Export control functions globally
            window.enableLocalStorageFallback = enableLocalStorageFallback;
            window.disableLocalStorageFallback = disableLocalStorageFallback;
            
            // Auto-refresh analytics if available
            setTimeout(() => {
                if (window.initAnalyticsCharts) {
                    console.log('🔄 Auto-refreshing analytics in Supabase-only mode...');
                    window.initAnalyticsCharts('month');
                }
                
                if (window.updateDashboardMetrics) {
                    window.updateDashboardMetrics();
                }
            }, 2000);
            
            console.log('✅ Supabase-Only Mode initialized successfully');
            console.log('💡 Use window.enableLocalStorageFallback() to restore localStorage fallback');
            
        }, 3000);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSupabaseOnlyMode);
    } else {
        initializeSupabaseOnlyMode();
    }
    
    console.log('✅ Disable localStorage Analytics Fallback loaded');
    
})();

// Export module info
window.disableLocalStorageAnalyticsFallback = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};