// Booking modal functionality with enhanced debugging
console.log('=== BOOKING.JS LOADED ===');

// Enhanced function to show booking modal with better error handling
function showBookingModal(dateStr) {
    console.log('=== SHOW BOOKING MODAL FUNCTION CALLED ===');
    console.log('Date string received:', dateStr);
    
    // Check if the booking modal element exists in the DOM
    const modalExists = document.getElementById('bookingModal');
    console.log('Booking modal element exists in DOM:', !!modalExists);
    if (!modalExists) {
        console.error('Booking modal element not found in DOM!');
        return;
    }
    
    // Add debugging to check if Bootstrap is available
    console.log('Bootstrap object available:', typeof bootstrap);
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not available! This is required for modal functionality.');
        return;
    }
    
    // Pre-fill the DR number and date before showing the modal
    const date = new Date(dateStr);
    console.log('Date object created:', date);
    
    const drNumber = `DR-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;
    console.log('Generated DR Number:', drNumber);
    
    // Pre-fill the DR number and date
    const drNumberEl = document.getElementById('drNumber');
    console.log('DR Number element found:', drNumberEl);
    if (drNumberEl) {
        drNumberEl.value = drNumber;
        console.log('DR Number value set to:', drNumberEl.value);
    } else {
        console.error('DR Number element not found!');
        // Try to find it in the modal
        const bookingModal = document.getElementById('bookingModal');
        if (bookingModal) {
            const altDrNumberEl = bookingModal.querySelector('#drNumber');
            console.log('Alternative DR Number element search:', altDrNumberEl);
            if (altDrNumberEl) {
                altDrNumberEl.value = drNumber;
                console.log('DR Number value set to:', altDrNumberEl.value);
            }
        }
    }
    
    const deliveryDateEl = document.getElementById('deliveryDate');
    console.log('Delivery Date element found:', deliveryDateEl);
    if (deliveryDateEl) {
        deliveryDateEl.value = dateStr;
        console.log('Delivery Date value set to:', deliveryDateEl.value);
    } else {
        console.error('Delivery Date element not found!');
        // Try to find it in the modal
        const bookingModal = document.getElementById('bookingModal');
        if (bookingModal) {
            const altDeliveryDateEl = bookingModal.querySelector('#deliveryDate');
            console.log('Alternative Delivery Date element search:', altDeliveryDateEl);
            if (altDeliveryDateEl) {
                altDeliveryDateEl.value = dateStr;
                console.log('Delivery Date value set to:', altDeliveryDateEl.value);
            }
        }
    }
    
    // Use the showModal utility function to properly show the modal
    if (typeof window.showModal === 'function') {
        console.log('Using showModal utility function');
        try {
            window.showModal('bookingModal');
            console.log('showModal function executed successfully');
        } catch (error) {
            console.error('Error calling showModal function:', error);
        }
    } else {
        console.log('showModal utility not available, using fallback method');
        // Fallback method to show the modal
        const bookingModalEl = document.getElementById('bookingModal');
        console.log('Booking Modal element found:', bookingModalEl);
        if (bookingModalEl) {
            console.log('Found booking modal element, attempting to show it');
            
            // Check if bootstrap is available
            console.log('Bootstrap object available:', typeof bootstrap);
            if (typeof bootstrap === 'undefined') {
                console.error('Bootstrap is not available!');
                return;
            }
            
            // Get existing modal instance or create new one
            let bookingModal = bootstrap.Modal.getInstance(bookingModalEl);
            console.log('Existing modal instance:', bookingModal);
            if (!bookingModal) {
                console.log('No existing modal instance, creating new one');
                // Create new modal instance with proper options
                try {
                    bookingModal = new bootstrap.Modal(bookingModalEl, {
                        backdrop: true,  // Allow backdrop
                        keyboard: true   // Allow keyboard escape
                    });
                    console.log('New modal instance created:', bookingModal);
                } catch (error) {
                    console.error('Error creating modal instance:', error);
                    return;
                }
            } else {
                console.log('Using existing modal instance');
            }
            
            console.log('Modal instance:', bookingModal);
            console.log('Showing modal');
            
            // Show the modal
            try {
                bookingModal.show();
                console.log('Modal show command executed successfully');
                
                // Log success
                console.log('showBookingModal fallback method completed successfully');
            } catch (error) {
                console.error('Error showing modal:', error);
            }
            
            console.log('Modal show command executed');
        } else {
            console.error('Booking modal element not found!');
        }
    }
    
    // Log success
    console.log('showBookingModal function completed successfully');
}

// Enhanced openBookingModal function for calendar integration
function openBookingModal(dateStr) {
    console.log('=== OPEN BOOKING MODAL FUNCTION CALLED ===');
    console.log('Date string received:', dateStr);
    
    // Make sure this function is globally available
    window.openBookingModal = openBookingModal;
    
    showBookingModal(dateStr);
}

// Ensure the function is globally available
window.openBookingModal = openBookingModal;
window.showBookingModal = showBookingModal;

// Test function to manually trigger the booking modal
window.testShowBookingModal = function() {
    console.log('=== TESTING BOOKING MODAL SHOW ===');
    
    // Check if booking modal exists
    const bookingModal = document.getElementById('bookingModal');
    console.log('Booking modal element:', bookingModal);
    
    if (bookingModal) {
        // Check if Bootstrap is available
        console.log('Bootstrap available:', typeof bootstrap !== 'undefined');
        
        // Try to show using Bootstrap
        if (typeof bootstrap !== 'undefined') {
            try {
                let modal = bootstrap.Modal.getInstance(bookingModal);
                console.log('Existing modal instance:', modal);
                
                if (!modal) {
                    console.log('Creating new modal instance');
                    modal = new bootstrap.Modal(bookingModal, {
                        backdrop: true,
                        keyboard: true
                    });
                }
                
                console.log('Showing modal');
                modal.show();
                console.log('Booking modal shown successfully');
            } catch (error) {
                console.error('Error showing booking modal:', error);
                
                // Fallback to direct manipulation
                console.log('Using fallback method to show modal');
                bookingModal.style.display = 'block';
                bookingModal.classList.add('show');
                document.body.classList.add('modal-open');
                
                // Add backdrop
                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
                console.log('Booking modal shown with fallback method');
            }
        } else {
            // Fallback to direct manipulation
            console.log('Bootstrap not available, using fallback method');
            bookingModal.style.display = 'block';
            bookingModal.classList.add('show');
            document.body.classList.add('modal-open');
            
            // Add backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            document.body.appendChild(backdrop);
            console.log('Booking modal shown with fallback method');
        }
    } else {
        console.error('Booking modal element not found');
    }
};

// Test function to manually trigger the booking modal with a specific date
window.testBookingModal = function(dateStr) {
    console.log('=== TESTING BOOKING MODAL WITH DATE ===');
    console.log('Date string received:', dateStr);
    
    // Use current date if no date provided
    const dateToUse = dateStr || new Date().toISOString().split('T')[0];
    console.log('Date to use:', dateToUse);
    
    // Call the main function
    showBookingModal(dateToUse);
};

// Add a DOMContentLoaded event to ensure functions are properly exposed
document.addEventListener('DOMContentLoaded', function() {
    console.log('Booking.js: DOMContentLoaded event fired');
    
    // Double-check that functions are globally available
    window.openBookingModal = openBookingModal;
    window.showBookingModal = showBookingModal;
    window.testShowBookingModal = window.testShowBookingModal;
    window.testBookingModal = window.testBookingModal;
    
    console.log('Booking.js: Functions re-exposed globally');
});

// Ensure functions are available immediately
if (document.readyState === 'loading') {
    // Document is still loading, add event listener
    document.addEventListener('DOMContentLoaded', function() {
        window.openBookingModal = openBookingModal;
        window.showBookingModal = showBookingModal;
    });
} else {
    // Document is already loaded, expose functions immediately
    window.openBookingModal = openBookingModal;
    window.showBookingModal = showBookingModal;
}

// Enhanced initBookingModal function with better error handling
function initBookingModal() {
    console.log('=== INIT BOOKING MODAL FUNCTION CALLED ===');
    
    // Make sure this function is globally available
    window.initBookingModal = initBookingModal;
    
    // Add a global flag to indicate this function was called
    window.initBookingModalCalled = true;
    console.log('initBookingModalCalled flag set to true');
    
    // Ensure customer management is available
    ensureCustomerManagementReady();
    
    const bookingModalElement = document.getElementById('bookingModal');
    console.log('Booking modal element found:', bookingModalElement);
    if (!bookingModalElement) {
        console.error('Booking modal element not found');
        return;
    }
    
    // Enhanced event listener for when modal is hidden
    const hiddenListener = function () {
        console.log('Booking modal hidden event triggered');
        // Reset form when modal is closed
        resetBookingForm();
        // Comprehensive modal cleanup
        cleanupAllBackdrops();
    };
    
    // Remove any existing listeners first
    bookingModalElement.removeEventListener('hidden.bs.modal', hiddenListener);
    // Add the new listener
    bookingModalElement.addEventListener('hidden.bs.modal', hiddenListener);
    
    // Also listen for hide event (before hidden)
    const hideListener = function () {
        console.log('Booking modal hide event triggered');
        // Start cleanup process
        setTimeout(cleanupAllBackdrops, 10);
    };
    
    // Remove any existing listeners first
    bookingModalElement.removeEventListener('hide.bs.modal', hideListener);
    // Add the new listener
    bookingModalElement.addEventListener('hide.bs.modal', hideListener);
    
    // Check if Bootstrap is available
    console.log('Bootstrap object available:', typeof bootstrap);
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not available! This is required for modal functionality.');
        return;
    }
    
    // Initialize the Bootstrap modal
    try {
        const bookingModal = new bootstrap.Modal(bookingModalElement);
        console.log('Bootstrap modal initialized:', bookingModal);
    } catch (error) {
        console.error('Error initializing Bootstrap modal:', error);
        return;
    }
    
    // Set flag to indicate booking modal has been initialized
    window.bookingModalInitialized = true;
    console.log('Booking modal initialized successfully');
    
    // Add debugging to check if all elements are found
    console.log('Checking booking modal elements:');
    console.log('bookingForm:', document.getElementById('bookingForm'));
    console.log('originSelect:', document.getElementById('originSelect'));
    console.log('customOriginContainer:', document.getElementById('customOriginContainer'));
    console.log('pinOriginBtn:', document.getElementById('pinOrigin'));
    console.log('addAreaBtn:', document.getElementById('addAreaBtn'));
    console.log('destinationAreasContainer:', document.getElementById('destinationAreasContainer'));
    console.log('drNumber:', document.getElementById('drNumber'));
    console.log('deliveryDate:', document.getElementById('deliveryDate'));
    
    console.log('=== INIT BOOKING MODAL FUNCTION COMPLETED ===');
    
    // Origin selection toggle
    const originSelect = document.getElementById('originSelect');
    const customOriginContainer = document.getElementById('customOriginContainer');
    
    if (originSelect && customOriginContainer) {
        originSelect.addEventListener('change', function () {
            if (this.value === '') {
                customOriginContainer.classList.remove('d-none');
            } else {
                customOriginContainer.classList.add('d-none');
            }
        });
    }

    // Map pin buttons for origin
    const pinOriginBtn = document.getElementById('pinOrigin');
    if (pinOriginBtn && customOriginContainer && originSelect) {
        pinOriginBtn.addEventListener('click', function () {
            customOriginContainer.classList.remove('d-none');
            originSelect.value = '';
            showMapPinDialog('origin');
        });
    }

    // Add destination area functionality
    const addAreaBtn = document.getElementById('addAreaBtn');
    const destinationAreasContainer = document.getElementById('destinationAreasContainer');

    if (addAreaBtn && destinationAreasContainer) {
        // Modify the event listener for existing destination area inputs to open map modal directly
        document.querySelectorAll('.destination-area-input').forEach((input, index) => {
            input.addEventListener('focus', function () {
                // Open map modal directly when focusing on the destination area input
                showMapPinDialog('destination', index);
            });
            
            // Prevent the default behavior of typing in the input
            input.addEventListener('keydown', function(e) {
                // Allow Tab, Escape, and Enter keys
                if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'Enter') {
                    return;
                }
                // Prevent other keys and open map modal
                e.preventDefault();
                showMapPinDialog('destination', index);
            });
            
            // Also open map modal on click
            input.addEventListener('click', function () {
                showMapPinDialog('destination', index);
            });
        });

        // Add event listeners to existing destination area elements
        document.querySelectorAll('.pin-on-map-btn').forEach((btn, index) => {
            if (index >= 0) { // Include the origin pin button now
                btn.addEventListener('click', function () {
                    const areaIndex = parseInt(this.dataset.areaIndex);
                    showMapPinDialog('destination', areaIndex);
                });
            }
        });

        addAreaBtn.addEventListener('click', function () {
            const areaIndex = document.querySelectorAll('.destination-area-item').length;
            const areaItem = document.createElement('div');
            areaItem.className = 'destination-area-item';
            areaItem.innerHTML = `
                <div class="input-group mb-2">
                    <input type="text" class="form-control destination-area-input" placeholder="Click to select location on map" required>
                    <button type="button" class="btn map-pin-btn pin-on-map-btn" data-area-index="${areaIndex}">
                        <i class="bi bi-geo-alt"></i> Pin on Map
                    </button>
                    <button type="button" class="btn btn-outline-danger remove-area">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            `;

            destinationAreasContainer.appendChild(areaItem);

            // Add event listeners for the new elements
            const pinBtn = areaItem.querySelector('.pin-on-map-btn');
            const removeBtn = areaItem.querySelector('.remove-area');
            const inputField = areaItem.querySelector('.destination-area-input');

            // Open map modal when clicking the input field
            inputField.addEventListener('focus', function () {
                showMapPinDialog('destination', areaIndex);
            });
            
            // Prevent typing in the input field
            inputField.addEventListener('keydown', function(e) {
                // Allow Tab, Escape, and Enter keys
                if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'Enter') {
                    return;
                }
                // Prevent other keys and open map modal
                e.preventDefault();
                showMapPinDialog('destination', areaIndex);
            });
            
            // Also open map modal on click
            inputField.addEventListener('click', function () {
                showMapPinDialog('destination', areaIndex);
            });

            if (pinBtn) {
                pinBtn.addEventListener('click', function () {
                    showMapPinDialog('destination', areaIndex);
                });
            }

            if (removeBtn) {
                removeBtn.addEventListener('click', function () {
                    areaItem.remove();
                    updateDistance();
                });
            }
        });
    }

    // Remove the search-related event listeners as they are no longer needed
    // The destination area input now directly opens the map modal

    // Add cost item functionality
    const addCostBtn = document.getElementById('addCostBtn');
    const costItemsContainer = document.getElementById('costItemsContainer');

    if (addCostBtn && costItemsContainer) {
        addCostBtn.addEventListener('click', function () {
            const costItem = document.createElement('div');
            costItem.className = 'cost-item';
            costItem.innerHTML = `
                <div class="flex-grow-1">
                    <input type="text" class="form-control form-control-sm" placeholder="Description (e.g., Fuel Surcharge)">
                </div>
                <div>
                    <div class="input-group">
                        <span class="input-group-text">₱</span>
                        <input type="number" class="form-control form-control-sm" placeholder="Amount">
                    </div>
                </div>
                <button type="button" class="remove-cost btn-sm">
                    <i class="bi bi-x-lg"></i>
                </button>
            `;
            costItemsContainer.appendChild(costItem);

            // Add event listener for the remove button
            const removeBtn = costItem.querySelector('.remove-cost');
            if (removeBtn) {
                removeBtn.addEventListener('click', function () {
                    costItem.remove();
                });
                
                // Enable the remove button since there's more than one item now
                removeBtn.disabled = false;
            }
        });
    }

    // Add event listener for removing cost items
    costItemsContainer.addEventListener('click', function (e) {
        if (e.target.closest('.remove-cost')) {
            const costItem = e.target.closest('.cost-item');
            if (costItem) {
                // Only remove if there's more than one cost item
                if (costItemsContainer.querySelectorAll('.cost-item').length > 1) {
                    costItem.remove();
                } else {
                    // If it's the last item, just clear the inputs
                    const inputs = costItem.querySelectorAll('input');
                    inputs.forEach(input => input.value = '');
                }
            }
        }
    });

    // Confirm booking button
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    if (confirmBookingBtn) {
        confirmBookingBtn.addEventListener('click', function () {
            console.log('Confirm booking button clicked');
            saveBooking();
        });
    }

    // Cancel booking button (uses data-bs-dismiss="modal" in HTML)
    // No need to add event listener as Bootstrap handles modal dismissal

    // Calculate distance when origin or destination changes
    const originSelectElement = document.getElementById('originSelect');
    const customOriginElement = document.getElementById('customOrigin');
    
    if (originSelectElement) {
        originSelectElement.addEventListener('change', updateDistance);
    }
    
    if (customOriginElement) {
        customOriginElement.addEventListener('change', updateDistance);
    }
    
    // Add event listeners for destination area inputs
    document.addEventListener('input', function(e) {
        if (e.target && e.target.classList.contains('destination-area-input')) {
            updateDistance();
        }
    });
}

// Make functions globally accessible
window.initBookingModal = initBookingModal;

// Calculate real distance between two points using Haversine formula
function calculateRealDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
}

// Function to update the calculated distance
function updateDistance() {
    // In a real implementation, this would calculate the distance between origin and destination
    // For this demo, we'll just show a placeholder value
    const distanceElement = document.getElementById('distanceValue');
    if (distanceElement) {
        distanceElement.textContent = '12.5 km';
    }
}

// Function to reset the booking form
function resetBookingForm() {
    console.log('Resetting booking form');
    
    // Reset all form fields
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.reset();
    }
    
    // Reset custom origin container
    const customOriginContainer = document.getElementById('customOriginContainer');
    if (customOriginContainer) {
        customOriginContainer.classList.add('d-none');
    }
    
    // Reset destination areas container to initial state
    const destinationAreasContainer = document.getElementById('destinationAreasContainer');
    if (destinationAreasContainer) {
        destinationAreasContainer.innerHTML = `
            <div class="destination-area-item">
                <div class="input-group mb-2">
                    <input type="text" class="form-control form-control-sm destination-area-input" placeholder="Click to select location on map" required readonly style="cursor: pointer;">
                    <button type="button" class="btn map-pin-btn pin-on-map-btn btn-sm" data-area-index="0">
                        <i class="bi bi-geo-alt"></i> Pin on Map
                    </button>
                    <button type="button" class="btn btn-outline-danger remove-area btn-sm">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Re-attach event listeners to the reset destination area
        const firstInput = destinationAreasContainer.querySelector('.destination-area-input');
        const firstPinBtn = destinationAreasContainer.querySelector('.pin-on-map-btn');
        const firstRemoveBtn = destinationAreasContainer.querySelector('.remove-area');
        
        if (firstInput) {
            firstInput.addEventListener('focus', function () {
                showMapPinDialog('destination', 0);
            });
            
            firstInput.addEventListener('keydown', function(e) {
                if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'Enter') {
                    return;
                }
                e.preventDefault();
                showMapPinDialog('destination', 0);
            });
            
            firstInput.addEventListener('click', function () {
                showMapPinDialog('destination', 0);
            });
        }
        
        if (firstPinBtn) {
            firstPinBtn.addEventListener('click', function () {
                showMapPinDialog('destination', 0);
            });
        }
        
        if (firstRemoveBtn) {
            firstRemoveBtn.addEventListener('click', function () {
                // Don't remove the last item, just clear it
                if (firstInput) {
                    firstInput.value = '';
                }
            });
        }
    }
    
    // Reset cost items container to initial state
    const costItemsContainer = document.getElementById('costItemsContainer');
    if (costItemsContainer) {
        costItemsContainer.innerHTML = `
            <div class="cost-item">
                <div class="flex-grow-1">
                    <input type="text" class="form-control form-control-sm" placeholder="Description (e.g., Fuel Surcharge)">
                </div>
                <div>
                    <div class="input-group">
                        <span class="input-group-text">₱</span>
                        <input type="number" class="form-control form-control-sm" placeholder="Amount">
                    </div>
                </div>
                <button type="button" class="remove-cost btn-sm" disabled>
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        `;
    }
    
    // Reset distance display
    const distanceElement = document.getElementById('distanceValue');
    if (distanceElement) {
        distanceElement.textContent = '-- km';
    }
    
    console.log('Booking form reset completed');
}

// Function to ensure customer management is ready
function ensureCustomerManagementReady() {
    // This function ensures that customer management functionality is available
    // In a real implementation, this might load customer data or initialize components
    console.log('Ensuring customer management is ready');
}

// Test function to manually initialize the booking modal
window.testInitBookingModal = function() {
    console.log('=== TESTING BOOKING MODAL INITIALIZATION ===');
    
    console.log('Checking if initBookingModal function exists:', typeof initBookingModal);
    console.log('Checking if window.initBookingModal function exists:', typeof window.initBookingModal);
    
    if (typeof initBookingModal === 'function') {
        console.log('Calling initBookingModal function');
        try {
            initBookingModal();
            console.log('initBookingModal executed successfully');
            window.bookingModalInitialized = true;
        } catch (error) {
            console.error('Error calling initBookingModal:', error);
        }
    } else if (typeof window.initBookingModal === 'function') {
        console.log('Calling window.initBookingModal function');
        try {
            window.initBookingModal();
            console.log('window.initBookingModal executed successfully');
            window.bookingModalInitialized = true;
        } catch (error) {
            console.error('Error calling window.initBookingModal:', error);
        }
    } else {
        console.error('initBookingModal function not found');
        // Check if it's available in window object
        console.log('initBookingModal in window:', window.initBookingModal);
        console.log('typeof window.initBookingModal:', typeof window.initBookingModal);
        
        // Try calling it from window object
        if (typeof window.initBookingModal === 'function') {
            console.log('Calling window.initBookingModal function');
            try {
                window.initBookingModal();
                console.log('window.initBookingModal executed successfully');
                window.bookingModalInitialized = true;
            } catch (error) {
                console.error('Error calling window.initBookingModal:', error);
            }
        }
    }
};

// Add a small delay to ensure DOM is ready before initializing
setTimeout(() => {
    console.log('Checking if booking modal needs initialization on page load');
    
    // Check if booking view is active
    const bookingView = document.getElementById('bookingView');
    if (bookingView && bookingView.classList.contains('active')) {
        console.log('Booking view is active, checking if booking modal needs initialization');
        
        if (typeof window.bookingModalInitialized === 'undefined') {
            console.log('Booking modal not yet initialized, attempting initialization');
            if (typeof initBookingModal === 'function') {
                try {
                    initBookingModal();
                    window.bookingModalInitialized = true;
                    console.log('Booking modal initialized successfully on page load');
                } catch (error) {
                    console.error('Error initializing booking modal on page load:', error);
                }
            }
        }
    }
}, 1500);

// Show map pin dialog for selecting locations
function showMapPinDialog(type, index = 0) {
    console.log(`showMapPinDialog called with type: ${type}, index: ${index}`);
    
    // In a real implementation, this would show a map modal for selecting locations
    // For this demo, we'll just log the call
    console.log('Map pin dialog would be shown here for:', type, index);
    
    // Simulate setting coordinates for demo purposes
    if (type === 'origin') {
        const customOrigin = document.getElementById('customOrigin');
        if (customOrigin) {
            customOrigin.value = 'Selected Origin Location';
            customOrigin.setAttribute('data-lat', '14.5995');
            customOrigin.setAttribute('data-lng', '120.9842');
        }
    } else {
        const destinationInputs = document.querySelectorAll('.destination-area-input');
        if (destinationInputs[index]) {
            destinationInputs[index].value = 'Selected Destination Location';
            destinationInputs[index].setAttribute('data-lat', '14.5995');
            destinationInputs[index].setAttribute('data-lng', '120.9842');
        }
    }
    
    // Update distance calculation
    updateDistance();
}

// Auto-create customer from booking details
async function autoCreateCustomer(customerName, customerNumber, destination) {
    try {
        console.log('=== AUTO CREATE CUSTOMER DEBUG ===');
        console.log('Customer Name:', customerName);
        console.log('Customer Number:', customerNumber);
        console.log('Destination:', destination);
        console.log('Window.customers exists:', !!window.customers);
        console.log('Window.customers array:', window.customers);
        
        // Ensure customers array exists
        if (!window.customers) {
            console.log('No customers array found, initializing...');
            window.customers = [];
        }
        
        // Check if customer already exists (by name or phone)
        const existingCustomer = window.customers?.find(customer => 
            customer.contactPerson.toLowerCase() === customerName.toLowerCase() ||
            customer.phone === customerNumber
        );
        
        console.log('Existing customer found:', existingCustomer);

        if (existingCustomer) {
            console.log('Customer already exists:', existingCustomer.contactPerson);
            
            // Update booking count and last delivery date for existing customer
            existingCustomer.bookingsCount = (existingCustomer.bookingsCount || 0) + 1;
            existingCustomer.lastDelivery = new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            // Save updated customer data to localStorage
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
            
            // Always refresh customers view to ensure updated data is visible
            if (typeof window.loadCustomers === 'function') {
                window.loadCustomers();
            }
            
            // Show update message
            showToast(`Customer "${customerName}" booking count updated in Customer Management!`);
            
            return existingCustomer;
        }

        // Create new customer
        const newCustomer = {
            id: 'CUST-' + String((window.customers?.length || 0) + 1).padStart(3, '0'),
            contactPerson: customerName,
            phone: customerNumber,
            address: destination, // Use destination as address
            accountType: 'Individual', // Default account type for individual customers
            email: '', // Empty email - can be filled later
            status: 'active',
            notes: 'Auto-created from delivery booking',
            bookingsCount: 1,
            lastDelivery: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }),
            createdAt: new Date()
        };

        // Add to customers array
        window.customers.push(newCustomer);
        console.log('New customer auto-created:', newCustomer.contactPerson);
        console.log('Updated window.customers array:', window.customers);
        
        // Save to localStorage
        localStorage.setItem('mci-customers', JSON.stringify(window.customers));
        console.log('Saved to localStorage');
        
        // Always refresh customers view to ensure new customer is visible
        console.log('=== REFRESHING CUSTOMER DISPLAY ===');
        
        if (typeof window.loadCustomers === 'function') {
            console.log('Calling window.loadCustomers()');
            window.loadCustomers();
        } else {
            console.log('window.loadCustomers function not available');
        }
        
        // Force refresh by triggering a custom event
        const customerUpdateEvent = new CustomEvent('customerUpdated', {
            detail: { customer: newCustomer, action: 'created' }
        });
        window.dispatchEvent(customerUpdateEvent);
        console.log('Dispatched customerUpdated event');
        
        // Show success message
        showToast(`Customer "${customerName}" automatically added to Customer Management section!`);

        return newCustomer;
    } catch (error) {
        console.error('Error auto-creating customer:', error);
        // Don't fail the booking if customer creation fails
        return null;
    }
}

// Save booking functionality
async function saveBooking() {
    try {
        console.log('=== SAVE BOOKING FUNCTION CALLED ===');
        
        // Get form values
        const drNumber = document.getElementById('drNumber').value;
        const customerName = document.getElementById('customerName').value;
        const customerNumber = document.getElementById('customerNumber').value;
        const deliveryDate = document.getElementById('deliveryDate').value;
        const truckType = document.getElementById('truckType').value;
        const truckPlateNumber = document.getElementById('truckPlateNumber').value;
        
        // Get origin
        const originSelect = document.getElementById('originSelect');
        const customOrigin = document.getElementById('customOrigin');
        let origin = '';
        if (originSelect.value && originSelect.value !== '') {
            origin = originSelect.options[originSelect.selectedIndex].text;
        } else if (customOrigin.value) {
            origin = customOrigin.value;
        }
        
        // Get destinations
        const destinationInputs = document.querySelectorAll('.destination-area-input');
        const destinations = [];
        destinationInputs.forEach(input => {
            if (input.value.trim()) {
                destinations.push(input.value);
            }
        });
        
        // Get distance
        const distance = document.getElementById('distanceValue').textContent;
        
        // Get additional costs
        const costItems = document.querySelectorAll('#costItemsContainer .cost-item');
        const additionalCosts = [];
        costItems.forEach(item => {
            const description = item.querySelector('input[placeholder="Description (e.g., Fuel Surcharge)"]').value;
            const amount = item.querySelector('input[placeholder="Amount"]').value;
            if (description && amount) {
                additionalCosts.push({
                    description,
                    amount: parseFloat(amount)
                });
            }
        });
        
        // Validate required fields
        if (!drNumber) {
            alert('DR Number is required');
            return;
        }
        
        if (!customerName) {
            alert('Customer Name is required');
            return;
        }
        
        if (!customerNumber) {
            alert('Customer Number is required');
            return;
        }
        
        if (!deliveryDate) {
            alert('Delivery Date is required');
            return;
        }
        
        if (!truckType) {
            alert('Truck Type is required');
            return;
        }
        
        if (!truckPlateNumber) {
            alert('Truck Plate Number is required');
            return;
        }
        
        if (!origin) {
            alert('Origin is required');
            return;
        }
        
        if (destinations.length === 0) {
            alert('At least one destination is required');
            return;
        }
        
        // Auto-create customer if not exists
        console.log('=== SAVE BOOKING DEBUG ===');
        console.log('About to call autoCreateCustomer with:', {
            customerName,
            customerNumber,
            destination: destinations[0] // Use first destination as the address
        });
        
        await autoCreateCustomer(customerName, customerNumber, destinations[0]);
        
        console.log('autoCreateCustomer completed');
        
        // In a real implementation, this would save to Supabase or localStorage
        console.log('Saving booking:', {
            drNumber,
            customerName,
            customerNumber,
            deliveryDate,
            truckType,
            truckPlateNumber,
            origin,
            destinations,
            distance,
            additionalCosts
        });
        
        // Show success message
        alert('Booking confirmed successfully!');
        
        // Reset form and close modal
        resetBookingForm();
        const bookingModalElement = document.getElementById('bookingModal');
        if (bookingModalElement) {
            const bookingModalInstance = bootstrap.Modal.getInstance(bookingModalElement);
            if (bookingModalInstance) {
                bookingModalInstance.hide();
            }
        }
        
        // Refresh calendar data
        if (typeof window.refreshCalendarData === 'function') {
            window.refreshCalendarData();
        }
    } catch (error) {
        console.error('Error saving booking:', error);
        alert('Failed to save booking: ' + error.message);
    }
}

// Load active deliveries
function loadActiveDeliveries() {
    console.log('Loading active deliveries...');
    // In a real implementation, this would fetch data from Supabase or localStorage
    
    // Update the UI with active deliveries
    const tableBody = document.getElementById('activeDeliveriesTableBody');
    if (tableBody) {
        // Add some mock data for demonstration
        tableBody.innerHTML = `
            <tr>
                <td><input type="checkbox" class="form-check-input"></td>
                <td><strong>DR-20231025-1234</strong></td>
                <td>John Doe</td>
                <td>+63 917 123 4567</td>
                <td>MCI Alabang</td>
                <td>Makati City</td>
                <td>25 km</td>
                <td>ABC-123</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-success" style="min-width: 90px;">
                            <i class="bi bi-check-circle me-1"></i>
                            On Schedule
                        </span>
                        <select class="form-select form-select-sm status-selector" style="min-width: 120px; max-width: 140px;">
                            <option value="On Schedule" selected>📅 On Schedule</option>
                            <option value="In Transit">🚛 In Transit</option>
                            <option value="Delayed">⚠️ Delayed</option>
                            <option value="Completed">✅ Completed</option>
                        </select>
                    </div>
                </td>
                <td>Oct 25, 2023</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary e-signature-btn">
                        <i class="bi bi-pencil"></i> E-Signature
                    </button>
                </td>
            </tr>
            <tr>
                <td><input type="checkbox" class="form-check-input"></td>
                <td><strong>DR-20231025-5678</strong></td>
                <td>Jane Smith</td>
                <td>+63 918 765 4321</td>
                <td>MCI Cebu</td>
                <td>Cebu City</td>
                <td>15 km</td>
                <td>XYZ-789</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-primary" style="min-width: 90px;">
                            <i class="bi bi-truck me-1"></i>
                            In Transit
                        </span>
                        <select class="form-select form-select-sm status-selector" style="min-width: 120px; max-width: 140px;">
                            <option value="On Schedule">📅 On Schedule</option>
                            <option value="In Transit" selected>🚛 In Transit</option>
                            <option value="Delayed">⚠️ Delayed</option>
                            <option value="Completed">✅ Completed</option>
                        </select>
                    </div>
                </td>
                <td>Oct 25, 2023</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary e-signature-btn">
                        <i class="bi bi-pencil"></i> E-Signature
                    </button>
                </td>
            </tr>
        `;
    }
}

// Expose function globally
window.loadActiveDeliveries = loadActiveDeliveries;

// Load delivery history
function loadDeliveryHistory() {
    console.log('Loading delivery history...');
    // In a real implementation, this would fetch data from Supabase or localStorage
    
    // Update the UI with delivery history
    const tableBody = document.getElementById('deliveryHistoryTableBody');
    if (tableBody) {
        // Add some mock data for demonstration
        tableBody.innerHTML = `
            <tr>
                <td>Oct 24, 2023</td>
                <td><strong>DR-20231024-4321</strong></td>
                <td>John Doe</td>
                <td>+63 917 123 4567</td>
                <td>MCI Alabang</td>
                <td>Makati City</td>
                <td>25 km</td>
                <td>$150.00</td>
                <td>
                    <span class="badge bg-success">
                        <i class="bi bi-check-circle"></i> Completed
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-e-pod-btn">
                        <i class="bi bi-eye"></i> View E-POD
                    </button>
                </td>
            </tr>
            <tr>
                <td>Oct 23, 2023</td>
                <td><strong>DR-20231023-8765</strong></td>
                <td>Jane Smith</td>
                <td>+63 918 765 4321</td>
                <td>MCI Cebu</td>
                <td>Cebu City</td>
                <td>15 km</td>
                <td>$120.00</td>
                <td>
                    <span class="badge bg-success">
                        <i class="bi bi-check-circle"></i> Completed
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-e-pod-btn">
                        <i class="bi bi-eye"></i> View E-POD
                    </button>
                </td>
            </tr>
        `;
    }
}

// Expose function globally
window.loadDeliveryHistory = loadDeliveryHistory;

// Load EPOD deliveries
function loadEPodDeliveries() {
    console.log('Loading EPOD deliveries...');
    // In a real implementation, this would fetch data from Supabase or localStorage
    
    // Update the UI with EPOD deliveries
    const container = document.getElementById('ePodCardsContainer');
    if (container) {
        // Add some mock data for demonstration
        container.innerHTML = `
            <div class="col-md-6 col-lg-4">
                <div class="card e-pod-card">
                    <div class="card-header bg-light">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="card-title mb-0">DR-20231025-1234</h6>
                            <span class="badge bg-success">Completed</span>
                        </div>
                        <small class="text-muted">John Doe</small>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <p class="mb-1"><i class="bi bi-geo-alt me-2"></i>MCI Alabang → Makati City</p>
                            <p class="mb-1"><i class="bi bi-truck me-2"></i>ABC-123</p>
                            <p class="mb-0"><i class="bi bi-calendar me-2"></i>Oct 25, 2023</p>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge bg-primary">E-Signed</span>
                            </div>
                            <div class="text-end">
                                <small class="text-muted">25 km</small>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent">
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-sm btn-outline-primary view-e-pod-btn">
                                <i class="bi bi-eye"></i> View
                            </button>
                            <button class="btn btn-sm btn-outline-secondary download-e-pod-btn">
                                <i class="bi bi-download"></i> Download
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-4">
                <div class="card e-pod-card">
                    <div class="card-header bg-light">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="card-title mb-0">DR-20231025-5678</h6>
                            <span class="badge bg-success">Completed</span>
                        </div>
                        <small class="text-muted">Jane Smith</small>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <p class="mb-1"><i class="bi bi-geo-alt me-2"></i>MCI Cebu → Cebu City</p>
                            <p class="mb-1"><i class="bi bi-truck me-2"></i>XYZ-789</p>
                            <p class="mb-0"><i class="bi bi-calendar me-2"></i>Oct 25, 2023</p>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge bg-warning text-dark">Pending</span>
                            </div>
                            <div class="text-end">
                                <small class="text-muted">15 km</small>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent">
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-sm btn-outline-primary view-e-pod-btn">
                                <i class="bi bi-eye"></i> View
                            </button>
                            <button class="btn btn-sm btn-outline-secondary download-e-pod-btn">
                                <i class="bi bi-download"></i> Download
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Expose function globally
window.loadEPodDeliveries = loadEPodDeliveries;

// Initialize EPOD
function initEPod() {
    console.log('Initializing EPOD...');
    // In a real implementation, this would initialize EPOD functionality
}

// Expose function globally
window.initEPod = initEPod;
