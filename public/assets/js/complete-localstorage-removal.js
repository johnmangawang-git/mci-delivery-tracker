/**
 * 🎯 COMPLETE localStorage REMOVAL - FINAL IMPLEMENTATION
 * 
 * This script completely removes ALL localStorage operations from the entire application
 * and ensures 100% Supabase-only data management
 */

console.log('🔧 COMPLETE localStorage REMOVAL: Script loaded');

(function() {
    'use strict';

    /**
     * 🚫 DISABLE ALL localStorage OPERATIONS
     */
    function disableLocalStorageOperations() {
        console.log('🚫 Disabling all localStorage operations...');

        // Store original localStorage methods
        const originalSetItem = localStorage.setItem;
        const originalGetItem = localStorage.getItem;
        const originalRemoveItem = localStorage.removeItem;
        const originalClear = localStorage.clear;

        // Override localStorage.setItem to prevent writes
        localStorage.setItem = function(key, value) {
            console.warn(`🚨 BLOCKED localStorage.setItem: ${key} - Using Supabase-only mode`);
            // Don't actually save to localStorage
            return;
        };

        // Override localStorage.getItem to return empty for MCI keys
        localStorage.getItem = function(key) {
            if (key.startsWith('mci-') || key === 'ePodRecords' || key === 'analytics-cost-breakdown') {
                console.warn(`🚨 BLOCKED localStorage.getItem: ${key} - Using Supabase-only mode`);
                return null;
            }
            // Allow other keys (for Bootstrap, etc.)
            return originalGetItem.call(this, key);
        };

        // Override localStorage.removeItem for MCI keys
        localStorage.removeItem = function(key) {
            if (key.startsWith('mci-') || key === 'ePodRecords' || key === 'analytics-cost-breakdown') {
                console.warn(`🚨 BLOCKED localStorage.removeItem: ${key} - Using Supabase-only mode`);
                return;
            }
            return originalRemoveItem.call(this, key);
        };

        console.log('✅ localStorage operations disabled for MCI data');
    }

    /**
     * 🔄 OVERRIDE SAVE FUNCTIONS TO USE SUPABASE ONLY
     */
    function overrideSaveFunctions() {
        console.log('🔄 Overriding save functions to use Supabase-only...');

        // Override saveToLocalStorage function
        window.saveToLocalStorage = function() {
            console.log('🚫 DISABLED: saveToLocalStorage - Using Supabase-only mode');
            // Do nothing - all saves go through dataService
        };

        // Override fallbackSaveToLocalStorage function
        window.fallbackSaveToLocalStorage = function() {
            console.log('🚫 DISABLED: fallbackSaveToLocalStorage - Using Supabase-only mode');
            // Do nothing - all saves go through dataService
        };

        // Override loadFromLocalStorage function
        window.loadFromLocalStorage = function() {
            console.log('🚫 DISABLED: loadFromLocalStorage - Using Supabase-only mode');
            // Return empty data - all loads go through dataService
            return {
                activeDeliveries: [],
                deliveryHistory: [],
                customers: [],
                ePodRecords: []
            };
        };

        console.log('✅ Save functions overridden to use Supabase-only');
    }

    /**
     * 🔄 ENHANCE DATA LOADING TO USE SUPABASE ONLY
     */
    function enhanceDataLoading() {
        console.log('🔄 Enhancing data loading to use Supabase-only...');

        // Override loadActiveDeliveries to use dataService
        if (typeof window.loadActiveDeliveries === 'function') {
            const originalLoadActiveDeliveries = window.loadActiveDeliveries;
            
            window.loadActiveDeliveries = async function() {
                console.log('🎯 SUPABASE-ONLY: Loading active deliveries...');
                
                if (window.dataService) {
                    try {
                        const deliveries = await window.dataService.getDeliveries({ status: 'Active' });
                        window.activeDeliveries = deliveries || [];
                        console.log('✅ SUPABASE-ONLY: Loaded active deliveries:', window.activeDeliveries.length);
                        
                        // Call original function for UI updates
                        if (originalLoadActiveDeliveries !== window.loadActiveDeliveries) {
                            return originalLoadActiveDeliveries.call(this);
                        }
                        
                        return window.activeDeliveries;
                    } catch (error) {
                        console.error('❌ SUPABASE-ONLY: Failed to load active deliveries:', error);
                        throw error;
                    }
                } else {
                    throw new Error('Supabase connection required for loading active deliveries');
                }
            };
        }

        // Override loadDeliveryHistory to use dataService
        if (typeof window.loadDeliveryHistory === 'function') {
            const originalLoadDeliveryHistory = window.loadDeliveryHistory;
            
            window.loadDeliveryHistory = async function() {
                console.log('🎯 SUPABASE-ONLY: Loading delivery history...');
                
                if (window.dataService) {
                    try {
                        const deliveries = await window.dataService.getDeliveries({ status: ['Completed', 'Signed'] });
                        window.deliveryHistory = deliveries || [];
                        console.log('✅ SUPABASE-ONLY: Loaded delivery history:', window.deliveryHistory.length);
                        
                        // Call original function for UI updates
                        if (originalLoadDeliveryHistory !== window.loadDeliveryHistory) {
                            return originalLoadDeliveryHistory.call(this);
                        }
                        
                        return window.deliveryHistory;
                    } catch (error) {
                        console.error('❌ SUPABASE-ONLY: Failed to load delivery history:', error);
                        throw error;
                    }
                } else {
                    throw new Error('Supabase connection required for loading delivery history');
                }
            };
        }

        // Override loadCustomers to use dataService
        if (typeof window.loadCustomers === 'function') {
            const originalLoadCustomers = window.loadCustomers;
            
            window.loadCustomers = async function() {
                console.log('🎯 SUPABASE-ONLY: Loading customers...');
                
                if (window.dataService) {
                    try {
                        const customers = await window.dataService.getCustomers();
                        window.customers = customers || [];
                        console.log('✅ SUPABASE-ONLY: Loaded customers:', window.customers.length);
                        
                        // Call original function for UI updates
                        if (originalLoadCustomers !== window.loadCustomers) {
                            return originalLoadCustomers.call(this);
                        }
                        
                        return window.customers;
                    } catch (error) {
                        console.error('❌ SUPABASE-ONLY: Failed to load customers:', error);
                        throw error;
                    }
                } else {
                    throw new Error('Supabase connection required for loading customers');
                }
            };
        }

        console.log('✅ Data loading functions enhanced to use Supabase-only');
    }

    /**
     * 🔄 CLEAN UP EXISTING localStorage DATA
     */
    function cleanupExistingLocalStorageData() {
        console.log('🧹 Cleaning up existing localStorage data...');

        const mciKeys = [
            'mci-active-deliveries',
            'mci-delivery-history',
            'mci-customers',
            'ePodRecords',
            'analytics-cost-breakdown',
            'activeDeliveries' // Legacy key
        ];

        let cleanedCount = 0;
        mciKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                cleanedCount++;
                console.log(`🗑️ Removed localStorage key: ${key}`);
            }
        });

        console.log(`✅ Cleaned up ${cleanedCount} localStorage keys`);
    }

    /**
     * 🔄 INITIALIZE SUPABASE-ONLY DATA LOADING
     */
    async function initializeSupabaseOnlyDataLoading() {
        console.log('🚀 Initializing Supabase-only data loading...');

        // Wait for dataService to be available
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.dataService && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.dataService) {
            console.error('❌ dataService not available after waiting');
            return;
        }

        try {
            // Load all data from Supabase
            console.log('📊 Loading all data from Supabase...');
            
            // Load active deliveries
            try {
                const activeDeliveries = await window.dataService.getDeliveries({ status: 'Active' });
                window.activeDeliveries = activeDeliveries || [];
                console.log(`✅ Loaded ${window.activeDeliveries.length} active deliveries from Supabase`);
            } catch (error) {
                console.warn('⚠️ Failed to load active deliveries:', error);
                window.activeDeliveries = [];
            }

            // Load delivery history
            try {
                const deliveryHistory = await window.dataService.getDeliveries({ status: ['Completed', 'Signed'] });
                window.deliveryHistory = deliveryHistory || [];
                console.log(`✅ Loaded ${window.deliveryHistory.length} delivery history from Supabase`);
            } catch (error) {
                console.warn('⚠️ Failed to load delivery history:', error);
                window.deliveryHistory = [];
            }

            // Load customers
            try {
                const customers = await window.dataService.getCustomers();
                window.customers = customers || [];
                console.log(`✅ Loaded ${window.customers.length} customers from Supabase`);
            } catch (error) {
                console.warn('⚠️ Failed to load customers:', error);
                window.customers = [];
            }

            // Refresh UI displays
            setTimeout(() => {
                if (typeof window.loadActiveDeliveries === 'function') {
                    window.loadActiveDeliveries();
                }
                if (typeof window.loadDeliveryHistory === 'function') {
                    window.loadDeliveryHistory();
                }
                if (typeof window.displayCustomers === 'function') {
                    window.displayCustomers();
                }
                if (typeof window.updateDashboardMetrics === 'function') {
                    window.updateDashboardMetrics();
                }
            }, 500);

            console.log('✅ Supabase-only data loading complete');

        } catch (error) {
            console.error('❌ Failed to initialize Supabase-only data loading:', error);
        }
    }

    /**
     * 🚀 MAIN INITIALIZATION
     */
    function initializeCompleteLocalStorageRemoval() {
        console.log('🚀 Initializing complete localStorage removal...');

        // Apply all fixes
        disableLocalStorageOperations();
        overrideSaveFunctions();
        enhanceDataLoading();
        cleanupExistingLocalStorageData();

        // Initialize data loading after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(initializeSupabaseOnlyDataLoading, 1000);
            });
        } else {
            setTimeout(initializeSupabaseOnlyDataLoading, 1000);
        }

        console.log('✅ COMPLETE localStorage REMOVAL: Initialization complete');
        console.log('✅ System is now 100% Supabase-only');
    }

    // Initialize immediately
    initializeCompleteLocalStorageRemoval();

    // Make functions globally available for testing
    window.completeLocalStorageRemoval = {
        disableLocalStorageOperations,
        overrideSaveFunctions,
        enhanceDataLoading,
        cleanupExistingLocalStorageData,
        initializeSupabaseOnlyDataLoading
    };

})();

console.log('✅ COMPLETE localStorage REMOVAL: Script complete - System is now 100% Supabase-only');