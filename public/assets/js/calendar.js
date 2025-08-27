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
        const hasBooking = bookingsData.some(booking =>
            booking.date.startsWith(dateStr)
        );

        if (hasBooking) {
            cell.classList.add('booked');
        }

        const indicator = document.createElement('div');
        indicator.className = 'booking-indicator';
        cell.appendChild(indicator);

        // Add booking summary popup
        const summary = document.createElement('div');
        summary.className = 'booking-summary';

        if (hasBooking) {
            const bookingsForDate = bookingsData.filter(booking =>
                booking.date.startsWith(dateStr)
            );

            let bookingsHtml = '';
            bookingsForDate.forEach(booking => {
                bookingsHtml += `
                    <div class="booking-item">
                        <div class="booking-dr">${booking.dr_number}</div>
                        <div class="booking-details">
                            <div class="detail-row">
                                <div class="detail-label">From:</div>
                                <div>${booking.origin}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">To:</div>
                                <div>${booking.destination}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Distance:</div>
                                <div>${booking.distance} km</div>
                            </div>
                            ${booking.additional_costs && booking.additional_costs.length > 0 ? `
                            <div class="detail-row">
                                <div class="detail-label">Costs:</div>
                                <div>${booking.additional_costs.map(cost => `${cost.description}: $${cost.amount}`).join(', ')}</div>
                            </div>` : ''}
                        </div>
                    </div>
                `;
            });

            summary.innerHTML = `
                <div class="summary-header">
                    <div class="summary-date">${monthNames[currentMonthIndex]} ${day}, ${currentYear}</div>
                    <div class="summary-count">${bookingsForDate.length}</div>
                </div>
                ${bookingsHtml}
            `;
        }

        cell.appendChild(summary);
        calendarGrid.appendChild(cell);

        // Add event listeners
        cell.addEventListener('mouseenter', function (e) {
            const summary = this.querySelector('.booking-summary');
            if (summary) {
                summary.style.display = 'block';

                // Position the summary relative to the cell
                const rect = this.getBoundingClientRect();
                const summaryRect = summary.getBoundingClientRect();

                // Position above the cell
                summary.style.top = (rect.top - summaryRect.height - 15) + 'px';
                summary.style.left = (rect.left + rect.width / 2 - summaryRect.width / 2) + 'px';
            }
        });

        cell.addEventListener('mouseleave', function () {
            const summary = this.querySelector('.booking-summary');
            if (summary) {
                summary.style.display = 'none';
            }
        });

        cell.addEventListener('click', function () {
            const dateStr = this.dataset.date;
            openBookingModal(dateStr);
        });
    }
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
                origin: 'MCI Alabang warehouse',
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
                origin: 'MCI Cebu warehouse',
                destination: '456 University Ave, Cebu City',
                distance: 8.2,
                additional_costs: []
            },
            {
                id: 3,
                dr_number: 'DR-8855',
                date: '2023-10-03T14:15:00Z',
                origin: 'MCI Alabang warehouse',
                destination: '789 Industrial Park, Laguna',
                distance: 24.7,
                additional_costs: [
                    { description: 'Fuel', amount: 75 }
                ]
            },
            {
                id: 4,
                dr_number: 'DR-8862',
                date: '2023-10-10T08:45:00Z',
                origin: 'MCI Davao warehouse',
                destination: '101 Corporate Center, Davao',
                distance: 5.3,
                additional_costs: []
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
    document.getElementById('totalBookings').textContent = totalBookings;

    // Count active deliveries (for demo, consider bookings for today as active)
    const activeDeliveries = bookingsData.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate.toDateString() === today.toDateString();
    }).length;
    document.getElementById('activeDeliveries').textContent = activeDeliveries;

    // Calculate total distance
    const totalDistance = bookingsData.reduce((sum, booking) => sum + booking.distance, 0).toFixed(0);
    document.getElementById('totalDistance').textContent = `${totalDistance} km`;

    // Calculate total revenue (for demo, revenue = distance * 10)
    const totalRevenue = (totalDistance * 10).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    document.getElementById('totalRevenue').textContent = totalRevenue;

    // Update analytics metrics
    document.getElementById('analyticsTotalBookings').textContent = totalBookings;
    document.getElementById('analyticsTotalDistance').textContent = `${totalDistance} km`;

    // Calculate total additional cost
    let totalAdditionalCost = 0;
    bookingsData.forEach(booking => {
        if (booking.additional_costs) {
            booking.additional_costs.forEach(cost => {
                totalAdditionalCost += cost.amount;
            });
        }
    });

    document.getElementById('analyticsTotalCost').textContent = totalAdditionalCost.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    // Calculate average cost per booking
    const avgCost = totalBookings > 0 ? totalAdditionalCost / totalBookings : 0;
    document.getElementById('analyticsAvgCost').textContent = avgCost.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    });
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
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    
    // Generate a new DR number based on the date
    const date = new Date(dateStr);
    const drNumber = `DR-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    // Pre-fill the DR number and date
    document.getElementById('drNumber').value = drNumber;
    document.getElementById('deliveryDate').value = dateStr;
    
    // Show the modal
    bookingModal.show();
    
    // Log the selected date for debugging
    console.log('Opening booking modal for date:', dateStr);
}

// Initialize calendar navigation
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('prevMonth').addEventListener('click', function () {
        currentMonthIndex--;
        if (currentMonthIndex < 0) {
            currentMonthIndex = 11;
            currentYear--;
        }
        updateCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', function () {
        currentMonthIndex++;
        if (currentMonthIndex > 11) {
            currentMonthIndex = 0;
            currentYear++;
        }
        updateCalendar();
    });
});