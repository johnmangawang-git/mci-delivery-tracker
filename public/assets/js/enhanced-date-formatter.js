/**
 * Enhanced Date Formatter for Delivery Tracking System
 * Provides consistent date and timestamp formatting across the application
 */

// Enhanced date formatting function with timestamp support
function formatDateWithTimestamp(dateString, options = {}) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return dateString; // Return original if invalid
        }
        
        const {
            includeTime = true,
            includeSeconds = true,
            format = 'standard', // 'standard', 'compact', 'detailed'
            timezone = 'Asia/Manila'
        } = options;
        
        // Format based on the specified format type
        switch (format) {
            case 'compact':
                return includeTime ? 
                    date.toLocaleString('en-US', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        ...(includeSeconds && { second: '2-digit' }),
                        hour12: false,
                        timeZone: timezone
                    }) :
                    date.toLocaleDateString('en-US', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                        timeZone: timezone
                    });
                    
            case 'detailed':
                return includeTime ?
                    date.toLocaleString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        ...(includeSeconds && { second: '2-digit' }),
                        hour12: true,
                        timeZone: timezone
                    }) :
                    date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: timezone
                    });
                    
            case 'standard':
            default:
                return includeTime ?
                    date.toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        ...(includeSeconds && { second: '2-digit' }),
                        hour12: false,
                        timeZone: timezone
                    }) :
                    date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        timeZone: timezone
                    });
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString; // Return original if error
    }
}

// Format date for Active Deliveries table
function formatActiveDeliveryDate(delivery) {
    const getField = window.getFieldValue || ((obj, field) => obj[field]);
    
    // Try multiple date fields in order of preference
    const dateValue = getField(delivery, 'deliveryDate') || 
                     getField(delivery, 'delivery_date') ||
                     getField(delivery, 'bookedDate') ||
                     getField(delivery, 'booked_date') ||
                     getField(delivery, 'created_at') ||
                     getField(delivery, 'timestamp') ||
                     getField(delivery, 'created_date');
    
    return formatDateWithTimestamp(dateValue, {
        includeTime: true,
        includeSeconds: true,
        format: 'standard'
    });
}

// Format date for Delivery History table
function formatDeliveryHistoryDate(delivery) {
    const getField = window.getFieldValue || ((obj, field) => obj[field]);
    
    // Try multiple date fields in order of preference
    const dateValue = getField(delivery, 'completedDateTime') ||
                     getField(delivery, 'completed_date_time') ||
                     getField(delivery, 'completedDate') ||
                     getField(delivery, 'completed_date') ||
                     getField(delivery, 'delivery_date') ||
                     getField(delivery, 'deliveryDate') ||
                     getField(delivery, 'created_at') ||
                     getField(delivery, 'timestamp');
    
    return formatDateWithTimestamp(dateValue, {
        includeTime: true,
        includeSeconds: true,
        format: 'standard'
    });
}

// Format date for customer tracking display
function formatCustomerTrackingDate(dateString) {
    return formatDateWithTimestamp(dateString, {
        includeTime: true,
        includeSeconds: false,
        format: 'standard'
    });
}

// Format date for export (Excel/PDF)
function formatExportDate(dateString) {
    return formatDateWithTimestamp(dateString, {
        includeTime: true,
        includeSeconds: true,
        format: 'compact'
    });
}

// Get relative time (e.g., "2 hours ago")
function getRelativeTime(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        // For older dates, show the formatted date
        return formatDateWithTimestamp(dateString, {
            includeTime: false,
            format: 'standard'
        });
    } catch (error) {
        console.error('Error calculating relative time:', error);
        return dateString;
    }
}

// Create a tooltip with both formatted date and relative time
function createDateTooltip(dateString) {
    if (!dateString) return { display: 'N/A', tooltip: '' };
    
    const formattedDate = formatDateWithTimestamp(dateString);
    const relativeTime = getRelativeTime(dateString);
    
    return {
        display: formattedDate,
        tooltip: `${formattedDate} (${relativeTime})`
    };
}

// Update the existing formatDate function to include timestamps
function formatDate(dateString) {
    return formatDateWithTimestamp(dateString, {
        includeTime: true,
        includeSeconds: false,
        format: 'standard'
    });
}

// Make functions globally available
window.formatDateWithTimestamp = formatDateWithTimestamp;
window.formatActiveDeliveryDate = formatActiveDeliveryDate;
window.formatDeliveryHistoryDate = formatDeliveryHistoryDate;
window.formatCustomerTrackingDate = formatCustomerTrackingDate;
window.formatExportDate = formatExportDate;
window.getRelativeTime = getRelativeTime;
window.createDateTooltip = createDateTooltip;

// Override the existing formatDate function
window.formatDate = formatDate;

console.log('✅ Enhanced date formatter loaded with timestamp support');