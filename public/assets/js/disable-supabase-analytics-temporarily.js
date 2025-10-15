/**
 * DISABLE SUPABASE ANALYTICS TEMPORARILY
 * Completely disables Supabase analytics calls until schema is applied
 * Forces all analytics to use localStorage data only
 */

console.log('🔧 Loading Temporary Supabase Analytics Disable...');

(function() {
    'use strict';
    
    /**
     * Override getCostBreakdownAnalytics to always use localStorage
     */
    function disableSupabaseAnalytics() {
        console.log('🚫 Disabling Supabase analytics calls temporarily...');
        
        // Override the Supabase analytics function to always fail gracefully
        window.getCostBreakdownAnalytics = async function(period = 'month') {
            console.log('📊 Supabase analytics disabled, using localStorage fallback');
            
            // Always throw an error to force fallback
            throw new Error('Supabase analytics temporarily disabled - schema not applied');
        };
        
        // Override the additional costs fix to not try Supabase
        if (window.additionalCostsSupabaseFix) {
            console.log('🔧 Overriding additional costs Supabase integration...');
            
            // Store original function
            window.originalGetCostBreakdownAnalytics = window.getCostBreakdownAnalytics;
            
            // Replace with localStorage-only version
            window.getCostBreakdownAnalytics = async function(period = 'month') {
                console.log('📊 Using localStorage-only analytics (Supabase disabled)');
                return getLocalStorageAnalytics(period);
            };
        }
        
        console.log('✅ Supabase analytics calls disabled');
    }
    
    /**
     * Get analytics data from localStorage only
     */
    function getLocalStorageAnalytics(period) {
        console.log('📊 Getting analytics from localStorage only...', period);
        
        try {
            // Get cost breakdown data from localStorage
            const drCostBreakdown = JSON.parse(localStorage.getItem('analytics-cost-breakdown') || '[]');
            
            // Get additional costs from deliveries
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
                const category = categorizeCostLocal(item.description);
                costBreakdown[category] = (costBreakdown[category] || 0) + (item.amount || 0);
            });
            
            // Add delivery cost data
            allDeliveries.forEach(delivery => {
                if (delivery.additionalCostItems && Array.isArray(delivery.additionalCostItems)) {
                    delivery.additionalCostItems.forEach(item => {
                        const category = categorizeCostLocal(item.description);
                        costBreakdown[category] = (costBreakdown[category] || 0) + (item.amount || 0);
                    });
                } else if (typeof delivery.additionalCosts === 'number' && delivery.additionalCosts > 0) {
                    costBreakdown['Other'] += delivery.additionalCosts;
                }
            });
            
            // Filter out zero values and convert to chart format
            const labels = Object.keys(costBreakdown).filter(key => costBreakdown[key] > 0);
            const values = labels.map(label => costBreakdown[label]);
            
            // If no data, show placeholder
            if (labels.length === 0) {
                return {
                    labels: ['No Cost Data'],
                    values: [1],
                    colors: ['rgba(149, 165, 166, 0.8)']
                };
            }
            
            const colors = [
                'rgba(243, 156, 18, 0.8)',  // Fuel Surcharge
                'rgba(52, 152, 219, 0.8)',   // Toll Fees
                'rgba(46, 204, 113, 0.8)',   // Helper
                'rgba(155, 89, 182, 0.8)',   // Special Handling
                'rgba(149, 165, 166, 0.8)'   // Other
            ];
            
            console.log('✅ LocalStorage analytics data:', { labels, values });
            
            return { labels, values, colors };
            
        } catch (error) {
            console.error('❌ LocalStorage analytics failed:', error);
            return {
                labels: ['No Data Available'],
                values: [1],
                colors: ['rgba(149, 165, 166, 0.8)']
            };
        }
    }
    
    /**
     * Local cost categorization function
     */
    function categorizeCostLocal(description) {
        if (!description || typeof description !== 'string') {
            return 'Other';
        }
        
        const desc = description.toLowerCase().trim();
        
        if (desc.includes('gas') || desc.includes('fuel') || 
            desc.includes('gasoline') || desc.includes('petrol') ||
            desc.includes('diesel') || desc.includes('gasolina')) {
            return 'Fuel Surcharge';
        }
        
        if (desc.includes('toll') || desc.includes('highway') ||
            desc.includes('expressway') || desc.includes('bridge') ||
            desc.includes('skyway') || desc.includes('slex') ||
            desc.includes('nlex') || desc.includes('cavitex')) {
            return 'Toll Fees';
        }
        
        if (desc.includes('helper') || desc.includes('urgent') || 
            desc.includes('assist') || desc.includes('labor') ||
            desc.includes('manpower') || desc.includes('overtime') ||
            desc.includes('rush') || desc.includes('kasama')) {
            return 'Helper';
        }
        
        if (desc.includes('special') || desc.includes('handling') ||
            desc.includes('fragile') || desc.includes('careful') ||
            desc.includes('delicate') || desc.includes('premium')) {
            return 'Special Handling';
        }
        
        return 'Other';
    }
    
    /**
     * Override updateAnalyticsWithCostBreakdown to ensure it works
     */
    function ensureAnalyticsUpdate() {
        console.log('🔧 Ensuring analytics update function works...');
        
        // Make sure this function exists and works
        window.updateAnalyticsWithCostBreakdown = function(costBreakdown) {
            console.log('📊 Updating analytics with cost breakdown (localStorage):', costBreakdown);
            
            try {
                // Get existing cost breakdown data from localStorage
                let existingBreakdown = JSON.parse(localStorage.getItem('analytics-cost-breakdown') || '[]');
                
                // Add new cost breakdown items
                if (costBreakdown && Array.isArray(costBreakdown)) {
                    costBreakdown.forEach(cost => {
                        const existingIndex = existingBreakdown.findIndex(item => item.description === cost.description);
                        
                        if (existingIndex >= 0) {
                            // Update existing cost category
                            existingBreakdown[existingIndex].amount += (cost.amount || 0);
                            existingBreakdown[existingIndex].count = (existingBreakdown[existingIndex].count || 0) + 1;
                            existingBreakdown[existingIndex].lastUpdated = new Date().toISOString();
                        } else {
                            // Add new cost category
                            existingBreakdown.push({
                                description: cost.description || 'Unknown',
                                amount: cost.amount || 0,
                                count: 1,
                                lastUpdated: new Date().toISOString()
                            });
                        }
                    });
                }
                
                // Save updated breakdown
                localStorage.setItem('analytics-cost-breakdown', JSON.stringify(existingBreakdown));
                
                console.log('✅ Analytics cost breakdown updated in localStorage:', existingBreakdown);
                
                // Trigger chart update if function exists
                if (typeof window.updateCostBreakdownChart === 'function') {
                    setTimeout(() => {
                        window.updateCostBreakdownChart('month');
                    }, 100);
                }
                
            } catch (error) {
                console.error('❌ Error updating analytics cost breakdown:', error);
            }
        };
        
        console.log('✅ Analytics update function ensured');
    }
    
    /**
     * Show user-friendly message about schema
     */
    function showSchemaMessage() {
        console.log('📢 SUPABASE SCHEMA NOTICE:');
        console.log('='.repeat(50));
        console.log('🔧 Additional Costs analytics is using localStorage fallback');
        console.log('📊 To enable full Supabase integration:');
        console.log('   1. Open Supabase Dashboard > SQL Editor');
        console.log('   2. Copy content from supabase/schema-additional-costs.sql');
        console.log('   3. Paste and run the SQL');
        console.log('   4. Refresh your application');
        console.log('✅ Current functionality: Working with localStorage data');
        console.log('='.repeat(50));
    }
    
    /**
     * Initialize the temporary disable
     */
    function initializeTemporaryDisable() {
        console.log('🚀 Initializing temporary Supabase analytics disable...');
        
        // Disable Supabase analytics
        disableSupabaseAnalytics();
        
        // Ensure analytics update works
        ensureAnalyticsUpdate();
        
        // Show informative message
        showSchemaMessage();
        
        console.log('✅ Temporary Supabase analytics disable applied');
    }
    
    // Export functions
    window.getLocalStorageAnalytics = getLocalStorageAnalytics;
    window.categorizeCostLocal = categorizeCostLocal;
    
    // Initialize immediately
    initializeTemporaryDisable();
    
    // Also initialize after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTemporaryDisable);
    }
    
    console.log('✅ Temporary Supabase Analytics Disable loaded successfully');
    
})();

// Export for external access
window.disableSupabaseAnalyticsTemporarily = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};