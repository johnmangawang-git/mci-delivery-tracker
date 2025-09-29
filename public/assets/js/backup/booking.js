// Booking modal functionality
function initBookingModal() {
    // Ensure customer management is available
    ensureCustomerManagementReady();
    
    const bookingModalElement = document.getElementById('bookingModal');
    if (!bookingModalElement) {
        console.error('Booking modal element not found');
        return;
    }
    
    const bookingModal = new bootstrap.Modal(bookingModalElement);
    const bookingForm = document.getElementById('bookingForm');
    // Note: bookingForm is not used in the current implementation, so we can skip the null check

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
                removeCostBtn.addEventListener('click', function () {
                    costItem.remove();
                });
            }
        });
    }

    // Remove cost buttons
    document.querySelectorAll('.remove-cost').forEach(button => {
        button.addEventListener('click', function () {
            const costItem = this.closest('.cost-item');
            if (costItem) {
                costItem.remove();
            }
        });
    });

    // Confirm booking button
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    if (confirmBookingBtn) {
        confirmBookingBtn.addEventListener('click', function () {
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

// Calculate distance between origin and destination
function calculateDistance() {
    const originSelect = document.getElementById('originSelect');
    const customOrigin = document.getElementById('customOrigin');
    const destination = document.getElementById('destination').value;
    const distanceBox = document.getElementById('distanceBox');

    // In a real implementation, this would use Google Maps API to calculate distance
    // For demo purposes, we'll use mock data

    if (!destination.value) {
        distanceBox.textContent = '0.0 km';
        return;
    }

    let origin = '';
    if (originSelect.value && originSelect.value !== '') {
        origin = originSelect.options[originSelect.selectedIndex].text;
    } else if (customOrigin.value) {
        origin = customOrigin.value;
    }

    if (!origin) {
        distanceBox.textContent = '0.0 km';
        return;
    }

    // Mock distance calculation
    let distance = 0;
    if (origin.includes('Alabang')) {
        if (destination.value.includes('Makati')) distance = 12.5;
        else if (destination.value.includes('Laguna')) distance = 24.7;
        else distance = 18.3;
    } else if (origin.includes('Cebu')) {
        if (destination.value.includes('Cebu')) distance = 8.2;
        else distance = 14.8;
    } else if (origin.includes('Davao')) {
        if (destination.value.includes('Davao')) distance = 5.3;
        else distance = 10.6;
    } else {
        distance = Math.floor(Math.random() * 50);
    }

    distanceBox.textContent = `${distance.toFixed(1)} km`;
}

// Save booking to Supabase
async function saveBooking() {
    try {
        const drNumber = document.getElementById('drNumber').value;
        const customerName = document.getElementById('customerName').value;
        const customerNumber = document.getElementById('customerNumber').value;
        const originSelect = document.getElementById('originSelect');
        const customOrigin = document.getElementById('customOrigin');
        const destination = document.getElementById('destination').value;
        const distanceBox = document.getElementById('distanceBox');

        // Validate form
        if (!drNumber) {
            showError('DR Number is required');
            return;
        }

        if (!customerName) {
            showError('Customer Name is required');
            return;
        }

        if (!customerNumber) {
            showError('Customer Number is required');
            return;
        }

        if (!destination) {
            showError('Destination is required');
            return;
        }

        // Get origin
        let origin = '';
        if (originSelect.value && originSelect.value !== '') {
            origin = originSelect.options[originSelect.selectedIndex].text;
        } else if (customOrigin.value) {
            origin = customOrigin.value;
        }

        if (!origin) {
            showError('Origin is required');
            return;
        }

        // Get distance
        const distance = parseFloat(distanceBox.textContent.replace(' km', ''));

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

        // Auto-create customer if not exists
        console.log('=== SAVE BOOKING DEBUG ===');
        console.log('About to call autoCreateCustomer with:', {
            customerName,
            customerNumber,
            destination
        });
        
        await autoCreateCustomer(customerName, customerNumber, destination);
        
        console.log('autoCreateCustomer completed');

        // In a real implementation, this would save to Supabase
        console.log('Saving booking:', {
            dr_number: drNumber,
            customer_name: customerName,
            customer_number: customerNumber,
            origin,
            destination,
            distance,
            additional_costs: additionalCosts
        });

        // Mock success
        showToast('Booking confirmed successfully!');

        // Reset form and close modal
        resetBookingForm();
        const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
        bookingModal.hide();

        // Refresh calendar data
        loadBookingsData().then(() => {
            updateCalendar();
        });
    } catch (error) {
        console.error('Error saving booking:', error);
        showError('Failed to save booking');
    }
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
    document.getElementById('bookingForm').reset();
    document.getElementById('distanceBox').textContent = '0.0 km';
    document.getElementById('customOriginContainer').classList.add('d-none');

    // Remove all additional cost items except the first one
    const costItems = document.querySelectorAll('#costItemsContainer .cost-item');
    if (costItems.length > 1) {
        for (let i = 1; i < costItems.length; i++) {
            costItems[i].remove();
        }
    }

    // Reset the first cost item
    const firstCostItem = document.querySelector('#costItemsContainer .cost-item');
    firstCostItem.querySelector('input[placeholder="Description (e.g., Fuel Surcharge)"]').value = '';
    firstCostItem.querySelector('input[placeholder="Amount"]').value = '';
    firstCostItem.querySelector('.remove-cost').disabled = true;
}





















// Update distance calculation
function updateDistance() {
    const originSelect = document.getElementById('originSelect');
    const customOrigin = document.getElementById('customOrigin');
    const destinationInputs = document.querySelectorAll('.destination-area-input');
    const distanceBox = document.getElementById('calculatedDistance');
    const distanceValue = document.getElementById('distanceValue');

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

    if ((!origin || destinationInputs.length === 0) && !originLat) {
        distanceValue.textContent = '-- km';
        return;
    }

    // Get destinations
    let totalDistance = 0;
    let hasDestination = false;
    
    // Process each destination
    destinationInputs.forEach(input => {
        if (input.value.trim()) {
            hasDestination = true;
            
            // Check if destination has coordinates
            if (input.hasAttribute('data-lat') && input.hasAttribute('data-lng')) {
                const destLat = parseFloat(input.getAttribute('data-lat'));
                const destLng = parseFloat(input.getAttribute('data-lng'));
                
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
                                <div class="mb-3">
                                    <label class="form-label">Location Name</label>
                                    <input type="text" class="form-control" id="locationNameInput" placeholder="Enter location name">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Address</label>
                                    <textarea class="form-control" id="locationAddressInput" rows="2" placeholder="Enter address"></textarea>
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

    // Initialize map after modal is shown
    mapModal.addEventListener('shown.bs.modal', function() {
        initializeMapModal(type, index);
    }, {once: true});
}

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

    // Initialize Leaflet map centered on Philippines
    const map = L.map('mapContainer').setView([12.8797, 121.7740], 6);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Add a marker for the selected location (initially null)
    let selectedMarker = null;
    let selectedCoordinates = { lat: null, lng: null };

    // Add click event to the map
    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Update selected coordinates display
        document.getElementById('selectedLat').textContent = lat.toFixed(6);
        document.getElementById('selectedLng').textContent = lng.toFixed(6);
        
        // Remove existing marker if any
        if (selectedMarker) {
            map.removeLayer(selectedMarker);
        }
        
        // Add new marker
        selectedMarker = L.marker([lat, lng]).addTo(map);
        
        // Update coordinates
        selectedCoordinates = { lat, lng };
        
        // Enable confirm button
        document.getElementById('confirmLocationBtn').disabled = false;
    });

    // Set up search functionality
    const searchInput = document.getElementById('mapSearchInput');
    const searchBtn = document.getElementById('mapSearchBtn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                mockAddressSearch(query).then(results => {
                    if (results.length > 0) {
                        const result = results[0];
                        const lat = parseFloat(result.lat);
                        const lng = parseFloat(result.lng);
                        
                        // Center map on the result
                        map.setView([lat, lng], 15);
                        
                        // Update selected coordinates display
                        document.getElementById('selectedLat').textContent = lat.toFixed(6);
                        document.getElementById('selectedLng').textContent = lng.toFixed(6);
                        
                        // Remove existing marker if any
                        if (selectedMarker) {
                            map.removeLayer(selectedMarker);
                        }
                        
                        // Add new marker
                        selectedMarker = L.marker([lat, lng]).addTo(map);
                        
                        // Update coordinates
                        selectedCoordinates = { lat, lng };
                        
                        // Enable confirm button
                        document.getElementById('confirmLocationBtn').disabled = false;
                        
                        // Pre-fill location name and address if available
                        if (result.display_name) {
                            document.getElementById('locationNameInput').value = result.display_name.split(',')[0];
                        }
                        document.getElementById('locationAddressInput').value = result.display_name || '';
                    }
                });
            }
        });
        
        // Allow Enter key to trigger search
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }

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
                        map.setView([lat, lng], 15);
                        
                        // Update selected coordinates display
                        document.getElementById('selectedLat').textContent = lat.toFixed(6);
                        document.getElementById('selectedLng').textContent = lng.toFixed(6);
                        
                        // Remove existing marker if any
                        if (selectedMarker) {
                            map.removeLayer(selectedMarker);
                        }
                        
                        // Add new marker
                        selectedMarker = L.marker([lat, lng]).addTo(map);
                        
                        // Update coordinates
                        selectedCoordinates = { lat, lng };
                        
                        // Enable confirm button
                        document.getElementById('confirmLocationBtn').disabled = false;
                        
                        // Pre-fill location name
                        document.getElementById('locationNameInput').value = 'Current Location';
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
                const locationName = document.getElementById('locationNameInput').value || 'Selected Location';
                const locationAddress = document.getElementById('locationAddressInput').value || 
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
            }
        });
    }
}

// Mock address search function (in a real implementation, this would use a geocoding service)
function mockAddressSearch(query) {
    return new Promise((resolve) => {
        // Simulate API delay
        setTimeout(() => {
            // Mock results based on query
            const mockResults = [
                {
                    lat: '14.5995',
                    lng: '120.9842',
                    display_name: 'Manila, Metro Manila, Philippines'
                },
                {
                    lat: '14.5547',
                    lng: '121.0244',
                    display_name: 'Makati, Metro Manila, Philippines'
                },
                {
                    lat: '14.4441',
                    lng: '121.0467',
                    display_name: 'Alabang, Muntinlupa, Metro Manila, Philippines'
                },
                {
                    lat: '10.3157',
                    lng: '123.8854',
                    display_name: 'Cebu City, Cebu, Philippines'
                },
                {
                    lat: '12.8797',
                    lng: '121.7740',
                    display_name: 'Philippines'
                }
            ];
            
            // Filter results based on query
            const filteredResults = mockResults.filter(result => 
                result.display_name.toLowerCase().includes(query.toLowerCase())
            );
            
            resolve(filteredResults);
        }, 500);
    });
}
