/**
 * DATA SOURCE INDICATOR FIX
 * Adds visual indicators to show when Additional Cost Breakdown data comes from local storage vs Supabase
 */

console.log('🔧 Loading Data Source Indicator Fix...');

(function() {
    'use strict';
    
    /**
     * Add data source indicator to chart container
     */
    function addDataSourceIndicator(chartContainer, dataSource, details = {}) {
        console.log('📊 Adding data source indicator:', dataSource, details);
        
        // Remove existing indicator
        const existingIndicator = chartContainer.querySelector('.data-source-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Create indicator element
        const indicator = document.createElement('div');
        indicator.className = 'data-source-indicator';
        
        let indicatorHTML = '';
        let indicatorClass = '';
        
        switch (dataSource) {
            case 'supabase':
                indicatorClass = 'indicator-supabase';
                indicatorHTML = `
                    <div class="indicator-content">
                        <i class="bi bi-cloud-check-fill"></i>
                        <span>Cloud Data</span>
                        <small>${details.itemCount || 0} items from Supabase</small>
                    </div>
                `;
                break;
                
            case 'localStorage':
                indicatorClass = 'indicator-local';
                indicatorHTML = `
                    <div class="indicator-content">
                        <i class="bi bi-hdd-fill"></i>
                        <span>Local Data</span>
                        <small>Data stored locally - may not sync across browsers</small>
                        <button onclick="window.syncToSupabase && window.syncToSupabase()" class="sync-btn">
                            <i class="bi bi-cloud-upload"></i> Sync to Cloud
                        </button>
                    </div>
                `;
                break;
                
            case 'mixed':
                indicatorClass = 'indicator-mixed';
                indicatorHTML = `
                    <div class="indicator-content">
                        <i class="bi bi-cloud-slash"></i>
                        <span>Mixed Data</span>
                        <small>Some data from cloud, some local - partial sync</small>
                        <button onclick="window.syncToSupabase && window.syncToSupabase()" class="sync-btn">
                            <i class="bi bi-arrow-repeat"></i> Full Sync
                        </button>
                    </div>
                `;
                break;
                
            case 'empty':
                indicatorClass = 'indicator-empty';
                indicatorHTML = `
                    <div class="indicator-content">
                        <i class="bi bi-inbox"></i>
                        <span>No Data</span>
                        <small>Upload a DR with additional costs to see breakdown</small>
                    </div>
                `;
                break;
                
            default:
                indicatorClass = 'indicator-unknown';
                indicatorHTML = `
                    <div class="indicator-content">
                        <i class="bi bi-question-circle"></i>
                        <span>Unknown Source</span>
                        <small>Unable to determine data source</small>
                    </div>
                `;
        }
        
        indicator.className = `data-source-indicator ${indicatorClass}`;
        indicator.innerHTML = indicatorHTML;
        
        // Add styles if not already added
        addIndicatorStyles();
        
        // Insert indicator at the top of chart container
        chartContainer.insertBefore(indicator, chartContainer.firstChild);
        
        console.log('✅ Data source indicator added:', dataSource);
    }
    
    /**
     * Add CSS styles for indicators
     */
    function addIndicatorStyles() {
        if (document.getElementById('dataSourceIndicatorStyles')) {
            return; // Already added
        }
        
        const styles = document.createElement('style');
        styles.id = 'dataSourceIndicatorStyles';
        styles.textContent = `
            .data-source-indicator {
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 1000;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                padding: 8px 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                font-size: 12px;
                font-family: Arial, sans-serif;
                border-left: 4px solid #ddd;
                max-width: 200px;
            }
            
            .indicator-supabase {
                border-left-color: #28a745;
                background: rgba(40, 167, 69, 0.05);
            }
            
            .indicator-local {
                border-left-color: #ffc107;
                background: rgba(255, 193, 7, 0.05);
            }
            
            .indicator-mixed {
                border-left-color: #fd7e14;
                background: rgba(253, 126, 20, 0.05);
            }
            
            .indicator-empty {
                border-left-color: #6c757d;
                background: rgba(108, 117, 125, 0.05);
            }
            
            .indicator-unknown {
                border-left-color: #dc3545;
                background: rgba(220, 53, 69, 0.05);
            }
            
            .indicator-content {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .indicator-content i {
                font-size: 14px;
                margin-right: 6px;
            }
            
            .indicator-supabase i {
                color: #28a745;
            }
            
            .indicator-local i {
                color: #ffc107;
            }
            
            .indicator-mixed i {
                color: #fd7e14;
            }
            
            .indicator-empty i {
                color: #6c757d;
            }
            
            .indicator-unknown i {
                color: #dc3545;
            }
            
            .indicator-content span {
                font-weight: bold;
                display: flex;
                align-items: center;
            }
            
            .indicator-content small {
                color: #666;
                line-height: 1.2;
                margin-top: 2px;
            }
            
            .sync-btn {
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 11px;
                cursor: pointer;
                margin-top: 4px;
                display: flex;
                align-items: center;
                gap: 4px;
                transition: background-color 0.2s;
            }
            
            .sync-btn:hover {
                background: #0056b3;
            }
            
            .sync-btn i {
                font-size: 10px;
            }
            
            /* Make chart container relative for absolute positioning */
            .chart-container {
                position: relative;
            }
            
            /* Ensure indicator doesn't interfere with chart */
            .data-source-indicator {
                pointer-events: auto;
            }
            
            .data-source-indicator * {
                pointer-events: auto;
            }
        `;
        
        document.head.appendChild(styles);
        console.log('✅ Data source indicator styles added');
    }
    
    /**
     * Detect data source for cost breakdown
     */
    async function detectCostBreakdownDataSource() {
        console.log('🔍 Detecting cost breakdown data source...');
        
        let supabaseItems = 0;
        let localItems = 0;
        let hasSupabaseConnection = false;
        
        try {
            // Check Supabase connection and data
            if (window.supabaseClient) {
                const client = window.supabaseClient();
                if (client) {
                    hasSupabaseConnection = true;
                    
                    try {
                        const { data: costItems, error } = await client
                            .from('additional_cost_items')
                            .select('id');
                        
                        if (!error && costItems) {
                            supabaseItems = costItems.length;
                        }
                    } catch (e) {
                        console.warn('⚠️ Could not query Supabase cost items:', e.message);
                    }
                }
            }
            
            // Check localStorage data
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            const allDeliveries = [...activeDeliveries, ...deliveryHistory];
            
            allDeliveries.forEach(delivery => {
                if (delivery.additionalCostItems && Array.isArray(delivery.additionalCostItems)) {
                    localItems += delivery.additionalCostItems.length;
                } else if (delivery.additionalCosts && delivery.additionalCosts > 0) {
                    localItems += 1; // Count as one item if no breakdown available
                }
            });
            
            console.log('📊 Data source detection results:', {
                hasSupabaseConnection,
                supabaseItems,
                localItems
            });
            
            // Determine data source
            if (supabaseItems > 0 && localItems > 0) {
                return { source: 'mixed', supabaseItems, localItems };
            } else if (supabaseItems > 0) {
                return { source: 'supabase', itemCount: supabaseItems };
            } else if (localItems > 0) {
                return { source: 'localStorage', itemCount: localItems };
            } else {
                return { source: 'empty' };
            }
            
        } catch (error) {
            console.error('❌ Error detecting data source:', error);
            return { source: 'unknown', error: error.message };
        }
    }
    
    /**
     * Enhanced updateCostBreakdownChart with data source indicator
     */
    function enhanceUpdateCostBreakdownChart() {
        console.log('🔧 Enhancing updateCostBreakdownChart with data source indicator...');
        
        // Store original function
        if (typeof window.updateCostBreakdownChart === 'function') {
            window.originalUpdateCostBreakdownChart = window.updateCostBreakdownChart;
        }
        
        // Override with enhanced version
        window.updateCostBreakdownChart = async function(period = 'month') {
            console.log('📊 Enhanced updateCostBreakdownChart with data source detection...');
            
            try {
                // Call original function first
                if (typeof window.originalUpdateCostBreakdownChart === 'function') {
                    await window.originalUpdateCostBreakdownChart(period);
                }
                
                // Detect data source and add indicator
                const dataSourceInfo = await detectCostBreakdownDataSource();
                
                // Find cost breakdown chart container
                const chartCanvas = document.getElementById('costBreakdownChart');
                if (chartCanvas) {
                    const chartContainer = chartCanvas.closest('.card-body') || chartCanvas.parentElement;
                    if (chartContainer) {
                        addDataSourceIndicator(chartContainer, dataSourceInfo.source, dataSourceInfo);
                    }
                }
                
            } catch (error) {
                console.error('❌ Error in enhanced updateCostBreakdownChart:', error);
            }
        };
        
        console.log('✅ updateCostBreakdownChart enhanced with data source indicator');
    }
    
    /**
     * Add sync to Supabase function
     */
    function addSyncToSupabaseFunction() {
        window.syncToSupabase = async function() {
            console.log('🔄 Syncing local data to Supabase...');
            
            try {
                if (!window.dataService || !window.dataService.isSupabaseAvailable()) {
                    alert('Supabase connection not available. Please check your internet connection and try again.');
                    return;
                }
                
                // Get local data
                const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
                const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
                const allDeliveries = [...activeDeliveries, ...deliveryHistory];
                
                let syncedCount = 0;
                
                for (const delivery of allDeliveries) {
                    try {
                        // Check if delivery already exists in Supabase
                        const client = window.supabaseClient();
                        const { data: existing } = await client
                            .from('deliveries')
                            .select('id')
                            .eq('dr_number', delivery.drNumber || delivery.dr_number)
                            .single();
                        
                        if (!existing) {
                            // Convert localStorage format to Supabase format
                            const supabaseDelivery = {
                                dr_number: delivery.drNumber || delivery.dr_number,
                                customer_name: delivery.customerName || delivery.customer_name,
                                vendor_number: delivery.vendorNumber || delivery.vendor_number,
                                origin: delivery.origin,
                                destination: delivery.destination,
                                status: delivery.status,
                                created_date: delivery.deliveryDate || delivery.created_date,
                                created_by: 'Local Sync',
                                additional_costs: delivery.additionalCosts || delivery.additional_costs || 0,
                                additional_cost_items: delivery.additionalCostItems || delivery.additional_cost_items || []
                            };
                            
                            await window.dataService.saveDelivery(supabaseDelivery);
                            syncedCount++;
                        }
                    } catch (error) {
                        console.warn('⚠️ Failed to sync delivery:', delivery.drNumber, error.message);
                    }
                }
                
                alert(`Successfully synced ${syncedCount} deliveries to cloud storage.`);
                
                // Refresh the chart
                if (typeof window.updateCostBreakdownChart === 'function') {
                    window.updateCostBreakdownChart();
                }
                
            } catch (error) {
                console.error('❌ Sync to Supabase failed:', error);
                alert('Failed to sync data to cloud storage: ' + error.message);
            }
        };
        
        console.log('✅ Sync to Supabase function added');
    }
    
    /**
     * Initialize data source indicator system
     */
    function initializeDataSourceIndicator() {
        console.log('🚀 Initializing Data Source Indicator system...');
        
        // Add styles
        addIndicatorStyles();
        
        // Enhance chart update function
        enhanceUpdateCostBreakdownChart();
        
        // Add sync function
        addSyncToSupabaseFunction();
        
        // Auto-detect and show indicator after a delay
        setTimeout(async () => {
            if (typeof window.updateCostBreakdownChart === 'function') {
                await window.updateCostBreakdownChart();
            }
        }, 3000);
        
        console.log('✅ Data Source Indicator system initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDataSourceIndicator);
    } else {
        initializeDataSourceIndicator();
    }
    
    // Export functions
    window.addDataSourceIndicator = addDataSourceIndicator;
    window.detectCostBreakdownDataSource = detectCostBreakdownDataSource;
    
    console.log('✅ Data Source Indicator Fix loaded');
    
})();

// Export module info
window.dataSourceIndicatorFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};