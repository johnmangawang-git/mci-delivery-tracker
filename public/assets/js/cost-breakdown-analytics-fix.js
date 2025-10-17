/**
 * COST BREAKDOWN ANALYTICS FIX
 * Comprehensive fix for Additional Cost Breakdown chart showing empty data
 * Addresses Supabase integration issues and ensures cross-browser data sync
 */

console.log('🔧 Loading Cost Breakdown Analytics Fix...');

(function() {
    'use strict';
    
    /**
     * Enhanced cost categorization with comprehensive keyword matching
     */
    function categorizeCostDescription(description) {
        if (!description || typeof description !== 'string') {
            return 'Other';
        }
        
        const desc = description.toLowerCase().trim();
        
        // Fuel-related keywords (comprehensive)
        if (desc.includes('gas') || desc.includes('fuel') || 
            desc.includes('gasoline') || desc.includes('petrol') ||
            desc.includes('diesel') || desc.includes('gasolina') ||
            desc.includes('lng') || desc.includes('cng')) {
            return 'Fuel Surcharge';
        }
        
        // Toll-related keywords (Philippine highways)
        if (desc.includes('toll') || desc.includes('highway') ||
            desc.includes('expressway') || desc.includes('bridge') ||
            desc.includes('skyway') || desc.includes('slex') ||
            desc.includes('nlex') || desc.includes('cavitex') ||
            desc.includes('tplex') || desc.includes('star tollway') ||
            desc.includes('mcx') || desc.includes('calax')) {
            return 'Toll Fees';
        }
        
        // Helper/Labor-related keywords
        if (desc.includes('helper') || desc.includes('urgent') || 
            desc.includes('assist') || desc.includes('labor') ||
            desc.includes('manpower') || desc.includes('overtime') ||
            desc.includes('rush') || desc.includes('kasama') ||
            desc.includes('extra hand') || desc.includes('loading')) {
            return 'Helper';
        }
        
        // Special handling keywords
        if (desc.includes('special') || desc.includes('handling') ||
            desc.includes('fragile') || desc.includes('careful') ||
            desc.includes('delicate') || desc.includes('premium') ||
            desc.includes('white glove') || desc.includes('extra care')) {
            return 'Special Handling';
        }
        
        // Parking/Storage related
        if (desc.includes('parking') || desc.includes('storage') ||
            desc.includes('warehouse') || desc.includes('overnight')) {
            return 'Parking/Storage';
        }
        
        return 'Other';
    }
    
    /**
     * Get cost breakdown data from multiple sources with fallback
     */
    async function getEnhancedCostBreakdownData(period = 'month') {
        console.log('📊 Getting enhanced cost breakdown data...', period);
        
        const categoryTotals = {
            'Fuel Surcharge': 0,
            'Toll Fees': 0,
            'Helper': 0,
            'Special Handling': 0,
            'Parking/Storage': 0,
            'Other': 0
        };
        
        try {
            // Method 1: Try Supabase additional_cost_items table (preferred)
            if (window.supabaseClient) {
                console.log('🔍 Trying Supabase additional_cost_items table...');
                
                const client = window.supabaseClient();
                if (client) {
                    const { data: costItems, error } = await client
                        .from('additional_cost_items')
                        .select('description, amount, category');
                    
                    if (!error && costItems && costItems.length > 0) {
                        console.log(`✅ Found ${costItems.length} cost items in Supabase table`);
                        
                        costItems.forEach(item => {
                            const category = item.category || categorizeCostDescription(item.description);
                            const amount = parseFloat(item.amount) || 0;
                            categoryTotals[category] = (categoryTotals[category] || 0) + amount;
                        });
                        
                        console.log('📊 Supabase cost breakdown:', categoryTotals);
                        return formatChartData(categoryTotals);
                    } else {
                        console.log('⚠️ No cost items found in additional_cost_items table');
                    }
                }
            }
            
            // Method 2: Try Supabase deliveries table with JSONB cost items
            if (window.supabaseClient) {
                console.log('🔍 Trying Supabase deliveries table...');
                
                const client = window.supabaseClient();
                if (client) {
                    const { data: deliveries, error } = await client
                        .from('deliveries')
                        .select('additional_cost_items, additional_costs')
                        .gt('additional_costs', 0);
                    
                    if (!error && deliveries && deliveries.length > 0) {
                        console.log(`✅ Found ${deliveries.length} deliveries with costs`);
                        
                        deliveries.forEach(delivery => {
                            if (delivery.additional_cost_items && Array.isArray(delivery.additional_cost_items)) {
                                delivery.additional_cost_items.forEach(item => {
                                    const category = item.category || categorizeCostDescription(item.description);
                                    const amount = parseFloat(item.amount) || 0;
                                    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
                                });
                            } else if (delivery.additional_costs > 0) {
                                // Fallback: add to Other category
                                categoryTotals['Other'] += parseFloat(delivery.additional_costs);
                            }
                        });
                        
                        console.log('📊 Deliveries cost breakdown:', categoryTotals);
                        return formatChartData(categoryTotals);
                    }
                }
            }
            
            // Method 3: Try localStorage data (fallback)
            console.log('🔍 Trying localStorage data...');
            
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            const allDeliveries = [...activeDeliveries, ...deliveryHistory];
            
            if (allDeliveries.length > 0) {
                console.log(`✅ Found ${allDeliveries.length} deliveries in localStorage`);
                
                allDeliveries.forEach(delivery => {
                    if (delivery.additionalCostItems && Array.isArray(delivery.additionalCostItems)) {
                        delivery.additionalCostItems.forEach(item => {
                            const category = item.category || categorizeCostDescription(item.description);
                            const amount = parseFloat(item.amount) || 0;
                            categoryTotals[category] = (categoryTotals[category] || 0) + amount;
                        });
                    } else if (delivery.additionalCosts && delivery.additionalCosts > 0) {
                        categoryTotals['Other'] += parseFloat(delivery.additionalCosts);
                    }
                });
                
                console.log('📊 localStorage cost breakdown:', categoryTotals);
                return formatChartData(categoryTotals);
            }
            
            // Method 4: Try global variables (last resort)
            console.log('🔍 Trying global variables...');
            
            const globalActive = window.activeDeliveries || [];
            const globalHistory = window.deliveryHistory || [];
            const globalAll = [...globalActive, ...globalHistory];
            
            if (globalAll.length > 0) {
                console.log(`✅ Found ${globalAll.length} deliveries in global variables`);
                
                globalAll.forEach(delivery => {
                    if (delivery.additionalCostItems && Array.isArray(delivery.additionalCostItems)) {
                        delivery.additionalCostItems.forEach(item => {
                            const category = item.category || categorizeCostDescription(item.description);
                            const amount = parseFloat(item.amount) || 0;
                            categoryTotals[category] = (categoryTotals[category] || 0) + amount;
                        });
                    } else if (delivery.additionalCosts && delivery.additionalCosts > 0) {
                        categoryTotals['Other'] += parseFloat(delivery.additionalCosts);
                    }
                });
                
                console.log('📊 Global variables cost breakdown:', categoryTotals);
                return formatChartData(categoryTotals);
            }
            
            console.log('⚠️ No cost data found in any source');
            return formatChartData(categoryTotals);
            
        } catch (error) {
            console.error('❌ Error getting cost breakdown data:', error);
            return formatChartData(categoryTotals);
        }
    }
    
    /**
     * Format data for Chart.js
     */
    function formatChartData(categoryTotals) {
        // Filter out categories with zero values
        const nonZeroCategories = Object.entries(categoryTotals)
            .filter(([category, amount]) => amount > 0);
        
        if (nonZeroCategories.length === 0) {
            console.log('📊 No cost data to display');
            return {
                labels: ['No Data'],
                values: [1],
                colors: ['rgba(149, 165, 166, 0.8)']
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
     * Create sample cost data for testing
     */
    async function createSampleCostData() {
        console.log('🛠️ Creating sample cost data for testing...');
        
        try {
            if (!window.dataService) {
                throw new Error('DataService not available');
            }
            
            const sampleDelivery = {
                dr_number: `DR-SAMPLE-${Date.now()}`,
                customer_name: 'Sample Customer for Analytics',
                vendor_number: '+63 917 555 0123',
                origin: 'Manila',
                destination: 'Cebu',
                status: 'Active',
                created_date: new Date().toISOString().split('T')[0],
                created_by: 'Analytics Fix',
                additional_costs: 425.75,
                additional_cost_items: [
                    { description: 'Gasoline for delivery truck', amount: 200.00, category: 'Fuel Surcharge' },
                    { description: 'SLEX toll fee', amount: 125.75, category: 'Toll Fees' },
                    { description: 'Helper for loading', amount: 100.00, category: 'Helper' }
                ]
            };
            
            const result = await window.dataService.saveDelivery(sampleDelivery);
            
            if (result) {
                console.log('✅ Sample cost data created successfully');
                return true;
            } else {
                throw new Error('Failed to save sample delivery');
            }
            
        } catch (error) {
            console.error('❌ Error creating sample cost data:', error);
            return false;
        }
    }
    
    /**
     * Fix the analytics chart update function
     */
    function fixCostBreakdownChart() {
        console.log('🔧 Fixing cost breakdown chart function...');
        
        // Override the updateCostBreakdownChart function
        window.updateCostBreakdownChart = async function(period = 'month') {
            console.log(`📊 Enhanced updateCostBreakdownChart called with period: ${period}`);
            
            try {
                const costBreakdownData = await getEnhancedCostBreakdownData(period);
                
                if (window.costBreakdownChart && costBreakdownData) {
                    window.costBreakdownChart.data.labels = costBreakdownData.labels;
                    window.costBreakdownChart.data.datasets[0].data = costBreakdownData.values;
                    window.costBreakdownChart.data.datasets[0].backgroundColor = costBreakdownData.colors;
                    window.costBreakdownChart.update();
                    
                    console.log('✅ Cost breakdown chart updated successfully');
                } else {
                    console.warn('⚠️ Cost breakdown chart or data not available');
                }
                
            } catch (error) {
                console.error('❌ Error updating cost breakdown chart:', error);
            }
        };
        
        // Also override the getCostBreakdownData function
        window.getCostBreakdownData = getEnhancedCostBreakdownData;
        
        console.log('✅ Cost breakdown chart functions fixed');
    }
    
    /**
     * Initialize the fix
     */
    function initializeCostBreakdownFix() {
        console.log('🚀 Initializing Cost Breakdown Analytics Fix...');
        
        // Apply the chart fix
        fixCostBreakdownChart();
        
        // Export functions globally
        window.getEnhancedCostBreakdownData = getEnhancedCostBreakdownData;
        window.createSampleCostData = createSampleCostData;
        window.categorizeCostDescription = categorizeCostDescription;
        
        // Auto-refresh analytics if chart exists
        setTimeout(() => {
            if (window.costBreakdownChart) {
                console.log('🔄 Auto-refreshing cost breakdown chart...');
                window.updateCostBreakdownChart('month');
            }
        }, 2000);
        
        console.log('✅ Cost Breakdown Analytics Fix initialized successfully');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCostBreakdownFix);
    } else {
        initializeCostBreakdownFix();
    }
    
    console.log('✅ Cost Breakdown Analytics Fix loaded');
    
})();

// Export module info
window.costBreakdownAnalyticsFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};