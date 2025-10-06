// Booking modal functionality
console.log('=== BOOKING.JS LOADED ===');

// Show toast notification
function showToast(message, type = 'success') {
    // Create toast element if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-bg-${type}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Show the toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // Remove the toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// Show error notification
function showError(message) {
    showToast(message, 'danger');
}

// Enhanced openBookingModal function for calendar integration
function openBookingModal(dateStr) {
    console.log('=== OPEN BOOKING MODAL FUNCTION CALLED ===');
    console.log('Date string received:', dateStr);
    
    // Make sure this function is globally available
    window.openBookingModal = openBookingModal;
    
    showBookingModal(dateStr);
}

// Enhanced showBookingModal function
function showBookingModal(dateStr) {
    console.log('=== SHOW BOOKING MODAL FUNCTION CALLED ===');
    console.log('Date string received:', dateStr);
    
    // Make sure this function is globally available
    window.showBookingModal = showBookingModal;
    
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
                
                // Set the delivery date if provided
                if (dateStr) {
                    const deliveryDateInput = document.getElementById('deliveryDate');
                    if (deliveryDateInput) {
                        deliveryDateInput.value = dateStr;
                    }
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

function initBookingModal() {
    // Ensure customer management is available
    ensureCustomerManagementReady();
    
    // Ensure warehouse manager is available
    ensureWarehouseManagerReady();
    
    const bookingModalElement = document.getElementById('bookingModal');
    if (!bookingModalElement) {
        console.error('Booking modal element not found');
        return;
    }
    
    const bookingModal = new bootstrap.Modal(bookingModalElement);
    const bookingForm = document.getElementById('bookingForm');
    // Note: bookingForm is not used in the current implementation, so we can skip the null check

    // Add DR number functionality with proper event listener cleanup
    const addDrBtn = document.getElementById('addDrBtn');
    const drNumbersContainer = document.getElementById('drNumbersContainer');

    if (addDrBtn && drNumbersContainer) {
        // Remove existing event listeners by cloning
        const newAddDrBtn = addDrBtn.cloneNode(true);
        addDrBtn.parentNode.replaceChild(newAddDrBtn, addDrBtn);
        
        newAddDrBtn.addEventListener('click', function () {
            const drNumberItem = document.createElement('div');
            drNumberItem.className = 'dr-number-item mt-2';
            // Generate a unique ID for each DR number input
            const uniqueId = 'drNumber-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            drNumberItem.innerHTML = `
                <div class="input-group">
                    <input type="text" class="form-control dr-number-input" id="${uniqueId}" placeholder="Enter DR number (e.g., DR-XXXXX)" required>
                    <button type="button" class="btn btn-outline-danger remove-dr-btn">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            `;

            drNumbersContainer.appendChild(drNumberItem);

            // Add event listener to the new remove button
            const removeDrBtn = drNumberItem.querySelector('.remove-dr-btn');
            if (removeDrBtn) {
                // Remove existing event listeners by cloning
                const newRemoveDrBtn = removeDrBtn.cloneNode(true);
                removeDrBtn.parentNode.replaceChild(newRemoveDrBtn, removeDrBtn);
                
                newRemoveDrBtn.addEventListener('click', function () {
                    drNumberItem.remove();
                });
            }
        });
    }

    // Add event listeners for remove DR number buttons with proper cleanup
    document.querySelectorAll('.remove-dr-btn').forEach(button => {
        // Remove existing event listeners by cloning
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function () {
            const drNumberItem = this.closest('.dr-number-item');
            if (drNumberItem) {
                drNumberItem.remove();
            }
        });
    });

    // Origin selection toggle with proper event listener cleanup
    const originSelect = document.getElementById('originSelect');
    const customOriginContainer = document.getElementById('customOriginContainer');

    if (originSelect && customOriginContainer) {
        // Remove existing event listeners by cloning
        const newOriginSelect = originSelect.cloneNode(true);
        originSelect.parentNode.replaceChild(newOriginSelect, originSelect);
        
        newOriginSelect.addEventListener('change', function () {
            if (this.value === '') {
                customOriginContainer.classList.remove('d-none');
                // Clear coordinates display when custom location is selected
                const originCoordinatesDisplay = document.getElementById('originCoordinatesDisplay');
                if (originCoordinatesDisplay) {
                    originCoordinatesDisplay.textContent = '';
                }
            } else {
                customOriginContainer.classList.add('d-none');
                // Display warehouse coordinates
                const originCoordinatesDisplay = document.getElementById('originCoordinatesDisplay');
                // Ensure warehouse manager is ready before accessing it
                ensureWarehouseManagerReady();
                if (originCoordinatesDisplay && window.warehouseManager && window.warehouseManager.warehouseLocations) {
                    const warehouse = window.warehouseManager.warehouseLocations.find(w => w.id === this.value);
                    if (warehouse) {
                        originCoordinatesDisplay.textContent = `(${warehouse.coordinates.lat.toFixed(6)}, ${warehouse.coordinates.lng.toFixed(6)})`;
                    } else {
                        originCoordinatesDisplay.textContent = '';
                    }
                }
            }
            updateDistance();
        });
    }

    // Map pin buttons for origin with proper event listener cleanup
    const pinOriginBtn = document.getElementById('pinOrigin');
    if (pinOriginBtn && customOriginContainer && originSelect) {
        // Remove existing event listeners by cloning
        const newPinOriginBtn = pinOriginBtn.cloneNode(true);
        pinOriginBtn.parentNode.replaceChild(newPinOriginBtn, pinOriginBtn);
        
        newPinOriginBtn.addEventListener('click', function () {
            customOriginContainer.classList.remove('d-none');
            if (originSelect) originSelect.value = '';
            showMapPinDialog('origin');
        });
    }

    // Add destination area functionality with proper event listener cleanup
    const addAreaBtn = document.getElementById('addAreaBtn');
    const destinationAreasContainer = document.getElementById('destinationAreasContainer');

    if (addAreaBtn && destinationAreasContainer) {
        // Modify the event listener for existing destination area inputs to open map modal directly
        document.querySelectorAll('.destination-area-input').forEach((input, index) => {
            // Remove existing event listeners by cloning
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            
            newInput.addEventListener('focus', function () {
                // Open map modal directly when focusing on the destination area input
                showMapPinDialog('destination', index);
            });
            
            // Prevent the default behavior of typing in the input
            newInput.addEventListener('keydown', function(e) {
                // Allow Tab, Escape, and Enter keys
                if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'Enter') {
                    return;
                }
                // Prevent other keys and open map modal
                e.preventDefault();
                showMapPinDialog('destination', index);
            });
            
            // Also open map modal on click
            newInput.addEventListener('click', function () {
                showMapPinDialog('destination', index);
            });
        });

        // Add event listeners to existing destination area elements
        document.querySelectorAll('.pin-on-map-btn').forEach((btn, index) => {
            if (index >= 0) { // Include the origin pin button now
                // Remove existing event listeners by cloning
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                newBtn.addEventListener('click', function () {
                    const areaIndex = parseInt(this.dataset.areaIndex);
                    showMapPinDialog('destination', areaIndex);
                });
            }
        });

        // Remove existing event listeners by cloning
        const newAddAreaBtn = addAreaBtn.cloneNode(true);
        addAreaBtn.parentNode.replaceChild(newAddAreaBtn, addAreaBtn);
        
        newAddAreaBtn.addEventListener('click', function () {
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
            if (inputField) {
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
            }

            if (pinBtn) {
                // Remove existing event listeners by cloning
                const newPinBtn = pinBtn.cloneNode(true);
                pinBtn.parentNode.replaceChild(newPinBtn, pinBtn);
                
                newPinBtn.addEventListener('click', function () {
                    showMapPinDialog('destination', areaIndex);
                });
            }

            if (removeBtn) {
                // Remove existing event listeners by cloning
                const newRemoveBtn = removeBtn.cloneNode(true);
                removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);
                
                newRemoveBtn.addEventListener('click', function () {
                    areaItem.remove();
                    updateDistance();
                });
            }
        });
    }

    // Remove the search-related event listeners as they are no longer needed
    // The destination area input now directly opens the map modal

    // Add cost item functionality with proper event listener cleanup
    const addCostBtn = document.getElementById('addCostBtn');
    const costItemsContainer = document.getElementById('costItemsContainer');

    if (addCostBtn && costItemsContainer) {
        // Remove existing event listeners by cloning
        const newAddCostBtn = addCostBtn.cloneNode(true);
        addCostBtn.parentNode.replaceChild(newAddCostBtn, addCostBtn);
        
        newAddCostBtn.addEventListener('click', function () {
            const costItem = document.createElement('div');
            costItem.className = 'cost-item';
            costItem.innerHTML = `
                <div class="flex-grow-1">
                    <input type="text" class="form-control" placeholder="Description (e.g., Fuel Surcharge)">
                </div>
                <div>
                    <div class="input-group">
                        <span class="input-group-text">₱</span>
                        <input type="number" class="form-control" placeholder="Amount">
                    </div>
                </div>
                <button type="button" class="remove-cost">
                    <i class="bi bi-x-lg"></i>
                </button>
            `;

            costItemsContainer.appendChild(costItem);

            // Add event listener to the new remove button
            const removeCostBtn = costItem.querySelector('.remove-cost');
            if (removeCostBtn) {
                // Remove existing event listeners by cloning
                const newRemoveCostBtn = removeCostBtn.cloneNode(true);
                removeCostBtn.parentNode.replaceChild(newRemoveCostBtn, removeCostBtn);
                
                newRemoveCostBtn.addEventListener('click', function () {
                    costItem.remove();
                });
            }
        });
    }

    // Remove cost buttons with proper event listener cleanup
    document.querySelectorAll('.remove-cost').forEach(button => {
        // Remove existing event listeners by cloning
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function () {
            const costItem = this.closest('.cost-item');
            if (costItem) {
                costItem.remove();
            }
        });
    });

    // Confirm booking button with proper event listener cleanup
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    if (confirmBookingBtn) {
        // Remove existing event listeners by cloning
        const newConfirmBookingBtn = confirmBookingBtn.cloneNode(true);
        confirmBookingBtn.parentNode.replaceChild(newConfirmBookingBtn, confirmBookingBtn);
        
        newConfirmBookingBtn.addEventListener('click', function () {
            saveBooking();
        });
    }

    // Cancel booking button (uses data-bs-dismiss="modal" in HTML)
    // No need to add event listener as Bootstrap handles modal dismissal

    // Calculate distance when origin or destination changes
    const originSelectElement = document.getElementById('originSelect');
    const customOriginElement = document.getElementById('customOrigin');
    
    if (originSelectElement) {
        // Remove existing event listeners by cloning
        const newOriginSelectElement = originSelectElement.cloneNode(true);
        originSelectElement.parentNode.replaceChild(newOriginSelectElement, originSelectElement);
        
        newOriginSelectElement.addEventListener('change', updateDistance);
    }
    
    if (customOriginElement) {
        // Remove existing event listeners by cloning
        const newCustomOriginElement = customOriginElement.cloneNode(true);
        customOriginElement.parentNode.replaceChild(newCustomOriginElement, customOriginElement);
        
        newCustomOriginElement.addEventListener('change', updateDistance);
    }
    
    // Add event listeners for destination area inputs
    document.addEventListener('input', function(e) {
        if (e.target && e.target.classList.contains('destination-area-input')) {
            updateDistance();
        }
    });
}

// Calculate distance between origin and destination
function calculateDistance() {
    const originSelect = document.getElementById('originSelect');
    const customOrigin = document.getElementById('customOrigin');
    const destinationInputs = document.querySelectorAll('.destination-area-input'); // Get all destination inputs
    const distanceBox = document.getElementById('distanceBox');

    // In a real implementation, this would use Google Maps API to calculate distance
    // For demo purposes, we'll use mock data

    // Check if at least one destination is provided
    let hasDestination = false;
    destinationInputs.forEach(input => {
        if (input.value.trim()) {
            hasDestination = true;
        }
    });

    if (!hasDestination) {
        if (distanceBox) {
            distanceBox.textContent = '0.0 km';
        }
        return;
    }

    let origin = '';
    if (originSelect && originSelect.value && originSelect.value !== '') {
        origin = originSelect.options[originSelect.selectedIndex].text;
    } else if (customOrigin && customOrigin.value) {
        origin = customOrigin.value;
    }

    if (!origin) {
        if (distanceBox) {
            distanceBox.textContent = '0.0 km';
        }
        return;
    }

    // Mock distance calculation
    let totalDistance = 0;
    destinationInputs.forEach(input => {
        if (input.value.trim()) {
            let distance = 0;
            if (origin.includes('Alabang')) {
                if (input.value.includes('Makati')) distance = 12.5;
                else if (input.value.includes('Laguna')) distance = 24.7;
                else distance = 18.3;
            } else if (origin.includes('Cebu')) {
                if (input.value.includes('Cebu')) distance = 8.2;
                else distance = 14.8;
            } else if (origin.includes('Davao')) {
                if (input.value.includes('Davao')) distance = 5.3;
                else distance = 10.6;
            } else {
                distance = Math.floor(Math.random() * 50);
            }
            totalDistance += distance;
        }
    });

    if (distanceBox) {
        distanceBox.textContent = `${totalDistance.toFixed(1)} km`;
    }
}

// Save booking to Supabase
async function saveBooking() {
    try {
        console.log('=== SAVE BOOKING FUNCTION STARTED ===');
        
        // Log the state of all relevant form elements
        const drNumberElement = document.getElementById('drNumber');
        console.log('Main DR Number element:', drNumberElement);
        console.log('Main DR Number value:', drNumberElement ? drNumberElement.value : 'Element not found');
        
        // Get all DR numbers - improved detection logic to accept any DR number input
        // Get all inputs with class "dr-number-input" (this includes both the main input and dynamically added ones)
        const drNumberInputs = document.querySelectorAll('.dr-number-input');
        
        console.log('DR Number inputs found:', drNumberInputs.length);
        drNumberInputs.forEach((input, index) => {
            console.log(`DR Input ${index}: ID=${input.id}, Value="${input.value}", Class="${input.className}"`);
        });
        
        let drNumbers = [];
        
        // Collect all DR numbers from inputs with class "dr-number-input"
        drNumberInputs.forEach((input, index) => {
            console.log(`Processing DR Input ${index} (ID: ${input.id}):`, input.value);
            if (input.value && input.value.trim()) {
                const trimmedValue = input.value.trim();
                if (trimmedValue) {
                    drNumbers.push(trimmedValue);
                    console.log(`Added DR number: "${trimmedValue}"`);
                }
            }
        });
        
        // Also check for the main drNumber input by ID in case it doesn't have the class
        const mainDrNumberInput = document.getElementById('drNumber');
        if (mainDrNumberInput) {
            console.log('Main DR Number input value:', `"${mainDrNumberInput.value}"`);
            console.log('Main DR Number input trimmed value:', `"${mainDrNumberInput.value.trim()}"`);
            console.log('DR numbers array before main input check:', drNumbers);
            
            // Check if main input has a value and it's not already in our array
            if (mainDrNumberInput.value && mainDrNumberInput.value.trim()) {
                const mainValue = mainDrNumberInput.value.trim();
                if (mainValue && !drNumbers.includes(mainValue)) {
                    drNumbers.push(mainValue);
                    console.log('Added main DR number input:', mainValue);
                } else if (mainValue && drNumbers.includes(mainValue)) {
                    console.log('Main DR number already in array, skipping duplicate');
                }
            } else {
                console.log('Main DR Number input is empty or whitespace only');
            }
        }
        
        console.log('Final collected DR Numbers:', drNumbers);
        
        // Check if we have the booking form element
        const bookingForm = document.getElementById('bookingForm');
        console.log('Booking form element:', bookingForm);
        if (bookingForm) {
            console.log('Booking form reset state:', bookingForm.dataset.resetState || 'not set');
        }

        // Validate form - simplified logic since we're now correctly collecting all DR numbers
        if (drNumbers.length === 0) {
            console.error('No DR numbers found - showing error to user');
            console.error('Current state:');
            console.error('- drNumbers array:', drNumbers);
            console.error('- drNumberInputs length:', drNumberInputs.length);
            console.error('- mainDrNumberInput exists:', !!mainDrNumberInput);
            if (mainDrNumberInput) {
                console.error('- mainDrNumberInput value:', `"${mainDrNumberInput.value}"`);
            }
            
            // Try to generate a DR number if none provided
            const generatedDR = generateDRNumber();
            console.log('Generated DR Number as fallback:', generatedDR);
            drNumbers.push(generatedDR);
            showToast('No DR number provided. Auto-generated: ' + generatedDR, 'warning');
        }

        const customerName = document.getElementById('customerName').value;
        const customerNumber = document.getElementById('customerNumber').value;
        const originSelect = document.getElementById('originSelect');
        const customOrigin = document.getElementById('customOrigin');
        const destinationInputs = document.querySelectorAll('.destination-area-input'); // Get all destination inputs
        const distanceValue = document.getElementById('distanceValue'); // Changed from distanceBox
        const deliveryDate = document.getElementById('deliveryDate').value;
        const truckType = document.getElementById('truckType').value;
        const truckPlateNumber = document.getElementById('truckPlateNumber').value;

        console.log('Form data collected:', {
            customerName,
            customerNumber,
            deliveryDate,
            truckType,
            truckPlateNumber,
            drNumbersCount: drNumbers.length
        });

        // Validate form
        if (!customerName) {
            showError('Customer Name is required');
            return;
        }

        if (!customerNumber) {
            showError('Customer Number is required');
            return;
        }

        if (!deliveryDate) {
            showError('Delivery Date is required');
            return;
        }

        if (!truckType) {
            showError('Truck Type is required');
            return;
        }

        if (!truckPlateNumber) {
            showError('Truck Plate Number is required');
            return;
        }

        // Get destinations (at least one required)
        let hasDestination = false;
        let destinations = [];
        destinationInputs.forEach(input => {
            if (input.value.trim()) {
                hasDestination = true;
                destinations.push(input.value);
            }
        });

        if (!hasDestination) {
            showError('At least one destination is required');
            return;
        }

        // Get origin
        let origin = '';
        if (originSelect && originSelect.value && originSelect.value !== '') {
            origin = originSelect.options[originSelect.selectedIndex].text;
        } else if (customOrigin && customOrigin.value) {
            origin = customOrigin.value;
        }

        if (!origin) {
            showError('Origin is required');
            return;
        }

        // Get distance
        let distance = 0;
        if (distanceValue) {
            const distanceText = distanceValue.textContent.replace(' km', '');
            distance = parseFloat(distanceText) || 0;
        }

        // Get additional costs with descriptions
        const costItems = document.querySelectorAll('#costItemsContainer .cost-item');
        let additionalCostsTotal = 0;
        let additionalCostItems = [];

        costItems.forEach(item => {
            const descriptionInput = item.querySelector('input[placeholder="Description (e.g., Fuel Surcharge)"]');
            const amountInput = item.querySelector('input[placeholder="Amount"]');
            
            if (amountInput && amountInput.value) {
                const amount = parseFloat(amountInput.value);
                const description = descriptionInput ? descriptionInput.value : '';
                if (!isNaN(amount)) {
                    additionalCostsTotal += amount;
                    additionalCostItems.push({
                        description: description,
                        amount: amount
                    });
                }
            }
        });

        // Process each DR number as a separate booking
        for (const drNumber of drNumbers) {
            // Auto-create customer if not exists
            console.log('=== SAVE BOOKING DEBUG ===');
            console.log('About to call autoCreateCustomer with:', {
                customerName,
                customerNumber,
                destinations
            });
            
            await autoCreateCustomer(customerName, customerNumber, destinations.join('; '));
            
            console.log('autoCreateCustomer completed');

            // Create delivery object
            const newDelivery = {
                id: 'DEL-' + Date.now() + '-' + drNumber,
                drNumber: drNumber,
                customerName: customerName,
                customerNumber: customerNumber,
                origin: origin,
                destination: destinations.join('; '),
                distance: distance + ' km',
                truckType: truckType,
                truckPlateNumber: truckPlateNumber,
                status: 'On Schedule',
                deliveryDate: deliveryDate,
                additionalCosts: additionalCostsTotal,
                additionalCostItems: additionalCostItems, // Store individual cost items
                timestamp: new Date().toISOString()
            };

            // Add to active deliveries
            if (typeof window.activeDeliveries !== 'undefined') {
                window.activeDeliveries.push(newDelivery);
                
                // Save to localStorage
                if (typeof window.saveToLocalStorage === 'function') {
                    window.saveToLocalStorage();
                }
                
                // Refresh active deliveries display
                if (typeof window.loadActiveDeliveries === 'function') {
                    window.loadActiveDeliveries();
                }
            }
        }

        // Mock success
        showToast('Booking confirmed successfully!');

        // Reset form and close modal
        resetBookingForm();
        const bookingModalElement = document.getElementById('bookingModal');
        const bookingModal = bootstrap.Modal.getInstance(bookingModalElement);
        if (bookingModal) {
            bookingModal.hide();
        }
        
        // Ensure modal backdrop is removed and body scrolling is re-enabled
        setTimeout(() => {
            const modalBackdrops = document.querySelectorAll('.modal-backdrop');
            modalBackdrops.forEach(backdrop => {
                backdrop.remove();
            });
            
            // Remove modal-open class from body if it exists
            if (document.body.classList.contains('modal-open')) {
                document.body.classList.remove('modal-open');
            }
            
            // Re-enable body scrolling
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, 300);

        // Refresh calendar data
        if (typeof loadBookingsData === 'function' && typeof updateCalendar === 'function') {
            loadBookingsData().then(() => {
                updateCalendar();
            });
        }
        
        // Update booking view dashboard with real data
        if (typeof window.updateBookingViewDashboard === 'function') {
            setTimeout(() => {
                window.updateBookingViewDashboard();
            }, 100);
        }
    } catch (error) {
        console.error('Error saving booking:', error);
        showError('Failed to save booking');
    }
}

// Helper function to generate DR number
function generateDRNumber() {
    // Generate a 4-digit random number
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;
    const drNumber = `DR-${randomNumber}`;
    console.log('Generated DR Number:', drNumber);
    return drNumber;
}

// Ensure customer management is ready
function ensureCustomerManagementReady() {
    console.log('=== ENSURING CUSTOMER MANAGEMENT READY ===');
    
    // Make sure customers array is globally accessible
    if (typeof window.customers === 'undefined') {
        window.customers = [];
        console.log('Initialized window.customers array');
    }
    
    // Try to load existing customers from localStorage
    const savedCustomers = localStorage.getItem('mci-customers');
    if (savedCustomers && window.customers.length === 0) {
        try {
            window.customers = JSON.parse(savedCustomers);
            console.log('Loaded customers from localStorage:', window.customers.length);
        } catch (error) {
            console.error('Error loading customers from localStorage:', error);
        }
    }
    
    // Sync with HTML customers array if it exists
    if (typeof customers !== 'undefined') {
        console.log('HTML customers array found with length:', customers.length);
        if (customers.length > 0 && window.customers.length === 0) {
            window.customers = [...customers];
            console.log('Synced window.customers with HTML customers');
        } else if (window.customers.length > 0 && customers.length === 0) {
            customers.push(...window.customers);
            console.log('Synced HTML customers with window.customers');
        }
    }
    
    // Make sure customer management functions are available
    if (typeof window.loadCustomers === 'undefined') {
        window.loadCustomers = function() {
            console.log('Customer management not fully loaded yet');
        };
    }
    
    console.log('Customer management ready check completed');
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
        
        // Also check if the HTML customers array exists
        if (typeof customers !== 'undefined') {
            console.log('HTML customers array exists with length:', customers.length);
            // Sync window.customers with HTML customers array
            if (customers.length > 0 && window.customers.length === 0) {
                window.customers = [...customers];
                console.log('Synced window.customers with HTML customers array');
            }
        } else {
            console.log('HTML customers array not found');
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
            
            // Also update in HTML customers array if it exists
            if (typeof customers !== 'undefined') {
                const htmlCustomerIndex = customers.findIndex(c => 
                    c.contactPerson.toLowerCase() === customerName.toLowerCase() ||
                    c.phone === customerNumber
                );
                if (htmlCustomerIndex !== -1) {
                    customers[htmlCustomerIndex] = existingCustomer;
                    console.log('Updated customer in HTML customers array');
                }
            }
            
            // Save updated customer data to localStorage
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
            
            // Always refresh customers view to ensure updated data is visible
            if (typeof window.loadCustomers === 'function') {
                window.loadCustomers();
            }
            
            // Also trigger the customer management refresh if available
            if (typeof loadCustomers === 'function') {
                loadCustomers();
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
        
        // Also add to HTML customers array if it exists
        if (typeof customers !== 'undefined') {
            customers.push(newCustomer);
            console.log('Added to HTML customers array, new length:', customers.length);
        }
        
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
        
        // Also trigger the customer management refresh if available
        if (typeof loadCustomers === 'function') {
            console.log('Calling loadCustomers() from HTML');
            loadCustomers();
        } else {
            console.log('loadCustomers() from HTML not available');
        }
        
        // Force refresh by triggering a custom event
        const customerUpdateEvent = new CustomEvent('customerUpdated', {
            detail: { customer: newCustomer, action: 'created' }
        });
        window.dispatchEvent(customerUpdateEvent);
        console.log('Dispatched customerUpdated event');
        
        // Try to directly update the customer display if the container exists
        const customersContainer = document.getElementById('customersContainer');
        if (customersContainer) {
            console.log('Found customersContainer, attempting direct refresh');
            // Trigger a manual refresh after a short delay
            setTimeout(() => {
                if (typeof loadCustomers === 'function') {
                    loadCustomers();
                    console.log('Manual refresh triggered');
                }
            }, 100);
        } else {
            console.log('customersContainer not found');
        }
        
        // Show success message
        showToast(`Customer "${customerName}" automatically added to Customer Management section!`);

        return newCustomer;
    } catch (error) {
        console.error('Error auto-creating customer:', error);
        // Don't fail the booking if customer creation fails
        return null;
    }
}

// Reset booking form
function resetBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.reset();
    }
    
    const distanceBox = document.getElementById('distanceBox');
    if (distanceBox) {
        distanceBox.textContent = '0.0 km';
    }
    
    const customOriginContainer = document.getElementById('customOriginContainer');
    if (customOriginContainer) {
        customOriginContainer.classList.add('d-none');
    }

    // Remove all additional DR number items except the first one
    const drNumberItems = document.querySelectorAll('#drNumbersContainer .dr-number-item');
    if (drNumberItems.length > 1) {
        for (let i = 1; i < drNumberItems.length; i++) {
            drNumberItems[i].remove();
        }
    }

    // Reset the first DR number item
    const firstDrNumberItem = document.querySelector('#drNumbersContainer .dr-number-item');
    if (firstDrNumberItem) {
        const drNumberInput = firstDrNumberItem.querySelector('.dr-number-input');
        if (drNumberInput) {
            drNumberInput.value = '';
        }
    }

    // Remove all additional cost items except the first one
    const costItems = document.querySelectorAll('#costItemsContainer .cost-item');
    if (costItems.length > 1) {
        for (let i = 1; i < costItems.length; i++) {
            costItems[i].remove();
        }
    }

    // Reset the first cost item
    const firstCostItem = document.querySelector('#costItemsContainer .cost-item');
    if (firstCostItem) {
        const descriptionInput = firstCostItem.querySelector('input[placeholder="Description (e.g., Fuel Surcharge)"]');
        if (descriptionInput) {
            descriptionInput.value = '';
        }
        
        const amountInput = firstCostItem.querySelector('input[placeholder="Amount"]');
        if (amountInput) {
            amountInput.value = '';
        }
        
        const removeCostBtn = firstCostItem.querySelector('.remove-cost');
        if (removeCostBtn) {
            removeCostBtn.disabled = true;
        }
    }
    
    // Ensure any modal backdrops are removed
    const modalBackdrops = document.querySelectorAll('.modal-backdrop');
    modalBackdrops.forEach(backdrop => {
        backdrop.remove();
    });
    
    // Remove modal-open class from body if it exists
    if (document.body.classList.contains('modal-open')) {
        document.body.classList.remove('modal-open');
    }
    
    // Re-enable body scrolling
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
}

// Ensure warehouse manager is ready
function ensureWarehouseManagerReady() {
    console.log('=== ENSURING WAREHOUSE MANAGER READY ===');
    
    // Make sure warehouse manager is globally accessible
    if (typeof window.warehouseManager === 'undefined' || window.warehouseManager === null) {
        console.log('Initializing warehouse manager...');
        // Check if WarehouseMapManager class is available
        if (typeof window.WarehouseMapManager !== 'undefined') {
            window.warehouseManager = new window.WarehouseMapManager();
            console.log('Warehouse manager initialized');
        } else {
            console.error('WarehouseMapManager class not available');
        }
    } else {
        console.log('Warehouse manager already initialized');
    }
    
    console.log('Warehouse manager ready check completed');
}

// Update distance calculation
function updateDistance() {
    const originSelect = document.getElementById('originSelect');
    const customOrigin = document.getElementById('customOrigin');
    const destinationInputs = document.querySelectorAll('.destination-area-input');
    const distanceBox = document.getElementById('calculatedDistance');
    const distanceValue = document.getElementById('distanceValue');
    
    // Get origin coordinates display element
    const originCoordinatesDisplay = document.getElementById('originCoordinatesDisplay');
    const destinationCoordinatesDisplay = document.getElementById('destinationCoordinatesDisplay');

    // Get origin
    let origin = '';
    let originLat = null;
    let originLng = null;
    
    if (originSelect.value && originSelect.value !== '') {
        origin = originSelect.options[originSelect.selectedIndex].text;
        // Get warehouse coordinates
        if (window.warehouseManager && window.warehouseManager.warehouseLocations) {
            const warehouse = window.warehouseManager.warehouseLocations.find(w => w.id === originSelect.value);
            if (warehouse) {
                originLat = warehouse.coordinates.lat;
                originLng = warehouse.coordinates.lng;
            }
        }
    } else if (customOrigin.value) {
        origin = customOrigin.value;
        // Check if custom origin has coordinates stored
        if (customOrigin.hasAttribute('data-lat') && customOrigin.hasAttribute('data-lng')) {
            originLat = parseFloat(customOrigin.getAttribute('data-lat'));
            originLng = parseFloat(customOrigin.getAttribute('data-lng'));
        }
    }

    // Display origin coordinates
    if (originLat && originLng) {
        if (originCoordinatesDisplay) {
            originCoordinatesDisplay.textContent = `(${originLat.toFixed(6)}, ${originLng.toFixed(6)})`;
        }
    } else {
        if (originCoordinatesDisplay) {
            originCoordinatesDisplay.textContent = '';
        }
    }

    if ((!origin || destinationInputs.length === 0) && !originLat) {
        distanceValue.textContent = '-- km';
        if (destinationCoordinatesDisplay) {
            destinationCoordinatesDisplay.innerHTML = '';
        }
        return;
    }

    // Get destinations
    let totalDistance = 0;
    let hasDestination = false;
    
    // Process each destination and display coordinates
    let destinationCoordinatesHtml = '';
    
    destinationInputs.forEach((input, index) => {
        if (input.value.trim()) {
            hasDestination = true;
            
            // Check if destination has coordinates
            if (input.hasAttribute('data-lat') && input.hasAttribute('data-lng')) {
                const destLat = parseFloat(input.getAttribute('data-lat'));
                const destLng = parseFloat(input.getAttribute('data-lng'));
                
                // Display destination coordinates
                destinationCoordinatesHtml += `<div class="destination-coordinate-item">
                    <small class="text-muted">Destination ${index + 1}:</small>
                    <span class="fw-bold">(${destLat.toFixed(6)}, ${destLng.toFixed(6)})</span>
                </div>`;
                
                // Calculate real distance if we have both origin and destination coordinates
                if (originLat && originLng && destLat && destLng) {
                    const distance = calculateRealDistance(originLat, originLng, destLat, destLng);
                    totalDistance += distance;
                } else {
                    // Fallback to mock calculation
                    let distance = 0;
                    if (origin.includes('Alabang')) {
                        if (input.value.includes('Makati')) distance = 12.5;
                        else if (input.value.includes('Laguna')) distance = 24.7;
                        else distance = 18.3;
                    } else if (origin.includes('Cebu')) {
                        if (input.value.includes('Cebu')) distance = 8.2;
                        else distance = 14.8;
                    } else if (origin.includes('Davao')) {
                        if (input.value.includes('Davao')) distance = 5.3;
                        else distance = 10.6;
                    } else {
                        distance = Math.floor(Math.random() * 50);
                    }
                    totalDistance += distance;
                }
            } else {
                // Display destination without coordinates
                destinationCoordinatesHtml += `<div class="destination-coordinate-item">
                    <small class="text-muted">Destination ${index + 1}:</small>
                    <span class="fw-bold">Coordinates not available</span>
                </div>`;
                
                // Fallback to mock calculation
                let distance = 0;
                if (origin.includes('Alabang')) {
                    if (input.value.includes('Makati')) distance = 12.5;
                    else if (input.value.includes('Laguna')) distance = 24.7;
                    else distance = 18.3;
                } else if (origin.includes('Cebu')) {
                    if (input.value.includes('Cebu')) distance = 8.2;
                    else distance = 14.8;
                } else if (origin.includes('Davao')) {
                    if (input.value.includes('Davao')) distance = 5.3;
                    else distance = 10.6;
                } else {
                    distance = Math.floor(Math.random() * 50);
                }
                totalDistance += distance;
            }
        }
    });

    // Display destination coordinates
    if (destinationCoordinatesDisplay) {
        destinationCoordinatesDisplay.innerHTML = destinationCoordinatesHtml;
    }

    if (hasDestination) {
        distanceValue.textContent = `${totalDistance.toFixed(1)} km`;
    } else {
        distanceValue.textContent = '-- km';
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

// Show map pin dialog for selecting locations
function showMapPinDialog(type, index = 0) {
    console.log(`showMapPinDialog called with type: ${type}, index: ${index}`);
    
    // Create or update the map modal
    let mapModal = document.getElementById('mapModal');
    if (!mapModal) {
        mapModal = document.createElement('div');
        mapModal.id = 'mapModal';
        mapModal.className = 'modal fade';
        mapModal.tabIndex = -1;
        mapModal.setAttribute('aria-hidden', 'true');
        mapModal.innerHTML = `
            <div class="modal-dialog modal-xl modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-geo-alt me-2"></i>
                            <span id="mapModalTitle">Select Location on Map</span>
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label class="form-label">Search Location</label>
                                    <div class="input-group">
                                        <span class="input-group-text">
                                            <i class="bi bi-geo-alt"></i>
                                        </span>
                                        <input type="text" class="form-control" id="mapSearchInput" placeholder="Search for a place...">
                                        <button class="btn btn-outline-secondary" type="button" id="mapSearchBtn">
                                            <i class="bi bi-search"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Selected Coordinates</label>
                                    <div class="coordinates-display p-2 bg-light rounded">
                                        <div class="coordinate-item">
                                            <small class="text-muted">Latitude:</small>
                                            <span id="selectedLat" class="fw-bold">--</span>
                                        </div>
                                        <div class="coordinate-item">
                                            <small class="text-muted">Longitude:</small>
                                            <span id="selectedLng" class="fw-bold">--</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="d-grid gap-2">
                                    <button class="btn btn-primary" id="confirmLocationBtn" disabled>
                                        <i class="bi bi-check-circle me-2"></i>Confirm Location
                                    </button>
                                    <button class="btn btn-outline-secondary" id="useCurrentLocationBtn">
                                        <i class="bi bi-geo-alt me-2"></i>Use Current Location
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-8">
                                <div id="mapContainer" style="height: 400px; border-radius: 8px; overflow: hidden; border: 1px solid #ddd;">
                                    <div class="d-flex justify-content-center align-items-center h-100">
                                        <div class="text-center">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">Loading map...</span>
                                            </div>
                                            <p class="mt-2">Loading map...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(mapModal);
    }

    // Set modal title based on type
    const modalTitle = document.getElementById('mapModalTitle');
    if (modalTitle) {
        modalTitle.textContent = type === 'origin' ? 'Select Origin Location' : `Select Destination Location #${index + 1}`;
    }

    // Show the modal
    const modal = new bootstrap.Modal(mapModal);
    modal.show();

    // Remove any existing shown.bs.modal event listeners to prevent duplicates
    // We use a flag to ensure initializeMapModal is only called once per modal show
    if (mapModal._isInitializing) {
        console.log('Map modal is already initializing, skipping duplicate initialization');
        return;
    }
    mapModal._isInitializing = true;

    // Initialize map after modal is shown
    mapModal.addEventListener('shown.bs.modal', function() {
        initializeMapModal(type, index);
    }, {once: true});

    // Clean up map when modal is hidden
    mapModal.addEventListener('hidden.bs.modal', function() {
        // Reset initialization flag
        mapModal._isInitializing = false;
        
        // Remove the map instance if it exists
        if (currentMapInstance) {
            currentMapInstance.remove();
            currentMapInstance = null;
        }
        // Remove the map modal from DOM to prevent initialization conflicts
        if (mapModal.parentNode) {
            mapModal.parentNode.removeChild(mapModal);
        }
    }, {once: true});
}

// Global variable to store the map instance
let currentMapInstance = null;
// Global variables to store the selected marker and coordinates
let selectedMarker = null;
let selectedCoordinates = { lat: null, lng: null };

// Initialize the map in the modal
function initializeMapModal(type, index) {
    console.log(`Initializing map modal for ${type}, index: ${index}`);
    
    // Get map container
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    // Clear loading indicator
    mapContainer.innerHTML = '';

    // Initialize Leaflet map centered on Luzon (focus on major cities in Luzon)
    // Default view centered on Metro Manila area
    currentMapInstance = L.map('mapContainer').setView([14.6091, 121.0223], 10);
    
    // Set bounds to restrict view to Luzon area
    const luzonBounds = L.latLngBounds(
        L.latLng(13.0, 119.0), // Southwest corner
        L.latLng(18.0, 122.0)  // Northeast corner
    );
    
    // Restrict map view to Luzon bounds
    currentMapInstance.setMaxBounds(luzonBounds);
    currentMapInstance.on('drag', function() {
        currentMapInstance.panInsideBounds(luzonBounds, { animate: false });
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(currentMapInstance);

    // Initialize selected marker and coordinates
    selectedMarker = null;
    selectedCoordinates = { lat: null, lng: null };

    // Add click event to the map
    currentMapInstance.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Update selected coordinates display
        document.getElementById('selectedLat').textContent = lat.toFixed(6);
        document.getElementById('selectedLng').textContent = lng.toFixed(6);
        
        // Remove existing marker if any
        if (selectedMarker) {
            currentMapInstance.removeLayer(selectedMarker);
        }
        
        // Add new marker with pin icon
        const pinIcon = L.divIcon({
            className: 'custom-pin-icon',
            html: '<i class="bi bi-geo-alt-fill" style="color: #d63384; font-size: 24px; transform: translate(-50%, -100%);"></i>',
            iconSize: [24, 24],
            iconAnchor: [12, 24]
        });
        
        selectedMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(currentMapInstance);
        
        // Update coordinates
        selectedCoordinates = { lat, lng };
        
        // Enable confirm button
        document.getElementById('confirmLocationBtn').disabled = false;
    });

    // Set up enhanced search functionality
    setupMapSearch();

    // Set up current location button
    const useCurrentLocationBtn = document.getElementById('useCurrentLocationBtn');
    if (useCurrentLocationBtn) {
        useCurrentLocationBtn.addEventListener('click', function() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        
                        // Center map on current location
                        currentMapInstance.setView([lat, lng], 15);
                        
                        // Update selected coordinates display
                        document.getElementById('selectedLat').textContent = lat.toFixed(6);
                        document.getElementById('selectedLng').textContent = lng.toFixed(6);
                        
                        // Remove existing marker if any
                        if (selectedMarker) {
                            currentMapInstance.removeLayer(selectedMarker);
                        }
                        
                        // Add new marker with pin icon
                        const pinIcon = L.divIcon({
                            className: 'custom-pin-icon',
                            html: '<i class="bi bi-geo-alt-fill" style="color: #d63384; font-size: 24px; transform: translate(-50%, -100%);"></i>',
                            iconSize: [24, 24],
                            iconAnchor: [12, 24]
                        });
                        
                        selectedMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(currentMapInstance);
                        
                        // Update coordinates
                        selectedCoordinates = { lat, lng };
                        
                        // Enable confirm button
                        document.getElementById('confirmLocationBtn').disabled = false;
                        
                        // Update search input
                        document.getElementById('mapSearchInput').value = 'Current Location';
                    },
                    function(error) {
                        console.error('Error getting current location:', error);
                        alert('Unable to get current location. Please try clicking on the map instead.');
                    }
                );
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        });
    }

    // Set up confirm button
    const confirmBtn = document.getElementById('confirmLocationBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (selectedCoordinates.lat && selectedCoordinates.lng) {
                // Get location details
                const locationAddress = document.getElementById('mapSearchInput').value || 
                    `${selectedCoordinates.lat.toFixed(6)}, ${selectedCoordinates.lng.toFixed(6)}`;
                
                // Update the appropriate input field
                if (type === 'origin') {
                    const customOrigin = document.getElementById('customOrigin');
                    if (customOrigin) {
                        customOrigin.value = locationAddress;
                        customOrigin.setAttribute('data-lat', selectedCoordinates.lat);
                        customOrigin.setAttribute('data-lng', selectedCoordinates.lng);
                        
                        // Show custom origin container
                        const customOriginContainer = document.getElementById('customOriginContainer');
                        if (customOriginContainer) {
                            customOriginContainer.classList.remove('d-none');
                        }
                        
                        // Reset origin select
                        const originSelect = document.getElementById('originSelect');
                        if (originSelect) {
                            originSelect.value = '';
                        }
                        
                        // Update coordinates display
                        const originCoordinatesDisplay = document.getElementById('originCoordinatesDisplay');
                        if (originCoordinatesDisplay) {
                            originCoordinatesDisplay.textContent = `(${selectedCoordinates.lat.toFixed(6)}, ${selectedCoordinates.lng.toFixed(6)})`;
                        }
                    }
                } else {
                    // For destination, update the specific area input
                    const destinationInputs = document.querySelectorAll('.destination-area-input');
                    if (destinationInputs[index]) {
                        destinationInputs[index].value = locationAddress;
                        destinationInputs[index].setAttribute('data-lat', selectedCoordinates.lat);
                        destinationInputs[index].setAttribute('data-lng', selectedCoordinates.lng);
                    }
                }
                
                // Update distance calculation
                updateDistance();
                
                // Close the modal
                const mapModal = document.getElementById('mapModal');
                if (mapModal) {
                    const modal = bootstrap.Modal.getInstance(mapModal);
                    if (modal) {
                        modal.hide();
                    }
                }
            } else {
                alert('Please select a location on the map or search for a location first.');
            }
        });
    }
}

// Real address search function using OpenStreetMap Nominatim API
function searchAddress(query) {
    return new Promise((resolve, reject) => {
        // Encode the query for URL
        const encodedQuery = encodeURIComponent(query);
        
        // Nominatim API endpoint with focus on Philippines (Luzon specifically)
        // We'll use viewbox to focus on Luzon area (approximately)
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&countrycodes=PH&viewbox=119.0,13.0,122.0,18.0&bounded=1&limit=10`;
        
        // Make the API request
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Process the results
                const results = data.map(item => ({
                    lat: item.lat,
                    lng: item.lon,
                    display_name: item.display_name,
                    type: item.type,
                    class: item.class
                }));
                
                resolve(results);
            })
            .catch(error => {
                console.error('Error searching address:', error);
                reject(error);
            });
    });
}

// Enhanced search with autocomplete functionality
function setupMapSearch() {
    const searchInput = document.getElementById('mapSearchInput');
    const searchBtn = document.getElementById('mapSearchBtn');
    
    if (!searchInput || !searchBtn) return;
    
    // Create search results dropdown if it doesn't exist
    let searchResultsDropdown = document.getElementById('searchResultsDropdown');
    if (!searchResultsDropdown) {
        const dropdown = document.createElement('div');
        dropdown.id = 'searchResultsDropdown';
        dropdown.className = 'dropdown-menu';
        dropdown.style.cssText = 'position: absolute; z-index: 1000; max-height: 200px; overflow-y: auto; width: 100%; display: none;';
        if (searchInput.parentNode) {
            searchInput.parentNode.appendChild(dropdown);
            searchResultsDropdown = dropdown;
        }
    }
    
    let searchTimeout;
    
    // Handle search input with debouncing
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = searchInput.value.trim();
        
        // Hide dropdown if query is too short
        if (query.length < 3) {
            const dropdown = document.getElementById('searchResultsDropdown');
            if (dropdown) {
                dropdown.style.display = 'none';
            }
            return;
        }
        
        searchTimeout = setTimeout(() => {
            // Show loading indicator
            const dropdown = document.getElementById('searchResultsDropdown');
            if (dropdown) {
                dropdown.innerHTML = '<div class="dropdown-item disabled">Searching...</div>';
                dropdown.style.display = 'block';
            }
            
            searchAddress(query)
                .then(results => {
                    const dropdown = document.getElementById('searchResultsDropdown');
                    if (!dropdown) return;
                    
                    if (results.length > 0) {
                        // Clear previous results
                        dropdown.innerHTML = '';
                        
                        // Add results to dropdown with pin icons
                        results.forEach((result, index) => {
                            const item = document.createElement('a');
                            item.className = 'dropdown-item';
                            item.href = '#';
                            item.innerHTML = `<i class="bi bi-geo-alt me-2"></i>${result.display_name}`;
                            item.addEventListener('click', function(e) {
                                e.preventDefault();
                                selectSearchResult(result);
                            });
                            dropdown.appendChild(item);
                        });
                        
                        // Show dropdown
                        dropdown.style.display = 'block';
                    } else {
                        dropdown.innerHTML = '<div class="dropdown-item disabled">No results found</div>';
                        setTimeout(() => {
                            dropdown.style.display = 'none';
                        }, 3000);
                    }
                })
                .catch(error => {
                    console.error('Search error:', error);
                    const dropdown = document.getElementById('searchResultsDropdown');
                    if (dropdown) {
                        dropdown.innerHTML = '<div class="dropdown-item disabled text-danger">Error searching. Please try again.</div>';
                        setTimeout(() => {
                            dropdown.style.display = 'none';
                        }, 3000);
                    }
                });
        }, 300); // 300ms debounce
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
        // Ensure searchInput and searchResultsDropdown exist before checking contains
        const searchResultsDropdown = document.getElementById('searchResultsDropdown');
        if (searchInput && searchResultsDropdown && 
            !searchInput.contains(e.target) && 
            !searchResultsDropdown.contains(e.target)) {
            searchResultsDropdown.style.display = 'none';
        }
    });
    
    // Handle search button click
    searchBtn.addEventListener('click', function() {
        const query = searchInput.value.trim();
        if (query) {
            // Show loading indicator
            const originalBtnText = searchBtn.innerHTML;
            searchBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
            searchBtn.disabled = true;
            
            searchAddress(query)
                .then(results => {
                    if (results.length > 0) {
                        // Select the first result
                        selectSearchResult(results[0]);
                    } else {
                        alert('No results found for "' + query + '". Please try a different search term.');
                    }
                })
                .catch(error => {
                    console.error('Search error:', error);
                    alert('Error searching for address. Please try again.');
                })
                .finally(() => {
                    // Restore button state
                    searchBtn.innerHTML = originalBtnText;
                    searchBtn.disabled = false;
                });
        } else {
            alert('Please enter a location to search for.');
        }
    });
    
    // Allow Enter key to trigger search
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
}

// Function to handle selecting a search result
function selectSearchResult(result) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lng);
    
    // Center map on the result
    if (currentMapInstance) {
        currentMapInstance.setView([lat, lng], 15);
        
        // Update selected coordinates display
        document.getElementById('selectedLat').textContent = lat.toFixed(6);
        document.getElementById('selectedLng').textContent = lng.toFixed(6);
        
        // Remove existing marker if any
        if (selectedMarker) {
            currentMapInstance.removeLayer(selectedMarker);
        }
        
        // Add new marker with pin icon
        const pinIcon = L.divIcon({
            className: 'custom-pin-icon',
            html: '<i class="bi bi-geo-alt-fill" style="color: #d63384; font-size: 24px; transform: translate(-50%, -100%);"></i>',
            iconSize: [24, 24],
            iconAnchor: [12, 24]
        });
        
        selectedMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(currentMapInstance);
        
        // Update coordinates
        selectedCoordinates = { lat, lng };
        
        // Enable confirm button
        document.getElementById('confirmLocationBtn').disabled = false;
        
        // Hide dropdown
        document.getElementById('searchResultsDropdown').style.display = 'none';
        
        // Update search input
        document.getElementById('mapSearchInput').value = result.display_name;
    }
}

// Backward compatibility function
function mockAddressSearch(query) {
    return searchAddress(query);
}
