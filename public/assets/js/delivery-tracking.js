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
        
        // Handle button click
        trackingButton.addEventListener('click', function(e) {
            e.preventDefault();
            performDeliverySearch();
        });
        
        console.log('✅ Delivery tracking event listeners attached');
    }
}

// Clean input - just remove special characters but don't auto-format
function cleanInput(input) {
    // Only clean the input, don't auto-format
    let value = input.value.replace(/[<>'"&]/g, ''); // Remove potentially harmful characters
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
    
    const searchInput = trackingInput.value.trim();
    
    if (!searchInput) {
        showTrackingError('Please enter a Tracking number to track your delivery');
        return;
    }
    
    // Validate search input format
    if (!isValidDRNumber(searchInput)) {
        showTrackingError('Please enter a valid Tracking number (at least 3 characters)');
        return;
    }
    
    // Show loading state
    showTrackingLoading();
    
    try {
        // Search for delivery items by DR number or Serial number
        const deliveryItems = await searchDelivery(searchInput);
        
        if (deliveryItems && deliveryItems.length > 0) {
            displayMultiItemDelivery(deliveryItems);
        } else {
            showTrackingError('Delivery not found. Please check your Tracking number and try again.');
        }
        
    } catch (error) {
        console.error('❌ Error searching delivery:', error);
        showTrackingError('Unable to search at this time. Please try again later.');
    }
}

// Validate search input - accepts DR Number or Serial Number
function isValidDRNumber(searchInput) {
    // Accept any reasonable delivery number or serial number format
    if (!searchInput || searchInput.trim().length < 3) return false;
    
    // Accept any alphanumeric string with at least 3 characters
    const flexiblePattern = /^[A-Za-z0-9-_]+$/;
    return flexiblePattern.test(searchInput.trim()) && searchInput.trim().length >= 3;
}

// Search for delivery in data sources by DR Number or Serial Number
async function searchDelivery(searchInput) {
    console.log('🔍 Searching for delivery by DR Number or Serial Number:', searchInput);
    
    try {
        // Try Supabase first
        if (window.supabase && window.dataService) {
            const delivery = await searchInSupabase(searchInput);
            if (delivery) {
                console.log('✅ Found delivery in Supabase');
                return delivery;
            }
        }
        
        // Fallback to localStorage
        const delivery = searchInLocalStorage(searchInput);
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

// Search in Supabase - GET ALL ITEMS for the DR Number or Serial Number
async function searchInSupabase(searchInput) {
    try {
        if (!window.supabase) {
            console.log('⚠️ Supabase not available');
            return null;
        }
        
        // Search in deliveries table by DR Number OR Serial Number
        const { data, error } = await window.supabase
            .from('deliveries')
            .select('*')
            .or(`dr_number.ilike.%${searchInput}%,serial_number.ilike.%${searchInput}%`)
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('❌ Supabase search error:', error);
            return null;
        }
        
        return data && data.length > 0 ? data : null; // Return array of all items
        
    } catch (error) {
        console.error('❌ Supabase search exception:', error);
        return null;
    }
}

// Search in localStorage - GET ALL ITEMS for the DR Number or Serial Number
function searchInLocalStorage(searchInput) {
    try {
        let allItems = [];
        
        // Search in active deliveries - GET ALL MATCHING ITEMS by DR Number OR Serial Number
        const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
        const activeMatches = activeDeliveries.filter(d => {
            const drMatch = d.drNumber && d.drNumber.toLowerCase().includes(searchInput.toLowerCase());
            const dr_numberMatch = d.dr_number && d.dr_number.toLowerCase().includes(searchInput.toLowerCase());
            const serialMatch = d.serialNumber && d.serialNumber.toLowerCase().includes(searchInput.toLowerCase());
            const serial_numberMatch = d.serial_number && d.serial_number.toLowerCase().includes(searchInput.toLowerCase());
            
            return drMatch || dr_numberMatch || serialMatch || serial_numberMatch;
        });
        allItems = allItems.concat(activeMatches);
        
        // Search in delivery history - GET ALL MATCHING ITEMS by DR Number OR Serial Number
        const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
        const historyMatches = deliveryHistory.filter(d => {
            const drMatch = d.drNumber && d.drNumber.toLowerCase().includes(searchInput.toLowerCase());
            const dr_numberMatch = d.dr_number && d.dr_number.toLowerCase().includes(searchInput.toLowerCase());
            const serialMatch = d.serialNumber && d.serialNumber.toLowerCase().includes(searchInput.toLowerCase());
            const serial_numberMatch = d.serial_number && d.serial_number.toLowerCase().includes(searchInput.toLowerCase());
            
            return drMatch || dr_numberMatch || serialMatch || serial_numberMatch;
        });
        allItems = allItems.concat(historyMatches);
        
        return allItems.length > 0 ? allItems : null; // Return array of all items
        
    } catch (error) {
        console.error('❌ localStorage search error:', error);
        return null;
    }
}

// Group items by DR number
function groupItemsByDR(deliveryItems) {
    const grouped = {};
    
    deliveryItems.forEach(item => {
        const drNumber = item.dr_number || item.drNumber;
        if (!grouped[drNumber]) {
            grouped[drNumber] = {
                drNumber: drNumber,
                customerName: item.customer_name || item.customerName,
                deliveryDate: item.delivery_date || item.deliveryDate || item.bookedDate,
                destination: item.destination,
                origin: item.origin,
                items: []
            };
        }
        grouped[drNumber].items.push(item);
    });
    
    return Object.values(grouped);
}

// Display multi-item delivery information
function displayMultiItemDelivery(deliveryItems) {
    const trackingResults = document.getElementById('trackingResults');
    
    if (!trackingResults) return;
    
    // Group items by DR number
    const deliveryGroups = groupItemsByDR(deliveryItems);
    
    let html = '';
    
    deliveryGroups.forEach(group => {
        // Determine overall status (use most common status or first item's status)
        const overallStatus = determineOverallStatus(group.items);
        const statusClass = getStatusClass(overallStatus);
        const publicStatus = mapToPublicStatus(overallStatus);
        
        // Create unique ID for collapsible content
        const groupId = group.drNumber.replace(/[^a-zA-Z0-9]/g, '');
        
        html += `
            <div class="dr-group-card mb-3 border rounded">
                <div class="dr-header p-3 bg-light cursor-pointer" onclick="toggleItems('${groupId}')">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="mb-1"><i class="bi bi-truck me-2"></i>${group.drNumber}</h5>
                            <p class="mb-0 text-muted">${maskCustomerName(group.customerName)}</p>
                            <small class="text-muted">
                                <i class="bi bi-geo-alt me-1"></i>
                                To: ${maskAddress(group.destination || 'Delivery Address')}
                            </small>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-secondary mb-1">${group.items.length} item${group.items.length > 1 ? 's' : ''}</span><br>
                            <span class="badge ${statusClass}">${publicStatus}</span><br>
                            <small class="text-muted mt-1">
                                <i class="bi bi-chevron-down" id="chevron-${groupId}"></i>
                                Click to view items
                            </small>
                        </div>
                    </div>
                </div>
                
                <div class="dr-items-list collapse" id="items-${groupId}">
                    <div class="p-3 border-top">
                        <h6 class="mb-3"><i class="bi bi-list-ul me-2"></i>Items in this delivery:</h6>
                        ${renderItemsList(group.items)}
                    </div>
                </div>
            </div>
        `;
    });
    
    // Add contact information
    html += `
        <div class="delivery-contact mt-3 p-3 bg-light rounded">
            <p class="text-muted small mb-0">
                <i class="bi bi-info-circle me-1"></i>
                For questions about your delivery, please contact us at <strong>+63 912 345 6789</strong>
            </p>
        </div>
    `;
    
    trackingResults.innerHTML = html;
    trackingResults.style.display = 'block';
}

// Render individual items list
function renderItemsList(items) {
    let itemsHtml = '';
    
    items.forEach((item, index) => {
        const itemStatus = mapToPublicStatus(item.status);
        const itemStatusClass = getStatusClass(item.status);
        
        // Mask sensitive information
        const maskedItem = maskSensitiveItemInfo(item);
        
        itemsHtml += `
            <div class="item-card mb-2 p-3 border rounded bg-white">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="item-info flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <span class="badge bg-primary me-2">#${index + 1}</span>
                            <strong>${maskedItem.itemDescription || 'Item'}</strong>
                        </div>
                        
                        ${maskedItem.serialNumber ? `
                            <p class="mb-1 small">
                                <i class="bi bi-hash me-1"></i>
                                <strong>Serial:</strong> ${maskedItem.serialNumber}
                            </p>
                        ` : ''}
                        
                        ${maskedItem.mobileNumber ? `
                            <p class="mb-1 small">
                                <i class="bi bi-phone me-1"></i>
                                <strong>Mobile:</strong> ${maskedItem.mobileNumber}
                            </p>
                        ` : ''}
                        
                        ${maskedItem.itemNumber ? `
                            <p class="mb-0 small text-muted">
                                <i class="bi bi-tag me-1"></i>
                                Item #: ${maskedItem.itemNumber}
                            </p>
                        ` : ''}
                    </div>
                    
                    <div class="item-status text-end">
                        <span class="badge ${itemStatusClass}">${itemStatus}</span>
                        ${item.delivery_date || item.deliveryDate ? `
                            <br><small class="text-muted mt-1">
                                ${formatDate(item.delivery_date || item.deliveryDate)}
                            </small>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    return itemsHtml;
}

// Display delivery information (keep for backward compatibility)
function displayDeliveryInfo(delivery) {
    // Convert single delivery to array and use multi-item display
    displayMultiItemDelivery([delivery]);
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

// Mask sensitive item information
function maskSensitiveItemInfo(item) {
    return {
        itemDescription: item.item_description || item.itemDescription || 'Item',
        serialNumber: maskSerialNumber(item.serial_number || item.serialNumber),
        mobileNumber: maskMobileNumber(item.mobile_number || item.mobileNumber),
        itemNumber: item.item_number || item.itemNumber
    };
}

// Mask serial number for privacy
function maskSerialNumber(serialNumber) {
    if (!serialNumber || serialNumber.length < 4) return serialNumber;
    
    // Show first 3 characters, mask the rest
    return serialNumber.substring(0, 3) + '***';
}

// Mask mobile number for privacy
function maskMobileNumber(mobileNumber) {
    if (!mobileNumber || mobileNumber.length < 7) return mobileNumber;
    
    // Show first 3 and last 2 digits, mask middle
    const cleaned = mobileNumber.replace(/\D/g, '');
    if (cleaned.length >= 7) {
        return cleaned.substring(0, 3) + '***' + cleaned.substring(cleaned.length - 2);
    }
    
    return mobileNumber;
}

// Determine overall status from multiple items
function determineOverallStatus(items) {
    if (!items || items.length === 0) return 'Processing';
    
    // Priority order for status determination
    const statusPriority = {
        'Delivered': 5,
        'Completed': 5,
        'In Transit': 4,
        'On Schedule': 4,
        'Active': 3,
        'Pending': 2,
        'Delayed': 1,
        'Cancelled': 0
    };
    
    // Find the highest priority status
    let highestPriority = -1;
    let overallStatus = 'Processing';
    
    items.forEach(item => {
        const status = item.status || 'Processing';
        const priority = statusPriority[status] || 1;
        
        if (priority > highestPriority) {
            highestPriority = priority;
            overallStatus = status;
        }
    });
    
    return overallStatus;
}

// Format date for display with timestamp
function formatDate(dateString) {
    if (!dateString) return 'TBD';
    
    // Use the enhanced date formatter if available
    if (typeof window.formatCustomerTrackingDate === 'function') {
        return window.formatCustomerTrackingDate(dateString);
    }
    
    // Fallback to enhanced formatting
    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Manila'
        });
    } catch (error) {
        return dateString;
    }
}

// Toggle items visibility
function toggleItems(groupId) {
    const itemsList = document.getElementById(`items-${groupId}`);
    const chevron = document.getElementById(`chevron-${groupId}`);
    
    if (itemsList && chevron) {
        if (itemsList.classList.contains('show')) {
            itemsList.classList.remove('show');
            chevron.classList.remove('bi-chevron-up');
            chevron.classList.add('bi-chevron-down');
        } else {
            itemsList.classList.add('show');
            chevron.classList.remove('bi-chevron-down');
            chevron.classList.add('bi-chevron-up');
        }
    }
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
window.toggleItems = toggleItems;

console.log('✅ Delivery tracking module initialized with multi-item support');