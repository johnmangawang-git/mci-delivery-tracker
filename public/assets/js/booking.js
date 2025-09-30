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
    
    // Update distance when modal is shown
    setTimeout(function() {
        console.log('Booking modal shown, calling updateDistance');
        updateDistance();
    }, 300); // Small delay to ensure DOM updates
    
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
        console.log('Booking modal element not found');
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
    
    // Warehouse coordinates data
    const warehouseCoordinates = {
        'alabang': { lat: 14.444208, lng: 121.046787, name: 'SMEG Alabang Warehouse' },
        'cebu': { lat: 10.3157, lng: 123.8854, name: 'SMEG Cebu Warehouse' },
        'davao': { lat: 7.0759, lng: 125.6143, name: 'SMEG Davao Warehouse' }
    };
    
    // Function to display warehouse coordinates
    function displayWarehouseCoordinates(warehouseId) {
        const coordinatesDisplay = document.getElementById('warehouseCoordinatesDisplay');
        if (coordinatesDisplay) {
            if (warehouseId && warehouseCoordinates[warehouseId]) {
                const coords = warehouseCoordinates[warehouseId];
                coordinatesDisplay.innerHTML = `
                    <div class="mt-2 p-2 bg-light rounded small">
                        <strong>Coordinates:</strong> ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}
                    </div>
                `;
                coordinatesDisplay.style.display = 'block';
                
                // Update distance when warehouse coordinates are displayed
                setTimeout(updateDistance, 100); // Small delay to ensure DOM updates
            } else {
                coordinatesDisplay.style.display = 'none';
            }
        }
    }
    
    if (originSelect && customOriginContainer) {
        // Create coordinates display element if it doesn't exist
        if (!document.getElementById('warehouseCoordinatesDisplay')) {
            const coordinatesDisplay = document.createElement('div');
            coordinatesDisplay.id = 'warehouseCoordinatesDisplay';
            coordinatesDisplay.style.display = 'none';
            originSelect.parentNode.appendChild(coordinatesDisplay);
        }
        
        originSelect.addEventListener('change', function () {
            console.log('Origin selection changed to:', this.value);
            if (this.value === 'custom') {
                customOriginContainer.classList.remove('d-none');
                displayWarehouseCoordinates(null); // Hide coordinates for custom selection
            } else {
                customOriginContainer.classList.add('d-none');
                displayWarehouseCoordinates(this.value); // Show coordinates for warehouse selection
            }
            
            // Update distance when origin changes
            console.log('Origin selection changed, calling updateDistance');
            setTimeout(updateDistance, 100); // Small delay to ensure DOM updates
        });
    }

    // Map pin buttons for origin
    const pinOriginBtn = document.getElementById('pinOrigin');
    if (pinOriginBtn && customOriginContainer && originSelect) {
        pinOriginBtn.addEventListener('click', function () {
            customOriginContainer.classList.remove('d-none');
            originSelect.value = 'custom'; // Set to custom option
            showMapPinDialog('origin');
        });
    }

    // Add destination area functionality
    const addAreaBtn = document.getElementById('addAreaBtn');
    const destinationAreasContainer = document.getElementById('destinationAreasContainer');

    if (addAreaBtn && destinationAreasContainer) {
        // Use event delegation for destination area inputs and buttons
        // This will work for both existing and dynamically added elements
        
        // Handle clicks on "Pin on Map" buttons and destination area inputs
        destinationAreasContainer.addEventListener('click', function(e) {
            // Handle pin on map button clicks
            if (e.target.closest('.pin-on-map-btn')) {
                const pinBtn = e.target.closest('.pin-on-map-btn');
                const areaIndex = parseInt(pinBtn.dataset.areaIndex);
                showMapPinDialog('destination', areaIndex);
                return;
            }
            
            // Handle remove area button clicks
            if (e.target.closest('.remove-area')) {
                const removeBtn = e.target.closest('.remove-area');
                const areaItem = removeBtn.closest('.destination-area-item');
                if (areaItem) {
                    const areaIndex = Array.from(destinationAreasContainer.children).indexOf(areaItem);
                    areaItem.remove();
                    hideDestinationCoordinates(areaIndex);
                    updateDistance();
                }
                return;
            }
            
            // Handle clicks on destination area inputs
            if (e.target.classList.contains('destination-area-input')) {
                const input = e.target;
                const areaItem = input.closest('.destination-area-item');
                if (areaItem) {
                    const areaIndex = Array.from(destinationAreasContainer.children).indexOf(areaItem);
                    showMapPinDialog('destination', areaIndex);
                }
                return;
            }
        });

        addAreaBtn.addEventListener('click', function () {
            const areaIndex = document.querySelectorAll('.destination-area-item').length;
            const areaItem = document.createElement('div');
            areaItem.className = 'destination-area-item';
            areaItem.innerHTML = `
                <div class="input-group mb-2">
                    <input type="text" class="form-control destination-area-input" placeholder="Click to select location on map" required readonly style="cursor: pointer;">
                    <button type="button" class="btn map-pin-btn pin-on-map-btn btn-sm" data-area-index="${areaIndex}">
                        <i class="bi bi-geo-alt"></i> Pin on Map
                    </button>
                    <button type="button" class="btn btn-outline-danger remove-area btn-sm">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            `;

            destinationAreasContainer.appendChild(areaItem);

            // No need to add individual event listeners since we're using event delegation
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
        originSelectElement.addEventListener('change', function() {
            console.log('Origin select changed, calling updateDistance');
            setTimeout(updateDistance, 100); // Small delay to ensure DOM updates
        });
    }
    
    if (customOriginElement) {
        customOriginElement.addEventListener('change', function() {
            console.log('Custom origin changed, calling updateDistance');
            setTimeout(updateDistance, 100); // Small delay to ensure DOM updates
        });
    }
    
    // Add event listeners for destination area inputs
    // Remove this global listener as we're using event delegation instead
    // document.addEventListener('input', function(e) {
    //     if (e.target && e.target.classList.contains('destination-area-input')) {
    //         console.log('Destination input changed, calling updateDistance');
    //         console.log('Destination input value:', e.target.value);
    //         console.log('Destination input dataset:', e.target.dataset);
    //         setTimeout(updateDistance, 100); // Small delay to ensure DOM updates
    //     }
    // });
    
    // Also listen for attribute changes on destination inputs
    const destinationInputs = document.querySelectorAll('.destination-area-input');
    destinationInputs.forEach(input => {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && (mutation.attributeName === 'data-lat' || mutation.attributeName === 'data-lng')) {
                    console.log('Destination input attribute changed, calling updateDistance');
                    console.log('Destination input value:', input.value);
                    console.log('Destination input dataset:', input.dataset);
                    setTimeout(updateDistance, 100); // Small delay to ensure DOM updates
                }
            });
        });
        
        observer.observe(input, {
            attributes: true
        });
    });
    
    // Initial distance calculation
    setTimeout(updateDistance, 200); // Small delay to ensure DOM is ready
}

// Make functions globally accessible
window.initBookingModal = initBookingModal;

// Function to display destination coordinates
function displayDestinationCoordinates(index, lat, lng) {
    console.log(`Displaying coordinates for destination ${index}:`, lat, lng);
    
    // Remove any existing coordinates display for this destination
    const existingCoordsDisplay = document.getElementById(`destinationCoordinatesDisplay-${index}`);
    if (existingCoordsDisplay) {
        existingCoordsDisplay.remove();
    }
    
    // Create coordinates display element
    const coordinatesDisplay = document.createElement('div');
    coordinatesDisplay.id = `destinationCoordinatesDisplay-${index}`;
    coordinatesDisplay.className = 'mt-2 p-2 bg-light rounded small';
    coordinatesDisplay.innerHTML = `<strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    // Find the parent container for this destination area
    const destinationItems = document.querySelectorAll('.destination-area-item');
    console.log('Destination items found:', destinationItems.length);
    if (destinationItems[index]) {
        // Check if the coordinates display already exists as a child
        const existing = destinationItems[index].querySelector(`#destinationCoordinatesDisplay-${index}`);
        if (existing) {
            existing.remove();
        }
        
        destinationItems[index].appendChild(coordinatesDisplay);
        console.log('Coordinates display added to destination item', index);
    } else {
        console.error('Destination item not found for index:', index);
        // Try to append to the last destination item as a fallback
        if (destinationItems.length > 0) {
            const lastIndex = destinationItems.length - 1;
            destinationItems[lastIndex].appendChild(coordinatesDisplay);
            console.log('Coordinates display added to last destination item as fallback');
        }
    }
}

// Function to hide destination coordinates
function hideDestinationCoordinates(index) {
    const coordinatesDisplay = document.getElementById(`destinationCoordinatesDisplay-${index}`);
    if (coordinatesDisplay) {
        coordinatesDisplay.remove();
    }
}

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
    console.log('=== UPDATE DISTANCE FUNCTION CALLED ===');
    
    // Calculate the distance between origin and destination
    const computedDistanceElement = document.getElementById('computedDistanceValue');
    const originDestinationInfoElement = document.getElementById('originDestinationInfo');
    
    // Get origin coordinates
    const originSelect = document.getElementById('originSelect');
    const customOrigin = document.getElementById('customOrigin');
    
    // Get destination coordinates
    const destinationInputs = document.querySelectorAll('.destination-area-input');
    
    let originLat, originLng, destLat, destLng;
    let originName = 'Unknown Origin';
    let destName = 'Unknown Destination';
    
    console.log('Origin select value:', originSelect?.value);
    console.log('Custom origin value:', customOrigin?.value);
    console.log('Custom origin dataset:', customOrigin?.dataset);
    console.log('Destination inputs count:', destinationInputs.length);
    
    // Get origin coordinates
    if (originSelect && originSelect.value && originSelect.value !== 'custom') {
        // Warehouse coordinates
        const warehouseCoordinates = {
            'alabang': { lat: 14.444208, lng: 121.046787, name: 'SMEG Alabang Warehouse' },
            'cebu': { lat: 10.3157, lng: 123.8854, name: 'SMEG Cebu Warehouse' },
            'davao': { lat: 7.0759, lng: 125.6143, name: 'SMEG Davao Warehouse' }
        };
        
        if (warehouseCoordinates[originSelect.value]) {
            originLat = warehouseCoordinates[originSelect.value].lat;
            originLng = warehouseCoordinates[originSelect.value].lng;
            originName = warehouseCoordinates[originSelect.value].name;
            console.log('Using warehouse coordinates:', originLat, originLng);
        }
    } else if (customOrigin && customOrigin.value && customOrigin.dataset.lat && customOrigin.dataset.lng) {
        // Custom origin coordinates
        originLat = parseFloat(customOrigin.dataset.lat);
        originLng = parseFloat(customOrigin.dataset.lng);
        originName = customOrigin.value || 'Custom Origin';
        console.log('Using custom origin coordinates:', originLat, originLng);
    }
    
    // Get destination coordinates (use the first destination for now)
    if (destinationInputs.length > 0) {
        const firstDestination = destinationInputs[0];
        console.log('First destination value:', firstDestination.value);
        console.log('First destination dataset:', firstDestination.dataset);
        if (firstDestination.dataset.lat && firstDestination.dataset.lng) {
            destLat = parseFloat(firstDestination.dataset.lat);
            destLng = parseFloat(firstDestination.dataset.lng);
            destName = firstDestination.value || 'Destination';
            console.log('Using destination coordinates from dataset:', destLat, destLng);
        } else if (firstDestination.value) {
            // Try to extract coordinates from the input value if in format "lat, lng"
            const coordsMatch = firstDestination.value.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
            if (coordsMatch) {
                destLat = parseFloat(coordsMatch[1]);
                destLng = parseFloat(coordsMatch[2]);
                destName = firstDestination.value;
                console.log('Extracted coordinates from input value:', destLat, destLng);
            } else {
                console.log('Could not extract coordinates from input value:', firstDestination.value);
            }
        } else {
            console.log('No destination coordinates found');
        }
    }
    
    // Calculate distance if we have both origin and destination
    if (originLat !== undefined && originLng !== undefined && 
        destLat !== undefined && destLng !== undefined) {
        const distance = calculateRealDistance(originLat, originLng, destLat, destLng);
        console.log('Calculated distance:', distance);
        
        // Update the computed distance display
        if (computedDistanceElement) {
            computedDistanceElement.textContent = `${distance.toFixed(2)} km`;
        }
        
        // Update origin/destination info
        if (originDestinationInfoElement) {
            originDestinationInfoElement.textContent = `${originName} to ${destName}`;
        }
        
        // Also update the main dashboard distance if needed
        updateDashboardDistance(distance);
    } else {
        console.log('Missing coordinates, showing -- km');
        console.log('Origin lat/lng:', originLat, originLng);
        console.log('Destination lat/lng:', destLat, destLng);
        
        // Update the computed distance display
        if (computedDistanceElement) {
            computedDistanceElement.textContent = '-- km';
        }
        
        // Update origin/destination info
        if (originDestinationInfoElement) {
            originDestinationInfoElement.textContent = 'Select origin and destination to calculate distance';
        }
        
        // Also update the main dashboard distance if needed
        updateDashboardDistance(null);
    }
}

// Function to update the main dashboard distance
function updateDashboardDistance(distance) {
    console.log('Updating dashboard distance:', distance);
    
    // Find the dashboard distance element
    const dashboardDistanceElement = document.querySelector('#booking-view .metric-card:nth-child(3) .metric-value');
    if (dashboardDistanceElement) {
        if (distance !== null) {
            dashboardDistanceElement.textContent = `${Math.round(distance)} km`;
        } else {
            dashboardDistanceElement.textContent = '0 km';
        }
    }
    
    // Also update any other distance displays if needed
    updateAllDistanceDisplays(distance);
}

// Function to update all distance displays in the system
function updateAllDistanceDisplays(distance) {
    console.log('Updating all distance displays with:', distance);
    
    // This function can be expanded to update distances in other parts of the app
    // For now, we're focusing on the main booking modal and dashboard
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
                // Hide coordinates display
                hideDestinationCoordinates(0);
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
    
    // Create map modal HTML
    const mapModalHtml = `
        <div class="modal fade" id="mapPinModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-geo-alt me-2"></i>Select Location on Map
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <p class="text-muted">Click anywhere on the map to select a location. You can also use the quick location buttons below.</p>
                        </div>
                        
                        <!-- Search Box -->
                        <div class="input-group mb-3">
                            <input type="text" class="form-control" id="locationSearchInput" placeholder="Search for a location...">
                            <button class="btn btn-outline-primary" type="button" id="locationSearchBtn">
                                <i class="bi bi-search"></i>
                            </button>
                        </div>
                        
                        <!-- Quick Location Buttons -->
                        <div class="d-flex flex-wrap gap-2 mb-3">
                            <button class="btn btn-sm btn-outline-primary quick-location-btn" data-lat="14.444208" data-lng="121.046787" data-name="SMEG Alabang">
                                <i class="bi bi-geo-alt me-1"></i>Alabang
                            </button>
                            <button class="btn btn-sm btn-outline-primary quick-location-btn" data-lat="10.3157" data-lng="123.8854" data-name="SMEG Cebu">
                                <i class="bi bi-geo-alt me-1"></i>Cebu
                            </button>
                            <button class="btn btn-sm btn-outline-primary quick-location-btn" data-lat="7.0759" data-lng="125.6143" data-name="SMEG Davao">
                                <i class="bi bi-geo-alt me-1"></i>Davao
                            </button>
                            <button class="btn btn-sm btn-outline-primary quick-location-btn" data-lat="14.5995" data-lng="120.9842" data-name="Manila">
                                <i class="bi bi-geo-alt me-1"></i>Manila
                            </button>
                            <button class="btn btn-sm btn-outline-primary quick-location-btn" data-lat="14.5547" data-lng="121.0244" data-name="Makati">
                                <i class="bi bi-geo-alt me-1"></i>Makati
                            </button>
                        </div>
                        
                        <!-- Map Container -->
                        <div id="mapPinContainer" style="height: 400px; border-radius: 8px; overflow: hidden; border: 1px solid #dee2e6;"></div>
                        
                        <!-- Selected Location Info -->
                        <div class="mt-3 p-3 bg-light rounded" id="selectedLocationInfo" style="display: none;">
                            <h6>Selected Location:</h6>
                            <p class="mb-1" id="selectedLocationName">-</p>
                            <p class="mb-1 text-muted small" id="selectedLocationCoords">Coordinates: -, -</p>
                            <div class="input-group mt-2">
                                <span class="input-group-text">Address</span>
                                <input type="text" class="form-control" id="selectedLocationAddress" placeholder="Enter address or description">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="confirmLocationBtn" disabled>
                            <i class="bi bi-check-circle me-1"></i>Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing map modal if it exists
    const existingModal = document.getElementById('mapPinModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add the map modal to the DOM
    document.body.insertAdjacentHTML('beforeend', mapModalHtml);
    
    // Show the modal
    const mapModalElement = document.getElementById('mapPinModal');
    const mapModal = new bootstrap.Modal(mapModalElement);
    mapModal.show();
    
    // Initialize the map when modal is shown
    mapModalElement.addEventListener('shown.bs.modal', function() {
        initializeMapPinDialog(type, index);
    });
    
    // Clean up when modal is hidden
    mapModalElement.addEventListener('hidden.bs.modal', function() {
        // Remove the modal from DOM
        mapModalElement.remove();
    });
}

// Initialize the map pin dialog
function initializeMapPinDialog(type, index) {
    console.log(`initializeMapPinDialog called with type: ${type}, index: ${index}`);
    
    // Check if Leaflet is available
    if (typeof L === 'undefined') {
        console.error('Leaflet is not available!');
        alert('Map functionality is not available. Please try again later.');
        return;
    }
    
    // Initialize Leaflet map centered on Philippines
    const map = L.map('mapPinContainer').setView([12.8797, 121.7740], 6);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Variable to store the selected location
    let selectedLocation = null;
    
    // Handle map click for selecting locations
    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Remove existing marker if any
        if (window.mapPinMarker) {
            map.removeLayer(window.mapPinMarker);
        }
        
        // Add marker at clicked location
        window.mapPinMarker = L.marker([lat, lng]).addTo(map);
        
        // Update selected location info
        selectedLocation = { lat, lng };
        updateSelectedLocationInfo(selectedLocation);
    });
    
    // Add event listeners for quick location buttons
    document.querySelectorAll('.quick-location-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lat = parseFloat(this.dataset.lat);
            const lng = parseFloat(this.dataset.lng);
            const name = this.dataset.name;
            
            // Center map on selected location
            map.setView([lat, lng], 12);
            
            // Remove existing marker if any
            if (window.mapPinMarker) {
                map.removeLayer(window.mapPinMarker);
            }
            
            // Add marker at selected location
            window.mapPinMarker = L.marker([lat, lng]).addTo(map);
            
            // Update selected location info
            selectedLocation = { lat, lng, name };
            updateSelectedLocationInfo(selectedLocation);
        });
    });
    
    // Add search functionality
    const searchInput = document.getElementById('locationSearchInput');
    const searchBtn = document.getElementById('locationSearchBtn');
    
    if (searchInput && searchBtn) {
        // Search on button click
        searchBtn.addEventListener('click', function() {
            performLocationSearch(searchInput.value, map);
        });
        
        // Search on Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performLocationSearch(searchInput.value, map);
            }
        });
    }
    
    // Function to perform location search using Nominatim
    function performLocationSearch(query, map) {
        if (!query.trim()) return;
        
        // Show loading indicator
        searchBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
        searchBtn.disabled = true;
        
        // Use Nominatim API for geocoding
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=PH&limit=5`)
            .then(response => response.json())
            .then(results => {
                if (results && results.length > 0) {
                    const result = results[0]; // Use the first result
                    const lat = parseFloat(result.lat);
                    const lng = parseFloat(result.lon);
                    const displayName = result.display_name;
                    
                    // Center map on the found location
                    map.setView([lat, lng], 15);
                    
                    // Remove existing marker if any
                    if (window.mapPinMarker) {
                        map.removeLayer(window.mapPinMarker);
                    }
                    
                    // Add marker at the found location
                    window.mapPinMarker = L.marker([lat, lng]).addTo(map);
                    
                    // Update selected location info
                    selectedLocation = { lat, lng, name: displayName };
                    updateSelectedLocationInfo(selectedLocation);
                } else {
                    alert('Location not found. Please try a different search term.');
                }
            })
            .catch(error => {
                console.error('Error searching for location:', error);
                alert('Error searching for location. Please try again.');
            })
            .finally(() => {
                // Restore search button
                searchBtn.innerHTML = '<i class="bi bi-search"></i>';
                searchBtn.disabled = false;
            });
    }
    
    // Update selected location info display
    function updateSelectedLocationInfo(location) {
        const infoDiv = document.getElementById('selectedLocationInfo');
        const nameElement = document.getElementById('selectedLocationName');
        const coordsElement = document.getElementById('selectedLocationCoords');
        const addressInput = document.getElementById('selectedLocationAddress');
        const confirmBtn = document.getElementById('confirmLocationBtn');
        
        if (location) {
            infoDiv.style.display = 'block';
            nameElement.textContent = location.name || 'Custom Location';
            coordsElement.textContent = `Coordinates: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
            addressInput.value = location.name || '';
            confirmBtn.disabled = false;
            
            // Add event listener to confirm button
            confirmBtn.onclick = function() {
                confirmLocationSelection(type, index, location, addressInput.value);
            };
        } else {
            infoDiv.style.display = 'none';
            confirmBtn.disabled = true;
        }
    }
    
    // Confirm location selection
    function confirmLocationSelection(type, index, location, address) {
        console.log(`confirmLocationSelection called with type: ${type}, index: ${index}, location:`, location);
        
        // Close the map modal
        const mapModalElement = document.getElementById('mapPinModal');
        const mapModal = bootstrap.Modal.getInstance(mapModalElement);
        mapModal.hide();
        
        // Set the selected location in the booking form
        if (type === 'origin') {
            const customOrigin = document.getElementById('customOrigin');
            if (customOrigin) {
                customOrigin.value = address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
                customOrigin.setAttribute('data-lat', location.lat);
                customOrigin.setAttribute('data-lng', location.lng);
                
                // Trigger change event to update distance
                const event = new Event('change', { bubbles: true });
                customOrigin.dispatchEvent(event);
            }
        } else {
            const destinationInputs = document.querySelectorAll('.destination-area-input');
            if (destinationInputs[index]) {
                destinationInputs[index].value = address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
                destinationInputs[index].setAttribute('data-lat', location.lat);
                destinationInputs[index].setAttribute('data-lng', location.lng);
                
                // Display coordinates below the destination area
                console.log('Displaying destination coordinates for index:', index, location.lat, location.lng);
                displayDestinationCoordinates(index, location.lat, location.lng);
                
                // Trigger input event to update distance
                const event = new Event('input', { bubbles: true });
                destinationInputs[index].dispatchEvent(event);
            } else {
                console.error('Destination input not found for index:', index);
            }
        }
        
        // Update distance calculation
        console.log('Calling updateDistance after location selection');
        setTimeout(updateDistance, 200); // Small delay to ensure DOM updates
    }
    
    // Initialize with no selected location
    updateSelectedLocationInfo(null);
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

// Show toast notification
function showToast(message, type = 'success') {
    // Create toast element
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    // Add to toast container or create one
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);

    // Initialize and show toast
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();

    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
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
        let originCoords = null;
        
        if (originSelect && originSelect.value && originSelect.value !== 'custom') {
            // Warehouse coordinates
            const warehouseCoordinates = {
                'alabang': { lat: 14.444208, lng: 121.046787, name: 'SMEG Alabang Warehouse' },
                'cebu': { lat: 10.3157, lng: 123.8854, name: 'SMEG Cebu Warehouse' },
                'davao': { lat: 7.0759, lng: 125.6143, name: 'SMEG Davao Warehouse' }
            };
            
            if (warehouseCoordinates[originSelect.value]) {
                origin = warehouseCoordinates[originSelect.value].name;
                originCoords = {
                    lat: warehouseCoordinates[originSelect.value].lat,
                    lng: warehouseCoordinates[originSelect.value].lng
                };
            }
        } else if (customOrigin && customOrigin.value && customOrigin.dataset.lat && customOrigin.dataset.lng) {
            origin = customOrigin.value;
            originCoords = {
                lat: parseFloat(customOrigin.dataset.lat),
                lng: parseFloat(customOrigin.dataset.lng)
            };
        }
        
        // Get destinations
        const destinationInputs = document.querySelectorAll('.destination-area-input');
        const destinations = [];
        const destinationCoords = [];
        
        destinationInputs.forEach(input => {
            if (input.value.trim()) {
                destinations.push(input.value);
                
                // Get coordinates if available
                if (input.dataset.lat && input.dataset.lng) {
                    destinationCoords.push({
                        lat: parseFloat(input.dataset.lat),
                        lng: parseFloat(input.dataset.lng)
                    });
                }
            }
        });
        
        // Get distance
        const computedDistanceElement = document.getElementById('computedDistanceValue');
        let distance = 0;
        if (computedDistanceElement && computedDistanceElement.textContent !== '-- km') {
            distance = parseFloat(computedDistanceElement.textContent);
        }
        
        // Get additional costs
        const costItems = document.querySelectorAll('.cost-item');
        const additionalCosts = [];
        let totalAdditionalCosts = 0;
        
        costItems.forEach(item => {
            const descriptionInput = item.querySelector('input[type="text"]');
            const amountInput = item.querySelector('input[type="number"]');
            
            if (descriptionInput && amountInput && descriptionInput.value.trim() && amountInput.value) {
                const amount = parseFloat(amountInput.value);
                additionalCosts.push({
                    description: descriptionInput.value,
                    amount: amount
                });
                totalAdditionalCosts += amount;
            }
        });
        
        // Validate form
        if (!drNumber) {
            showToast('DR Number is required', 'error');
            return;
        }
        
        if (!customerName) {
            showToast('Customer Name is required', 'error');
            return;
        }
        
        if (!customerNumber) {
            showToast('Customer Number is required', 'error');
            return;
        }
        
        if (!deliveryDate) {
            showToast('Delivery Date is required', 'error');
            return;
        }
        
        if (!truckType) {
            showToast('Truck Type is required', 'error');
            return;
        }
        
        if (!truckPlateNumber) {
            showToast('Truck Plate Number is required', 'error');
            return;
        }
        
        if (!origin) {
            showToast('Origin is required', 'error');
            return;
        }
        
        if (destinations.length === 0) {
            showToast('At least one destination is required', 'error');
            return;
        }
        
        // Create booking object
        const booking = {
            id: 'BOOKING-' + Date.now(),
            drNumber: drNumber,
            customerName: customerName,
            customerNumber: customerNumber,
            deliveryDate: deliveryDate,
            truckType: truckType,
            truckPlateNumber: truckPlateNumber,
            origin: origin,
            originCoords: originCoords,
            destinations: destinations,
            destinationCoords: destinationCoords,
            distance: distance,
            additionalCosts: additionalCosts,
            totalAdditionalCosts: totalAdditionalCosts,
            status: 'On Schedule', // Default status
            createdAt: new Date().toISOString()
        };
        
        console.log('Booking object created:', booking);
        
        // Save to localStorage (in a real implementation, this would be saved to a database)
        let bookings = JSON.parse(localStorage.getItem('mci-bookings') || '[]');
        bookings.push(booking);
        localStorage.setItem('mci-bookings', JSON.stringify(bookings));
        
        // Auto-create customer if not exists
        console.log('=== SAVE BOOKING DEBUG ===');
        console.log('About to call autoCreateCustomer with:', {
            customerName,
            customerNumber,
            destination: destinations[0] || ''
        });
        
        await autoCreateCustomer(customerName, customerNumber, destinations[0] || '');
        
        console.log('autoCreateCustomer completed');

        // In a real implementation, this would save to Supabase or another backend
        console.log('Saving booking:', booking);

        // Show success message
        showToast('Booking confirmed successfully!');
        
        // Reset form and close modal
        resetBookingForm();
        const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
        if (bookingModal) {
            bookingModal.hide();
        }
        
        // Refresh active deliveries if the function exists
        if (typeof window.loadActiveDeliveries === 'function') {
            window.loadActiveDeliveries();
        }
        
        // Refresh calendar data
        if (typeof window.loadBookingsData === 'function' && typeof window.updateCalendar === 'function') {
            window.loadBookingsData().then(() => {
                window.updateCalendar();
            });
        }
        
    } catch (error) {
        console.error('Error saving booking:', error);
        showToast('Failed to save booking', 'error');
    }
}

// Expose function globally
window.saveBooking = saveBooking;
