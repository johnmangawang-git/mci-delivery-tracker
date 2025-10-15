/**
 * ANALYTICS ERROR FIX
 * Fixes the analytics dashboard errors when Supabase schema is not yet applied
 * Provides graceful fallbacks and error handling
 */

console.log('🔧 Loading Analytics Error Fix...');

(function() {
    'use strict';
    
    /**
     * Safe cost breakdown data retrieval with fallbacks
     */
    async function getSafeCostBreakdownData(period = 'month') {
        console.log('📊 Getting safe cost breakdown data...', period);
        
        try {
            // First try the new Supabase method
            if (typeof window.getCostBreakdownAnalytics === 'function') {
                try {
                    const supabaseData = await window.getCostBreakdownAnalytics(period);
                    if (supabaseData && supabaseData.labels && supabaseData.labels.length > 0) {
                        console.log('✅ Using Supabase analytics data');
                        return supabaseData;
                    }
                } catch (supabaseError) {
                    console.warn('⚠️ Supabase analytics failed, falling back:', supabaseError.message);
                }
            }
            
            // Fallback to localStorage method
            console.log('📊 Falling back to localStorage analytics...');
            return getLocalStorageCostBreakdownData(period);
            
        } catch (error) {
            console.error('❌ All cost breakdown methods failed:', error);
            return getEmptyCostBreakdownData();
        }
    }
    
    /**
     * Get cost breakdown data from localStorage (fallback method)
     */
    function getLocalStorageCostBreakdownData(period) {
        try {
            // Get cost breakdown data from localStorage
            const drCostBreakdown = JSON.parse(localStorage.getItem('analytics-cost-breakdown') || '[]');
            
            // Get additional costs from active deliveries and delivery history
            const activeDeliveries = window.activeDeliveries || [];
            const deliveryHistory = window.deliveryHistory || [];
            const allDeliveries = [...activeDeliveries, ...deliveryHistory];
            
            // Process cost breakdown
            const costBreakdown = {
                'Fuel Surcharge': 0,
                'Toll Fees': 0,
                'Helper': 0,
                'Special Handling': 0,
                'Other': 0
            };
            
            // Add localStorage cost breakdown data
            drCostBreakdown.forEach(item => {
                const category = categorizeCostDescriptionSafe(item.description);
                costBreakdown[category] = (costBreakdown[category] || 0) + (item.amount || 0);
            });
            
            // Add delivery cost data
            allDeliveries.forEach(delivery => {
                if (delivery.additionalCostItems && Array.isArray(delivery.additionalCostItems)) {
                    delivery.additionalCostItems.forEach(item => {
                        const category = categorizeCostDescriptionSafe(item.description);
                        costBreakdown[category] = (costBreakdown[category] || 0) + (item.amount || 0);
                    });
                } else if (typeof delivery.additionalCosts === 'number' && delivery.additionalCosts > 0) {
                    costBreakdown['Other'] += delivery.additionalCosts;
                }
            });
            
            // Convert to chart format
            const labels = Object.keys(costBreakdown).filter(key => costBreakdown[key] > 0);
            const values = labels.map(label => costBreakdown[label]);
            const colors = [
                'rgba(243, 156, 18, 0.8)',
                'rgba(52, 152, 219, 0.8)',
                'rgba(46, 204, 113, 0.8)',
                'rgba(155, 89, 182, 0.8)',
                'rgba(149, 165, 166, 0.8)'
            ];
            
            console.log('✅ Using localStorage fallback data:', { labels, values });
            
            return { labels, values, colors };
            
        } catch (error) {
            console.error('❌ localStorage fallback failed:', error);
            return getEmptyCostBreakdownData();
        }
    }
    
    /**
     * Safe cost categorization function
     */
    function categorizeCostDescriptionSafe(description) {
        if (!description || typeof description !== 'string') {
            return 'Other';
        }
        
        const desc = description.toLowerCase().trim();
        
        // Fuel-related keywords
        if (desc.includes('gas') || desc.includes('fuel') || 
            desc.includes('gasoline') || desc.includes('petrol') ||
            desc.includes('diesel') || desc.includes('gasolina')) {
            return 'Fuel Surcharge';
        }
        
        // Toll-related keywords
        if (desc.includes('toll') || desc.includes('highway') ||
            desc.includes('expressway') || desc.includes('bridge') ||
            desc.includes('skyway') || desc.includes('slex') ||
            desc.includes('nlex') || desc.includes('cavitex')) {
            return 'Toll Fees';
        }
        
        // Helper/Labor-related keywords
        if (desc.includes('helper') || desc.includes('urgent') || 
            desc.includes('assist') || desc.includes('labor') ||
            desc.includes('manpower') || desc.includes('overtime') ||
            desc.includes('rush') || desc.includes('kasama')) {
            return 'Helper';
        }
        
        // Special handling keywords
        if (desc.includes('special') || desc.includes('handling') ||
            desc.includes('fragile') || desc.includes('careful') ||
            desc.includes('delicate') || desc.includes('premium')) {
            return 'Special Handling';
        }
        
        return 'Other';
    }
    
    /**
     * Get empty cost breakdown data (final fallback)
     */
    function getEmptyCostBreakdownData() {
        console.log('📊 Using empty cost breakdown data');
        return {
            labels: ['No Data'],
            values: [1],
            colors: ['rgba(149, 165, 166, 0.8)']
        };
    }
    
    /**
     * Safe chart update function
     */
    function safeUpdateCostBreakdownChart(period) {
        console.log('📊 Safe cost breakdown chart update...', period);
        
        getSafeCostBreakdownData(period).then(costBreakdownData => {
            try {
                // Find the chart instance
                let costBreakdownChart = null;
                
                // Try to get the chart from global scope
                if (window.costBreakdownChart) {
                    costBreakdownChart = window.costBreakdownChart;
                } else {
                    // Try to find the chart by canvas element
                    const canvas = document.getElementById('costBreakdownChart');
                    if (canvas && Chart.getChart) {
                        costBreakdownChart = Chart.getChart(canvas);
                    }
                }
                
                if (costBreakdownChart && costBreakdownData) {
                    // Safely update chart data
                    if (costBreakdownData.labels && costBreakdownData.values) {
                        costBreakdownChart.data.labels = costBreakdownData.labels;
                        costBreakdownChart.data.datasets[0].data = costBreakdownData.values;
                        
                        if (costBreakdownData.colors) {
                            costBreakdownChart.data.datasets[0].backgroundColor = costBreakdownData.colors;
                        }
                        
                        costBreakdownChart.update('none'); // Update without animation to prevent errors
                        console.log('✅ Cost breakdown chart updated successfully');
                    } else {
                        console.warn('⚠️ Invalid cost breakdown data structure');
                    }
                } else {
                    console.warn('⚠️ Cost breakdown chart not found or no data available');
                }
                
            } catch (chartError) {
                console.error('❌ Error updating cost breakdown chart:', chartError);
                
                // Try to recreate the chart if update failed
                try {
                    recreateCostBreakdownChart(costBreakdownData);
                } catch (recreateError) {
                    console.error('❌ Failed to recreate chart:', recreateError);
                }
            }
        }).catch(error => {
            console.error('❌ Failed to get cost breakdown data:', error);
        });
    }
    
    /**
     * Recreate cost breakdown chart if update fails
     */
    function recreateCostBreakdownChart(data) {
        console.log('🔄 Recreating cost breakdown chart...');
        
        const canvas = document.getElementById('costBreakdownChart');
        if (!canvas) {
            console.error('❌ Cost breakdown chart canvas not found');
            return;
        }
        
        // Destroy existing chart if it exists
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }
        
        // Create new chart
        const newChart = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: data.labels || ['No Data'],
                datasets: [{
                    data: data.values || [1],
                    backgroundColor: data.colors || ['rgba(149, 165, 166, 0.8)']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
        
        // Store chart reference globally
        window.costBreakdownChart = newChart;
        console.log('✅ Cost breakdown chart recreated successfully');
    }
    
    /**
     * Override problematic functions with safe versions
     */
    function applyAnalyticsErrorFixes() {
        console.log('🔧 Applying analytics error fixes...');
        
        // Override getCostBreakdownData if it exists
        if (typeof window.getCostBreakdownData === 'function') {
            window.originalGetCostBreakdownData = window.getCostBreakdownData;
        }
        window.getCostBreakdownData = getSafeCostBreakdownData;
        
        // Override updateCostBreakdownChart if it exists
        if (typeof window.updateCostBreakdownChart === 'function') {
            window.originalUpdateCostBreakdownChart = window.updateCostBreakdownChart;
        }
        window.updateCostBreakdownChart = safeUpdateCostBreakdownChart;
        
        // Add error handling to analytics dashboard update
        if (typeof window.updateAnalyticsDashboard === 'function') {
            const originalUpdateAnalyticsDashboard = window.updateAnalyticsDashboard;
            window.updateAnalyticsDashboard = function() {
                try {
                    return originalUpdateAnalyticsDashboard.apply(this, arguments);
                } catch (error) {
                    console.error('❌ Analytics dashboard update error (handled):', error);
                    // Continue execution instead of crashing
                }
            };
        }
        
        console.log('✅ Analytics error fixes applied');
    }
    
    /**
     * Initialize error fixes
     */
    function initializeAnalyticsErrorFix() {
        console.log('🚀 Initializing Analytics Error Fix...');
        
        // Apply fixes immediately
        applyAnalyticsErrorFixes();
        
        // Also apply fixes after a delay to catch late-loading scripts
        setTimeout(() => {
            applyAnalyticsErrorFixes();
        }, 2000);
        
        console.log('✅ Analytics Error Fix initialized');
    }
    
    // Export functions to global scope
    window.getSafeCostBreakdownData = getSafeCostBreakdownData;
    window.safeUpdateCostBreakdownChart = safeUpdateCostBreakdownChart;
    window.categorizeCostDescriptionSafe = categorizeCostDescriptionSafe;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAnalyticsErrorFix);
    } else {
        initializeAnalyticsErrorFix();
    }
    
    console.log('✅ Analytics Error Fix loaded successfully');
    
})();

// Export for external access
window.analyticsErrorFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};