/**
 * Force Delivery Date Fix
 * CRITICAL: Forces user-selected delivery date + system time throughout the entire system
 * Overrides ALL functions that try to use system date instead of user-selected date
 */

console.log('🚨 Loading FORCE Delivery Date Fix...');

window.forceDeliveryDateFix = {
    
    // Store the user-selected delivery date
    userSelectedDate: null,
    
    /**
     * Capture and store the user-selected delivery date
     */
    captureUserSelectedDate() {
        const drDeliveryDateInput = document.getElementById('drDeliveryDate');
        if (drDeliveryDateInput && drDeliveryDateInput.value) {
            this.userSelectedDate = drDeliveryDateInput.value;
            console.log('📅 CAPTURED user-selected date:', this.userSelectedDate);
            return this.userSelectedDate;
        }
        
        // Fallback to today if no date selected
        this.userSelectedDate = new Date().toISOString().split('T')[0];
        console.log('📅 FALLBACK to today:', this.userSelectedDate);
        return this.userSelectedDate;
    },
    
    /**
     * Create combined date-time with user date + system time
     */
    createUserDateSystemTime() {
        const userDate = this.userSelectedDate || this.captureUserSelectedDate();
        const currentTime = new Date();
        
        // CRITICAL: Combine user-selected DATE with current system TIME
        const combinedDateTime = new Date(userDate + 'T' + currentTime.toTimeString().split(' ')[0]);
        
        const result = {
            userDate: userDate,
            systemTime: currentTime.toTimeString().split(' ')[0],
            combinedDateTime: combinedDateTime.toISOString(),
            formattedDisplay: combinedDateTime.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) + ', ' + combinedDateTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        
        console.log('🔧 FORCE: Created user date + system time:', result);
        return result;
    },
    
    /**
     * Override ALL date-related functions to force user-selected date
     */
    overrideAllDateFunctions() {
        const self = this;
        
        // Override getLocalSystemDate to return user-selected date
        window.getLocalSystemDate = function() {
            const userDate = self.userSelectedDate || self.captureUserSelectedDate();
            console.log('🔧 OVERRIDE getLocalSystemDate:', userDate);
            return userDate;
        };
        
        // Override getSelectedDeliveryDate to return user-selected date
        window.getSelectedDeliveryDate = function() {
            const userDate = self.userSelectedDate || self.captureUserSelectedDate();
            console.log('🔧 OVERRIDE getSelectedDeliveryDate:', userDate);
            return userDate;
        };
        
        // Override createBookingTimestamp to use user date + system time
        window.createBookingTimestamp = function() {
            const dateTime = self.createUserDateSystemTime();
            const result = {
                deliveryDate: dateTime.userDate,
                bookedDate: dateTime.userDate,
                deliveryDateTime: dateTime.combinedDateTime,
                created_date: dateTime.userDate, // FORCE: Use user-selected date for created_date
                timestamp: new Date().toISOString(), // Keep system timestamp for creation tracking
                formattedDeliveryDateTime: dateTime.formattedDisplay
            };
            console.log('🔧 OVERRIDE createBookingTimestamp:', result);
            return result;
        };
        
        console.log('✅ FORCE: All date functions overridden');
    },
    
    /**
     * Override mapDRData to force user-selected date into all bookings
     */
    overrideMapDRData() {
        if (typeof window.mapDRData === 'function') {
            const originalMapDRData = window.mapDRData;
            const self = this;
            
            window.mapDRData = function(data) {
                console.log('🔧 FORCE: mapDRData override called');
                
                // Ensure user date is captured
                self.captureUserSelectedDate();
                
                // Call original function
                const mappedData = originalMapDRData(data);
                
                // FORCE user-selected date into ALL mapped bookings
                if (Array.isArray(mappedData)) {
                    mappedData.forEach(booking => {
                        const dateTime = self.createUserDateSystemTime();
                        
                        // FORCE override ALL date fields - REPLACE CREATED DATE WITH DELIVERY DATE
                        booking.deliveryDate = dateTime.userDate;
                        booking.bookedDate = dateTime.userDate;
                        booking.deliveryDateTime = dateTime.combinedDateTime;
                        booking.formattedDeliveryDateTime = dateTime.formattedDisplay;
                        
                        // CRITICAL: Replace created_date with user-selected delivery date (not system date)
                        booking.created_date = dateTime.userDate; // User-selected date for created_date
                        
                        // Keep system timestamps for tracking only
                        booking.timestamp = new Date().toISOString(); // System timestamp for tracking
                        booking.created_at = new Date().toISOString(); // System creation time
                        booking.updated_at = new Date().toISOString(); // System update time
                        
                        console.log(`🔧 FORCE: Updated booking ${booking.drNumber} with user date:`, dateTime.userDate);
                    });
                }
                
                return mappedData;
            };
            
            console.log('✅ FORCE: mapDRData overridden');
        }
    },
    
    /**
     * Override booking creation functions
     */
    overrideBookingCreation() {
        const self = this;
        
        // Override any function that creates booking objects
        const originalCreateBooking = window.createBooking;
        if (typeof originalCreateBooking === 'function') {
            window.createBooking = function(bookingData) {
                const dateTime = self.createUserDateSystemTime();
                
                // FORCE user date into booking data
                bookingData.deliveryDate = dateTime.userDate;
                bookingData.bookedDate = dateTime.userDate;
                bookingData.deliveryDateTime = dateTime.combinedDateTime;
                bookingData.formattedDeliveryDateTime = dateTime.formattedDisplay;
                bookingData.created_date = dateTime.userDate; // FORCE: Use user-selected date for created_date
                
                console.log('🔧 FORCE: createBooking with user date:', dateTime.userDate);
                return originalCreateBooking(bookingData);
            };
        }
        
        console.log('✅ FORCE: Booking creation overridden');
    },
    
    /**
     * Monitor DR upload modal and capture date changes
     */
    monitorDeliveryDateInput() {
        const drDeliveryDateInput = document.getElementById('drDeliveryDate');
        if (drDeliveryDateInput) {
            // Capture initial value
            this.captureUserSelectedDate();
            
            // Monitor changes
            drDeliveryDateInput.addEventListener('change', (event) => {
                this.userSelectedDate = event.target.value;
                console.log('📅 FORCE: User changed delivery date to:', this.userSelectedDate);
            });
            
            console.log('✅ FORCE: Monitoring delivery date input');
        } else {
            // If input doesn't exist yet, try again later
            setTimeout(() => {
                this.monitorDeliveryDateInput();
            }, 1000);
        }
    },
    
    /**
     * Override Active Deliveries display to show user date + system time
     */
    overrideActiveDeliveriesDisplay() {
        const self = this;
        
        // Override formatActiveDeliveryDate
        window.formatActiveDeliveryDate = function(delivery) {
            // Priority: deliveryDateTime > deliveryDate > fallback
            let dateToFormat = delivery.deliveryDateTime || delivery.formattedDeliveryDateTime;
            
            if (!dateToFormat && delivery.deliveryDate) {
                // If we have deliveryDate but no deliveryDateTime, create it
                const currentTime = new Date();
                const combinedDateTime = new Date(delivery.deliveryDate + 'T' + currentTime.toTimeString().split(' ')[0]);
                dateToFormat = combinedDateTime.toISOString();
            }
            
            if (!dateToFormat) {
                dateToFormat = delivery.timestamp || delivery.created_at || new Date().toISOString();
            }
            
            try {
                const date = new Date(dateToFormat);
                const formatted = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }) + ', ' + date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                console.log(`📅 FORCE: Formatted display for ${delivery.drNumber}:`, formatted);
                return formatted;
            } catch (error) {
                console.error('❌ FORCE: Error formatting date:', error);
                return 'Date Error';
            }
        };
        
        console.log('✅ FORCE: Active Deliveries display overridden');
    },
    
    /**
     * Initialize the FORCE delivery date fix
     */
    initialize() {
        console.log('🚨 INITIALIZING FORCE Delivery Date Fix...');
        
        // Step 1: Monitor delivery date input
        this.monitorDeliveryDateInput();
        
        // Step 2: Override all date functions
        this.overrideAllDateFunctions();
        
        // Step 3: Override data mapping
        this.overrideMapDRData();
        
        // Step 4: Override booking creation
        this.overrideBookingCreation();
        
        // Step 5: Override display functions
        this.overrideActiveDeliveriesDisplay();
        
        // Step 6: Periodic enforcement
        setInterval(() => {
            this.overrideAllDateFunctions();
        }, 5000); // Re-override every 5 seconds
        
        console.log('🚨 FORCE Delivery Date Fix INITIALIZED');
        console.log('🎯 GOAL: User date + System time = Combined display');
    }
};

// Initialize immediately and on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            window.forceDeliveryDateFix.initialize();
        }, 1000);
    });
} else {
    setTimeout(() => {
        window.forceDeliveryDateFix.initialize();
    }, 1000);
}

// Also initialize when DR upload modal is opened
document.addEventListener('click', function(event) {
    if (event.target && (
        event.target.textContent.includes('Upload DR') || 
        event.target.id === 'uploadDrFileBtn' ||
        event.target.id === 'selectDrFileBtn'
    )) {
        setTimeout(() => {
            window.forceDeliveryDateFix.captureUserSelectedDate();
        }, 500);
    }
});

console.log('🚨 FORCE Delivery Date Fix loaded - WILL ENFORCE USER DATE + SYSTEM TIME');