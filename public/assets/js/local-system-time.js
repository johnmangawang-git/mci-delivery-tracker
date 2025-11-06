/**
 * Local System Time Module
 * Uses your computer's system time directly without UTC conversion issues
 */

console.log('🕐 Loading Local System Time module...');

/**
 * Get current local system time as a formatted string
 * This bypasses UTC conversion and uses your system clock directly
 */
function getLocalSystemTime() {
    const now = new Date();
    
    // Format using your system's local time directly
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Get current local system time as ISO-like string but using local time
 */
function getLocalSystemTimeISO() {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    // Create ISO-like format but with local time instead of UTC
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+08:00`;
}

/**
 * Get current date in YYYY-MM-DD format using local system time
 */
function getLocalSystemDate() {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Format local system time for display
 */
function formatLocalSystemTime(includeSeconds = true) {
    const now = new Date();
    
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    
    if (includeSeconds) {
        options.second = '2-digit';
    }
    
    // Use your system's locale and timezone directly
    return now.toLocaleString('en-US', options);
}

/**
 * Create delivery timestamp using local system time
 */
function createDeliveryTimestamp() {
    return {
        // For database storage (local time in ISO-like format)
        timestamp: getLocalSystemTimeISO(),
        
        // For date fields (local date)
        deliveryDate: getLocalSystemDate(),
        bookedDate: getLocalSystemDate(),
        
        // For display (formatted local time)
        displayTime: formatLocalSystemTime(true),
        
        // Raw local time for calculations
        localTime: getLocalSystemTime(),
        
        // Creation metadata
        createdAt: getLocalSystemTimeISO(),
        updatedAt: getLocalSystemTimeISO()
    };
}

/**
 * Override the existing timestamp creation functions
 */
function overrideTimestampFunctions() {
    // Store original functions
    const originalDateToISOString = Date.prototype.toISOString;
    
    // Create a flag to identify when we want local time
    window.useLocalSystemTime = true;
    
    console.log('✅ Local system time functions ready');
}

/**
 * Format any timestamp using local system approach
 */
function formatWithLocalTime(dateInput) {
    let date;
    
    if (typeof dateInput === 'string') {
        // If it's a string, try to parse it
        date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
        date = dateInput;
    } else {
        // Default to current time
        date = new Date();
    }
    
    // Format using MMDDYYYYHHmmss format as requested
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${month}${day}${year}${hours}${minutes}${seconds}`;
}

/**
 * Format BOOKING/UPLOAD timestamp for Active Deliveries
 * This shows when the DR was originally uploaded/booked
 */
function formatActiveDeliveryTimestamp(delivery) {
    // Priority order for BOOKING timestamps - prioritize most recent/accurate timestamps
    const bookingDateValue = delivery.created_at ||           // Most recent timestamp
                            delivery.timestamp ||             // Backup timestamp
                            delivery.deliveryDate || 
                            delivery.delivery_date ||
                            delivery.bookedDate || 
                            delivery.booked_date ||
                            delivery.localTime;
    
    if (!bookingDateValue) {
        return 'No booking time recorded';
    }
    
    return formatWithLocalTime(bookingDateValue);
}

/**
 * Format COMPLETION timestamp for Delivery History  
 * This shows when the DR was completed/e-signed (moved to history)
 */
function formatCompletionTimestamp(delivery) {
    // Priority order for COMPLETION timestamps
    const completionDateValue = delivery.completedDateTime ||
                               delivery.completed_date_time ||
                               delivery.completedDate ||
                               delivery.completed_date ||
                               delivery.signedAt ||
                               delivery.signed_at;
    
    if (!completionDateValue) {
        return 'No completion time recorded';
    }
    
    return formatWithLocalTime(completionDateValue);
}

/**
 * Create booking timestamp (for when DR is uploaded)
 */
function createBookingTimestamp() {
    return {
        // For Active Deliveries display - USE FULL TIMESTAMP WITH TIME
        deliveryDate: getLocalSystemTimeISO(),
        bookedDate: getLocalSystemTimeISO(), 
        timestamp: getLocalSystemTimeISO(),
        created_at: getLocalSystemTimeISO(),
        
        // Display format for Active Deliveries
        displayTime: formatLocalSystemTime(true),
        
        // Metadata
        action: 'booking',
        actionTime: getLocalSystemTime()
    };
}

/**
 * Create completion timestamp (for when DR is e-signed/completed)
 */
function createCompletionTimestamp() {
    return {
        // For Delivery History display
        completedDateTime: getLocalSystemTimeISO(),
        completed_date_time: getLocalSystemTimeISO(),
        completedDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }),
        signedAt: getLocalSystemTimeISO(),
        
        // Display format for Delivery History
        displayTime: formatLocalSystemTime(true),
        
        // Metadata
        action: 'completion',
        actionTime: getLocalSystemTime()
    };
}

// Make functions globally available
window.getLocalSystemTime = getLocalSystemTime;
window.getLocalSystemTimeISO = getLocalSystemTimeISO;
window.getLocalSystemDate = getLocalSystemDate;
window.formatLocalSystemTime = formatLocalSystemTime;
window.createDeliveryTimestamp = createDeliveryTimestamp;
window.formatWithLocalTime = formatWithLocalTime;

// NEW: Separate functions for booking vs completion
window.formatActiveDeliveryTimestamp = formatActiveDeliveryTimestamp;
window.formatCompletionTimestamp = formatCompletionTimestamp;
window.createBookingTimestamp = createBookingTimestamp;
window.createCompletionTimestamp = createCompletionTimestamp;

// Override enhanced date formatter functions with specific purposes
window.formatActiveDeliveryDate = formatActiveDeliveryTimestamp;  // Shows BOOKING time
window.formatDeliveryHistoryDate = formatCompletionTimestamp;     // Shows COMPLETION time

// Initialize
overrideTimestampFunctions();

console.log('✅ Local System Time module loaded - now using your system clock directly!');
console.log('🕐 Current local system time:', formatLocalSystemTime(true));