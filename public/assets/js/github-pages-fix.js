/**
 * GITHUB PAGES DATA PERSISTENCE FIX
 * Ensures data works properly when deployed to GitHub Pages
 */

console.log('🔧 Loading GitHub Pages compatibility fix...');

// Enhanced localStorage management for GitHub Pages
(function() {
    'use strict';
    
    // Ensure global arrays are properly initialized
    function initializeGlobalArrays() {
        if (typeof window.activeDeliveries === 'undefined') {
            window.activeDeliveries = [];
            console.log('✅ Initialized window.activeDeliveries');
        }
        
        if (typeof window.deliveryHistory === 'undefined') {
            window.deliveryHistory = [];
            console.log('✅ Initialized window.deliveryHistory');
        }
        
        if (typeof window.customers === 'undefined') {
            window.customers = [];
            console.log('✅ Initialized window.customers');
        }
        
        // Load data from localStorage
        loadAllDataFromStorage();
    }
    
    // Load all data from localStorage
    function loadAllDataFromStorage() {
        try {
            // Load active deliveries
            const savedActive = localStorage.getItem('mci-active-deliveries');
            if (savedActive) {
                const parsed = JSON.parse(savedActive);
                if (Array.isArray(parsed)) {
                    window.activeDeliveries = parsed;
                    console.log(`✅ Loaded ${parsed.length} active deliveries from localStorage`);
                }
            }
            
            // Load delivery history
            const savedHistory = localStorage.getItem('mci-delivery-history');
            if (savedHistory) {
                const parsed = JSON.parse(savedHistory);
                if (Array.isArray(parsed)) {
                    window.deliveryHistory = parsed;
                    console.log(`✅ Loaded ${parsed.length} delivery history items from localStorage`);
                }
            }
            
            // Load customers
            const savedCustomers = localStorage.getItem('mci-customers');
            if (savedCustomers) {
                const parsed = JSON.parse(savedCustomers);
                if (Array.isArray(parsed)) {
                    window.customers = parsed;
                    console.log(`✅ Loaded ${parsed.length} customers from localStorage`);
                }
            }
            
        } catch (error) {
            console.error('❌ Error loading data from localStorage:', error);
        }
    }
    
    // Enhanced save function with error handling
    function saveAllDataToStorage() {
        try {
            // Save active deliveries
            if (window.activeDeliveries) {
                localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                console.log(`💾 Saved ${window.activeDeliveries.length} active deliveries`);
            }
            
            // Save delivery history
            if (window.deliveryHistory) {
                localStorage.setItem('mci-delivery-history', JSON.stringify(window.deliveryHistory));
                console.log(`💾 Saved ${window.deliveryHistory.length} delivery history items`);
            }
            
            // Save customers
            if (window.customers) {
                localStorage.setItem('mci-customers', JSON.stringify(window.customers));
                console.log(`💾 Saved ${window.customers.length} customers`);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error saving data to localStorage:', error);
            return false;
        }
    }
    
    // Enhanced Excel upload processing
    function enhancedProcessExcelData(data) {
        console.log('📊 Processing Excel data for GitHub Pages...');
        
        if (!Array.isArray(data) || data.length === 0) {
            console.error('❌ Invalid Excel data provided');
            return false;
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        data.forEach((row, index) => {
            try {
                // Create delivery object from Excel row
                const delivery = {
                    id: 'excel-' + Date.now() + '-' + index,
                    drNumber: row['DR Number'] || row['dr_number'] || `DR-${Date.now()}-${index}`,
                    customerName: row['Customer Name'] || row['customer_name'] || 'Unknown Customer',
                    vendorNumber: row['Vendor Number'] || row['vendor_number'] || 'VN-001',
                    origin: row['Origin'] || row['origin'] || 'Unknown Origin',
                    destination: row['Destination'] || row['destination'] || 'Unknown Destination',
                    truckType: row['Truck Type'] || row['truck_type'] || '10-Wheeler',
                    truckPlateNumber: row['Truck Plate'] || row['truck_plate'] || 'ABC-123',
                    status: 'Active',
                    createdDate: new Date().toLocaleDateString(),
                    createdBy: 'Excel Upload',
                    uploadedAt: new Date().toISOString()
                };
                
                // Add to active deliveries
                window.activeDeliveries.push(delivery);
                successCount++;
                
                console.log(`✅ Processed delivery ${index + 1}: ${delivery.drNumber}`);
                
            } catch (error) {
                console.error(`❌ Error processing row ${index + 1}:`, error);
                errorCount++;
            }
        });
        
        // Save to localStorage
        const saved = saveAllDataToStorage();
        
        if (saved) {
            console.log(`🎉 Excel upload complete: ${successCount} successful, ${errorCount} errors`);
            
            // Refresh the active deliveries view
            if (typeof window.loadActiveDeliveries === 'function') {
                setTimeout(() => {
                    window.loadActiveDeliveries();
                }, 100);
            }
            
            // Show success message
            if (typeof showToast === 'function') {
                showToast(`Successfully uploaded ${successCount} deliveries from Excel!`, 'success');
            }
            
            return true;
        } else {
            console.error('❌ Failed to save Excel data');
            return false;
        }
    }
    
    // Override the existing Excel processing if it exists
    if (typeof window.processExcelData === 'function') {
        window.originalProcessExcelData = window.processExcelData;
    }
    window.processExcelData = enhancedProcessExcelData;
    
    // Enhanced booking save for GitHub Pages
    function enhancedSaveBooking(bookingData) {
        console.log('💾 Enhanced save booking for GitHub Pages...');
        
        if (!bookingData) {
            console.error('❌ No booking data provided');
            return false;
        }
        
        try {
            // Ensure booking has required fields
            const delivery = {
                id: bookingData.id || 'booking-' + Date.now(),
                drNumber: bookingData.drNumber || `DR-${Date.now()}`,
                customerName: bookingData.customerName || 'Unknown Customer',
                vendorNumber: bookingData.vendorNumber || 'VN-001',
                origin: bookingData.origin || 'Unknown Origin',
                destination: bookingData.destination || 'Unknown Destination',
                truckType: bookingData.truckType || '10-Wheeler',
                truckPlateNumber: bookingData.truckPlateNumber || 'ABC-123',
                status: 'Active',
                createdDate: new Date().toLocaleDateString(),
                createdBy: 'Manual Booking',
                createdAt: new Date().toISOString(),
                ...bookingData // Spread any additional fields
            };
            
            // Add to active deliveries
            window.activeDeliveries.push(delivery);
            console.log(`✅ Added booking: ${delivery.drNumber}`);
            
            // Save to localStorage
            const saved = saveAllDataToStorage();
            
            if (saved) {
                // Refresh views
                if (typeof window.loadActiveDeliveries === 'function') {
                    setTimeout(() => {
                        window.loadActiveDeliveries();
                    }, 100);
                }
                
                // Show success message
                if (typeof showToast === 'function') {
                    showToast('Booking saved successfully!', 'success');
                }
                
                return true;
            } else {
                throw new Error('Failed to save to localStorage');
            }
            
        } catch (error) {
            console.error('❌ Error saving booking:', error);
            
            if (typeof showToast === 'function') {
                showToast('Failed to save booking. Please try again.', 'error');
            }
            
            return false;
        }
    }
    
    // Data synchronization check
    function checkDataSync() {
        console.log('🔄 Checking data synchronization...');
        
        const activeCount = window.activeDeliveries ? window.activeDeliveries.length : 0;
        const historyCount = window.deliveryHistory ? window.deliveryHistory.length : 0;
        const customerCount = window.customers ? window.customers.length : 0;
        
        console.log(`📊 Current data: ${activeCount} active, ${historyCount} history, ${customerCount} customers`);
        
        // Auto-save every 30 seconds to prevent data loss
        setInterval(() => {
            saveAllDataToStorage();
        }, 30000);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGlobalArrays);
    } else {
        initializeGlobalArrays();
    }
    
    // Export functions
    window.enhancedProcessExcelData = enhancedProcessExcelData;
    window.enhancedSaveBooking = enhancedSaveBooking;
    window.saveAllDataToStorage = saveAllDataToStorage;
    window.loadAllDataFromStorage = loadAllDataFromStorage;
    
    // Start data sync check
    setTimeout(checkDataSync, 1000);
    
    console.log('✅ GitHub Pages compatibility fix loaded successfully');
    
})();

// Add helpful debug function
window.debugGitHubPagesData = function() {
    console.log('🔍 GitHub Pages Data Debug:');
    console.log('Active Deliveries:', window.activeDeliveries);
    console.log('Delivery History:', window.deliveryHistory);
    console.log('Customers:', window.customers);
    
    // Check localStorage
    console.log('localStorage keys:', Object.keys(localStorage));
    console.log('mci-active-deliveries:', localStorage.getItem('mci-active-deliveries'));
    console.log('mci-delivery-history:', localStorage.getItem('mci-delivery-history'));
    console.log('mci-customers:', localStorage.getItem('mci-customers'));
};