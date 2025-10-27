/**
 * DELIVERY DATE ENHANCEMENT
 * Adds custom delivery date selection to DR Preview modal
 * Replaces "Booked Date" concept with user-selectable "Delivery Date"
 */

console.log('🔧 Loading Delivery Date Enhancement...');

(function() {
    'use strict';
    
    /**
     * Initialize delivery date functionality
     */
    function initDeliveryDateEnhancement() {
        console.log('🚀 Initializing Delivery Date Enhancement...');
        
        // Set up delivery date input
        setupDeliveryDateInput();
        
        // Override existing booking functions to use delivery date
        overrideBookingFunctions();
        
        // Update UI labels
        updateUILabels();
        
        console.log('✅ Delivery Date Enhancement initialized');
    }
    
    /**
     * Set up the delivery date input field
     */
    function setupDeliveryDateInput() {
        const deliveryDateInput = document.getElementById('drDeliveryDate');
        
        if (deliveryDateInput) {
            // Set minimum date to today
            const today = new Date().toISOString().split('T')[0];
            deliveryDateInput.min = today;
            
            // Set default to today
            deliveryDateInput.value = today;
            
            // Add change event listener
            deliveryDateInput.addEventListener('change', function() {
                const selectedDate = new Date(this.value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    alert('Delivery date cannot be in the past. Please select today or a future date.');
                    this.value = today.toISOString().split('T')[0];
                    return;
                }
                
                console.log('📅 Delivery date selected:', this.value);
                updatePreviewWithDeliveryDate(this.value);
            });
            
            console.log('✅ Delivery date input configured');
        }
    }
    
    /**
     * Update preview table with selected delivery date
     */
    function updatePreviewWithDeliveryDate(deliveryDate) {
        const previewTableBody = document.getElementById('drPreviewTableBody');
        
        if (previewTableBody) {
            // Update all rows in preview to show the selected delivery date
            const rows = previewTableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > 5) { // Make sure we have enough columns
                    // Update the "Created Date" column (index 5) to show selected delivery date
                    const formattedDate = new Date(deliveryDate).toLocaleDateString();
                    cells[5].textContent = formattedDate;
                }
            });
            
            console.log('✅ Preview updated with delivery date:', deliveryDate);
        }
    }
    
    /**
     * Override existing booking functions to use delivery date instead of current date
     */
    function overrideBookingFunctions() {
        // Store original functions if they exist
        if (typeof window.originalProcessDRUpload === 'undefined' && typeof window.processDRUpload === 'function') {
            window.originalProcessDRUpload = window.processDRUpload;
        }
        
        // Override the DR upload processing to include delivery date
        if (typeof window.processDRUpload === 'function') {
            window.processDRUpload = function(data) {
                console.log('🔧 Enhanced processDRUpload called with delivery date support');
                
                // Get the selected delivery date
                const deliveryDateInput = document.getElementById('drDeliveryDate');
                const selectedDeliveryDate = deliveryDateInput ? deliveryDateInput.value : null;
                
                if (selectedDeliveryDate) {
                    // Add delivery date to each DR record
                    if (Array.isArray(data)) {
                        data.forEach(record => {
                            record.booked_date = selectedDeliveryDate; // Use booked_date field but with delivery date value
                            record.delivery_date = selectedDeliveryDate; // Also store as delivery_date for clarity
                            record.created_at = new Date().toISOString(); // Actual creation timestamp
                        });
                    }
                    
                    console.log('📅 DR records enhanced with delivery date:', selectedDeliveryDate);
                }
                
                // Call original function with enhanced data
                if (typeof window.originalProcessDRUpload === 'function') {
                    return window.originalProcessDRUpload(data);
                } else {
                    console.warn('⚠️ Original processDRUpload function not found');
                    return data;
                }
            };
        }
        
        // Override confirmation function to include delivery date
        const confirmBtn = document.getElementById('confirmDrUploadBtn');
        if (confirmBtn) {
            // Store original click handler
            const originalOnClick = confirmBtn.onclick;
            
            confirmBtn.onclick = function() {
                console.log('🔧 Enhanced confirm button clicked');
                
                // Validate delivery date is selected
                const deliveryDateInput = document.getElementById('drDeliveryDate');
                if (!deliveryDateInput || !deliveryDateInput.value) {
                    alert('Please select a delivery date before confirming.');
                    return;
                }
                
                // Add delivery date to pending data
                if (window.pendingDRData) {
                    const deliveryDate = deliveryDateInput.value;
                    
                    if (Array.isArray(window.pendingDRData)) {
                        window.pendingDRData.forEach(record => {
                            record.booked_date = deliveryDate; // Backend field name
                            record.delivery_date = deliveryDate; // User-friendly field name
                            record.created_at = new Date().toISOString(); // Actual creation time
                        });
                    }
                    
                    console.log('📅 Pending DR data enhanced with delivery date:', deliveryDate);
                }
                
                // Call original handler
                if (originalOnClick) {
                    originalOnClick.call(this);
                } else {
                    // Fallback: trigger the upload process
                    if (window.pendingDRData && typeof window.processInlineUpload === 'function') {
                        window.processInlineUpload(window.pendingDRData);
                    }
                }
            };
        }
        
        // Override createBookingTimestamp function if it exists
        if (typeof window.createBookingTimestamp === 'function') {
            const originalCreateBookingTimestamp = window.createBookingTimestamp;
            window.createBookingTimestamp = function() {
                const originalResult = originalCreateBookingTimestamp();
                const selectedDate = getSelectedDeliveryDate();
                
                // Override the dates with selected delivery date
                return {
                    ...originalResult,
                    deliveryDate: selectedDate,
                    bookedDate: selectedDate
                };
            };
        }
        
        // Override any date creation functions
        const originalGetLocalSystemDate = window.getLocalSystemDate;
        window.getLocalSystemDate = function() {
            const selectedDate = getSelectedDeliveryDate();
            console.log('🔧 getLocalSystemDate overridden, returning:', selectedDate);
            return selectedDate;
        };
        
        console.log('✅ Booking functions overridden with delivery date support');
    }
    
    /**
     * Update UI labels from "Booked Date" to "Delivery Date"
     */
    function updateUILabels() {
        // Update any existing labels in the interface
        const elementsToUpdate = [
            { selector: 'label[for*="booked"]', newText: 'Delivery Date' },
            { selector: 'th', searchText: 'Booked Date', newText: 'Delivery Date' },
            { selector: 'td', searchText: 'Booked Date', newText: 'Delivery Date' },
            { selector: '.form-label', searchText: 'Booked Date', newText: 'Delivery Date' },
            { selector: 'span', searchText: 'Booking Date', newText: 'Delivery Date' },
            { selector: 'p', searchText: 'Date Booked', newText: 'Delivery Date' }
        ];
        
        elementsToUpdate.forEach(({ selector, searchText, newText }) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (searchText) {
                    if (element.textContent && element.textContent.includes(searchText)) {
                        element.textContent = element.textContent.replace(searchText, newText);
                    }
                } else if (newText) {
                    element.textContent = newText;
                }
            });
        });
        
        console.log('✅ UI labels updated to use "Delivery Date"');
    }
    
    /**
     * Get the selected delivery date
     */
    function getSelectedDeliveryDate() {
        const deliveryDateInput = document.getElementById('drDeliveryDate');
        const selectedDate = deliveryDateInput ? deliveryDateInput.value : null;
        
        if (selectedDate) {
            console.log('📅 Using selected delivery date:', selectedDate);
            return selectedDate;
        }
        
        // Fallback to today
        const today = new Date().toISOString().split('T')[0];
        console.log('📅 Using fallback date (today):', today);
        return today;
    }
    
    /**
     * Set delivery date programmatically
     */
    function setDeliveryDate(date) {
        const deliveryDateInput = document.getElementById('drDeliveryDate');
        if (deliveryDateInput) {
            deliveryDateInput.value = date;
            updatePreviewWithDeliveryDate(date);
            console.log('📅 Delivery date set to:', date);
        }
    }
    
    /**
     * Validate delivery date
     */
    function validateDeliveryDate(date) {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return selectedDate >= today;
    }
    
    // Export functions globally
    window.getSelectedDeliveryDate = getSelectedDeliveryDate;
    window.setDeliveryDate = setDeliveryDate;
    window.validateDeliveryDate = validateDeliveryDate;
    window.updatePreviewWithDeliveryDate = updatePreviewWithDeliveryDate;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDeliveryDateEnhancement);
    } else {
        // DOM is already loaded
        setTimeout(initDeliveryDateEnhancement, 100);
    }
    
    // Set up periodic override to ensure our delivery date is always used
    setInterval(() => {
        // Ensure our getSelectedDeliveryDate function is always available
        if (typeof window.getSelectedDeliveryDate !== 'function') {
            window.getSelectedDeliveryDate = getSelectedDeliveryDate;
        }
        
        // Re-override key functions periodically
        if (typeof window.getLocalSystemDate === 'function') {
            window.getLocalSystemDate = function() {
                const selectedDate = getSelectedDeliveryDate();
                return selectedDate;
            };
        }
    }, 2000);
    
    console.log('✅ Delivery Date Enhancement loaded successfully');
    
})();

// Export module info
window.deliveryDateEnhancement = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};