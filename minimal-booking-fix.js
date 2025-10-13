// Minimal Booking System Fix
// This creates the essential functions needed for booking to work

console.log('Loading minimal booking fix...');

// Initialize global arrays
if (typeof window.activeDeliveries === 'undefined') {
    window.activeDeliveries = [];
    console.log('✅ Initialized window.activeDeliveries');
}

if (typeof window.deliveryHistory === 'undefined') {
    window.deliveryHistory = [];
    console.log('✅ Initialized window.deliveryHistory');
}

// Load existing data from localStorage
try {
    const savedActive = localStorage.getItem('mci-active-deliveries');
    if (savedActive) {
        window.activeDeliveries = JSON.parse(savedActive);
        console.log(`✅ Loaded ${window.activeDeliveries.length} active deliveries from localStorage`);
    }
    
    const savedHistory = localStorage.getItem('mci-delivery-history');
    if (savedHistory) {
        window.deliveryHistory = JSON.parse(savedHistory);
        console.log(`✅ Loaded ${window.deliveryHistory.length} delivery history from localStorage`);
    }
} catch (error) {
    console.error('Error loading from localStorage:', error);
}

// Minimal saveBooking function
window.saveBooking = function() {
    console.log('🎯 Minimal saveBooking called');
    
    try {
        // Get form data
        const drNumber = document.getElementById('drNumber')?.value || 'DR-' + Date.now();
        const customerName = document.getElementById('customerName')?.value || 'Test Customer';
        const vendorNumber = document.getElementById('vendorNumber')?.value || 'VN-001';
        const origin = document.getElementById('customOrigin')?.value || 'Manila';
        const destination = document.querySelector('.destination-area-input')?.value || 'Quezon City';
        const truckType = document.getElementById('truckType')?.value || '10-Wheeler';
        const truckPlateNumber = document.getElementById('truckPlateNumber')?.value || 'ABC-123';
        const deliveryDate = document.getElementById('deliveryDate')?.value || new Date().toISOString().split('T')[0];
        
        // Create delivery object
        const newDelivery = {
            id: 'DEL-' + Date.now() + '-' + drNumber,
            drNumber: drNumber,
            customerName: customerName,
            vendorNumber: vendorNumber,
            origin: origin,
            destination: destination,
            truckType: truckType,
            truckPlateNumber: truckPlateNumber,
            status: 'On Schedule',
            deliveryDate: deliveryDate,
            timestamp: new Date().toISOString(),
            source: 'MINIMAL_FIX'
        };
        
        console.log('📝 Created delivery:', newDelivery);
        
        // Add to activeDeliveries
        window.activeDeliveries.push(newDelivery);
        console.log(`✅ Added to activeDeliveries. Total: ${window.activeDeliveries.length}`);
        
        // Save to localStorage
        localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
        console.log('💾 Saved to localStorage');
        
        // Call loadActiveDeliveries if available
        if (typeof window.loadActiveDeliveries === 'function') {
            setTimeout(() => {
                window.loadActiveDeliveries();
                console.log('🔄 Called loadActiveDeliveries');
            }, 100);
        } else {
            console.log('⚠️ loadActiveDeliveries not available, calling minimal version');
            setTimeout(() => {
                window.minimalLoadActiveDeliveries();
            }, 100);
        }
        
        // Show success message
        alert(`Booking confirmed! DR: ${drNumber}\nCustomer: ${customerName}\nTotal bookings: ${window.activeDeliveries.length}`);
        
        // Close modal if it exists
        const modal = document.getElementById('bookingModal');
        if (modal) {
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
        }
        
        console.log('✅ Booking saved successfully');
        
    } catch (error) {
        console.error('❌ Error in minimal saveBooking:', error);
        alert('Error saving booking: ' + error.message);
    }
};

// Minimal loadActiveDeliveries function
window.minimalLoadActiveDeliveries = function() {
    console.log('🔄 Minimal loadActiveDeliveries called');
    
    try {
        const tableBody = document.getElementById('activeDeliveriesTableBody');
        if (!tableBody) {
            console.log('⚠️ activeDeliveriesTableBody not found');
            return;
        }
        
        console.log(`📊 Loading ${window.activeDeliveries.length} deliveries`);
        
        if (window.activeDeliveries.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-5">
                        <i class="bi bi-truck" style="font-size: 3rem; opacity: 0.3;"></i>
                        <h4 class="mt-3">No active deliveries found</h4>
                        <p class="text-muted">Create a booking to see it here</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Generate table rows
        tableBody.innerHTML = window.activeDeliveries.map(delivery => `
            <tr>
                <td><input type="checkbox" class="form-check-input"></td>
                <td><strong>${delivery.drNumber}</strong></td>
                <td>${delivery.customerName}</td>
                <td>${delivery.vendorNumber}</td>
                <td>${delivery.origin}</td>
                <td>${delivery.destination}</td>
                <td>${delivery.truckType} (${delivery.truckPlateNumber})</td>
                <td><span class="badge bg-success">${delivery.status}</span></td>
                <td>${delivery.deliveryDate}</td>
            </tr>
        `).join('');
        
        console.log('✅ Table populated successfully');
        
    } catch (error) {
        console.error('❌ Error in minimal loadActiveDeliveries:', error);
    }
};

// Enhanced loadActiveDeliveries that works with existing data
window.loadActiveDeliveries = function() {
    console.log('🔄 Enhanced loadActiveDeliveries called');
    
    // Load from localStorage if array is empty
    if (window.activeDeliveries.length === 0) {
        try {
            const saved = localStorage.getItem('mci-active-deliveries');
            if (saved) {
                window.activeDeliveries = JSON.parse(saved);
                console.log(`📊 Loaded ${window.activeDeliveries.length} deliveries from localStorage`);
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }
    
    // Call minimal version
    window.minimalLoadActiveDeliveries();
};

// Set up confirm booking button
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Setting up minimal booking fix...');
    
    setTimeout(() => {
        const confirmBtn = document.getElementById('confirmBookingBtn');
        if (confirmBtn) {
            // Remove existing listeners
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
            
            // Add new listener
            newBtn.addEventListener('click', function() {
                console.log('🔘 Confirm booking clicked (minimal fix)');
                window.saveBooking();
            });
            
            console.log('✅ Confirm booking button set up');
        } else {
            console.log('⚠️ Confirm booking button not found');
        }
        
        // Try to load existing deliveries
        window.loadActiveDeliveries();
        
    }, 2000);
});

console.log('✅ Minimal booking fix loaded successfully');