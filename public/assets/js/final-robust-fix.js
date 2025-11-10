/**
 * FINAL ROBUST FIX
 * Definitively fixes both critical issues:
 * 1. Completed DR items not disappearing from Active Deliveries
 * 2. Date values being reset to 080000 format
 */

console.log('🔧 Loading Final Robust Fix...');

(function() {
    'use strict';
    
    // =============================================================================
    // ISSUE 1 FIX: COMPLETED DR ITEMS NOT DISAPPEARING
    // =============================================================================
    
    /**
     * CRITICAL: Override ALL functions that load/filter active deliveries
     * to ensure completed items are ALWAYS removed
     */
    function enforceCompletedItemRemoval() {
        console.log('🔧 Enforcing completed item removal from active deliveries...');
        
        // Store original functions
        const originalLoadActiveDeliveries = window.loadActiveDeliveries;
        const originalPopulateActiveDeliveriesTable = window.populateActiveDeliveriesTable;
        const originalUpdateDeliveryStatus = window.updateDeliveryStatus;
        
        // OVERRIDE: loadActiveDeliveries
        window.loadActiveDeliveries = function() {
            console.log('🔧 FINAL FIX: loadActiveDeliveries called');
            
            // STEP 1: Aggressively filter completed items from global array
            if (window.activeDeliveries && Array.isArray(window.activeDeliveries)) {
                const beforeCount = window.activeDeliveries.length;
                
                window.activeDeliveries = window.activeDeliveries.filter(delivery => {
                    const status = delivery.status;
                    const isCompleted = status === 'Completed' || status === 'Signed';
                    
                    if (isCompleted) {
                        console.log(`🗑️ REMOVING completed item from active: ${delivery.drNumber || delivery.dr_number} (status: ${status})`);
                    }
                    
                    return !isCompleted;
                });
                
                const afterCount = window.activeDeliveries.length;
                const removedCount = beforeCount - afterCount;
                
                if (removedCount > 0) {
                    console.log(`✅ FINAL FIX: Remov