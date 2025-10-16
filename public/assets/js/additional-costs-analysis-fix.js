/**
 * ADDITIONAL COSTS ANALYSIS FIX
 * Fixes ONLY the "Additional Costs Analysis" line chart to show real cost totals
 * Does NOT affect the "Additional Cost Breakdown" pie chart
 */

console.log('🔧 Loading Additional Costs Analysis Fix...');

(function() {
    'use strict';
    
    /**
     * Extract total additional costs from deliveries (multiple field formats)
     */
    function extractTotalAdditionalCosts(deliveries) {
        console.log('💰 Extracting total additional costs from deliveries...', deliveries.length);
        
        let totalCosts = 0;
        let deliveriesWithCosts = 0;
        
        deliveries.forEach(delivery => {
            let deliveryCost = 0;
            
            // Method 1: Check additionalCosts field (JavaScript format)
            if (delivery.additionalCosts && typeof delivery.additionalCosts === 'number' && delivery.additionalCosts > 0) {
                deliveryCost = delivery.additionalCosts;
            }
            // Method 2: Check additional_costs field (Supabase format)
            else if (delivery.additional_costs && typeof delivery.additional_costs === 'number' && delivery.additional_costs > 0) {
                deliveryCost = delivery.additional_costs;
            }
            // Method 3: Sum up additionalCostItems array
            else if (delivery.additionalCostItems && Array.isArray(delivery.additionalCostItems)) {
                deliveryCost = delivery.additionalCostItems.reduce((sum, item) => {
                    return sum + (parseFloat(item.amount) || 0);
                }, 0);
            }
            
            if (deliveryCost > 0) {
                totalCosts += deliveryCost;
                deliveriesWithCosts++;
                console.log(`💰 ${delivery.dr_number || delivery.drNumber}: ₱${deliveryCost.toLocaleString()}`);
            }
        });
        
        console.log(`💰 Total additional costs found: ₱${totalCosts.toLocaleString()} from ${deliveriesWithCosts} deliveries`);
        return totalCosts;
    }
    
    /**
     * Enhanced updateDashboardMetrics function that finds real cost data
     */
    function enhancedUpdateDashboardMetrics() {
        console.log('📊 Enhanced dashboard metrics update...');
        
        try {
            // Get deliveries from multiple sources
            let allDeliveries = [];
            
            // Source 1: Global arrays
            const activeDeliveries = window.activeDeliveries || [];
            const deliveryHistory = window.deliveryHistory || [];
            allDeliveries = [...activeDeliveries, ...deliveryHistory];
            
            // Source 2: Try to get from dataService if available
            if (allDeliveries.length === 0 && window.dataService) {
                console.log('📥 No global deliveries found, will use dataService when available');
            }
            
            // Source 3: localStorage fallback
            if (allDeliveries.length === 0) {
                try {
                    const localActive = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
                    const localHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
                    allDeliveries = [...localActive, ...localHistory];
                    console.log(`📥 Loaded ${allDeliveries.length} deliveries from localStorage`);
                } catch (error) {
                    console.error('❌ Error loading from localStorage:', error);
                }
            }
            
            console.log(`📊 Processing ${allDeliveries.length} deliveries for metrics`);
            
            // Calculate metrics
            const totalBookings = allDeliveries.length;
            const totalAdditionalCost = extractTotalAdditionalCosts(allDeliveries);
            const avgCostPerBooking = totalBookings > 0 ? totalAdditionalCost / totalBookings : 0;
            
            // Update UI elements
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
            
            console.log('📊 Enhanced dashboard metrics updated:', {
                totalBookings,
                totalAdditionalCost: `₱${totalAdditionalCost.toLocaleString()}`,
                avgCostPerBooking: `₱${avgCostPerBooking.toFixed(2)}`
            });
            
        } catch (error) {
            console.error('❌ Error in enhanced dashboard metrics update:', error);
        }
    }
    
    /**
     * Enhanced cost data processing for the costs chart (line chart)
     */
    function enhancedProcessCostData(deliveries, period) {
        console.log('📈 Enhanced cost data processing for costs chart...', period);
        
        const costsByPeriod = {};
        
        deliveries.forEach(delivery => {
            // Extract total cost for this delivery
            let deliveryCost = 0;
            
            if (delivery.additionalCosts && typeof delivery.additionalCosts === 'number') {
                deliveryCost = delivery.additionalCosts;
            } else if (delivery.additional_costs && typeof delivery.additional_costs === 'number') {
                deliveryCost = delivery.additional_costs;
            } else if (delivery.additionalCostItems && Array.isArray(delivery.additionalCostItems)) {
                deliveryCost = delivery.additionalCostItems.reduce((sum, item) => {
                    return sum + (parseFloat(item.amount) || 0);
                }, 0);
            }
            
            if (deliveryCost > 0) {
                // Group by time period
                const date = delivery.created_date || delivery.createdAt || delivery.created_at || delivery.deliveryDate;
                if (date) {
                    let periodKey;
                    const dateObj = new Date(date);
                    
                    switch (period) {
                        case 'day':
                            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                            periodKey = `${dayName} ${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
                            break;
                        case 'week':
                            const startOfWeek = new Date(dateObj);
                            startOfWeek.setDate(dateObj.getDate() - dateObj.getDay());
                            periodKey = `Week of ${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}`;
                            break;
                        case 'month':
                        default:
                            periodKey = dateObj.toLocaleString('default', { month: 'short' });
                            break;
                    }
                    
                    costsByPeriod[periodKey] = (costsByPeriod[periodKey] || 0) + deliveryCost;
                }
            }
        });
        
        // Generate labels and values for the chart
        let labels, values;
        
        if (period === 'day') {
            // Generate last 7 days
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayKey = `${dayName} ${date.getMonth() + 1}/${date.getDate()}`;
                last7Days.push(dayKey);
            }
            labels = last7Days;
            values = labels.map(label => costsByPeriod[label] || 0);
        } else {
            labels = Object.keys(costsByPeriod);
            values = Object.values(costsByPeriod);
        }
        
        console.log('📈 Enhanced cost data processed:', { labels, values, totalCosts: values.reduce((a, b) => a + b, 0) });
        
        return { labels, values };
    }
    
    /**
     * Override the analytics data loading to use enhanced cost processing
     */
    function enhanceAnalyticsDataLoading() {
        console.log('🔧 Enhancing analytics data loading...');
        
        // Store original loadAnalyticsData if it exists
        if (typeof window.loadAnalyticsData === 'function') {
            window.originalLoadAnalyticsData = window.loadAnalyticsData;
        }
        
        // Create enhanced loadAnalyticsData function
        window.loadAnalyticsData = async function(period = 'month') {
            console.log('📊 Enhanced loadAnalyticsData called with period:', period);
            
            try {
                // Get deliveries from multiple sources
                let allDeliveries = [];
                
                // Try global arrays first
                const activeDeliveries = window.activeDeliveries || [];
                const deliveryHistory = window.deliveryHistory || [];
                allDeliveries = [...activeDeliveries, ...deliveryHistory];
                
                // Try dataService if global arrays are empty
                if (allDeliveries.length === 0 && window.dataService && typeof window.dataService.getDeliveries === 'function') {
                    try {
                        allDeliveries = await window.dataService.getDeliveries();
                        console.log(`📥 Loaded ${allDeliveries.length} deliveries from dataService`);
                    } catch (error) {
                        console.warn('⚠️ DataService failed:', error.message);
                    }
                }
                
                // Fallback to localStorage
                if (allDeliveries.length === 0) {
                    try {
                        const localActive = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
                        const localHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
                        allDeliveries = [...localActive, ...localHistory];
                        console.log(`📥 Loaded ${allDeliveries.length} deliveries from localStorage`);
                    } catch (error) {
                        console.error('❌ Error loading from localStorage:', error);
                    }
                }
                
                console.log(`📊 Processing ${allDeliveries.length} deliveries for analytics`);
                
                // Process data for different chart types
                const bookingsData = processBookingsData(allDeliveries, period);
                const costsData = enhancedProcessCostData(allDeliveries, period); // Enhanced for costs chart
                const originData = processOriginData(allDeliveries);
                const costBreakdownData = processCostBreakdownData(allDeliveries); // Keep original for pie chart
                
                return {
                    bookings: bookingsData,
                    costs: costsData, // This is the enhanced costs data
                    origin: originData,
                    costBreakdown: costBreakdownData
                };
                
            } catch (error) {
                console.error('❌ Enhanced loadAnalyticsData failed:', error);
                
                // Return empty data as fallback
                return {
                    bookings: { labels: [], values: [] },
                    costs: { labels: [], values: [] },
                    origin: { labels: [], values: [] },
                    costBreakdown: { labels: [], values: [] }
                };
            }
        };
        
        console.log('✅ Analytics data loading enhanced');
    }
    
    /**
     * Helper functions for processing other chart data (keep original logic)
     */
    function processBookingsData(deliveries, period) {
        const bookingsByPeriod = {};
        
        deliveries.forEach(delivery => {
            const date = delivery.created_date || delivery.createdAt || delivery.created_at || delivery.deliveryDate;
            if (date) {
                let periodKey;
                const dateObj = new Date(date);
                
                switch (period) {
                    case 'day':
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                        periodKey = `${dayName} ${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
                        break;
                    case 'week':
                        const startOfWeek = new Date(dateObj);
                        startOfWeek.setDate(dateObj.getDate() - dateObj.getDay());
                        periodKey = `Week of ${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}`;
                        break;
                    case 'month':
                    default:
                        periodKey = dateObj.toLocaleString('default', { month: 'short' });
                        break;
                }
                
                bookingsByPeriod[periodKey] = (bookingsByPeriod[periodKey] || 0) + 1;
            }
        });
        
        const labels = Object.keys(bookingsByPeriod);
        const values = Object.values(bookingsByPeriod);
        
        return { labels, values };
    }
    
    function processOriginData(deliveries) {
        const originCount = {};
        
        deliveries.forEach(delivery => {
            const origin = delivery.origin || 'Unknown';
            originCount[origin] = (originCount[origin] || 0) + 1;
        });
        
        const labels = Object.keys(originCount);
        const values = Object.values(originCount);
        
        return { labels, values };
    }
    
    function processCostBreakdownData(deliveries) {
        // Keep the original cost breakdown logic for the pie chart
        const costBreakdown = {
            'Fuel Surcharge': 0,
            'Toll Fees': 0,
            'Helper': 0,
            'Special Handling': 0,
            'Other': 0
        };
        
        deliveries.forEach(delivery => {
            if (delivery.additionalCostItems && Array.isArray(delivery.additionalCostItems)) {
                delivery.additionalCostItems.forEach(item => {
                    const amount = parseFloat(item.amount) || 0;
                    const category = categorizeCostDescription(item.description);
                    costBreakdown[category] = (costBreakdown[category] || 0) + amount;
                });
            } else if (delivery.additionalCosts && typeof delivery.additionalCosts === 'number' && delivery.additionalCosts > 0) {
                costBreakdown['Other'] += delivery.additionalCosts;
            } else if (delivery.additional_costs && typeof delivery.additional_costs === 'number' && delivery.additional_costs > 0) {
                costBreakdown['Other'] += delivery.additional_costs;
            }
        });
        
        const labels = Object.keys(costBreakdown).filter(key => costBreakdown[key] > 0);
        const values = labels.map(label => costBreakdown[label]);
        
        return { labels, values };
    }
    
    function categorizeCostDescription(description) {
        if (!description) return 'Other';
        
        const desc = description.toLowerCase();
        
        if (desc.includes('fuel') || desc.includes('gas') || desc.includes('gasoline')) {
            return 'Fuel Surcharge';
        }
        if (desc.includes('toll') || desc.includes('highway') || desc.includes('expressway')) {
            return 'Toll Fees';
        }
        if (desc.includes('helper') || desc.includes('urgent') || desc.includes('assist')) {
            return 'Helper';
        }
        if (desc.includes('special') || desc.includes('handling') || desc.includes('fragile')) {
            return 'Special Handling';
        }
        
        return 'Other';
    }
    
    /**
     * Initialize the fix
     */
    function initializeAdditionalCostsAnalysisFix() {
        console.log('🚀 Initializing Additional Costs Analysis Fix...');
        
        // Override updateDashboardMetrics
        if (typeof window.updateDashboardMetrics === 'function') {
            window.originalUpdateDashboardMetrics = window.updateDashboardMetrics;
        }
        window.updateDashboardMetrics = enhancedUpdateDashboardMetrics;
        
        // Enhance analytics data loading
        enhanceAnalyticsDataLoading();
        
        // Force update after initialization
        setTimeout(() => {
            console.log('🔄 Forcing dashboard metrics update...');
            enhancedUpdateDashboardMetrics();
            
            // Force costs chart update if function exists
            if (typeof window.updateCostsChart === 'function') {
                window.updateCostsChart('month');
            }
        }, 2000);
        
        console.log('✅ Additional Costs Analysis Fix initialized');
    }
    
    // Export functions to global scope
    window.extractTotalAdditionalCosts = extractTotalAdditionalCosts;
    window.enhancedUpdateDashboardMetrics = enhancedUpdateDashboardMetrics;
    window.enhancedProcessCostData = enhancedProcessCostData;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAdditionalCostsAnalysisFix);
    } else {
        initializeAdditionalCostsAnalysisFix();
    }
    
    console.log('✅ Additional Costs Analysis Fix loaded successfully');
    
})();

// Export for external access
window.additionalCostsAnalysisFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};