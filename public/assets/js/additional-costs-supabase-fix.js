/**
 * ADDITIONAL COSTS SUPABASE FIX
 * Ensures all additional cost breakdown data is saved to Supabase instead of localStorage
 * Integrates with the new additional_cost_items table and enhanced deliveries schema
 */

console.log('🔧 Loading Additional Costs Supabase Fix...');

(function() {
    'use strict';
    
    /**
     * Enhanced cost categorization function
     */
    function categorizeCostDescription(description) {
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
        
        // Default category
        return 'Other';
    }
    
    /**
     * Save additional cost items to Supabase
     */
    async function saveAdditionalCostItems(deliveryId, costItems) {
        console.log('💾 Saving additional cost items to Supabase...', { deliveryId, costItems });
        
        if (!deliveryId || !costItems || !Array.isArray(costItems) || costItems.length === 0) {
            console.log('📊 No cost items to save');
            return [];
        }
        
        try {
            // Ensure Supabase client is ready
            const client = await window.getSafeSupabaseClient();
            if (!client) {
                throw new Error('Supabase client not available');
            }
            
            // First, delete existing cost items for this delivery
            const { error: deleteError } = await client
                .from('additional_cost_items')
                .delete()
                .eq('delivery_id', deliveryId);
            
            if (deleteError) {
                console.warn('⚠️ Error deleting existing cost items:', deleteError);
            }
            
            // Prepare cost items for insertion
            const costItemsToInsert = costItems.map(item => ({
                delivery_id: deliveryId,
                description: item.description || '',
                amount: parseFloat(item.amount) || 0,
                category: categorizeCostDescription(item.description || ''),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));
            
            console.log('📤 Inserting cost items:', costItemsToInsert);
            
            // Insert new cost items
            const { data, error } = await client
                .from('additional_cost_items')
                .insert(costItemsToInsert)
                .select();
            
            if (error) {
                console.error('❌ Error saving cost items to Supabase:', error);
                throw error;
            }
            
            console.log('✅ Cost items saved to Supabase:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Failed to save cost items to Supabase:', error);
            throw error;
        }
    }
    
    /**
     * Get additional cost items from Supabase
     */
    async function getAdditionalCostItems(deliveryId) {
        console.log('📥 Getting additional cost items from Supabase...', deliveryId);
        
        if (!deliveryId) {
            return [];
        }
        
        try {
            // Ensure Supabase client is ready
            const client = await window.getSafeSupabaseClient();
            if (!client) {
                throw new Error('Supabase client not available');
            }
            
            const { data, error } = await client
                .from('additional_cost_items')
                .select('*')
                .eq('delivery_id', deliveryId)
                .order('created_at', { ascending: true });
            
            if (error) {
                console.error('❌ Error getting cost items from Supabase:', error);
                throw error;
            }
            
            console.log('✅ Cost items retrieved from Supabase:', data);
            return data || [];
            
        } catch (error) {
            console.error('❌ Failed to get cost items from Supabase:', error);
            return [];
        }
    }
    
    /**
     * Get cost breakdown analytics from Supabase
     */
    async function getCostBreakdownAnalytics(period = 'month') {
        console.log('📊 Getting cost breakdown analytics from Supabase...', period);
        
        try {
            // Ensure Supabase client is ready
            const client = await window.getSafeSupabaseClient();
            if (!client) {
                throw new Error('Supabase client not available');
            }
            
            // Use the analytics view
            const { data, error } = await client
                .from('cost_breakdown_analytics')
                .select('*')
                .order('total_amount', { ascending: false });
            
            if (error) {
                console.error('❌ Error getting cost breakdown analytics:', error);
                throw error;
            }
            
            console.log('✅ Cost breakdown analytics retrieved:', data);
            
            // Process data for charts
            const categoryTotals = {};
            
            (data || []).forEach(item => {
                const category = item.category || 'Other';
                categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(item.total_amount || 0);
            });
            
            return {
                labels: Object.keys(categoryTotals),
                values: Object.values(categoryTotals),
                colors: [
                    'rgba(243, 156, 18, 0.8)',
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(149, 165, 166, 0.8)'
                ]
            };
            
        } catch (error) {
            console.error('❌ Failed to get cost breakdown analytics:', error);
            return { labels: [], values: [], colors: [] };
        }
    }
    
    /**
     * Enhanced dataService saveDelivery to handle cost items
     */
    function enhanceDataServiceWithCostItems() {
        console.log('🔗 Enhancing dataService with cost items support...');
        
        if (!window.dataService) {
            console.warn('⚠️ DataService not available, will retry later');
            return;
        }
        
        // Store original saveDelivery method
        const originalSaveDelivery = window.dataService.saveDelivery.bind(window.dataService);
        
        // Override saveDelivery to handle cost items
        window.dataService.saveDelivery = async function(delivery) {
            console.log('💾 Enhanced saveDelivery with cost items support...', delivery);
            
            try {
                // First save the delivery using the original method
                const savedDelivery = await originalSaveDelivery(delivery);
                console.log('✅ Delivery saved:', savedDelivery);
                
                // If delivery has additionalCostItems, save them separately
                if (delivery.additionalCostItems && Array.isArray(delivery.additionalCostItems) && delivery.additionalCostItems.length > 0) {
                    console.log('💰 Saving additional cost items...', delivery.additionalCostItems);
                    
                    try {
                        const costItems = await saveAdditionalCostItems(savedDelivery.id, delivery.additionalCostItems);
                        
                        // Add the cost items back to the saved delivery object
                        savedDelivery.additionalCostItems = costItems.map(item => ({
                            description: item.description,
                            amount: parseFloat(item.amount),
                            category: item.category
                        }));
                        
                        console.log('✅ Cost items saved and attached to delivery');
                        
                    } catch (costError) {
                        console.error('❌ Failed to save cost items, but delivery was saved:', costError);
                        // Don't fail the entire operation if cost items fail
                    }
                }
                
                return savedDelivery;
                
            } catch (error) {
                console.error('❌ Enhanced saveDelivery failed:', error);
                throw error;
            }
        };
        
        // Store original getDeliveries method
        const originalGetDeliveries = window.dataService.getDeliveries.bind(window.dataService);
        
        // Override getDeliveries to include cost items
        window.dataService.getDeliveries = async function(filters = {}) {
            console.log('📥 Enhanced getDeliveries with cost items support...', filters);
            
            try {
                // Get deliveries using original method
                const deliveries = await originalGetDeliveries(filters);
                console.log('✅ Deliveries retrieved:', deliveries.length);
                
                // For each delivery, get its cost items
                const deliveriesWithCostItems = await Promise.all(
                    deliveries.map(async (delivery) => {
                        try {
                            const costItems = await getAdditionalCostItems(delivery.id);
                            
                            // Add cost items to delivery object
                            delivery.additionalCostItems = costItems.map(item => ({
                                description: item.description,
                                amount: parseFloat(item.amount),
                                category: item.category
                            }));
                            
                            return delivery;
                        } catch (error) {
                            console.warn(`⚠️ Failed to get cost items for delivery ${delivery.id}:`, error);
                            delivery.additionalCostItems = [];
                            return delivery;
                        }
                    })
                );
                
                console.log('✅ Deliveries enhanced with cost items');
                return deliveriesWithCostItems;
                
            } catch (error) {
                console.error('❌ Enhanced getDeliveries failed:', error);
                throw error;
            }
        };
        
        console.log('✅ DataService enhanced with cost items support');
    }
    
    /**
     * Replace localStorage-based analytics with Supabase-based analytics
     */
    function replaceAnalyticsWithSupabase() {
        console.log('📊 Replacing localStorage analytics with Supabase analytics...');
        
        // Override the getCostBreakdownData function if it exists
        if (typeof window.getCostBreakdownData === 'function') {
            window.originalGetCostBreakdownData = window.getCostBreakdownData;
        }
        
        window.getCostBreakdownData = async function(period = 'month') {
            console.log('📊 Getting cost breakdown data from Supabase...', period);
            
            try {
                const analyticsData = await getCostBreakdownAnalytics(period);
                console.log('✅ Supabase analytics data:', analyticsData);
                return analyticsData;
            } catch (error) {
                console.error('❌ Failed to get Supabase analytics, falling back to original method:', error);
                
                // Fallback to original method if available
                if (typeof window.originalGetCostBreakdownData === 'function') {
                    return window.originalGetCostBreakdownData(period);
                }
                
                return { labels: [], values: [], colors: [] };
            }
        };
        
        // Override updateAnalyticsWithCostBreakdown to do nothing (since we're using Supabase now)
        if (typeof window.updateAnalyticsWithCostBreakdown === 'function') {
            window.originalUpdateAnalyticsWithCostBreakdown = window.updateAnalyticsWithCostBreakdown;
        }
        
        window.updateAnalyticsWithCostBreakdown = function(costBreakdown) {
            console.log('📊 Cost breakdown analytics now handled by Supabase, skipping localStorage update');
            // Do nothing - data is automatically saved to Supabase via enhanced saveDelivery
        };
        
        console.log('✅ Analytics replaced with Supabase-based system');
    }
    
    /**
     * Initialize the fix
     */
    function initializeAdditionalCostsFix() {
        console.log('🚀 Initializing Additional Costs Supabase Fix...');
        
        // Wait for dataService to be available
        if (window.dataService) {
            enhanceDataServiceWithCostItems();
            replaceAnalyticsWithSupabase();
            console.log('✅ Additional Costs Supabase Fix applied successfully');
        } else {
            console.log('⏳ DataService not ready, retrying in 1 second...');
            setTimeout(initializeAdditionalCostsFix, 1000);
        }
    }
    
    // Export functions to global scope
    window.saveAdditionalCostItems = saveAdditionalCostItems;
    window.getAdditionalCostItems = getAdditionalCostItems;
    window.getCostBreakdownAnalytics = getCostBreakdownAnalytics;
    window.categorizeCostDescription = categorizeCostDescription;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAdditionalCostsFix);
    } else {
        initializeAdditionalCostsFix();
    }
    
    console.log('✅ Additional Costs Supabase Fix loaded successfully');
    
})();

// Export for external access
window.additionalCostsSupabaseFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};