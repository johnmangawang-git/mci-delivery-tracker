// 7. Other Module Logic
    function initAnalytics() {}
    function initCustomers() {}
    function initActiveDeliveries() {
        // Load active deliveries data
        loadActiveDeliveries();
    }
    function initDeliveryHistory() {}
    function initEpod() {}
    function initWarehouseMap() {}
    function initSettings() {}

    // Load active deliveries from localStorage
    function loadActiveDeliveries() {
        console.log('Loading active deliveries...');
        
        // Get bookings from localStorage
        let bookings = JSON.parse(localStorage.getItem('mci-bookings') || '[]');
        
        // Filter for active deliveries (not completed)
        const activeBookings = bookings.filter(booking => 
            booking.status !== 'Completed' && booking.status !== 'Signed'
        );
        
        // Update the UI with active deliveries
        const tableBody = document.getElementById('activeDeliveriesTableBody');
        if (tableBody) {
            if (activeBookings.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="10" class="text-center py-4">
                            <i class="bi bi-inbox" style="font-size: 2rem; opacity: 0.3;"></i>
                            <h4 class="mt-2">No Active Deliveries</h4>
                            <p class="text-muted mb-0">Bookings will appear here once confirmed</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Generate table rows
            tableBody.innerHTML = activeBookings.map(booking => {
                // Format destinations
                const destinations = booking.destinations.join(', ');
                
                // Format distance
                const distance = booking.distance ? `${booking.distance.toFixed(2)} km` : '-- km';
                
                // Format additional costs
                const additionalCosts = booking.totalAdditionalCosts ? 
                    `₱${booking.totalAdditionalCosts.toFixed(2)}` : '₱0.00';
                
                return `
                    <tr>
                        <td><input type="checkbox" class="form-check-input select-delivery" data-dr="${booking.drNumber}"></td>
                        <td><strong>${booking.drNumber}</strong></td>
                        <td>${booking.customerName}</td>
                        <td>${booking.customerNumber}</td>
                        <td>${booking.origin}</td>
                        <td>${destinations}</td>
                        <td>${distance}</td>
                        <td>${booking.truckPlateNumber}</td>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge bg-success" style="min-width: 90px;">
                                    <i class="bi bi-check-circle me-1"></i>
                                    ${booking.status}
                                </span>
                                <select class="form-select form-select-sm status-selector" style="min-width: 120px; max-width: 140px;" data-dr="${booking.drNumber}">
                                    <option value="On Schedule" ${booking.status === 'On Schedule' ? 'selected' : ''}>📅 On Schedule</option>
                                    <option value="In Transit" ${booking.status === 'In Transit' ? 'selected' : ''}>🚛 In Transit</option>
                                    <option value="Delayed" ${booking.status === 'Delayed' ? 'selected' : ''}>⚠️ Delayed</option>
                                    <option value="Completed" ${booking.status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
                                </select>
                            </div>
                        </td>
                        <td>${new Date(booking.deliveryDate).toLocaleDateString()}</td>
                    </tr>
                `;
            }).join('');
            
            // Add event listeners for status selectors
            document.querySelectorAll('.status-selector').forEach(select => {
                select.addEventListener('change', function() {
                    const drNumber = this.dataset.dr;
                    const newStatus = this.value;
                    updateBookingStatus(drNumber, newStatus);
                });
            });
            
            // Add event listeners for checkboxes
            document.querySelectorAll('.select-delivery').forEach(checkbox => {
                checkbox.addEventListener('change', updateESignatureButton);
            });
        }
    }
    
    // Update booking status
    function updateBookingStatus(drNumber, newStatus) {
        console.log(`Updating status for ${drNumber} to ${newStatus}`);
        
        // Get bookings from localStorage
        let bookings = JSON.parse(localStorage.getItem('mci-bookings') || '[]');
        
        // Find and update the booking
        const bookingIndex = bookings.findIndex(booking => booking.drNumber === drNumber);
        if (bookingIndex !== -1) {
            bookings[bookingIndex].status = newStatus;
            
            // If status is completed, move to delivery history
            if (newStatus === 'Completed') {
                // In a real implementation, you would move this to a separate history collection
                console.log(`Booking ${drNumber} marked as completed`);
            }
            
            // Save back to localStorage
            localStorage.setItem('mci-bookings', JSON.stringify(bookings));
            
            // Show success message
            showToast(`Status updated to ${newStatus}`, 'success');
        }
    }
    
    // Update E-Signature button based on selection
    function updateESignatureButton() {
        const eSignatureBtn = document.getElementById('eSignatureBtn');
        if (!eSignatureBtn) return;
        
        const selectedCheckboxes = document.querySelectorAll('.select-delivery:checked');
        eSignatureBtn.disabled = selectedCheckboxes.length === 0;
    }

    // Make functions globally accessible
    window.loadActiveDeliveries = loadActiveDeliveries;
    window.updateBookingStatus = updateBookingStatus;
    window.updateESignatureButton = updateESignatureButton;