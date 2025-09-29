// Clean Calendar functionality
let currentMonthIndex = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentMonthIndexModal = new Date().getMonth();
let currentYearModal = new Date().getFullYear();

// Add a global flag to indicate calendar.js is loaded
window.calendarJsLoaded = true;

// Function to check if a date has booking based on real delivery data
function checkDateHasBooking(dateStr) {
    // Get delivery data from the main app (if available)
    const activeDeliveries = window.activeDeliveries || [];
    const deliveryHistory = window.deliveryHistory || [];
    
    // Check active deliveries for matching booking/delivery dates
    const hasActiveDelivery = activeDeliveries.some(delivery => {
        // Check if delivery has a deliveryDate field (from booking)
        if (delivery.deliveryDate) {
            try {
                const deliveryDate = new Date(delivery.deliveryDate);
                const deliveryDateFormatted = deliveryDate.toISOString().split('T')[0];
                return dateStr === deliveryDateFormatted;
            } catch (e) {
                console.error('Error parsing delivery date:', e);
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
                return false;
            }
        }
        return false;
    });
    
    return hasActiveDelivery || hasHistoryDelivery;
}

// Enhanced openBookingModal function with better error handling
function openBookingModal(dateStr) {
    console.log('=== OPEN BOOKING MODAL FUNCTION CALLED ===');
    console.log('Date string received:', dateStr);
    
    // Make sure this function is globally available
    window.openBookingModal = openBookingModal;
    
    // Check if the booking modal element exists in the DOM
    const bookingModal = document.getElementById('bookingModal');
    console.log('Booking modal element:', bookingModal);
    if (!bookingModal) {
        console.error('Booking modal element not found in DOM!');
        return;
    }
    
    // Check if Bootstrap is available
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
    }
    
    const deliveryDateEl = document.getElementById('deliveryDate');
    console.log('Delivery Date element found:', deliveryDateEl);
    if (deliveryDateEl) {
        deliveryDateEl.value = dateStr;
        console.log('Delivery Date value set to:', deliveryDateEl.value);
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
            let bookingModalInstance = bootstrap.Modal.getInstance(bookingModalEl);
            console.log('Existing modal instance:', bookingModalInstance);
            if (!bookingModalInstance) {
                console.log('No existing modal instance, creating new one');
                // Create new modal instance with proper options
                try {
                    bookingModalInstance = new bootstrap.Modal(bookingModalEl, {
                        backdrop: true,  // Allow backdrop
                        keyboard: true   // Allow keyboard escape
                    });
                    console.log('New modal instance created:', bookingModalInstance);
                } catch (error) {
                    console.error('Error creating modal instance:', error);
                    return;
                }
            } else {
                console.log('Using existing modal instance');
            }
            
            console.log('Modal instance:', bookingModalInstance);
            console.log('Showing modal');
            
            // Show the modal
            try {
                bookingModalInstance.show();
                console.log('Modal show command executed successfully');
            } catch (error) {
                console.error('Error showing modal:', error);
            }
        } else {
            console.error('Booking modal element not found!');
        }
    }
    
    // Update the modal calendar when the modal is shown
    setTimeout(() => {
        if (typeof updateCalendarModal === 'function') {
            updateCalendarModal();
        }
    }, 100);
    
    // Log success
    console.log('openBookingModal function completed successfully');
}

// Ensure the function is globally available
window.openBookingModal = openBookingModal;

// Enhanced function to update calendar with debugging
function updateCalendar() {
    try {
        console.log('=== UPDATE CALENDAR CALLED ===');
        
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        // Update month display
        const currentMonthEl = document.getElementById('currentMonth');
        if (currentMonthEl) {
            currentMonthEl.textContent = `${monthNames[currentMonthIndex]} ${currentYear}`;
        }

        const calendarGrid = document.getElementById('calendarGrid');
        console.log('Calendar grid element:', calendarGrid);
        if (!calendarGrid) {
            console.error('Calendar grid not found!');
            return;
        }

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
            emptyCell.className = 'calendar-cell empty';
            calendarGrid.appendChild(emptyCell);
        }

        // Add days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            // Add visual indicators to make cells clearly visible
            cell.style.border = '1px solid #dee2e6';
            cell.style.backgroundColor = '#f8f9fa';
            
            const dateStr = `${currentYear}-${(currentMonthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            cell.dataset.date = dateStr;

            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = day;
            dateNumber.style.fontWeight = 'bold';
            cell.appendChild(dateNumber);

            // Check if this is today
            const today = new Date();
            if (currentYear === today.getFullYear() &&
                currentMonthIndex === today.getMonth() &&
                day === today.getDate()) {
                cell.classList.add('today');
                cell.style.backgroundColor = '#e3f2fd';
            }

            // Check if there are bookings for this date
            const hasBooking = checkDateHasBooking(dateStr);

            if (hasBooking) {
                cell.classList.add('booked');
                cell.style.backgroundColor = '#ffebee';
            }

            const indicator = document.createElement('div');
            indicator.className = 'booking-indicator';
            indicator.style.fontSize = '10px';
            indicator.textContent = hasBooking ? '📅' : '';
            cell.appendChild(indicator);
            
            calendarGrid.appendChild(cell);

            // Add event listeners for click functionality
            cell.style.cursor = 'pointer';
            cell.title = `Click to book delivery for ${dateStr}`;
            
            cell.addEventListener('click', function(event) {
                console.log('=== CALENDAR CELL CLICKED ===');
                console.log('Event details:', {
                    type: event.type,
                    target: event.target,
                    currentTarget: event.currentTarget,
                    date: this.dataset.date
                });
                
                // Prevent default and stop propagation for debugging
                event.preventDefault();
                event.stopPropagation();
                
                const dateStr = this.dataset.date;
                console.log('Attempting to open booking modal for date:', dateStr);
                
                // Try multiple methods to call openBookingModal
                if (typeof window.openBookingModal === 'function') {
                    console.log('Calling window.openBookingModal');
                    try {
                        window.openBookingModal(dateStr);
                    } catch (error) {
                        console.error('Error calling window.openBookingModal:', error);
                    }
                } else if (typeof openBookingModal === 'function') {
                    console.log('Calling openBookingModal');
                    try {
                        openBookingModal(dateStr);
                    } catch (error) {
                        console.error('Error calling openBookingModal:', error);
                    }
                } else {
                    console.error('openBookingModal function not found!');
                }
            });
        }
        
        console.log('Calendar update completed successfully');
    } catch (error) {
        console.error('Error updating calendar:', error);
    }
}

// New function to update the modal calendar
function updateCalendarModal() {
    try {
        console.log('=== UPDATE MODAL CALENDAR CALLED ===');
        
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        // Update modal month display
        const currentMonthModalEl = document.getElementById('currentMonthModal');
        if (currentMonthModalEl) {
            currentMonthModalEl.textContent = `${monthNames[currentMonthIndexModal]} ${currentYearModal}`;
        }

        const calendarGridModal = document.getElementById('calendarGridModal');
        console.log('Modal calendar grid element:', calendarGridModal);
        if (!calendarGridModal) {
            console.log('Modal calendar grid not found - this is okay if modal is not open');
            return;
        }

        calendarGridModal.innerHTML = '';

        // Add day headers
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        daysOfWeek.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGridModal.appendChild(dayHeader);
        });

        // Get first day of month and total days
        const firstDay = new Date(currentYearModal, currentMonthIndexModal, 1);
        const lastDay = new Date(currentYearModal, currentMonthIndexModal + 1, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayIndex = firstDay.getDay();

        // Add empty cells for previous month
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-cell empty';
            calendarGridModal.appendChild(emptyCell);
        }

        // Add days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            // Add visual indicators to make cells clearly visible
            cell.style.border = '1px solid #dee2e6';
            cell.style.backgroundColor = '#f8f9fa';
            
            const dateStr = `${currentYearModal}-${(currentMonthIndexModal + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            cell.dataset.date = dateStr;

            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = day;
            dateNumber.style.fontWeight = 'bold';
            cell.appendChild(dateNumber);

            // Check if this is today
            const today = new Date();
            if (currentYearModal === today.getFullYear() &&
                currentMonthIndexModal === today.getMonth() &&
                day === today.getDate()) {
                cell.classList.add('today');
                cell.style.backgroundColor = '#e3f2fd';
            }

            // Check if there are bookings for this date
            const hasBooking = checkDateHasBooking(dateStr);

            if (hasBooking) {
                cell.classList.add('booked');
                cell.style.backgroundColor = '#ffebee';
            }

            const indicator = document.createElement('div');
            indicator.className = 'booking-indicator';
            indicator.style.fontSize = '10px';
            indicator.textContent = hasBooking ? '📅' : '';
            cell.appendChild(indicator);
            
            calendarGridModal.appendChild(cell);

            // Add event listeners for click functionality
            cell.style.cursor = 'pointer';
            cell.title = `Click to book delivery for ${dateStr}`;
            
            cell.addEventListener('click', function(event) {
                console.log('=== MODAL CALENDAR CELL CLICKED ===');
                console.log('Event details:', {
                    type: event.type,
                    target: event.target,
                    currentTarget: event.currentTarget,
                    date: this.dataset.date
                });
                
                // Prevent default and stop propagation for debugging
                event.preventDefault();
                event.stopPropagation();
                
                const dateStr = this.dataset.date;
                console.log('Attempting to open booking modal for date:', dateStr);
                
                // Try multiple methods to call openBookingModal
                if (typeof window.openBookingModal === 'function') {
                    console.log('Calling window.openBookingModal');
                    try {
                        window.openBookingModal(dateStr);
                    } catch (error) {
                        console.error('Error calling window.openBookingModal:', error);
                    }
                } else if (typeof openBookingModal === 'function') {
                    console.log('Calling openBookingModal');
                    try {
                        openBookingModal(dateStr);
                    } catch (error) {
                        console.error('Error calling openBookingModal:', error);
                    }
                } else {
                    console.error('openBookingModal function not found!');
                }
            });
        }
        
        console.log('Modal calendar update completed successfully');
    } catch (error) {
        console.error('Error updating modal calendar:', error);
    }
}

// Initialize calendar function
function initCalendar() {
    console.log('initCalendar function called');
    
    // Make sure this function is globally available
    window.initCalendar = initCalendar;
    
    // Set flag to indicate calendar has been initialized
    window.calendarInitialized = true;
    console.log('Calendar initialization flag set');
    
    const calendarGrid = document.getElementById('calendarGrid');
    console.log('Calendar grid element for initialization:', calendarGrid);
    
    if (calendarGrid) {
        // Update the calendar display
        updateCalendar();
        
        // Add navigation event listeners
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                console.log('Previous month button clicked');
                currentMonthIndex--;
                if (currentMonthIndex < 0) {
                    currentMonthIndex = 11;
                    currentYear--;
                }
                updateCalendar();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                console.log('Next month button clicked');
                currentMonthIndex++;
                if (currentMonthIndex > 11) {
                    currentMonthIndex = 0;
                    currentYear++;
                }
                updateCalendar();
            });
        }
        
        console.log('Calendar initialized successfully');
    } else {
        console.error('Calendar grid element not found during initialization');
    }
}

// Ensure initCalendar is globally available
window.initCalendar = initCalendar;

// Modal calendar initialization function
function initCalendarModal() {
    console.log('initCalendarModal function called');
    
    // Make sure this function is globally available
    window.initCalendarModal = initCalendarModal;
    
    const calendarGridModal = document.getElementById('calendarGridModal');
    console.log('Modal calendar grid element for initialization:', calendarGridModal);
    
    if (calendarGridModal) {
        // Update the modal calendar display
        updateCalendarModal();
        
        // Add navigation event listeners for modal
        const prevBtnModal = document.getElementById('prevMonthModal');
        const nextBtnModal = document.getElementById('nextMonthModal');
        
        if (prevBtnModal) {
            prevBtnModal.addEventListener('click', function() {
                console.log('Previous month button clicked in modal');
                currentMonthIndexModal--;
                if (currentMonthIndexModal < 0) {
                    currentMonthIndexModal = 11;
                    currentYearModal--;
                }
                updateCalendarModal();
            });
        }
        
        if (nextBtnModal) {
            nextBtnModal.addEventListener('click', function() {
                console.log('Next month button clicked in modal');
                currentMonthIndexModal++;
                if (currentMonthIndexModal > 11) {
                    currentMonthIndexModal = 0;
                    currentYearModal++;
                }
                updateCalendarModal();
            });
        }
        
        console.log('Modal calendar initialized successfully');
    } else {
        console.log('Modal calendar grid element not found during initialization - this is okay if modal is not open');
    }
}

// Ensure initCalendarModal is globally available
window.initCalendarModal = initCalendarModal;

// Ensure event listeners are added when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CONTENT LOADED - INITIALIZING CALENDAR ===');
    
    // Check if we're on the right page
    console.log('Document ready, checking for booking view');
    const bookingView = document.getElementById('bookingView');
    console.log('Booking view element:', bookingView);
    if (bookingView) {
        console.log('Booking view class list:', bookingView.classList);
        console.log('Booking view is active:', bookingView.classList.contains('active'));
    }
    
    // Initialize calendar if booking view is active
    setTimeout(() => {
        const bookingView = document.getElementById('bookingView');
        console.log('Checking booking view after timeout:', bookingView);
        if (bookingView && bookingView.classList.contains('active')) {
            console.log('Booking view is active, initializing calendar');
            if (typeof initCalendar === 'function') {
                console.log('Calling initCalendar function');
                initCalendar();
            } else {
                console.error('initCalendar function is not available');
            }
        } else {
            console.log('Booking view is not active or not found');
        }
    }, 500);
});