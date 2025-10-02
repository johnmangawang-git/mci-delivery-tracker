// Modal utility functions to handle backdrop issues

// Comprehensive function to clean up all modal backdrops
function cleanupAllBackdrops() {
    console.log('Modal Utils: Cleaning up all backdrops');
    
    try {
        // Remove all backdrop elements
        const backdrops = document.querySelectorAll('.modal-backdrop');
        console.log('Modal Utils: Found backdrops:', backdrops.length);
        
        backdrops.forEach(backdrop => {
            if (backdrop && backdrop.parentNode) {
                console.log('Modal Utils: Removing backdrop:', backdrop);
                backdrop.parentNode.removeChild(backdrop);
            }
        });
        
        // Clean up body classes
        console.log('Modal Utils: Cleaning up body classes and styles');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
        document.body.style.paddingRight = '0';
    } catch (error) {
        console.error('Modal Utils: Error during backdrop cleanup:', error);
    }
}

// Function to ensure a modal is properly hidden
function hideModal(modalId) {
    console.log('Modal Utils: Hiding modal with ID:', modalId);
    
    try {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            // Get the modal instance
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                console.log('Modal Utils: Hiding modal instance');
                modalInstance.hide();
            } else {
                // If no instance exists, manually hide
                console.log('Modal Utils: Manually hiding modal');
                modalElement.classList.remove('show');
                modalElement.style.display = 'none';
            }
        }
        
        // Start the cleanup process after a short delay
        setTimeout(cleanupAllBackdrops, 100);
    } catch (error) {
        console.error('Modal Utils: Error hiding modal:', error);
        // Ensure cleanup even if there's an error
        cleanupAllBackdrops();
    }
}

// Function to show a modal with proper backdrop handling
function showModal(modalId) {
    console.log('Modal Utils: Showing modal with ID:', modalId);
    
    try {
        // First, clean up any existing backdrops to prevent conflicts
        cleanupAllBackdrops();
        
        const modalElement = document.getElementById(modalId);
        console.log('Modal Utils: Modal element found:', modalElement);
        if (modalElement) {
            console.log('Modal Utils: Found modal element');
            
            // Ensure modal is visible
            modalElement.style.display = 'block';
            
            // Get existing modal instance or create new one
            let modal = bootstrap.Modal.getInstance(modalElement);
            console.log('Modal Utils: Existing modal instance:', modal);
            if (!modal) {
                console.log('Modal Utils: No existing modal instance, creating new one');
                // Create new modal instance with specific options
                modal = new bootstrap.Modal(modalElement, {
                    backdrop: true,  // Allow backdrop
                    keyboard: true,  // Allow keyboard escape
                    focus: true      // Focus on modal when shown
                });
                console.log('Modal Utils: New modal instance created:', modal);
            } else {
                console.log('Modal Utils: Using existing modal instance');
            }
            
            console.log('Modal Utils: Showing modal');
            // Show the modal
            modal.show();
            console.log('Modal Utils: Modal show command executed');
            
            // Log success
            console.log('Modal Utils: showModal function completed successfully for modal:', modalId);
        } else {
            console.error('Modal Utils: Modal element not found for ID:', modalId);
        }
    } catch (error) {
        console.error('Modal Utils: Error showing modal:', error);
        // Try to show the modal directly
        try {
            console.log('Modal Utils: Trying to show modal directly');
            const directModalElement = document.getElementById(modalId);
            if (directModalElement) {
                directModalElement.style.display = 'block';
                directModalElement.classList.add('show');
                // Add backdrop
                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
                document.body.classList.add('modal-open');
                console.log('Modal Utils: Modal shown directly');
            }
        } catch (directError) {
            console.error('Modal Utils: Error showing modal directly:', directError);
        }
    }
}

// Test function to verify modal functionality
function testBookingModal() {
    console.log('=== TESTING BOOKING MODAL ===');
    
    // Check if Bootstrap is available
    console.log('Bootstrap available:', typeof bootstrap !== 'undefined');
    
    // Check if modal element exists
    const bookingModal = document.getElementById('bookingModal');
    console.log('Booking modal element exists:', !!bookingModal);
    
    // Try to show the modal
    if (typeof window.showModal === 'function') {
        console.log('Using showModal function');
        try {
            window.showModal('bookingModal');
            console.log('Modal shown successfully using utility function');
        } catch (error) {
            console.error('Error showing modal with utility function:', error);
        }
    } else {
        console.log('showModal utility function not available');
        // Fallback method
        if (bookingModal && typeof bootstrap !== 'undefined') {
            let modalInstance = bootstrap.Modal.getInstance(bookingModal);
            if (!modalInstance) {
                modalInstance = new bootstrap.Modal(bookingModal, {
                    backdrop: true,
                    keyboard: true
                });
            }
            try {
                modalInstance.show();
                console.log('Modal shown successfully with fallback method');
            } catch (error) {
                console.error('Error showing modal with fallback method:', error);
            }
        }
    }
}

// Make functions globally accessible
window.cleanupAllBackdrops = cleanupAllBackdrops;
window.hideModal = hideModal;
window.showModal = showModal;

// Make test function globally accessible
window.testBookingModal = testBookingModal;

// Ensure the functions are properly exposed
if (typeof window.showModal !== 'function') {
    console.error('showModal function is not properly exposed globally');
}
if (typeof window.hideModal !== 'function') {
    console.error('hideModal function is not properly exposed globally');
}
if (typeof window.cleanupAllBackdrops !== 'function') {
    console.error('cleanupAllBackdrops function is not properly exposed globally');
}

// Add a DOMContentLoaded event to ensure Bootstrap is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Modal Utils: DOMContentLoaded event fired');
    
    // Double-check that functions are globally available
    window.cleanupAllBackdrops = cleanupAllBackdrops;
    window.hideModal = hideModal;
    window.showModal = showModal;
    
    console.log('Modal Utils: Functions re-exposed globally');
});