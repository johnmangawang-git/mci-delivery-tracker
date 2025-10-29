/**
 * Delivery Date System Time Fix
 * Ensures delivery date from DR upload modal is properly mapped with system time
 * Fixes any timing or mapping issues between drDeliveryDate and Active Deliveries
 */

console.log('🕒 Loading Delivery Date System Time Fix...');

window.deliveryDateSystemTimeFix = {
    
    /**
     * Enhanced delivery date capture with system time
     * Uses USER-SELECTED DATE + CURRENT SYSTEM TIME (not system date)
     */
    captureDeliveryDateWithSystemTime() {
        const drDeliveryDateInput = document.getElementById('drDeliveryDate');
        
        if (!drDeliveryDateInput || !drDeliveryDateInput.value) {
            console.warn('⚠️ No delivery date selected, using today');
            const today = new Date();
            return {
                deliveryDate: today.toISOString().split('T')[0],
                deliveryDateTime: today.toISOString(),
                systemTime: today.toISOString(),
                formattedDate: today.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                formattedDateTime: today.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
        }
        
        const selectedDate = drDeliveryDateInput.value; // User-selected date (e.g., "2025-01-31")
        const currentTime = new Date(); // Current system time
        
        // CRITICAL: Combine USER-SELECTED DATE with CURRENT SYSTEM TIME
        // This creates a datetime with the user's chosen date but current time
        const deliveryDateTime = new Date(selectedDate + 'T' + currentTime.toTimeString().split(' ')[0]);
        
        const result = {
            deliveryDate: selectedDate, // User-selected date only
            deliveryDateTime: deliveryDateTime.toISOString(), // User date + system time
            systemTime: currentTime.toISOString(), // Pure system timestamp
            formattedDate: new Date(selectedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            formattedDateTime: deliveryDateTime.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        
        console.log('📅 Delivery date/time captured:', {
            userSelectedDate: selectedDate,
            currentSystemTime: currentTime.toTimeString(),
            combinedDateTime: result.formattedDateTime
        });
        
        return result;
    },
    
    /**
     * Enhanced booking data creation with proper date mapping
     */
    enhanceBookingWithDeliveryDate(bookingData) {
        const dateInfo = this.captureDeliveryDateWithSystemTime();
        
        // Enhance booking data with comprehensive date information
        const enhancedBooking = {
            ...bookingData,
            
            // Primary delivery date fields
            deliveryDate: dateInfo.deliveryDate,
            bookedDate: dateInfo.deliveryDate, // For backend compatibility
            
            // Timestamp fields
            deliveryDateTime: dateInfo.deliveryDateTime,
            timestamp: dateInfo.systemTime,
            created_at: dateInfo.systemTime,
            updated_at: dateInfo.systemTime,
            
            // Display fields
            formattedDeliveryDate: dateInfo.formattedDate,
            formattedDeliveryDateTime: dateInfo.formattedDateTime,
            
            // Additional metadata
            dateSource: 'user_selected',
            timeSource: 'system_current'
        };
        
        console.log('📅 Enhanced booking with delivery date:', {
            original: bookingData.deliveryDate,
            enhanced: enhancedBooking.deliveryDate,
            dateTime: enhancedBooking.deliveryDateTime,
            formatted: enhancedBooking.formattedDeliveryDate
        });
        
        return enhancedBooking;
    },
    
    /**
     * Override mapDRData function to ensure proper date mapping
     */
    overrideMapDRData() {
        if (typeof window.mapDRData === 'function') {
            const originalMapDRData = window.mapDRData;
            
            window.mapDRData = (data) => {
                console.log('🔧 Enhanced mapDRData called with delivery date fix');
                
                // Call original function
                const mappedData = originalMapDRData(data);
                
                // Enhance each booking with proper delivery date
                if (Array.isArray(mappedData)) {
                    const enhancedData = mappedData.map(booking => {
                        return this.enhanceBookingWithDeliveryDate(booking);
                    });
                    
                    console.log(`📅 Enhanced ${enhancedData.length} bookings with delivery date and system time`);
                    return enhancedData;
                }
                
                return mappedData;
            };
            
            console.log('✅ mapDRData function overridden with delivery date fix');
        }
    },
    
    /**
     * Override processDRUpload to ensure date mapping
     */
    overrideProcessDRUpload() {
        if (typeof window.processDRUpload === 'function') {
            const originalProcessDRUpload = window.processDRUpload;
            
            window.processDRUpload = async (data) => {
                console.log('🔧 Enhanced processDRUpload called');
                
                // Validate delivery date is selected
                const drDeliveryDateInput = document.getElementById('drDeliveryDate');
                if (!drDeliveryDateInput || !drDeliveryDateInput.value) {
                    if (typeof window.showToast === 'function') {
                        window.showToast('⚠️ Please select a delivery date before processing', 'warning');
                    }
                    return;
                }
                
                // Enhance data with delivery date info
                if (Array.isArray(data)) {
                    const dateInfo = this.captureDeliveryDateWithSystemTime();
                    
                    data.forEach(item => {
                        Object.assign(item, {
                            deliveryDate: dateInfo.deliveryDate,
                            bookedDate: dateInfo.deliveryDate,
                            deliveryDateTime: dateInfo.deliveryDateTime,
                            timestamp: dateInfo.systemTime,
                            created_at: dateInfo.systemTime
                        });
                    });
                    
                    console.log('📅 Enhanced DR upload data with delivery date:', dateInfo.deliveryDate);
                }
                
                // Call original function
                return await originalProcessDRUpload(data);
            };
            
            console.log('✅ processDRUpload function overridden with delivery date fix');
        }
    },
    
    /**
     * Override confirmDrUploadBtn click handler
     */
    overrideConfirmButton() {
        const confirmBtn = document.getElementById('confirmDrUploadBtn');
        if (confirmBtn) {
            // Remove existing event listeners
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            
            // Add enhanced click handler
            newConfirmBtn.addEventListener('click', async () => {
                console.log('🔧 Enhanced confirm button clicked');
                
                // Validate delivery date
                const drDeliveryDateInput = document.getElementById('drDeliveryDate');
                if (!drDeliveryDateInput || !drDeliveryDateInput.value) {
                    if (typeof window.showToast === 'function') {
                        window.showToast('⚠️ Please select a delivery date before confirming', 'warning');
                    }
                    return;
                }
                
                // Enhance pending data
                if (window.pendingDRData && Array.isArray(window.pendingDRData)) {
                    const dateInfo = this.captureDeliveryDateWithSystemTime();
                    
                    window.pendingDRData = window.pendingDRData.map(booking => {
                        return this.enhanceBookingWithDeliveryDate(booking);
                    });
                    
                    console.log('📅 Enhanced pending DR data with delivery date and system time');
                }
                
                // Process the upload
                if (typeof window.processInlineUpload === 'function' && window.pendingDRData) {
                    await window.processInlineUpload(window.pendingDRData);
                } else if (typeof window.confirmDrUpload === 'function') {
                    await window.confirmDrUpload();
                }
            });
            
            console.log('✅ Confirm button overridden with delivery date validation');
        }
    },
    
    /**
     * Monitor delivery date input for changes
     */
    monitorDeliveryDateInput() {
        const drDeliveryDateInput = document.getElementById('drDeliveryDate');
        if (drDeliveryDateInput) {
            drDeliveryDateInput.addEventListener('change', (event) => {
                const selectedDate = event.target.value;
                console.log('📅 Delivery date changed to:', selectedDate);
                
                // Validate date is not in the past
                const selected = new Date(selectedDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selected < today) {
                    if (typeof window.showToast === 'function') {
                        window.showToast('⚠️ Delivery date cannot be in the past', 'warning');
                    }
                    event.target.value = today.toISOString().split('T')[0];
                    return;
                }
                
                // Update preview if available
                if (typeof window.updatePreviewWithDeliveryDate === 'function') {
                    window.updatePreviewWithDeliveryDate(selectedDate);
                }
            });
            
            console.log('✅ Delivery date input monitoring enabled');
        }
    },
    
    /**
     * Initialize the fix
     */
    initialize() {
        console.log('🚀 Initializing Delivery Date System Time Fix...');
        
        // Override key functions
        this.overrideMapDRData();
        this.overrideProcessDRUpload();
        this.overrideConfirmButton();
        
        // Monitor input changes
        this.monitorDeliveryDateInput();
        
        // Set default date to today if not set
        setTimeout(() => {
            const drDeliveryDateInput = document.getElementById('drDeliveryDate');
            if (drDeliveryDateInput && !drDeliveryDateInput.value) {
                drDeliveryDateInput.value = new Date().toISOString().split('T')[0];
                console.log('📅 Set default delivery date to today');
            }
        }, 1000);
        
        console.log('✅ Delivery Date System Time Fix initialized');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            window.deliveryDateSystemTimeFix.initialize();
        }, 2000);
    });
} else {
    setTimeout(() => {
        window.deliveryDateSystemTimeFix.initialize();
    }, 2000);
}

console.log('✅ Delivery Date System Time Fix loaded');