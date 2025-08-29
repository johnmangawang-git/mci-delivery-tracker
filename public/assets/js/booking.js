// Booking modal functionality
function initBookingModal() {
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    const bookingForm = document.getElementById('bookingForm');

    // Origin selection toggle
    const originSelect = document.getElementById('originSelect');
    const customOriginContainer = document.getElementById('customOriginContainer');

    originSelect.addEventListener('change', function () {
        if (this.value === '') {
            customOriginContainer.classList.remove('d-none');
        } else {
            customOriginContainer.classList.add('d-none');
        }
    });

    // Map pin buttons
    document.getElementById('pinOrigin').addEventListener('click', function () {
        customOriginContainer.classList.remove('d-none');
        originSelect.value = '';
    });

    // Add cost item functionality
    const addCostBtn = document.getElementById('addCostBtn');
    const costItemsContainer = document.getElementById('costItemsContainer');

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
        costItem.querySelector('.remove-cost').addEventListener('click', function () {
            costItem.remove();
        });
    });

    // Remove cost buttons
    document.querySelectorAll('.remove-cost').forEach(button => {
        button.addEventListener('click', function () {
            const costItem = this.closest('.cost-item');
            costItem.remove();
        });
    });

    // Confirm booking button
    document.getElementById('confirmBookingBtn').addEventListener('click', function () {
        saveBooking();
    });

    // Cancel booking button
    document.getElementById('cancelBookingBtn').addEventListener('click', function () {
        resetBookingForm();
    });

    // Calculate distance when origin or destination changes
    document.getElementById('originSelect').addEventListener('change', calculateDistance);
    document.getElementById('customOrigin').addEventListener('change', calculateDistance);
    document.getElementById('destination').addEventListener('change', calculateDistance);
}

// Calculate distance between origin and destination
function calculateDistance() {
    const originSelect = document.getElementById('originSelect');
    const customOrigin = document.getElementById('customOrigin');
    const destination = document.getElementById('destination');
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
        const originSelect = document.getElementById('originSelect');
        const customOrigin = document.getElementById('customOrigin');
        const destination = document.getElementById('destination').value;
        const distanceBox = document.getElementById('distanceBox');

        // Validate form
        if (!drNumber) {
            showError('DR Number is required');
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

        // In a real implementation, this would save to Supabase
        console.log('Saving booking:', {
            dr_number: drNumber,
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