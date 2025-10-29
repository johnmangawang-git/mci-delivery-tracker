/**
 * Delivery Status Fix
 * Comprehensive solution for deliveries getting stuck in Active Deliveries
 */

console.log('🔧 Loading Delivery Status Fix...');

// Enhanced delivery status management
window.deliveryStatusFix = {
    
    /**
     * Fix stuck deliveries that should be in history
     */
    async fixStuckDeliveries() {
        console.log('🔍 Checking for stuck deliveries...');
        
        try {
            // Get current data
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            
            let fixedCount = 0;
            const fixedDRs = [];
            
            // Find deliveries that should be in history
            for (let i = activeDeliveries.length - 1; i >= 0; i--) {
                const delivery = activeDeliveries[i];
                
                // Check if delivery should be in history
                if (this.shouldBeInHistory(delivery)) {
                    console.log(`📦 Moving stuck delivery to history: DR ${delivery.drNumber || delivery.dr_number}`);
                    
                    // Ensure completion data is set
                    this.ensureCompletionData(delivery);
                    
                    // Move to history
                    deliveryHistory.unshift(delivery);
                    activeDeliveries.splice(i, 1);
                    
                    fixedCount++;
                    fixedDRs.push(delivery.drNumber || delivery.dr_number);
                }
            }
            
            // Remove duplicates from history
            const cleanHistory = this.removeDuplicatesFromHistory(deliveryHistory);
            
            // Save cleaned data
            localStorage.setItem('mci-active-deliveries', JSON.stringify(activeDeliveries));
            localStorage.setItem('mci-delivery-history', JSON.stringify(cleanHistory));
            
            // Update global references
            if (window.activeDeliveries) {
                window.activeDeliveries = activeDeliveries;
            }
            if (window.deliveryHistory) {
                window.deliveryHistory = cleanHistory;
            }
            
            // Also update in Supabase if available
            await this.syncWithSupabase(fixedDRs);
            
            console.log(`✅ Fixed ${fixedCount} stuck deliveries:`, fixedDRs);
            
            return {
                fixed: fixedCount,
                drNumbers: fixedDRs,
                activeCount: activeDeliveries.length,
                historyCount: cleanHistory.length
            };
            
        } catch (error) {
            console.error('❌ Error fixing stuck deliveries:', error);
            throw error;
        }
    },
    
    /**
     * Check if a delivery should be in history
     */
    shouldBeInHistory(delivery) {
        const status = delivery.status;
        
        // Deliveries with these statuses should be in history
        const historyStatuses = ['Completed', 'Signed', 'Delivered', 'Finished'];
        
        // Also check if delivery has signature data (indicates completion)
        const hasSignature = delivery.signature_data || delivery.signatureData || delivery.signature;
        
        // Check if delivery has completion timestamp
        const hasCompletionTime = delivery.completedDate || delivery.completed_at || delivery.signed_at;
        
        return historyStatuses.includes(status) || hasSignature || hasCompletionTime;
    },
    
    /**
     * Ensure delivery has proper completion data
     */
    ensureCompletionData(delivery) {
        // Set completion date if missing
        if (!delivery.completedDate) {
            delivery.completedDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        
        // Set completion timestamp if missing
        if (!delivery.completedDateTime && !delivery.completed_at && !delivery.signed_at) {
            delivery.completedDateTime = new Date().toISOString();
        }
        
        // Ensure status is set to completed
        if (!delivery.status || delivery.status === 'Active' || delivery.status === 'Pending') {
            delivery.status = 'Completed';
        }
    },
    
    /**
     * Remove duplicate deliveries from history (keep most recent)
     */
    removeDuplicatesFromHistory(deliveryHistory) {
        const uniqueDeliveries = [];
        const seenDRs = new Set();
        
        // Sort by completion date (most recent first)
        const sortedHistory = deliveryHistory.sort((a, b) => {
            const dateA = new Date(a.completedDateTime || a.completed_at || a.signed_at || 0);
            const dateB = new Date(b.completedDateTime || b.completed_at || b.signed_at || 0);
            return dateB - dateA;
        });
        
        for (const delivery of sortedHistory) {
            const drNumber = delivery.drNumber || delivery.dr_number;
            if (drNumber && !seenDRs.has(drNumber)) {
                seenDRs.add(drNumber);
                uniqueDeliveries.push(delivery);
            }
        }
        
        return uniqueDeliveries;
    },
    
    /**
     * Sync fixed deliveries with Supabase
     */
    async syncWithSupabase(fixedDRs) {
        if (!window.dataService || fixedDRs.length === 0) {
            return;
        }
        
        try {
            console.log('🔄 Syncing fixed deliveries with Supabase...');
            
            for (const drNumber of fixedDRs) {
                await window.dataService.updateDeliveryStatusInSupabase(drNumber, 'Completed');
            }
            
            console.log('✅ Supabase sync completed');
        } catch (error) {
            console.warn('⚠️ Supabase sync failed (continuing with local fix):', error);
        }
    },
    
    /**
     * Enhanced delivery status update with proper validation
     */
    async updateDeliveryStatus(drNumber, newStatus) {
        console.log(`🔄 Updating DR ${drNumber} status to: ${newStatus}`);
        
        try {
            // Update in Supabase first
            if (window.dataService) {
                await window.dataService.updateDeliveryStatusInSupabase(drNumber, newStatus);
            }
            
            // Get current data
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            
            // Find delivery in active list
            const activeIndex = activeDeliveries.findIndex(d => (d.drNumber || d.dr_number) === drNumber);
            
            if (activeIndex !== -1) {
                const delivery = activeDeliveries[activeIndex];
                delivery.status = newStatus;
                
                // If completing, move to history
                if (this.shouldBeInHistory(delivery)) {
                    this.ensureCompletionData(delivery);
                    
                    // Move to history
                    deliveryHistory.unshift(delivery);
                    activeDeliveries.splice(activeIndex, 1);
                    
                    console.log(`📦 Moved DR ${drNumber} to history`);
                }
            } else {
                // Check if it's in history and needs to be moved back
                const historyIndex = deliveryHistory.findIndex(d => (d.drNumber || d.dr_number) === drNumber);
                
                if (historyIndex !== -1 && !this.shouldBeInHistory({status: newStatus})) {
                    const delivery = deliveryHistory[historyIndex];
                    delivery.status = newStatus;
                    
                    // Move back to active
                    activeDeliveries.push(delivery);
                    deliveryHistory.splice(historyIndex, 1);
                    
                    console.log(`📦 Moved DR ${drNumber} back to active`);
                }
            }
            
            // Save updated data
            localStorage.setItem('mci-active-deliveries', JSON.stringify(activeDeliveries));
            localStorage.setItem('mci-delivery-history', JSON.stringify(deliveryHistory));
            
            // Update global references
            if (window.activeDeliveries) {
                window.activeDeliveries = activeDeliveries;
            }
            if (window.deliveryHistory) {
                window.deliveryHistory = deliveryHistory;
            }
            
            // Refresh UI
            this.refreshDeliveryViews();
            
            return true;
            
        } catch (error) {
            console.error(`❌ Error updating delivery status for DR ${drNumber}:`, error);
            throw error;
        }
    },
    
    /**
     * Refresh delivery views
     */
    refreshDeliveryViews() {
        try {
            // Refresh active deliveries table
            if (typeof window.populateActiveDeliveriesTable === 'function') {
                window.populateActiveDeliveriesTable();
            } else if (typeof window.loadActiveDeliveries === 'function') {
                window.loadActiveDeliveries();
            }
            
            // Refresh delivery history
            if (typeof window.loadDeliveryHistory === 'function') {
                window.loadDeliveryHistory();
            }
            
            // Update dashboard stats
            if (typeof window.updateDashboardStats === 'function') {
                window.updateDashboardStats();
            }
            
        } catch (error) {
            console.warn('⚠️ Error refreshing delivery views:', error);
        }
    },
    
    /**
     * Auto-fix stuck deliveries on page load
     */
    async autoFix() {
        try {
            console.log('🔧 Running auto-fix for stuck deliveries...');
            
            const result = await this.fixStuckDeliveries();
            
            if (result.fixed > 0) {
                console.log(`✅ Auto-fix completed: ${result.fixed} deliveries moved to history`);
                
                // Show toast notification if available
                if (typeof window.showToast === 'function') {
                    window.showToast(
                        `Auto-fix: Moved ${result.fixed} completed deliveries to history`, 
                        'success'
                    );
                }
                
                // Refresh views
                this.refreshDeliveryViews();
            }
            
        } catch (error) {
            console.error('❌ Auto-fix failed:', error);
        }
    }
};

// Override the original updateDeliveryStatus function if it exists
if (typeof window.updateDeliveryStatus === 'function') {
    window.originalUpdateDeliveryStatus = window.updateDeliveryStatus;
}

window.updateDeliveryStatus = function(drNumber, newStatus) {
    return window.deliveryStatusFix.updateDeliveryStatus(drNumber, newStatus);
};

// Run auto-fix when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        window.deliveryStatusFix.autoFix();
    }, 2000);
});

// Also run auto-fix when data is loaded
window.addEventListener('deliveriesLoaded', function() {
    setTimeout(() => {
        window.deliveryStatusFix.autoFix();
    }, 1000);
});

console.log('✅ Delivery Status Fix loaded successfully');