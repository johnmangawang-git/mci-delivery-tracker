// Calendar functionality
let currentMonthIndex = new Date().getMonth();
let currentYear = new Date().getFullYear();
let bookingsData = [];

function initCalendar() {
    // Load bookings data from Supabase
    loadBookingsData().then(() => {
        updateCalendar();
    });

    // Initialize date pickers
    initializeDatePickers();
}

function updateCalendar() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    document.getElementById('currentMonth').textContent = `${monthNames[currentMonthIndex]} ${currentYear}`;

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Add day headers
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Get first day of month and total days
    const firstDay = new Date(currentYear, currentMonthIndex, 1);
    const lastDay = new Date(currentYear, currentMonthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayIndex = firstDay.getDay();

    // Add empty cells for previous month
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-cell';
        calendarGrid.appendChild(emptyCell);
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        const dateStr = `${currentYear}-${(currentMonthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        cell.dataset.date = dateStr;

        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = day;
        cell.appendChild(dateNumber);

        // Check if this is today
        const today = new Date();
        if (currentYear === today.getFullYear() &&
            currentMonthIndex === today.getMonth() &&
            day === today.getDate()) {
            cell.classList.add('today');
        }

        // Check if there are bookings for this date
        const hasBooking = checkDateHasBooking(dateStr);

        if (hasBooking) {
            cell.classList.add('booked');
        }

        const indicator = document.createElement('div');
        indicator.className = 'booking-indicator';
        cell.appendChild(indicator);
        
        calendarGrid.appendChild(cell);

        // Add event listeners for click functionality
        cell.addEventListener('click', function () {
            const dateStr = this.dataset.date;
            openBookingModal(dateStr);
        });
    }
}

// Function to check if a date has booking based on real delivery data
function checkDateHasBooking(dateStr) {
    // Get delivery data from the main app (if available)
    const activeDeliveries = window.activeDeliveries || [];
    const deliveryHistory = window.deliveryHistory || [];
    
    // Debug logging
    console.log(`Calendar: Checking bookings for ${dateStr}, found ${activeDeliveries.length} active and ${deliveryHistory.length} history deliveries`);
    
    // Check active deliveries for matching booking/delivery dates
    const hasActiveDelivery = activeDeliveries.some(delivery => {
        // Check if delivery has a deliveryDate field (from booking)
        if (delivery.deliveryDate) {
            try {
                const deliveryDate = new Date(delivery.deliveryDate);
                const deliveryDateFormatted = deliveryDate.toISOString().split('T')[0];
                console.log(`Comparing ${dateStr} with delivery date ${deliveryDateFormatted}`);
                return dateStr === deliveryDateFormatted;
            } catch (e) {
                console.error('Error parsing delivery date:', e);
            }
        }
        
        // Fallback: Parse ETA to check if delivery is scheduled for this date
        if (delivery.eta && delivery.eta.includes('Today')) {
            const today = new Date().toISOString().split('T')[0];
            return dateStr === today;
        }
        
        // Parse ETA for future dates like "Nov 2, 3:30 PM"
        if (delivery.eta && delivery.eta.match(/\w+ \d+/)) {
            try {
                const currentYear = new Date().getFullYear();
                const etaDateStr = delivery.eta.split(',')[0]; // Get "Nov 2" part
                const etaDate = new Date(`${etaDateStr}, ${currentYear}`);
                const etaDateFormatted = etaDate.toISOString().split('T')[0];
                return dateStr === etaDateFormatted;
            } catch (e) {
                // If parsing fails, ignore this delivery
                return false;
            }
        }
        
        return false;
    });
    
    // Check delivery history for matching completion dates
    const hasHistoryDelivery = deliveryHistory.some(delivery => {
        if (delivery.completedDate) {
            try {
                const completedDate = new Date(delivery.completedDate);
                const completedDateFormatted = completedDate.toISOString().split('T')[0];
                return dateStr === completedDateFormatted;
            } catch (e) {
                // If parsing fails, try different format
                if (delivery.completedDate.includes(',')) {
                    const currentYear = new Date().getFullYear();
                    const historyDate = new Date(`${delivery.completedDate}, ${currentYear}`);
                    const historyDateFormatted = historyDate.toISOString().split('T')[0];
                    return dateStr === historyDateFormatted;
                }
                return false;
            }
        }
        return false;
    });
    
    // If no real data available, fall back to mock data
    if (activeDeliveries.length === 0 && deliveryHistory.length === 0) {
        return bookingsData.some(booking =>
            booking.date.startsWith(dateStr)
        );
    }
    
    return hasActiveDelivery || hasHistoryDelivery;
}

// Function to get deliveries for a specific date
function getDeliveriesForDate(dateStr) {
    const activeDeliveries = window.activeDeliveries || [];
    const deliveryHistory = window.deliveryHistory || [];
    const deliveries = [];
    
    console.log(`Getting deliveries for date: ${dateStr}`);
    
    // Get active deliveries for this date
    activeDeliveries.forEach(delivery => {
        // Check if delivery has a deliveryDate field (from booking)
        if (delivery.deliveryDate) {
            try {
                const deliveryDate = new Date(delivery.deliveryDate);
                const deliveryDateFormatted = deliveryDate.toISOString().split('T')[0];
                if (dateStr === deliveryDateFormatted) {
                    console.log(`Found delivery for ${dateStr}:`, delivery);
                    deliveries.push({
                        ...delivery,
                        type: 'active'
                    });
                    return; // Skip ETA checking since we found a match
                }
            } catch (e) {
                console.error('Error parsing delivery date:', e);
            }
        }
        
        // Fallback: Check ETA for today's deliveries
        if (delivery.eta && delivery.eta.includes('Today')) {
            const today = new Date().toISOString().split('T')[0];
            if (dateStr === today) {
                deliveries.push({
                    ...delivery,
                    type: 'active'
                });
            }
        }
        
        // Parse ETA for future dates
        if (delivery.eta && delivery.eta.match(/\w+ \d+/)) {
            try {
                const currentYear = new Date().getFullYear();
                const etaDateStr = delivery.eta.split(',')[0];
                const etaDate = new Date(`${etaDateStr}, ${currentYear}`);
                const etaDateFormatted = etaDate.toISOString().split('T')[0];
                if (dateStr === etaDateFormatted) {
                    deliveries.push({
                        ...delivery,
                        type: 'active'
                    });
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    });
    
    // Get history deliveries for this date
    deliveryHistory.forEach(delivery => {
        if (delivery.completedDate) {
            try {
                const completedDate = new Date(delivery.completedDate);
                const completedDateFormatted = completedDate.toISOString().split('T')[0];
                if (dateStr === completedDateFormatted) {
                    deliveries.push({
                        ...delivery,
                        type: 'history'
                    });
                }
            } catch (e) {
                // Try different format
                if (delivery.completedDate.includes(',')) {
                    const currentYear = new Date().getFullYear();
                    const historyDate = new Date(`${delivery.completedDate}, ${currentYear}`);
                    const historyDateFormatted = historyDate.toISOString().split('T')[0];
                    if (dateStr === historyDateFormatted) {
                        deliveries.push({
                            ...delivery,
                            type: 'history'
                        });
                    }
                }
            }
        }
    });
    
    // If no real data available, fall back to mock data
    if (deliveries.length === 0 && activeDeliveries.length === 0 && deliveryHistory.length === 0) {
        return bookingsData.filter(booking => booking.date.startsWith(dateStr));
    }
    
    return deliveries;
}

// Load bookings data from Supabase
async function loadBookingsData() {
    try {
        // In a real implementation, this would fetch data from Supabase
        // For demo purposes, we'll use mock data
        bookingsData = [
            {
                id: 1,
                dr_number: 'DR-8842',
                date: '2023-10-01T09:00:00Z',
                origin: 'SMEG Alabang warehouse',
                destination: '123 Business Park, Makati',
                distance: 12.5,
                additional_costs: [
                    { description: 'Fuel', amount: 50 },
                    { description: 'Toll', amount: 25 }
                ]
            },
            {
                id: 2,
                dr_number: 'DR-8851',
                date: '2023-10-03T10:30:00Z',
                origin: 'SMEG Cebu warehouse',
                destination: '456 University Ave, Cebu City',
                distance: 8.2,
                additional_costs: []
            },
            {
                id: 3,
                dr_number: 'DR-8855',
                date: '2023-10-03T14:15:00Z',
                origin: 'SMEG Alabang warehouse',
                destination: '789 Industrial Park, Laguna',
                distance: 24.7,
                additional_costs: [
                    { description: 'Fuel', amount: 75 }
                ]
            }
        ];

        // Update dashboard metrics
        updateDashboardMetrics();

        return bookingsData;
    } catch (error) {
        console.error('Error loading bookings data:', error);
        showError('Failed to load bookings data');
        return [];
    }
}

// Update dashboard metrics based on bookings data
function updateDashboardMetrics() {
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());

    // Count total bookings
    const totalBookings = bookingsData.length;
    const totalBookingsEl = document.getElementById('totalBookings');
    if (totalBookingsEl) totalBookingsEl.textContent = totalBookings;

    // Count active deliveries (for demo, consider bookings for today as active)
    const activeDeliveries = bookingsData.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate.toDateString() === today.toDateString();
    }).length;
    const activeDeliveriesEl = document.getElementById('activeDeliveries');
    if (activeDeliveriesEl) activeDeliveriesEl.textContent = activeDeliveries;

    // Calculate total distance
    const totalDistance = bookingsData.reduce((sum, booking) => sum + booking.distance, 0).toFixed(0);
    const totalDistanceEl = document.getElementById('totalDistance');
    if (totalDistanceEl) totalDistanceEl.textContent = `${totalDistance} km`;

    // Calculate total revenue (for demo, revenue = distance * 10)
    const totalRevenue = (totalDistance * 10).toLocaleString('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) totalRevenueEl.textContent = totalRevenue;

    // Update analytics metrics
    const analyticsTotalBookingsEl = document.getElementById('analyticsTotalBookings');
    if (analyticsTotalBookingsEl) analyticsTotalBookingsEl.textContent = totalBookings;
    
    const analyticsTotalDistanceEl = document.getElementById('analyticsTotalDistance');
    if (analyticsTotalDistanceEl) analyticsTotalDistanceEl.textContent = `${totalDistance} km`;

    // Calculate total additional cost
    let totalAdditionalCost = 0;
    bookingsData.forEach(booking => {
        if (booking.additional_costs) {
            booking.additional_costs.forEach(cost => {
                totalAdditionalCost += cost.amount;
            });
        }
    });

    const analyticsTotalCostEl = document.getElementById('analyticsTotalCost');
    if (analyticsTotalCostEl) {
        analyticsTotalCostEl.textContent = totalAdditionalCost.toLocaleString('en-PH', {
            style: 'currency',
            currency: 'PHP'
        });
    }

    // Calculate average cost per booking
    const avgCost = totalBookings > 0 ? totalAdditionalCost / totalBookings : 0;
    const analyticsAvgCostEl = document.getElementById('analyticsAvgCost');
    if (analyticsAvgCostEl) {
        analyticsAvgCostEl.textContent = avgCost.toLocaleString('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        });
    }
}

// Initialize date pickers
function initializeDatePickers() {
    // In a real implementation with a date picker library
    // For this demo, we'll just log when the inputs are focused
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.addEventListener('focus', function () {
            console.log('Date picker opened');
        });
    });
}

// Open booking modal for a specific date
function openBookingModal(dateStr) {
    const bookingModalEl = document.getElementById('bookingModal');
    if (!bookingModalEl) {
        console.warn('Booking modal element not found');
        return;
    }
    
    const bookingModal = new bootstrap.Modal(bookingModalEl);
    
    // Generate a new DR number based on the date
    const date = new Date(dateStr);
    const drNumber = `DR-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    // Pre-fill the DR number and date
    const drNumberEl = document.getElementById('drNumber');
    if (drNumberEl) drNumberEl.value = drNumber;
    
    const deliveryDateEl = document.getElementById('deliveryDate');
    if (deliveryDateEl) deliveryDateEl.value = dateStr;
    
    // Show the modal
    bookingModal.show();
    
    // Log the selected date for debugging
    console.log('Opening booking modal for date:', dateStr);
}

// Function to refresh calendar when bookings are updated
function refreshCalendarData() {
    console.log('Calendar: Refreshing calendar data...');
    
    // Show loading indicator
    const calendarGrid = document.getElementById('calendarGrid');
    if (calendarGrid) {
        calendarGrid.style.opacity = '0.6';
        calendarGrid.style.pointerEvents = 'none';
        
        // Add a subtle loading animation
        setTimeout(() => {
            updateCalendar();
            calendarGrid.style.opacity = '1';
            calendarGrid.style.pointerEvents = 'auto';
        }, 200);
    } else {
        updateCalendar();
    }
}

// Make refresh function globally available
window.refreshCalendarData = refreshCalendarData;

// Initialize calendar navigation
document.addEventListener('DOMContentLoaded', function () {
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', function () {
            currentMonthIndex--;
            if (currentMonthIndex < 0) {
                currentMonthIndex = 11;
                currentYear--;
            }
            updateCalendar();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', function () {
            currentMonthIndex++;
            if (currentMonthIndex > 11) {
                currentMonthIndex = 0;
                currentYear++;
            }
            updateCalendar();
        });
    }
});