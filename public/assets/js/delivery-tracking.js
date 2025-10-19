/**
 * Customer Delivery Tracking Module
 * Allows customers to track their deliveries without authentication
 */

// Initialize delivery tracking functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚚 Delivery tracking module loaded');
    setupDeliveryTracking();
});

// Setup delivery tracking functionality
function setupDeliveryTracking() {
    const trackingForm = document.getElementById('trackingForm');
    const trackingInput = document.getElementById('trackingInput');
    const trackingButton = document.getElementById('trackingButton');
    const trackingResults = document.getElementById('trackingResults');
    
    if (trackingForm && trackingInput && trackingButton) {
        // Handle form submission
        trackingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performDeliverySearch();
        });
        
        // Handle input formatting
        trackingInput.addEventListener('input', function(e) {
            formatDRNumber(e.target);
        });
        
        // Handle button click
        trackingButton.addEventListener('click', function(e) {
            e.preventDefault();
            performDeliverySearch();
        });
        
        console.log('✅ Delivery tracking event listeners attached');
    }
}

// Format DR number input
function formatDRNumber(input) {
    let value = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    
    // Only auto-format if user has typed something substantial (3+ characters)
    if (value.length >= 3 && !value.startsWith('DR-')) {
        if (value.startsWith('DR')) {
            value = value.replace('DR', 'DR-');
        } else if (/^\d/.test(value)) {
            // Only add DR- prefix if it starts with a number
            value = 'DR-' + value;
        }
    }
    
    input.value = value;
}

// Perform delivery search
async function performDeliverySearch() {
    const trackingInput = document.getElementById('trackingInput');
    const trackingButton = document.getElementById('trackingButton');
    const trackingResults = document.getElementById('trackingResults');
    
    if (!trackingInput || !trackingButton || !trackingResults) {
        console.error('❌ Tracking elements not found');
        return;
    }
    
    const drNumber = trackingInput.value.trim();
    
    if (!drNumber) {
        showTrackingError('Please enter a DR number to track your delivery');
        return;
    }
    
    // Validate DR number format
    if (!isValidDRNumber(drNumber)) {
        showTrackingError('Please enter a valid delivery number (at least 5 characters)');
        return;
    }
    
    // Show loading state
    showTrackingLoading();
    
    try {
        // Search for delivery
        const delivery = await searchDelivery(drNumber);
        
        if (delivery) {
            displayDeliveryInfo(delivery);
        } else {
            showTrackingError('Delivery not found. Please check your DR number and try again.');
        }
        
    } catch (error) {
        console.error('❌ Error searching delivery:', error);
        showTrackingError('Unable to search at this time. Please try again later.');
    }
}

// Validate DR number format
function isValidDRNumber(drNumber) {
    // Accept various DR number formats
    if (!drNumber || drNumber.length < 3) return false;
    
    // Standard format: DR-2024-001
    const standardPattern = /^DR-\d{4}-\d{3,}$/i;
    if (standardPattern.test(drNumber)) return true;
    
    // Compact format: DR2024001
    const compactPattern = /^DR\d{7,}$/i;
    if (compactPattern.test(drNumber)) return true;
    
    // Number only: 2024001
    const numberPattern = /^\d{5,}$/;
    if (numberPattern.test(drNumber)) return true;
    
    // Any format with at least 5 characters
    return drNumber.length >= 5;
}

// Search for delivery in data sources
async function searchDelivery(drNumber) {
    console.log('🔍 Searching for delivery:', drNumber);
    
    try {
        // Try Supabase first
        if (window.supabase && window.dataService) {
            const delivery = await searchInSupabase(drNumber);
            if (delivery) {
                console.log('✅ Found delivery in Supabase');
                return delivery;
            }
        }
        
        // Fallback to localStorage
        const delivery = searchInLocalStorage(drNumber);
        if (delivery) {
            console.log('✅ Found delivery in localStorage');
            return delivery;
        }
        
        console.log('❌ Delivery not found in any data source');
        return null;
        
    } catch (error) {
        console.error('❌ Error in delivery search:', error);
        throw error;
    }
}

// Search in Supabase
async function searchInSupabase(drNumber) {
    try {
        if (!window.supabase) {
            console.log('⚠️ Supabase not available');
            return null;
        }
        
        // Search in deliveries table
        const { data, error } = await window.supabase
            .from('deliveries')
            .select('*')
            .ilike('dr_number', `%${drNumber}%`)
            .limit(1);
        
        if (error) {
            console.error('❌ Supabase search error:', error);
            return null;
        }
        
        return data && data.length > 0 ? data[0] : null;
        
    } catch (error) {
        console.error('❌ Supabase search exception:', error);
        return null;
    }
}

// Search in localStorage
function searchInLocalStorage(drNumber) {
    try {
        // Search in active deliveries
        const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
        let delivery = activeDeliveries.find(d => 
            d.drNumber && d.drNumber.toLowerCase().includes(drNumber.toLowerCase())
        );
        
        if (delivery) return delivery;
        
        // Search in delivery history
        const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
        delivery = deliveryHistory.find(d => 
            d.drNumber && d.drNumber.toLowerCase().includes(drNumber.toLowerCase())
        );
        
        return delivery || null;
        
    } catch (error) {
        console.error('❌ localStorage search error:', error);
        return null;
    }
}

// Display delivery information
function displayDeliveryInfo(delivery) {
    const trackingResults = document.getElementById('trackingResults');
    
    if (!trackingResults) return;
    
    // Map internal status to customer-friendly status
    const publicStatus = mapToPublicStatus(delivery.status);
    const statusClass = getStatusClass(delivery.status);
    
    // Mask sensitive information for privacy
    const maskedDelivery = maskSensitiveInfo(delivery);
    
    const html = `
        <div class="tracking-result">
            <div class="delivery-header">
                <h5><i class="bi bi-truck me-2"></i>Delivery Information</h5>
                <span class="badge ${statusClass} fs-6">${publicStatus}</span>
            </div>
            
            <div class="delivery-details">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>DR Number:</strong> ${maskedDelivery.drNumber}</p>
                        <p><strong>Customer:</strong> ${maskedDelivery.customerName}</p>
                        <p><strong>Delivery Date:</strong> ${maskedDelivery.deliveryDate || 'TBD'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>From:</strong> ${maskedDelivery.origin || 'Warehouse'}</p>
                        <p><strong>To:</strong> ${maskedDelivery.destination}</p>
                        <p><strong>Status:</strong> ${publicStatus}</p>
                    </div>
                </div>
            </div>
            
            <div class="delivery-contact">
                <p class="text-muted small">
                    <i class="bi bi-info-circle me-1"></i>
                    For questions about your delivery, please contact us at <strong>+63 912 345 6789</strong>
                </p>
            </div>
        </div>
    `;
    
    trackingResults.innerHTML = html;
    trackingResults.style.display = 'block';
}

// Map internal status to customer-friendly status
function mapToPublicStatus(status) {
    const statusMap = {
        'Active': 'Order Confirmed',
        'On Schedule': 'Out for Delivery',
        'In Transit': 'Out for Delivery',
        'Delivered': 'Delivered',
        'Completed': 'Delivered',
        'Pending': 'Processing',
        'Cancelled': 'Cancelled',
        'Delayed': 'Delayed'
    };
    
    return statusMap[status] || 'Processing';
}

// Get CSS class for status
function getStatusClass(status) {
    const classMap = {
        'Active': 'bg-primary',
        'On Schedule': 'bg-info',
        'In Transit': 'bg-info',
        'Delivered': 'bg-success',
        'Completed': 'bg-success',
        'Pending': 'bg-warning',
        'Cancelled': 'bg-danger',
        'Delayed': 'bg-warning'
    };
    
    return classMap[status] || 'bg-secondary';
}

// Mask sensitive information for privacy
function maskSensitiveInfo(delivery) {
    return {
        drNumber: delivery.drNumber || delivery.dr_number || 'N/A',
        customerName: maskCustomerName(delivery.customerName || delivery.customer_name || 'Customer'),
        deliveryDate: delivery.deliveryDate || delivery.delivery_date || delivery.bookedDate,
        origin: delivery.origin || 'Warehouse',
        destination: maskAddress(delivery.destination || 'Delivery Address'),
        status: delivery.status || 'Processing'
    };
}

// Mask customer name for privacy
function maskCustomerName(name) {
    if (!name || name.length < 3) return name;
    
    const parts = name.split(' ');
    if (parts.length > 1) {
        // Show first name, mask last name
        return parts[0] + ' ' + parts[1].charAt(0) + '***';
    } else {
        // Mask middle characters
        return name.charAt(0) + '***' + name.charAt(name.length - 1);
    }
}

// Mask address for privacy
function maskAddress(address) {
    if (!address || address.length < 10) return address;
    
    // Show first part, mask specific details
    const parts = address.split(',');
    if (parts.length > 1) {
        return parts[0] + ', ' + parts[1].trim().split(' ')[0] + '***';
    }
    
    return address.substring(0, 10) + '***';
}

// Show loading state
function showTrackingLoading() {
    const trackingResults = document.getElementById('trackingResults');
    const trackingButton = document.getElementById('trackingButton');
    
    if (trackingButton) {
        trackingButton.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i>Searching...';
        trackingButton.disabled = true;
    }
    
    if (trackingResults) {
        trackingResults.innerHTML = `
            <div class="text-center p-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Searching...</span>
                </div>
                <p class="mt-2 text-muted">Searching for your delivery...</p>
            </div>
        `;
        trackingResults.style.display = 'block';
    }
    
    // Reset button after 10 seconds
    setTimeout(() => {
        if (trackingButton) {
            trackingButton.innerHTML = '<i class="bi bi-search me-1"></i>Track Delivery';
            trackingButton.disabled = false;
        }
    }, 10000);
}

// Show tracking error
function showTrackingError(message) {
    const trackingResults = document.getElementById('trackingResults');
    const trackingButton = document.getElementById('trackingButton');
    
    if (trackingButton) {
        trackingButton.innerHTML = '<i class="bi bi-search me-1"></i>Track Delivery';
        trackingButton.disabled = false;
    }
    
    if (trackingResults) {
        trackingResults.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Not Found</strong><br>
                ${message}
            </div>
        `;
        trackingResults.style.display = 'block';
    }
}

// Make functions globally available
window.setupDeliveryTracking = setupDeliveryTracking;
window.performDeliverySearch = performDeliverySearch;

console.log('✅ Delivery tracking module initialized');