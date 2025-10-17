/**
 * SUPABASE COST ITEMS INTEGRATION FIX
 * Ensures cost items from DR uploads are properly saved to additional_cost_items table
 * and loaded correctly across all browsers
 */

console.log('🔧 Loading Supabase Cost Items Integration Fix...');

(function() {
    'use strict';
    
    /**
     * Enhanced DataService saveDelivery to ensure cost items are saved to dedicated table
     */
    function enhanceDataServiceForCostItems() {
        console.log('🔗 Enhancing DataService for cost items integration...');
        
        if (!window.dataService) {
            console.warn('⚠️ DataService not available, will retry later');
            return false;
        }
        
        // Store original saveDelivery method
        const originalSaveDelivery = window.dataService.saveDelivery.bind(window.dataService);
        
        // Override saveDelivery to handle cost items properly
        window.dataService.saveDelivery = async function(delivery) {
            console.log('💾 Enhanced saveDelivery with cost items integration...', {
                drNumber: delivery.dr_number,
                additionalCosts: delivery.additional_costs,
                costItemsCount: delivery.additional_cost_items?.length || 0
            });
            
            try {
                // First save the delivery using the original method
                const savedDelivery = await originalSaveDelivery(delivery);
                console.log('✅ Delivery saved to deliveries table:', savedDelivery.id);
                
                // If delivery has additional_cost_items, save them to dedicated table
                if (delivery.additional_cost_items && Array.isArray(delivery.additional_cost_items) && delivery.additional_cost_items.length > 0) {
                    console.log('💰 Saving cost items to additional_cost_items table...', delivery.additional_cost_items);
                    
                    try {
                        await saveCostItemsToSupabase(savedDelivery.id, delivery.additional_cost_items);
                        console.log('✅ Cost items saved to additional_cost_items table');
                        
                        // Also ensure the JSONB field is updated for backward compatibility
                        await updateDeliveryWithCostItems(savedDelivery.id, delivery.additional_cost_items);
                        
                    } catch (costError) {
                        console.error('❌ Failed to save cost items to dedicated table:', costError);
                        // Don't fail the entire operation if cost items fail
                    }
                }
                
                return savedDelivery;
                
            } catch (error) {
                console.error('❌ Enhanced saveDelivery failed:', error);
                throw error;
            }
        };
        
        console.log('✅ DataService enhanced for cost items integration');
        return true;
    }
    
    /**
     * Save cost items to additional_cost_items table
     */
    async function saveCostItemsToSupabase(deliveryId, costItems) {
        console.log('💾 Saving cost items to Supabase additional_cost_items table...', {
            deliveryId,
            itemCount: costItems.length
        });
        
        if (!deliveryId || !costItems || !Array.isArray(costItems) || costItems.length === 0) {
            console.log('📊 No cost items to save');
            return [];
        }
        
        try {
            const client = window.supabaseClient();
            if (!client) {
                throw new Error('Supabase client not available');
            }
            
            // First, delete existing cost items for this delivery to avoid duplicates
            const { error: deleteError } = await client
                .from('additional_cost_items')
                .delete()
                .eq('delivery_id', deliveryId);
            
            if (deleteError) {
                console.warn('⚠️ Error deleting existing cost items (might be first time):', deleteError.message);
            }
            
            // Prepare cost items for insertion
            const costItemsToInsert = costItems.map(item => ({
                delivery_id: deliveryId,
                description: item.description || '',
                amount: parseFloat(item.amount) || 0,
                category: item.category || categorizeCostDescription(item.description || ''),
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
            
            console.log('✅ Cost items saved to Supabase successfully:', data?.length || 0, 'items');
            return data || [];
            
        } catch (error) {
            console.error('❌ Failed to save cost items to Supabase:', error);
            throw error;
        }
    }
    
    /**
     * Update delivery record with cost items JSONB for backward compatibility
     */
    async function updateDeliveryWithCostItems(deliveryId, costItems) {
        console.log('🔄 Updating delivery JSONB field with cost items...');
        
        try {
            const client = window.supabaseClient();
            if (!client) {
                throw new Error('Supabase client not available');
            }
            
            // Calculate total cost
            const totalCost = costItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            
            // Update delivery record
            const { error } = await client
                .from('deliveries')
                .update({
                    additional_cost_items: costItems,
                    additional_costs: totalCost,
                    updated_at: new Date().toISOString()
                })
                .eq('id', deliveryId);
            
            if (error) {
                console.error('❌ Error updating delivery with cost items:', error);
                throw error;
            }
            
            console.log('✅ Delivery updated with cost items JSONB');
            
        } catch (error) {
            console.error('❌ Failed to update delivery with cost items:', error);
            throw error;
        }
    }
    
    /**
     * Enhanced cost categorization
     */
    function categorizeCostDescription(description) {
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
     * Enhanced getCostBreakdownData that prioritizes Supabase data
     */
    async function getSupabaseCostBreakdownData(period = 'month') {
        console.log('📊 Getting cost breakdown data from Supabase...', period);
        
        try {
            const client = window.supabaseClient();
            if (!client) {
                throw new Error('Supabase client not available');
            }
            
            // Get cost items from dedicated table
            const { data: costItems, error } = await client
                .from('additional_cost_items')
                .select('description, amount, category, created_at');
            
            if (error) {
                console.error('❌ Error querying cost items:', error);
                throw error;
            }
            
            console.log(`✅ Retrieved ${costItems?.length || 0} cost items from Supabase`);
            
            // Process data for chart
            const categoryTotals = {};
            
            (costItems || []).forEach(item => {
                const category = item.category || 'Other';
                categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(item.amount || 0);
            });
            
            // Format for chart
            const labels = Object.keys(categoryTotals).filter(key => categoryTotals[key] > 0);
            const values = labels.map(label => categoryTotals[label]);
            
            const colors = [
                'rgba(243, 156, 18, 0.8)', // Fuel - Orange
                'rgba(52, 152, 219, 0.8)',  // Toll - Blue
                'rgba(46, 204, 113, 0.8)',  // Helper - Green
                'rgba(155, 89, 182, 0.8)',  // Special - Purple
                'rgba(149, 165, 166, 0.8)'  // Other - Gray
            ];
            
            const result = {
                labels,
                values,
                colors: colors.slice(0, labels.length)
            };
            
            console.log('📊 Supabase cost breakdown result:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Failed to get cost breakdown from Supabase:', error);
            throw error;
        }
    }
    
    /**
     * Override analytics functions to use Supabase data
     */
    function overrideAnalyticsFunctions() {
        console.log('📊 Overriding analytics functions to use Supabase data...');
        
        // Store original function if it exists
        if (typeof window.getCostBreakdownData === 'function') {
            window.originalGetCostBreakdownData = window.getCostBreakdownData;
        }
        
        // Override with Supabase-first approach
        window.getCostBreakdownData = async function(period = 'month') {
            console.log('📊 Enhanced getCostBreakdownData called (Supabase-first)');
            
            try {
                // Try Supabase first
                return await getSupabaseCostBreakdownData(period);
            } catch (error) {
                console.warn('⚠️ Supabase cost breakdown failed, trying fallback:', error.message);
                
                // Fallback to enhanced function if available
                if (typeof window.getEnhancedCostBreakdownData === 'function') {
                    return await window.getEnhancedCostBreakdownData(period);
                }
                
                // Final fallback to original function
                if (typeof window.originalGetCostBreakdownData === 'function') {
                    return await window.originalGetCostBreakdownData(period);
                }
                
                // Return empty data if all else fails
                return { labels: [], values: [], colors: [] };
            }
        };
        
        console.log('✅ Analytics functions overridden for Supabase integration');
    }
    
    /**
     * Verify cost items are being saved properly
     */
    async function verifyCostItemsSaving() {
        console.log('🔍 Verifying cost items saving functionality...');
        
        try {
            const client = window.supabaseClient();
            if (!client) {
                console.warn('⚠️ Supabase client not available for verification');
                return false;
            }
            
            // Check if additional_cost_items table exists and is accessible
            const { data, error } = await client
                .from('additional_cost_items')
                .select('count')
                .limit(1);
            
            if (error && error.code !== 'PGRST116') {
                console.error('❌ additional_cost_items table not accessible:', error.message);
                return false;
            }
            
            console.log('✅ additional_cost_items table is accessible');
            
            // Check if we have any existing cost items
            const { data: existingItems, error: countError } = await client
                .from('additional_cost_items')
                .select('id, description, amount, category')
                .limit(5);
            
            if (!countError) {
                console.log(`📊 Found ${existingItems?.length || 0} existing cost items in table`);
                if (existingItems && existingItems.length > 0) {
                    console.log('Sample cost items:', existingItems);
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Cost items verification failed:', error);
            return false;
        }
    }
    
    /**
     * Initialize the integration fix
     */
    async function initializeCostItemsIntegration() {
        console.log('🚀 Initializing Supabase Cost Items Integration Fix...');
        
        // Wait for DataService to be available
        let retryCount = 0;
        const maxRetries = 10;
        
        const waitForDataService = () => {
            if (window.dataService) {
                console.log('✅ DataService found, applying enhancements...');
                
                const enhanced = enhanceDataServiceForCostItems();
                if (enhanced) {
                    overrideAnalyticsFunctions();
                    
                    // Verify setup
                    setTimeout(() => {
                        verifyCostItemsSaving();
                    }, 1000);
                    
                    console.log('✅ Supabase Cost Items Integration Fix applied successfully');
                } else {
                    console.warn('⚠️ Failed to enhance DataService');
                }
            } else {
                retryCount++;
                if (retryCount < maxRetries) {
                    console.log(`⏳ DataService not ready, retrying (${retryCount}/${maxRetries})...`);
                    setTimeout(waitForDataService, 1000);
                } else {
                    console.error('❌ DataService not available after maximum retries');
                }
            }
        };
        
        waitForDataService();
    }
    
    // Export functions globally
    window.saveCostItemsToSupabase = saveCostItemsToSupabase;
    window.getSupabaseCostBreakdownData = getSupabaseCostBreakdownData;
    window.categorizeCostDescription = categorizeCostDescription;
    window.verifyCostItemsSaving = verifyCostItemsSaving;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCostItemsIntegration);
    } else {
        initializeCostItemsIntegration();
    }
    
    console.log('✅ Supabase Cost Items Integration Fix loaded');
    
})();

// Export module info
window.supabaseCostItemsIntegrationFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};