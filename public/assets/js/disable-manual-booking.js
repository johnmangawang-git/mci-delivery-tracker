/**
 * DISABLE MANUAL BOOKING
 * Redirects users from manual booking to Excel upload
 */

console.log('🚫 DISABLE MANUAL BOOKING: Loading...');

// Store the original openBookingModal function
let originalOpenBookingModal = null;

// Function to show the redirect message
function showManualBookingDisabledMessage() {
    // Create a custom modal for the message
    const messageModal = document.createElement('div');
    messageModal.className = 'modal fade';
    messageModal.id = 'manualBookingDisabledModal';
    messageModal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-warning text-dark">
                    <h5 class="modal-title">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Manual Booking Disabled
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <div class="mb-3">
                        <i class="bi bi-file-earmark-excel text-success" style="font-size: 3rem;"></i>
                    </div>
                    <h6 class="mb-3">Manual booking is currently disabled</h6>
                    <p class="mb-3">
                        To ensure data consistency and accuracy, please use the 
                        <strong>"Upload DR File"</strong> feature to book deliveries.
                    </p>
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        Upload your Excel file with delivery data for batch processing
                    </div>
                </div>
                <div class="modal-footer justify-content-center">
                    <button type="button" class="btn btn-success" onclick="openDRUploadModal()">
                        <i class="bi bi-file-earmark-excel me-2"></i>
                        Upload DR File
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add to body if not already there
    if (!document.getElementById('manualBookingDisabledModal')) {
        document.body.appendChild(messageModal);
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(messageModal);
    modal.show();
    
    console.log('🚫 Showed manual booking disabled message');
}

// Function to open DR Upload modal
function openDRUploadModal() {
    // Close the disabled message modal first
    const disabledModal = bootstrap.Modal.getInstance(document.getElementById('manualBookingDisabledModal'));
    if (disabledModal) {
        disabledModal.hide();
    }
    
    // Open the DR Upload modal
    const drUploadModal = document.getElementById('drUploadModal');
    if (drUploadModal) {
        const modal = new bootstrap.Modal(drUploadModal);
        modal.show();
        console.log('✅ Opened DR Upload modal');
    } else {
        console.error('❌ DR Upload modal not found');
        alert('DR Upload feature not available. Please contact support.');
    }
}

// Override the openBookingModal function
function disableManualBooking() {
    console.log('🚫 Disabling manual booking...');
    
    // Store original function if it exists
    if (window.openBookingModal && !originalOpenBookingModal) {
        originalOpenBookingModal = window.openBookingModal;
        console.log('✅ Stored original openBookingModal function');
    }
    
    // Override with our disabled version
    window.openBookingModal = function(dateStr) {
        console.log('🚫 Manual booking attempted for date:', dateStr);
        console.log('🚫 Showing disabled message instead');
        
        // Show the disabled message
        showManualBookingDisabledMessage();
        
        // Prevent the original modal from opening
        return false;
    };
    
    console.log('✅ Manual booking disabled - redirects to Excel upload');
}

// Function to re-enable manual booking (for admin use)
function enableManualBooking() {
    console.log('✅ Re-enabling manual booking...');
    
    if (originalOpenBookingModal) {
        window.openBookingModal = originalOpenBookingModal;
        console.log('✅ Manual booking re-enabled');
    } else {
        console.warn('⚠️ Original openBookingModal function not found');
    }
}

// Make functions globally available
window.showManualBookingDisabledMessage = showManualBookingDisabledMessage;
window.openDRUploadModal = openDRUploadModal;
window.disableManualBooking = disableManualBooking;
window.enableManualBooking = enableManualBooking;

// Initialize - disable manual booking by default
function initDisableManualBooking() {
    console.log('🔧 Initializing manual booking disable...');
    
    // Wait a bit for other scripts to load
    setTimeout(() => {
        disableManualBooking();
    }, 2000);
    
    console.log('✅ Manual booking disable initialized');
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDisableManualBooking);
} else {
    initDisableManualBooking();
}

console.log('🚫 DISABLE MANUAL BOOKING: Loaded');
console.log('🎯 Manual booking will redirect to Excel upload');
console.log('🔧 Use enableManualBooking() in console to re-enable if needed');