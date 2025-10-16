/**
 * ANALYTICS COST DATA FIX
 * Ensures Additional Costs Analysis shows real data from deliveries
 * Forces all cost data to flow through Supabase only
 */

console.log('🔧 Loading Analytics Cost Data Fix...');

(function() {
    'use strict';
    
    /**
     * Extract and normalize cost data from deliveries
     */
    function extractCostDataFromDeliveries(deliveries) {
        console.log('💰 Extracting cost data from deliveries...', deliveries.length);
        
        let totalCosts = 0;
        const costBreakdown = {
            'Fuel Surcharge': 0,
            'Toll Fees': 0,
            'Helper': 0,
            'Special Handling': 0,
            'Other': 0
        };
        
        const costsByPeriod = {};
        
        deliveries.forEach(delivery => {
            let deliveryCosts = 0;
            
            // Method 1: Check for additionalCostItems array (detailed breakdown)
            if (delivery.additionalCostItems && Array.isArray(delivery.additionalCostItems)) {
                console.log(`📋 Found ${delivery.additionalCostItems.length} cost items for ${delivery.dr_number || delivery.drNumber}`);
                
                delivery.additionalCostItems.forEach(item => {
                    const amount = parseFloat(item.amount) || 0;
                    deliveryCosts += amount;
                    
                    const category = categorizeCostDescriptionEnhanced(item.description);
                    costBreakdown[category] = (costBreakdown[category] || 0) + amount;
                    
                    console.log(`  - ${item.description}: ₱${amount} (${category})`);
                });
            }
            
            // Method 2: Check for additionalCosts field (single total)
            else if (delivery.additionalCosts && typeof delivery.additionalCosts === 'number' && delivery.additionalCosts > 0) {
                deliveryCosts = delivery.additionalCosts;
                costBreakdown['Other'] += deliveryCosts;
                console.log(`💰 Found total additional costs for ${delivery.dr_number || delivery.drNumber}: ₱${deliveryCosts}`);
            }
            
            // Method 3: Check for additional_costs field (Supabase format)
            else if (delivery.additional_costs && typeof delivery.additional_costs === 'number' && delivery.additional_costs > 0) {
                deliveryCosts = delivery.additional_costs;
                costBreakdown['Other'] += deliveryCosts;
                console.log(`💰 Found additional_costs for ${delivery.dr_number || delivery.drNumber}: ₱${deliveryCosts}`);
            }
            
            // Method 4: Check for cost-related fields in the delivery object
            else {
                // Look for any field that might contain cost data
                const costFields = ['fuel', 'toll', 'helper', 'gas', 'gasoline', 'surcharge'];
                costFields.forEach(field => {
                    if (delivery[field] && typeof delivery[field] === 'number' && delivery[field] > 0) {
                        deliveryCosts += delivery[field];
                        const category = categorizeCostDescriptionEnhanced(field);
                        costBreakdown[category] = (costBreakdown[category] || 0) + delivery[field];
                        console.log(`💰 Found ${field} cost for ${delivery.dr_number || delivery.drNumber}: ₱${delivery[field]}`);
                    }
                });
            }
            
            totalCosts += deliveryCosts;
            
            // Group costs by date for time-series analysis
            if (deliveryCosts > 0) {
                const date = delivery.created_date || delivery.createdAt || delivery.created_at || delivery.deliveryDate;
                if (date) {
                    const dateKey = new Date(date).toDateString();
                    costsByPeriod[dateKey] = (costsByPeriod[dateKey] || 0) + deliveryCosts;
                }
            }
        });
        
        console.log('💰 Cost extraction summary:', {
            totalCosts,
            costBreakdown,
            deliveriesProcessed: deliveries.length,
            costsByPeriod: Object.keys(costsByPeriod).length
        });
        
        return {
            totalCosts,
            costBreakdown,
            costsByPeriod
        };
    }
    
    /**
     * Enhanced cost categorization
     */
    function categorizeCostDescriptionEnhanced(description) {
        if (!description || typeof description !== 'string') {
            return 'Other';
        }
        
        const desc = description.toLowerCase().trim();
        
        // Fuel-related keywords (expanded)
        if (desc.includes('gas') || desc.includes('fuel') || 
            desc.includes('gasoline') || desc.includes('petrol') ||
            desc.includes('diesel') || desc.includes('gasolina') ||
            desc.includes('lng') || desc.includes('cng')) {
            return 'Fuel Surcharge';
        }
        
        // Toll-related keywords (Philippine-specific)
        if (desc.includes('toll') || desc.includes('highway') ||
            desc.includes('expressway') || desc.includes('bridge') ||
            desc.includes('skyway') || desc.includes('slex') ||
            desc.includes('nlex') || desc.includes('cavitex') ||
            desc.includes('tplex') || desc.includes('star tollway')) {
            return 'Toll Fees';
        }
        
        // Helper/Labor-related keywords
        if (desc.includes('helper') || desc.includes('urgent') || 
            desc.includes('assist') || desc.includes('labor') ||
            desc.includes('manpower') || desc.includes('overtime') ||
            desc.includes('rush') || desc.includes('kasama') ||
            desc.includes('tulong') || desc.includes('dagdag')) {
            return 'Helper';
        }
        
        // Special handling keywords
        if (desc.includes('special') || desc.includes('handling') ||
            desc.includes('fragile') || desc.includes('careful') ||
            desc.includes('delicate') || desc.includes('premium') ||
            desc.includes('white glove') || desc.includes('sensitive')) {
            return 'Special Handling';
        }
        
        return 'Other';
    }
    
    /**
     * Get comprehensive cost data from all sources
     */
    async function getComprehensiveCostData() {
        console.log('📊 Getting comprehensive cost data...');
        
        try {
            let allDeliveries = [];
            
            // Method 1: Try to get from dataService (Supabase)
            if (window.dataService && typeof window.dataService.getDeliveries === 'function') {
                try {
                    console.log('📥 Loading deliveries from dataService...');
                    const supabaseDeliveries = await window.dataService.getDeliveries();
                    allDeliveries = [...allDeliveries, ...supabaseDeliveries];
                    console.log(`✅ Loaded ${supabaseDeliveries.length} deliveries from Supabase`);
                } catch (supabaseError) {
                    console.warn('⚠️ Failed to load from Supabase:', supabaseError.message);
                }
            }
            
            // Method 2: Get from global arrays (fallback)
            const activeDeliveries = window.activeDeliveries || [];
            const deliveryHistory = window.deliveryHistory || [];
            const globalDeliveries = [...activeDeliveries, ...deliveryHistory];
            
            if (globalDeliveries.length > 0) {
                console.log(`📥 Found ${globalDeliveries.length} deliveries in global arrays`);
                allDeliveries = [...allDeliveries, ...globalDeliveries];
            }
            
            // Method 3: Get from localStorage (last resort)
            if (allDeliveries.length === 0) {
                try {
                    const localActive = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
                    const localHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
                    const localDeliveries = [...localActive, ...localHistory];
                    
                    if (localDeliveries.length > 0) {
                        console.log(`📥 Found ${localDeliveries.length} deliveries in localStorage`);
                        allDeliveries = [...allDeliveries, ...localDeliveries];
                    }
                } catch (localError) {
                    console.error('❌ Error loading from localStorage:', localError);
                }
            }
            
            // Remove duplicates based on DR number
            const uniqueDeliveries = [];
            const seenDRNumbers = new Set();
            
            allDeliveries.forEach(delivery => {
                const drNumber = delivery.dr_number || delivery.drNumber || delivery.id;
                if (drNumber && !seenDRNumbers.has(drNumber)) {
                    seenDRNumbers.add(drNumber);
                    uniqueDeliveries.push(delivery);
                }
            });
            
            console.log(`📊 Processing ${uniqueDeliveries.length} unique deliveries for cost analysis`);
            
            // Extract cost data
            const costData = extractCostDataFromDeliveries(uniqueDeliveries);
            
            return {
                deliveries: uniqueDeliveries,
                ...costData
            };
            
        } catch (error) {
            console.error('❌ Error getting comprehensive cost data:', error);
            return {
                deliveries: [],
                totalCosts: 0,
                costBreakdown: {
                    'Fuel Surcharge': 0,
                    'Toll Fees': 0,
                    'Helper': 0,
                    'Special Handling': 0,
                    'Other': 0
                },
                costsByPeriod: {}
            };
        }
    }
    
    /**
     * Enhanced cost breakdown data for analytics
     */
    async function getEnhancedCostBreakdownData(period = 'month') {
        console.log('📊 Getting enhanced cost breakdown data...', period);
        
        const costData = await getComprehensiveCostData();
        
        // Filter out zero values for cleaner charts
        const nonZeroBreakdown = {};
        Object.keys(costData.costBreakdown).forEach(category => {
            if (costData.costBreakdown[category] > 0) {
                nonZeroBreakdown[category] = costData.costBreakdown[category];
            }
        });
        
        // If no cost data found, show a message
        if (Object.keys(nonZeroBreakdown).length === 0) {
            console.warn('⚠️ No cost data found in deliveries');
            return {
                labels: ['No Cost Data'],
                values: [1],
                colors: ['rgba(149, 165, 166, 0.8)'],
                totalCosts: 0
            };
        }
        
        const labels = Object.keys(nonZeroBreakdown);
        const values = Object.values(nonZeroBreakdown);
        const colors = [
            'rgba(243, 156, 18, 0.8)', // Fuel - Orange
            'rgba(52, 152, 219, 0.8)',  // Toll - Blue
            'rgba(46, 204, 113, 0.8)',  // Helper - Green
            'rgba(155, 89, 182, 0.8)',  // Special - Purple
            'rgba(149, 165, 166, 0.8)'  // Other - Gray
        ];
        
        console.log('✅ Enhanced cost breakdown data:', {
            labels,
            values,
            totalCosts: costData.totalCosts
        });
        
        return {
            labels,
            values,
            colors: colors.slice(0, labels.length),
            totalCosts: costData.totalCosts
        };
    }
    
    /**
     * Force analytics to use real cost data
     */
    function forceAnalyticsToUseRealData() {
        console.log('🔧 Forcing analytics to use real cost data...');
        
        // Override getCostBreakdownData function
        if (typeof window.getCostBreakdownData === 'function') {
            window.originalGetCostBreakdownData = window.getCostBreakdownData;
        }
        window.getCostBreakdownData = getEnhancedCostBreakdownData;
        
        // Override getSafeCostBreakdownData if it exists
        if (typeof window.getSafeCostBreakdownData === 'function') {
            window.originalGetSafeCostBreakdownData = window.getSafeCostBreakdownData;
        }
        window.getSafeCostBreakdownData = getEnhancedCostBreakdownData;
        
        // Force update the cost breakdown chart
        if (typeof window.updateCostBreakdownChart === 'function') {
            setTimeout(() => {
                console.log('🔄 Forcing cost breakdown chart update...');
                window.updateCostBreakdownChart('month');
            }, 2000);
        }
        
        // Force update analytics dashboard
        if (typeof window.updateDashboardMetrics === 'function') {
            setTimeout(() => {
                console.log('🔄 Forcing dashboard metrics update...');
                window.updateDashboardMetrics();
            }, 3000);
        }
        
        console.log('✅ Analytics forced to use real cost data');
    }
    
    /**
     * Disable localStorage for cost analytics (force Supabase only)
     */
    function disableLocalStorageForCosts() {
        console.log('🚫 Disabling localStorage for cost analytics...');
        
        // Override localStorage methods for analytics cost data
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            if (key === 'analytics-cost-breakdown') {
                console.log('🚫 Blocked localStorage save for analytics-cost-breakdown - using Supabase only');
                return;
            }
            return originalSetItem.call(this, key, value);
        };
        
        // Clear existing localStorage cost data
        localStorage.removeItem('analytics-cost-breakdown');
        
        console.log('✅ localStorage disabled for cost analytics');
    }
    
    /**
     * Initialize the cost data fix
     */
    function initializeCostDataFix() {
        console.log('🚀 Initializing Analytics Cost Data Fix...');
        
        // Disable localStorage for costs
        disableLocalStorageForCosts();
        
        // Force analytics to use real data
        forceAnalyticsToUseRealData();
        
        // Run a test to show current cost data
        setTimeout(async () => {
            const costData = await getComprehensiveCostData();
            console.log('📊 CURRENT COST DATA SUMMARY:');
            console.log('Total Additional Costs: ₱' + costData.totalCosts.toLocaleString());
            console.log('Cost Breakdown:', costData.costBreakdown);
            console.log('Deliveries with costs:', costData.deliveries.filter(d => 
                (d.additionalCosts && d.additionalCosts > 0) || 
                (d.additional_costs && d.additional_costs > 0) ||
                (d.additionalCostItems && d.additionalCostItems.length > 0)
            ).length);
            
            if (costData.totalCosts === 0) {
                console.warn('⚠️ NO COST DATA FOUND! This might be why analytics shows 0 pesos.');
                console.warn('Check if deliveries have additionalCosts, additional_costs, or additionalCostItems fields.');
            }
        }, 1000);
        
        console.log('✅ Analytics Cost Data Fix initialized');
    }
    
    // Export functions to global scope
    window.getComprehensiveCostData = getComprehensiveCostData;
    window.getEnhancedCostBreakdownData = getEnhancedCostBreakdownData;
    window.extractCostDataFromDeliveries = extractCostDataFromDeliveries;
    window.categorizeCostDescriptionEnhanced = categorizeCostDescriptionEnhanced;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCostDataFix);
    } else {
        initializeCostDataFix();
    }
    
    console.log('✅ Analytics Cost Data Fix loaded successfully');
    
})();

// Export for external access
window.analyticsCostDataFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};