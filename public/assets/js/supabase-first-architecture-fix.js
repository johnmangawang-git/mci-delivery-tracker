/**
 * Supabase-First Architecture Fix
 * Eliminates localStorage quota issues by using Supabase as primary storage
 * localStorage only used for temporary caching, not permanent storage
 */

console.log('🏗️ Loading Supabase-First Architecture Fix...');

window.supabaseFirstFix = {
    
    /**
     * Save EPOD record directly to Supabase (no localStorage)
     */
    async saveEPODToSupabase(ePodRecord) {
        try {
            console.log('💾 Saving EPOD directly to Supabase:', ePodRecord.dr_number);
            
            if (!window.dataService) {
                throw new Error('DataService not available');
            }
            
            // Save to Supabase epod_records table
            const result = await window.dataService.saveEPOD(ePodRecord);
            console.log('✅ EPOD saved to Supabase successfully');
            
            return result;
            
        } catch (error) {
            console.error('❌ Error saving EPOD to Supabase:', error);
            throw error;
        }
    },
    
    /**
     * Update delivery status in Supabase (no localStorage dependency)
     */
    async updateDeliveryStatusSupabaseFirst(drNumber, newStatus) {
        try {
            console.log(`🔄 Updating DR ${drNumber} status to ${newStatus} in Supabase`);
            
            if (!window.dataService) {
                throw new Error('DataService not available');
            }
            
            // Update status directly in Supabase
            await window.dataService.updateDeliveryStatusInSupabase(drNumber, newStatus);
            console.log('✅ Delivery status updated in Supabase');
            
            // Only update local cache after successful Supabase update
            this.updateLocalCacheAfterSupabaseSuccess(drNumber, newStatus);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Error updating delivery status in Supabase for DR ${drNumber}:`, error);
            throw error;
        }
    },
    
    /**
     * Update local cache only after successful Supabase operations
     */
    updateLocalCacheAfterSupabaseSuccess(drNumber, newStatus) {
        try {
            // Get current data from localStorage (for caching only)
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            
            // Find and update delivery
            const activeIndex = activeDeliveries.findIndex(d => (d.drNumber || d.dr_number) === drNumber);
            
            if (activeIndex !== -1) {
                const delivery = activeDeliveries[activeIndex];
                delivery.status = newStatus;
                
                // If completed, move to history
                if (newStatus === 'Completed' || newStatus === 'Signed') {
                    // Add completion data
                    delivery.completedDate = new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    delivery.completedDateTime = new Date().toISOString();
                    
                    // Move to history
                    deliveryHistory.unshift(delivery);
                    activeDeliveries.splice(activeIndex, 1);
                    
                    console.log(`📦 Moved DR ${drNumber} to history cache`);
                }
            }
            
            // Update localStorage cache (small data only)
            localStorage.setItem('mci-active-deliveries', JSON.stringify(activeDeliveries));
            localStorage.setItem('mci-delivery-history', JSON.stringify(deliveryHistory));
            
            // Update global references
            if (window.activeDeliveries) {
                window.activeDeliveries = activeDeliveries;
            }
            if (window.deliveryHistory) {
                window.deliveryHistory = deliveryHistory;
            }
            
            console.log('✅ Local cache updated after Supabase success');
            
        } catch (error) {
            console.warn('⚠️ Error updating local cache (non-critical):', error);
            // Don't throw - cache update failure shouldn't break the flow
        }
    },
    
    /**
     * Clean localStorage of large data that should be in Supabase
     */
    cleanupLocalStorageQuota() {
        try {
            console.log('🧹 Cleaning up localStorage quota issues...');
            
            // Remove large EPOD records from localStorage
            const ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
            console.log(`Found ${ePodRecords.length} EPOD records in localStorage`);
            
            if (ePodRecords.length > 0) {
                // Keep only the last 10 records for offline access
                const recentRecords = ePodRecords.slice(-10);
                localStorage.setItem('ePodRecords', JSON.stringify(recentRecords));
                console.log(`Reduced EPOD records from ${ePodRecords.length} to ${recentRecords.length}`);
            }
            
            // Remove other large data that should be in Supabase
            const keysToClean = [
                'large-signature-data',
                'bulk-delivery-data',
                'cached-images',
                'temp-upload-data'
            ];
            
            keysToClean.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`Removed ${key} from localStorage`);
                }
            });
            
            console.log('✅ localStorage cleanup completed');
            
        } catch (error) {
            console.error('❌ Error during localStorage cleanup:', error);
        }
    },
    
    /**
     * Enhanced signature saving that uses Supabase first
     */
    async saveSignatureSupabaseFirst(signatureInfo) {
        try {
            console.log('🖊️ Saving signature with Supabase-first architecture');
            
            // Step 1: Save EPOD to Supabase (no localStorage)
            const ePodRecord = {
                dr_number: signatureInfo.drNumber,
                customer_name: signatureInfo.customerName,
                signature_data: signatureInfo.signatureData,
                status: 'Completed',
                signed_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            };
            
            await this.saveEPODToSupabase(ePodRecord);
            
            // Step 2: Update delivery status in Supabase
            await this.updateDeliveryStatusSupabaseFirst(signatureInfo.drNumber, 'Completed');
            
            // Step 3: Refresh UI from Supabase (source of truth)
            await this.refreshFromSupabase();
            
            console.log('✅ Signature saved successfully with Supabase-first architecture');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error saving signature with Supabase-first architecture:', error);
            throw error;
        }
    },
    
    /**
     * Refresh data from Supabase (source of truth)
     */
    async refreshFromSupabase() {
        try {
            console.log('🔄 Refreshing data from Supabase...');
            
            if (!window.dataService) {
                console.warn('DataService not available, skipping refresh');
                return;
            }
            
            // Get fresh data from Supabase
            const deliveries = await window.dataService.getDeliveries();
            
            // Separate active and completed deliveries
            const activeDeliveries = deliveries.filter(d => 
                d.status !== 'Completed' && d.status !== 'Signed'
            );
            const deliveryHistory = deliveries.filter(d => 
                d.status === 'Completed' || d.status === 'Signed'
            );
            
            // Update global references
            window.activeDeliveries = activeDeliveries;
            window.deliveryHistory = deliveryHistory;
            
            // Update localStorage cache (small data only)
            localStorage.setItem('mci-active-deliveries', JSON.stringify(activeDeliveries));
            localStorage.setItem('mci-delivery-history', JSON.stringify(deliveryHistory));
            
            // Refresh UI
            if (typeof window.populateActiveDeliveriesTable === 'function') {
                window.populateActiveDeliveriesTable();
            }
            if (typeof window.loadDeliveryHistory === 'function') {
                window.loadDeliveryHistory();
            }
            
            console.log(`✅ Data refreshed from Supabase: ${activeDeliveries.length} active, ${deliveryHistory.length} history`);
            
        } catch (error) {
            console.error('❌ Error refreshing from Supabase:', error);
        }
    },
    
    /**
     * Initialize Supabase-first architecture
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Supabase-first architecture...');
            
            // Clean up localStorage quota issues
            this.cleanupLocalStorageQuota();
            
            // Override problematic localStorage-heavy functions
            this.overrideLocalStorageHeavyFunctions();
            
            // Refresh from Supabase
            await this.refreshFromSupabase();
            
            console.log('✅ Supabase-first architecture initialized');
            
        } catch (error) {
            console.error('❌ Error initializing Supabase-first architecture:', error);
        }
    },
    
    /**
     * Override functions that rely too heavily on localStorage
     */
    overrideLocalStorageHeavyFunctions() {
        // Override the problematic signature saving function
        if (typeof window.comprehensiveSaveSignature === 'function') {
            window.originalComprehensiveSaveSignature = window.comprehensiveSaveSignature;
            
            window.comprehensiveSaveSignature = async (signatureInfo) => {
                console.log('🔄 Using Supabase-first signature saving');
                return await this.saveSignatureSupabaseFirst(signatureInfo);
            };
        }
        
        // Override EPOD saving to use Supabase first
        if (typeof window.saveEPOD === 'function') {
            window.originalSaveEPOD = window.saveEPOD;
            
            window.saveEPOD = async (ePodRecord) => {
                console.log('🔄 Using Supabase-first EPOD saving');
                return await this.saveEPODToSupabase(ePodRecord);
            };
        }
        
        console.log('✅ localStorage-heavy functions overridden with Supabase-first versions');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.supabaseFirstFix.initialize();
    }, 2000);
});

// Also initialize when dataService becomes available
window.addEventListener('dataServiceReady', function() {
    setTimeout(() => {
        window.supabaseFirstFix.initialize();
    }, 1000);
});

console.log('✅ Supabase-First Architecture Fix loaded');