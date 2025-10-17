/**
 * CROSS-BROWSER DATA SYNC UTILITY
 * Helps sync data between different browsers using Supabase as the central source
 */

console.log('🔧 Loading Cross-Browser Data Sync...');

(function() {
    'use strict';
    
    /**
     * Sync data from Supabase to localStorage for cross-browser consistency
     */
    async function syncDataFromSupabase() {
        console.log('🔄 Starting cross-browser data sync from Supabase...');
        
        try {
            if (!window.dataService || !window.dataService.isSupabaseAvailable()) {
                console.warn('⚠️ Supabase not available, cannot sync data across browsers');
                return false;
            }
            
            // Sync deliveries
            console.log('📦 Syncing deliveries from Supabase...');
            const allDeliveries = await window.dataService.getDeliveries();
            
            if (allDeliveries && allDeliveries.length > 0) {
                // Separate active and completed deliveries
                const activeDeliveries = allDeliveries.filter(d => d.status !== 'Completed' && d.status !== 'Signed');
                const deliveryHistory = allDeliveries.filter(d => d.status === 'Completed' || d.status === 'Signed');
                
                // Update localStorage
                localStorage.setItem('mci-active-deliveries', JSON.stringify(activeDeliveries));
                localStorage.setItem('mci-delivery-history', JSON.stringify(deliveryHistory));
                
                // Update global arrays
                window.activeDeliveries = activeDeliveries;
                window.deliveryHistory = deliveryHistory;
                
                console.log(`✅ Synced ${activeDeliveries.length} active deliveries and ${deliveryHistory.length} completed deliveries`);
            }
            
            // Sync customers
            console.log('👥 Syncing customers from Supabase...');
            const customers = await window.dataService.getCustomers();
            
            if (customers && customers.length > 0) {
                localStorage.setItem('mci-customers', JSON.stringify(customers));
                window.customers = customers;
                console.log(`✅ Synced ${customers.length} customers`);
            }
            
            console.log('🎉 Cross-browser data sync completed successfully!');
            return true;
            
        } catch (error) {
            console.error('❌ Cross-browser data sync failed:', error);
            return false;
        }
    }
    
    /**
     * Check if data is inconsistent between browsers and offer to sync
     */
    function checkDataConsistency() {
        console.log('🔍 Checking data consistency across browsers...');
        
        const localActiveCount = (JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]')).length;
        const localHistoryCount = (JSON.parse(localStorage.getItem('mci-delivery-history') || '[]')).length;
        const localCustomerCount = (JSON.parse(localStorage.getItem('mci-customers') || '[]')).length;
        
        console.log('📊 Local data counts:', {
            activeDeliveries: localActiveCount,
            deliveryHistory: localHistoryCount,
            customers: localCustomerCount
        });
        
        // If no local data, suggest sync
        if (localActiveCount === 0 && localHistoryCount === 0 && localCustomerCount === 0) {
            console.log('📭 No local data found - this might be a different browser');
            showSyncSuggestion();
        }
    }
    
    /**
     * Show sync suggestion to user
     */
    function showSyncSuggestion() {
        // Only show if Supabase is available
        if (!window.dataService || !window.dataService.isSupabaseAvailable()) {
            return;
        }
        
        // Create a non-intrusive notification
        const notification = document.createElement('div');
        notification.id = 'crossBrowserSyncNotification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            max-width: 350px;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="bi bi-cloud-download" style="font-size: 18px;"></i>
                <div style="flex: 1;">
                    <strong>Sync Data?</strong><br>
                    <small>Load your data from the cloud to this browser</small>
                </div>
                <button onclick="window.syncFromSupabase()" style="background: white; color: #007bff; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    Sync
                </button>
                <button onclick="document.getElementById('crossBrowserSyncNotification').remove()" style="background: transparent; color: white; border: none; cursor: pointer; font-size: 16px;">
                    ×
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (document.getElementById('crossBrowserSyncNotification')) {
                notification.remove();
            }
        }, 10000);
    }
    
    /**
     * Manual sync function for user-triggered sync
     */
    async function manualSync() {
        console.log('🔄 Manual sync triggered by user...');
        
        // Show loading indicator
        const notification = document.getElementById('crossBrowserSyncNotification');
        if (notification) {
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 18px; height: 18px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <div>Syncing data from cloud...</div>
                </div>
                <style>
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            `;
        }
        
        const success = await syncDataFromSupabase();
        
        if (notification) {
            if (success) {
                notification.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="bi bi-check-circle" style="font-size: 18px; color: #28a745;"></i>
                        <div>Data synced successfully!</div>
                        <button onclick="window.location.reload()" style="background: white; color: #007bff; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Refresh
                        </button>
                    </div>
                `;
                
                // Auto-refresh after 3 seconds
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else {
                notification.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="bi bi-exclamation-triangle" style="font-size: 18px; color: #ffc107;"></i>
                        <div>Sync failed. Please try again.</div>
                        <button onclick="document.getElementById('crossBrowserSyncNotification').remove()" style="background: transparent; color: white; border: none; cursor: pointer; font-size: 16px;">
                            ×
                        </button>
                    </div>
                `;
            }
        }
    }
    
    // Export functions globally
    window.syncFromSupabase = manualSync;
    window.checkDataConsistency = checkDataConsistency;
    window.syncDataFromSupabase = syncDataFromSupabase;
    
    // Auto-check on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a bit for other scripts to load
        setTimeout(() => {
            checkDataConsistency();
        }, 2000);
    });
    
    console.log('✅ Cross-Browser Data Sync loaded successfully');
    
})();