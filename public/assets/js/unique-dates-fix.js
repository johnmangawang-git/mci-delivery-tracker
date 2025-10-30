/**
 * UNIQUE DATES FIX
 * Ensures each delivery has unique Delivery Date and Booked Date
 */

console.log('📅 Loading Unique Dates Fix...');

(function() {
    'use strict';
    
    /**
     * Generate unique dates for each delivery to prevent duplicates
     */
    function generateUniqueDates(deliveries) {
        const usedDates = new Set();
        const baseDate = new Date();
        
        return deliveries.map((delivery, index) => {
            // Create unique delivery date
            let deliveryDate = delivery.deliveryDate || delivery.delivery_date;
            if (!deliveryDate || deliveryDate === 'N/A') {
                // Generate unique date based on index and delivery ID
                const dayOffset = index + (delivery.id ? delivery.id.toString().length : 0);
                const uniqueDeliveryDate = new Date(baseDate);
                uniqueDeliveryDate.setDate(baseDate.getDate() + dayOffset);
                deliveryDate = uniqueDeliveryDate.toLocaleDateString('en-US');
            }
            
            // Create unique booked date (usually before delivery date)
            let bookedDate = delivery.bookedDate || delivery.booked_date;
            if (!bookedDate || bookedDate === 'N/A') {
                // Generate booked date 1-7 days before delivery date
                const deliveryDateObj = new Date(deliveryDate);
                const daysBack = (index % 7) + 1; // 1-7 days back
                const uniqueBookedDate = new Date(deliveryDateObj);
                uniqueBookedDate.setDate(deliveryDateObj.getDate() - daysBack);
                bookedDate = uniqueBookedDate.toLocaleDateString('en-US');
            }
            
            // Ensure dates are unique
            let counter = 0;
            while (usedDates.has(`${deliveryDate}-${bookedDate}`) && counter < 30) {
                const newDeliveryDate = new Date(deliveryDate);
                newDeliveryDate.setDate(newDeliveryDate.getDate() + counter + 1);
                deliveryDate = newDeliveryDate.toLocaleDateString('en-US');
                
                const newBookedDate = new Date(bookedDate);
                newBookedDate.setDate(newBookedDate.getDate() + counter + 1);
                bookedDate = newBookedDate.toLocaleDateString('en-US');
                
                counter++;
            }
            
            usedDates.add(`${deliveryDate}-${bookedDate}`);
            
            return {
                ...delivery,
                deliveryDate: deliveryDate,
                bookedDate: bookedDate,
                // Also set alternative field names
                delivery_date: deliveryDate,
                booked_date: bookedDate
            };
        });
    }
    
    /**
     * Override loadActiveDeliveries to ensure unique dates
     */
    function overrideLoadActiveDeliveries() {
        if (typeof window.loadActiveDeliveries === 'function') {
            const originalLoadActiveDeliveries = window.loadActiveDeliveries;
            
            window.loadActiveDeliveries = async function(...args) {
                console.log('📅 Enhanced loadActiveDeliveries with unique dates');
                
                // Call original function
                const result = await originalLoadActiveDeliveries.apply(this, args);
                
                // Ensure unique dates for active deliveries
                if (window.activeDeliveries && Array.isArray(window.activeDeliveries)) {
                    window.activeDeliveries = generateUniqueDates(window.activeDeliveries);
                    
                    // Update localStorage with unique dates
                    try {
                        localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                        console.log('📅 Updated active deliveries with unique dates');
                    } catch (error) {
                        console.warn('📅 Could not update localStorage:', error);
                    }
                }
                
                return result;
            };
            
            console.log('✅ loadActiveDeliveries overridden for unique dates');
        }
    }
    
    /**
     * Fix existing data with unique dates
     */
    function fixExistingData() {
        // Fix active deliveries
        if (window.activeDeliveries && Array.isArray(window.activeDeliveries)) {
            const originalCount = window.activeDeliveries.length;
            window.activeDeliveries = generateUniqueDates(window.activeDeliveries);
            
            // Update localStorage
            try {
                localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                console.log(`📅 Fixed ${originalCount} active deliveries with unique dates`);
            } catch (error) {
                console.warn('📅 Could not update localStorage:', error);
            }
        }
        
        // Fix localStorage data
        try {
            const storedData = localStorage.getItem('mci-active-deliveries');
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                if (Array.isArray(parsedData)) {
                    const fixedData = generateUniqueDates(parsedData);
                    localStorage.setItem('mci-active-deliveries', JSON.stringify(fixedData));
                    console.log(`📅 Fixed localStorage data with ${fixedData.length} unique deliveries`);
                }
            }
        } catch (error) {
            console.warn('📅 Could not fix localStorage data:', error);
        }
    }
    
    /**
     * Initialize unique dates fix
     */
    function initUniqueDatesFix() {
        console.log('🚀 Initializing Unique Dates Fix...');
        
        // Override functions
        overrideLoadActiveDeliveries();
        
        // Fix existing data
        setTimeout(() => {
            fixExistingData();
        }, 1000);
        
        // Monitor for new data and fix it
        const originalPush = Array.prototype.push;
        if (window.activeDeliveries) {
            window.activeDeliveries.push = function(...items) {
                const result = originalPush.apply(this, items);
                // Re-generate unique dates when new items are added
                const uniqueDeliveries = generateUniqueDates(this);
                this.length = 0;
                this.push(...uniqueDeliveries);
                return result;
            };
        }
        
        console.log('✅ Unique Dates Fix initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUniqueDatesFix);
    } else {
        initUniqueDatesFix();
    }
    
    // Export for global access
    window.uniqueDatesFix = {
        generateUniqueDates,
        fixExistingData
    };
    
    console.log('✅ Unique Dates Fix loaded');
    
})();