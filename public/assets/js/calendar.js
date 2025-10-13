// Calendar functionality
let currentMonthIndex = new Date().getMonth();
let currentYear = new Date().getFullYear();
let bookingsData = [];

// Add a global flag to indicate calendar.js is loaded
window.calendarJsLoaded = true;

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
        // Try to find all elements with class 'modal'
        const allModals = document.querySelectorAll('.modal');
        console.log('All modal elements found:', allModals.length);
        allModals.forEach((modal, index) => {
            console.log(`Modal ${index}:`, modal.id || 'no id');
        });
        
        // Also check for elements with ID containing 'booking'
        const bookingElements = document.querySelectorAll('[id*="booking"]');
        console.log('Elements with ID containing "booking":', bookingElements.length);
        bookingElements.forEach((element, index) => {
            console.log(`Booking element ${index}:`, element.id, element.tagName);
        });
        return;
    }
    
    // Check if Bootstrap is available
    console.log('Bootstrap object available:', typeof bootstrap);
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not available! This is required for modal functionality.');
        return;
    }
    
    // Ensure initBookingModal is called if available
    if (typeof window.bookingModalInitialized === 'undefined') {
        console.log('⏳ Checking for initBookingModal availability...');
        
        // Try multiple times with delays to handle loading order
        let attempts = 0;
        const maxAttempts = 10;
        
        const tryInitBookingModal = () => {
            attempts++;
            
            if (typeof window.initBookingModal === 'function') {
                try {
                    window.initBookingModal();
                    window.bookingModalInitialized = true;
                    console.log('✅ initBookingModal executed successfully on attempt', attempts);
                    return true;
                } catch (error) {
                    console.error('❌ Error calling initBookingModal:', error);
                    return false;
                }
            } else if (attempts < maxAttempts) {
                console.log(`⏳ initBookingModal not available yet, attempt ${attempts}/${maxAttempts}`);
                setTimeout(tryInitBookingModal, 50);
                return false;
            } else {
                console.warn('⚠️ initBookingModal not available after', maxAttempts, 'attempts');
                return false;
            }
        };
        
        tryInitBookingModal();
    }
    
    // Pre-fill the DR number and date before showing the modal
    const date = new Date(dateStr);
    console.log('Date object created:', date);
    
    // Generate a DR number in DR-XXXX format (4 digits)
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;
    const drNumber = `DR-${randomNumber}`;
    const drNumberEl = document.getElementById('drNumber');
    if (drNumberEl) {
        drNumberEl.value = drNumber;
        console.log('DR number set to:', drNumber);
    } else {
        console.error('DR number element not found');
        // Try to find it in the modal
        const bookingModalElement = document.getElementById('bookingModal');
        if (bookingModalElement) {
            const altDrNumberEl = bookingModalElement.querySelector('#drNumber');
            console.log('Alternative DR Number element search:', altDrNumberEl);
            if (altDrNumberEl) {
                altDrNumberEl.value = drNumber;
                console.log('DR Number value set to:', altDrNumberEl.value);
            } else {
                // Try to find by class name as fallback
                const classDrNumberEl = bookingModalElement.querySelector('.dr-number-input');
                console.log('Class-based DR Number element search:', classDrNumberEl);
                if (classDrNumberEl) {
                    classDrNumberEl.value = drNumber;
                    console.log('DR Number value set via class selector:', classDrNumberEl.value);
                }
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
        const bookingModalElement = document.getElementById('bookingModal');
        if (bookingModalElement) {
            const altDeliveryDateEl = bookingModalElement.querySelector('#deliveryDate');
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
                
                // Log success
                console.log('openBookingModal fallback method completed successfully');
            } catch (error) {
                console.error('Error showing modal:', error);
            }
            
            console.log('Modal show command executed');
        } else {
            console.error('Booking modal element not found!');
        }
    }
    
    // Set the delivery date and DR number in the form AFTER the modal is shown
    // This ensures it's not cleared by any form reset operations
    setTimeout(() => {
        // Set delivery date
        const deliveryDateEl = document.getElementById('deliveryDate');
        console.log('Delivery Date element found:', deliveryDateEl);
        if (deliveryDateEl) {
            deliveryDateEl.value = dateStr;
            console.log('Delivery Date value set to:', deliveryDateEl.value);
        } else {
            console.error('Delivery Date element not found!');
            // Try to find it in the modal
            const bookingModalElement = document.getElementById('bookingModal');
            if (bookingModalElement) {
                const altDeliveryDateEl = bookingModalElement.querySelector('#deliveryDate');
                console.log('Alternative Delivery Date element search:', altDeliveryDateEl);
                if (altDeliveryDateEl) {
                    altDeliveryDateEl.value = dateStr;
                    console.log('Delivery Date value set to:', altDeliveryDateEl.value);
                }
            }
        }
        
        // Set DR number
        const randomNumber = Math.floor(Math.random() * 9000) + 1000;
        const drNumber = `DR-${randomNumber}`;
        const drNumberEl = document.getElementById('drNumber');
        if (drNumberEl) {
            drNumberEl.value = drNumber;
            console.log('DR number set to:', drNumber);
        } else {
            console.error('DR number element not found');
            // Try to find it in the modal
            const bookingModalElement = document.getElementById('bookingModal');
            if (bookingModalElement) {
                const altDrNumberEl = bookingModalElement.querySelector('#drNumber');
                console.log('Alternative DR Number element search:', altDrNumberEl);
                if (altDrNumberEl) {
                    altDrNumberEl.value = drNumber;
                    console.log('DR Number value set to:', altDrNumberEl.value);
                } else {
                    // Try to find by class name as fallback
                    const classDrNumberEl = bookingModalElement.querySelector('.dr-number-input');
                    console.log('Class-based DR Number element search:', classDrNumberEl);
                    if (classDrNumberEl) {
                        classDrNumberEl.value = drNumber;
                        console.log('DR Number value set via class selector:', classDrNumberEl.value);
                    }
                }
            }
        }
    }, 100);
    
    // Update the modal calendar when the modal is shown
    setTimeout(() => {
        updateCalendarModal();
    }, 100);
    
    // Log success
    console.log('openBookingModal function completed successfully');
}

// Ensure the function is globally available
window.openBookingModal = openBookingModal;

// Test function to manually trigger a calendar cell click
window.testCalendarClick = function() {
    console.log('=== TESTING CALENDAR CLICK ===');
    
    // Generate a test date (today)
    const today = new Date();
    const testDateStr = today.toISOString().split('T')[0];
    console.log('Test date string:', testDateStr);
    
    // Call the openBookingModal function
    if (typeof openBookingModal === 'function') {
        openBookingModal(testDateStr);
    } else {
        console.error('openBookingModal function is not available');
    }
};

// Calendar initialization function
function initCalendar() {
    console.log('=== INIT CALENDAR FUNCTION CALLED ===');
    
    // Set global flag
    window.calendarInitialized = true;
    
    // Get current date
    const today = new Date();
    const currentMonth = today.getMonth();
    const initCurrentYear = today.getFullYear();
    
    // Update calendar display
    updateCalendar(currentMonth, initCurrentYear);
    
    // Add event listeners for navigation buttons
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
            updateCalendar(currentMonthIndex, currentYear);
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
            updateCalendar(currentMonthIndex, currentYear);
        });
    }
    
    console.log('Calendar initialized successfully');
}

// Function to update the main calendar
function updateCalendar(month, year) {
    console.log('=== UPDATE CALENDAR FUNCTION CALLED ===');
    console.log('Month:', month, 'Year:', year);
    
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) {
        console.error('Calendar grid element not found!');
        return;
    }
    
    // Clear existing calendar content
    calendarGrid.innerHTML = '';
    
    // Create calendar header (day names)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-cell empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        cell.dataset.date = dateStr;
        
        // Add date number
        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = day;
        cell.appendChild(dateNumber);
        
        // Check if this is today
        const today = new Date();
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            cell.classList.add('today');
        }
        
        // Add click event to open booking modal
        cell.addEventListener('click', function() {
            console.log('Calendar cell clicked:', dateStr);
            if (typeof openBookingModal === 'function') {
                openBookingModal(dateStr);
            } else {
                console.error('openBookingModal function is not available');
            }
        });
        
        calendarGrid.appendChild(cell);
    }
    
    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthElement = document.getElementById('currentMonth');
    if (currentMonthElement) {
        currentMonthElement.textContent = `${monthNames[month]} ${year}`;
    }
    
    console.log('Calendar updated successfully');
}

// Function to update the modal calendar
function updateCalendarModal() {
    console.log('=== UPDATE CALENDAR MODAL FUNCTION CALLED ===');
    
    const calendarGridModal = document.getElementById('calendarGridModal');
    if (!calendarGridModal) {
        console.error('Modal calendar grid element not found');
        // Try to find it in the DOM
        const allElements = document.querySelectorAll('*');
        console.log('Total elements in DOM:', allElements.length);
        
        // Try to find elements with similar IDs
        const possibleElements = document.querySelectorAll('[id*="calendar"], [id*="modal"]');
        console.log('Possible calendar/modal elements:', possibleElements.length);
        possibleElements.forEach((el, index) => {
            console.log(`Element ${index}: ID="${el.id}", Tag="${el.tagName}"`);
        });
        
        // Try to find the modal itself
        const modalElement = document.getElementById('calendarModal');
        if (modalElement) {
            console.log('Calendar modal found, but calendarGridModal is missing');
            // Try to create the grid element if it doesn't exist
            const modalBody = modalElement.querySelector('.modal-body');
            if (modalBody) {
                console.log('Modal body found, creating calendar grid');
                const gridElement = document.createElement('div');
                gridElement.id = 'calendarGridModal';
                gridElement.className = 'calendar-grid';
                modalBody.appendChild(gridElement);
                console.log('Created calendarGridModal element');
                // Retry the function
                setTimeout(updateCalendarModal, 100);
                return;
            }
        }
        return;
    }
    
    // Clear existing calendar
    calendarGridModal.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const headerCell = document.createElement('div');
        headerCell.className = 'calendar-day-header';
        headerCell.textContent = day;
        calendarGridModal.appendChild(headerCell);
    });
    
    // Get first day of month and days in month
    const firstDay = new Date(currentYearModal, currentMonthIndexModal, 1);
    const daysInMonth = new Date(currentYearModal, currentMonthIndexModal + 1, 0).getDate();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-cell empty';
        calendarGridModal.appendChild(emptyCell);
    }
    
    // Add cells for each day of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        
        const dateStr = `${currentYearModal}-${(currentMonthIndexModal + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        cell.dataset.date = dateStr;
        
        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = day;
        cell.appendChild(dateNumber);
        
        // Check if this is today
        if (currentYearModal === today.getFullYear() &&
            currentMonthIndexModal === today.getMonth() &&
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
        
        calendarGridModal.appendChild(cell);
        
        // Add visual indicator that cell was added
        cell.style.border = '1px solid #ddd';
    }
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthDisplay = document.getElementById('currentMonthModal');
    if (monthDisplay) {
        monthDisplay.textContent = `${monthNames[currentMonthIndexModal]} ${currentYearModal}`;
    }
    
    // Add event listeners to modal calendar cells
    setTimeout(addModalCalendarCellEventListeners, 100);
    
    console.log('=== UPDATE CALENDAR MODAL FUNCTION COMPLETED ===');
}

// Add a DOMContentLoaded event to initialize the calendar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Calendar.js: DOMContentLoaded event fired');
    
    // Double-check that functions are globally available
    window.openBookingModal = openBookingModal;
    window.initCalendar = initCalendar;
    window.updateCalendar = updateCalendar;
    window.updateCalendarModal = updateCalendarModal;
    
    console.log('Calendar.js: Functions re-exposed globally');
    
    // Initialize calendar if not already initialized
    if (!window.calendarInitialized) {
        console.log('Initializing calendar on DOMContentLoaded');
        initCalendar();
    }
});

// Ensure functions are available immediately
if (document.readyState === 'loading') {
    // Document is still loading, add event listener
    document.addEventListener('DOMContentLoaded', function() {
        window.openBookingModal = openBookingModal;
        window.initCalendar = initCalendar;
    });
} else {
    // Document is already loaded, expose functions immediately
    window.openBookingModal = openBookingModal;
    window.initCalendar = initCalendar;
}

// Test function to manually trigger modal calendar cell click
window.testModalCalendarCellClick = function() {
    console.log('=== TESTING MODAL CALENDAR CELL CLICK ===');
    
    // Try to find a modal calendar cell manually
    const modalCalendarCells = document.querySelectorAll('#calendarGridModal .calendar-cell[data-date]');
    console.log('Modal calendar cells found:', modalCalendarCells.length);
    
    if (modalCalendarCells.length > 0) {
        const firstCell = modalCalendarCells[0];
        console.log('Clicking first modal cell with date:', firstCell.dataset.date);
        
        // Simulate a click event
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        firstCell.dispatchEvent(clickEvent);
        console.log('Click event dispatched to first modal calendar cell');
    } else {
        console.error('No modal calendar cells found');
    }
};

// Initialize calendar if booking view is active on page load
setTimeout(() => {
    console.log('Checking if booking view is active on page load');
    const bookingView = document.getElementById('bookingView');
    console.log('Booking view element:', bookingView);
    if (bookingView) {
        console.log('Booking view class list:', bookingView.classList);
        console.log('Booking view is active:', bookingView.classList.contains('active'));
    }
    if (bookingView && bookingView.classList.contains('active')) {
        console.log('Booking view is active on page load, initializing calendar from calendar.js');
        if (typeof initCalendar === 'function') {
            try {
                initCalendar();
                console.log('Calendar initialized successfully on page load from calendar.js');
            } catch (error) {
                console.error('Error initializing calendar on page load from calendar.js:', error);
            }
        } else {
            console.error('initCalendar function is not available on page load');
            // Try to find it in window object
            console.log('initCalendar in window:', window.initCalendar);
            console.log('typeof window.initCalendar:', typeof window.initCalendar);
        }
    } else {
        console.log('Booking view is not active on page load, not initializing calendar');
    }
}, 1000);

// Modal calendar variables
let currentMonthIndexModal = new Date().getMonth();
let currentYearModal = new Date().getFullYear();

// Calendar initialization is now handled by main.js
// This prevents duplicate initialization conflicts

// Add a small delay to ensure DOM is ready before initializing
setTimeout(() => {
    // Check if calendar should be initialized on page load
    const bookingView = document.getElementById('bookingView');
    if (bookingView && bookingView.classList.contains('active')) {
        console.log('Booking view is active on page load, checking if calendar needs initialization');
        if (typeof window.calendarInitialized === 'undefined') {
            console.log('Calendar not yet initialized, attempting initialization');
            if (typeof initCalendar === 'function') {
                try {
                    initCalendar();
                    console.log('Calendar initialized successfully on page load');
                } catch (error) {
                    console.error('Error initializing calendar on page load:', error);
                }
            }
        }
    }
    
    // Also ensure openBookingModal is available
    if (typeof window.openBookingModal !== 'function') {
        console.error('openBookingModal function is still not available after page load');
    }
}, 2000);

// Enhanced function to update calendar with debugging
function updateCalendarFromCalendarJs() {
    try {
        console.log('=== UPDATE CALENDAR FROM CALENDAR.JS CALLED ===');
        
        // Make sure this function is globally available
        window.updateCalendarFromCalendarJs = updateCalendarFromCalendarJs;
        
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
            // Add visual indicators
            cell.style.border = '2px solid #007bff'; // Blue border to show cells are created
            cell.style.backgroundColor = '#f8f9fa'; // Light background to make cells visible
            cell.style.padding = '5px';
            cell.style.margin = '2px';
            
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
                cell.style.backgroundColor = '#ffebee'; // Light red for today
            }

            // Check if there are bookings for this date
            const hasBooking = checkDateHasBooking(dateStr);

            if (hasBooking) {
                cell.classList.add('booked');
                cell.style.backgroundColor = '#e8f5e9'; // Light green for booked days
            }

            const indicator = document.createElement('div');
            indicator.className = 'booking-indicator';
            indicator.textContent = '📅'; // Add an emoji to make it clear this is a calendar cell
            indicator.style.fontSize = '10px';
            cell.appendChild(indicator);
            
            calendarGrid.appendChild(cell);
            
            // Add debugging to verify cell was added
            console.log('Calendar cell added:', {
                element: cell,
                date: cell.dataset.date,
                hasBooking: hasBooking
            });

            // Add event listeners for click functionality
            cell.style.cursor = 'pointer';
            cell.title = `Click to book delivery for ${dateStr}`;
            
            // Create a named function for better debugging
            const handleCalendarClick = function(event) {
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
                
                // Check if booking modal exists in DOM
                const bookingModalEl = document.getElementById('bookingModal');
                console.log('Booking modal element in DOM:', bookingModalEl);
                
                // Check if Bootstrap is available
                console.log('Bootstrap available:', typeof bootstrap !== 'undefined');
                
                // Try multiple methods to call openBookingModal
                if (typeof window.openBookingModal === 'function') {
                    console.log('Calling window.openBookingModal');
                    try {
                        window.openBookingModal(dateStr);
                    } catch (error) {
                        console.error('Error calling window.openBookingModal:', error);
                        // Try direct modal show as ultimate fallback
                        showDirectModal(dateStr);
                    }
                } else if (typeof openBookingModal === 'function') {
                    console.log('Calling openBookingModal');
                    try {
                        openBookingModal(dateStr);
                    } catch (error) {
                        console.error('Error calling openBookingModal:', error);
                        // Try direct modal show as ultimate fallback
                        showDirectModal(dateStr);
                    }
                } else {
                    console.error('openBookingModal function not found!');
                    // Try direct modal show as ultimate fallback
                    showDirectModal(dateStr);
                }
            };
            
            // Attach multiple event listeners for better debugging
            cell.addEventListener('click', handleCalendarClick);
            cell.addEventListener('mousedown', function(event) {
                console.log('Calendar cell mousedown event:', event);
            });
            cell.addEventListener('mouseup', function(event) {
                console.log('Calendar cell mouseup event:', event);
            });
            
            // Also add touch events for mobile support
            cell.addEventListener('touchstart', function(event) {
                console.log('Calendar cell touchstart event:', event);
                // Prevent scrolling when touching calendar cells
                event.preventDefault();
            });
            
            cell.addEventListener('touchend', function(event) {
                console.log('Calendar cell touchend event:', event);
                // Trigger click event on touch end
                handleCalendarClick(event);
            });
            
            console.log('Click event listener attached to cell for date:', dateStr);
            
            // Add a data attribute to track that this cell has event listeners
            cell.setAttribute('data-has-listeners', 'true');
        }
        
        console.log('Calendar update completed successfully');
    } catch (error) {
        console.error('Error updating calendar:', error);
    }
}

// Ensure the function is globally available
window.updateCalendarFromCalendarJs = updateCalendarFromCalendarJs;

// New function to update the modal calendar with enhanced debugging
function updateCalendarModalFromCalendarJs() {
    try {
        console.log('=== UPDATE MODAL CALENDAR FROM CALENDAR.JS CALLED ===');
        
        // Make sure this function is globally available
        window.updateCalendarModalFromCalendarJs = updateCalendarModalFromCalendarJs;
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
            emptyCell.className = 'calendar-cell';
            calendarGridModal.appendChild(emptyCell);
        }

        // Add days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            // Add visual indicators
            cell.style.border = '2px solid #007bff'; // Blue border to show cells are created
            const dateStr = `${currentYearModal}-${(currentMonthIndexModal + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            cell.dataset.date = dateStr;

            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = day;
            cell.appendChild(dateNumber);

            // Check if this is today
            const today = new Date();
            if (currentYearModal === today.getFullYear() &&
                currentMonthIndexModal === today.getMonth() &&
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
            
            calendarGridModal.appendChild(cell);
            
            // Add debugging to verify cell was added
            console.log('Modal calendar cell added:', {
                element: cell,
                date: cell.dataset.date,
                hasBooking: hasBooking
            });

            // Add event listeners for click functionality
            cell.style.cursor = 'pointer';
            cell.title = `Click to book delivery for ${dateStr}`;
            
            // Create a named function for better debugging
            const handleCalendarClick = function(event) {
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
                
                // Check if booking modal exists in DOM
                const bookingModalEl = document.getElementById('bookingModal');
                console.log('Booking modal element in DOM:', bookingModalEl);
                
                // Check if Bootstrap is available
                console.log('Bootstrap available:', typeof bootstrap !== 'undefined');
                
                // Try multiple methods to call openBookingModal
                if (typeof window.openBookingModal === 'function') {
                    console.log('Calling window.openBookingModal');
                    try {
                        window.openBookingModal(dateStr);
                    } catch (error) {
                        console.error('Error calling window.openBookingModal:', error);
                        // Try direct modal show as ultimate fallback
                        showDirectModal(dateStr);
                    }
                } else if (typeof openBookingModal === 'function') {
                    console.log('Calling openBookingModal');
                    try {
                        openBookingModal(dateStr);
                    } catch (error) {
                        console.error('Error calling openBookingModal:', error);
                        // Try direct modal show as ultimate fallback
                        showDirectModal(dateStr);
                    }
                } else {
                    console.error('openBookingModal function not found!');
                    // Try direct modal show as ultimate fallback
                    showDirectModal(dateStr);
                }
            };
            
            // Attach multiple event listeners for better debugging
            cell.addEventListener('click', handleCalendarClick);
            cell.addEventListener('mousedown', function(event) {
                console.log('Modal calendar cell mousedown event:', event);
            });
            cell.addEventListener('mouseup', function(event) {
                console.log('Modal calendar cell mouseup event:', event);
            });
            
            // Also add touch events for mobile support
            cell.addEventListener('touchstart', function(event) {
                console.log('Modal calendar cell touchstart event:', event);
                // Prevent scrolling when touching calendar cells
                event.preventDefault();
            });
            
            cell.addEventListener('touchend', function(event) {
                console.log('Modal calendar cell touchend event:', event);
                // Trigger click event on touch end
                handleCalendarClick(event);
            });
            
            console.log('Click event listener attached to cell for date:', dateStr);
            
            // Add a data attribute to track that this cell has event listeners
            cell.setAttribute('data-has-listeners', 'true');
        }
        
        console.log('Modal calendar update completed successfully');
    } catch (error) {
        console.error('Error updating modal calendar:', error);
    }
}

// Ensure the function is globally available
window.updateCalendarModalFromCalendarJs = updateCalendarModalFromCalendarJs;

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
        
        // Fallback: Parse ETA to check if delivery is scheduled for this date
        if (delivery.eta && delivery.eta.includes('Today')) {
            const today = new Date().toISOString().split('T')[0];
            if (dateStr === today) {
                console.log(`Found active delivery for today ${dateStr}:`, delivery);
                deliveries.push({
                    ...delivery,
                    type: 'active'
                });
            }
        }
        
        // Parse ETA for future dates like "Nov 2, 3:30 PM"
        if (delivery.eta && delivery.eta.match(/\w+ \d+/)) {
            try {
                const currentYear = new Date().getFullYear();
                const etaDateStr = delivery.eta.split(',')[0]; // Get "Nov 2" part
                const etaDate = new Date(`${etaDateStr}, ${currentYear}`);
                const etaDateFormatted = etaDate.toISOString().split('T')[0];
                if (dateStr === etaDateFormatted) {
                    console.log(`Found active delivery for ${dateStr}:`, delivery);
                    deliveries.push({
                        ...delivery,
                        type: 'active'
                    });
                }
            } catch (e) {
                // If parsing fails, ignore this delivery
                console.error('Error parsing ETA date:', e);
            }
        }
    });
    
    // Get delivery history for this date
    deliveryHistory.forEach(delivery => {
        if (delivery.completedDate) {
            try {
                const completedDate = new Date(delivery.completedDate);
                const completedDateFormatted = completedDate.toISOString().split('T')[0];
                if (dateStr === completedDateFormatted) {
                    console.log(`Found history delivery for ${dateStr}:`, delivery);
                    deliveries.push({
                        ...delivery,
                        type: 'history'
                    });
                }
            } catch (e) {
                // If parsing fails, try different format
                if (delivery.completedDate.includes(',')) {
                    const currentYear = new Date().getFullYear();
                    const historyDate = new Date(`${delivery.completedDate}, ${currentYear}`);
                    const historyDateFormatted = historyDate.toISOString().split('T')[0];
                    if (dateStr === historyDateFormatted) {
                        console.log(`Found history delivery for ${dateStr}:`, delivery);
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
    if (activeDeliveries.length === 0 && deliveryHistory.length === 0) {
        const mockDeliveries = bookingsData.filter(booking => 
            booking.date.startsWith(dateStr)
        );
        
        mockDeliveries.forEach(booking => {
            deliveries.push({
                id: booking.id,
                dr_number: booking.dr_number,
                date: booking.date,
                origin: booking.origin,
                destination: booking.destination,
                distance: booking.distance,
                additional_costs: booking.additional_costs,
                type: 'mock'
            });
        });
    }
    
    console.log(`Found ${deliveries.length} deliveries for date ${dateStr}`);
    return deliveries;
}

// Initialize calendar function
function initCalendar() {
    console.log('initCalendar function called from calendar.js');
    
    // Make sure this function is globally available
    window.initCalendar = initCalendar;
    
    // Add a visual indicator that calendar initialization started
    const calendarGrid = document.getElementById('calendarGrid');
    console.log('Calendar grid element for initialization:', calendarGrid);
    
    // Set flag to indicate calendar has been initialized
    window.calendarInitialized = true;
    console.log('Calendar initialization flag set');
    
    // Check if we're in the right view
    const bookingView = document.getElementById('bookingView');
    console.log('Booking view during initCalendar:', bookingView);
    if (bookingView) {
        console.log('Booking view class list:', bookingView.classList);
        console.log('Booking view is active:', bookingView.classList.contains('active'));
    }
    
    if (calendarGrid) {
        // Update the calendar display
        updateCalendarFromCalendarJs();
        
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
                updateCalendarFromCalendarJs();
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
                updateCalendarFromCalendarJs();
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
        updateCalendarModalFromCalendarJs();
        
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
                updateCalendarModalFromCalendarJs();
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
                updateCalendarModalFromCalendarJs();
            });
        }
        
        console.log('Modal calendar initialized successfully');
    } else {
        console.log('Modal calendar grid element not found during initialization - this is okay if modal is not open');
    }
}

// Ensure initCalendarModal is globally available
window.initCalendarModal = initCalendarModal;

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

// Fallback function to show booking modal directly
function fallbackShowBookingModal(dateStr) {
    console.log('Using fallback method to show booking modal with date:', dateStr);
    
    // Check if Bootstrap is available
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not available for fallback method');
        return;
    }
    
    const bookingModal = document.getElementById('bookingModal');
    if (bookingModal) {
        console.log('Booking modal element found, attempting to show it');
        
        // Pre-fill the date
        const deliveryDateEl = document.getElementById('deliveryDate');
        if (deliveryDateEl) {
            deliveryDateEl.value = dateStr;
            console.log('Delivery date set to:', dateStr);
        } else {
            console.error('Delivery date element not found');
        }
        
        // Generate a DR number in DR-XXXX format (4 digits)
        const randomNumber = Math.floor(Math.random() * 9000) + 1000;
        const drNumber = `DR-${randomNumber}`;
        const drNumberEl = document.getElementById('drNumber');
        if (drNumberEl) {
            drNumberEl.value = drNumber;
            console.log('DR number set to:', drNumber);
        } else {
            console.error('DR number element not found');
        }
        
        // Show the modal
        try {
            const modal = new bootstrap.Modal(bookingModal, {
                backdrop: true,
                keyboard: true
            });
            modal.show();
            console.log('Booking modal shown using fallback method');
            
            // Set the delivery date and DR number in the form AFTER the modal is shown
            // This ensures it's not cleared by any form reset operations
            setTimeout(() => {
                // Set delivery date
                const deliveryDateEl = document.getElementById('deliveryDate');
                if (deliveryDateEl) {
                    deliveryDateEl.value = dateStr;
                    console.log('Delivery date set to:', dateStr);
                }
                
                // Set DR number
                const randomNumber = Math.floor(Math.random() * 9000) + 1000;
                const drNumber = `DR-${randomNumber}`;
                const drNumberEl = document.getElementById('drNumber');
                if (drNumberEl) {
                    drNumberEl.value = drNumber;
                    console.log('DR number set to:', drNumber);
                } else {
                    console.error('DR number element not found');
                    // Try to find it in the modal
                    const bookingModalElement = document.getElementById('bookingModal');
                    if (bookingModalElement) {
                        const altDrNumberEl = bookingModalElement.querySelector('#drNumber');
                        console.log('Alternative DR Number element search:', altDrNumberEl);
                        if (altDrNumberEl) {
                            altDrNumberEl.value = drNumber;
                            console.log('DR Number value set to:', altDrNumberEl.value);
                        } else {
                            // Try to find by class name as fallback
                            const classDrNumberEl = bookingModalElement.querySelector('.dr-number-input');
                            console.log('Class-based DR Number element search:', classDrNumberEl);
                            if (classDrNumberEl) {
                                classDrNumberEl.value = drNumber;
                                console.log('DR Number value set via class selector:', classDrNumberEl.value);
                            }
                        }
                    }
                }
            }, 100);
        } catch (error) {
            console.error('Error showing booking modal with fallback method:', error);
        }
    } else {
        console.error('Booking modal element not found for fallback method');
        
        // Try to find all elements with class 'modal'
        const allModals = document.querySelectorAll('.modal');
        console.log('All modal elements found:', allModals.length);
        allModals.forEach((modal, index) => {
            console.log(`Modal ${index}:`, modal.id || 'no id');
        });
        
        // Also check for elements with ID containing 'booking'
        const bookingElements = document.querySelectorAll('[id*="booking"]');
        console.log('Elements with ID containing "booking":', bookingElements.length);
        bookingElements.forEach((element, index) => {
            console.log(`Booking element ${index}:`, element.id, element.tagName);
        });
    }
}

// Enhanced function to clean up all modal backdrops
function cleanupAllBackdrops() {
    // Multiple methods to ensure all backdrops are removed
    const methods = [
        // Method 1: Query all backdrop elements
        () => {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => {
                if (backdrop && backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            });
        },
        // Method 2: Get by class name
        () => {
            const backdrops = document.getElementsByClassName('modal-backdrop');
            // Convert to array to avoid issues with live NodeList
            Array.from(backdrops).forEach(backdrop => {
                if (backdrop && backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            });
        },
        // Method 3: Direct body class cleanup
        () => {
            document.body.classList.remove('modal-open');
            document.body.style.overflow = 'auto';
            document.body.style.paddingRight = '0';
        },
        // Method 4: Remove any modal-related classes
        () => {
            const modalElements = document.querySelectorAll('.modal');
            modalElements.forEach(modal => {
                modal.classList.remove('show');
                modal.style.display = 'none';
            });
        }
    ];
    
    // Execute all methods with small delays
    methods.forEach((method, index) => {
        setTimeout(method, index * 25);
    });
    
    // Final cleanup after a longer delay
    setTimeout(() => {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
        document.body.style.paddingRight = '0';
    }, 200);
}

// Helper function to show direct modal (fallback)
function showDirectModal(dateStr) {
    console.log('=== SHOW DIRECT MODAL FALLBACK ===');
    console.log('Date string:', dateStr);
    
    const bookingModal = document.getElementById('bookingModal');
    console.log('Booking modal element:', bookingModal);
    
    if (bookingModal) {
        // Pre-fill the date
        const deliveryDateEl = document.getElementById('deliveryDate');
        if (deliveryDateEl) {
            deliveryDateEl.value = dateStr;
            console.log('Delivery date set to:', dateStr);
        }
        
        // Generate a DR number in DR-XXXX format (4 digits)
        const randomNumber = Math.floor(Math.random() * 9000) + 1000;
        const drNumber = `DR-${randomNumber}`;
        const drNumberEl = document.getElementById('drNumber');
        if (drNumberEl) {
            drNumberEl.value = drNumber;
            console.log('DR number set to:', drNumber);
        }
        
        // Try to use Bootstrap modal first if available
        if (typeof bootstrap !== 'undefined') {
            console.log('Using Bootstrap modal for fallback');
            try {
                // Get existing modal instance or create new one
                let modalInstance = bootstrap.Modal.getInstance(bookingModal);
                console.log('Existing modal instance:', modalInstance);
                
                if (!modalInstance) {
                    console.log('No existing modal instance, creating new one');
                    // Create new modal instance with specific options
                    modalInstance = new bootstrap.Modal(bookingModal, {
                        backdrop: true,  // Allow backdrop
                        keyboard: true,  // Allow keyboard escape
                        focus: true      // Focus on modal when shown
                    });
                    console.log('New modal instance created:', modalInstance);
                }
                
                console.log('Showing modal');
                // Show the modal
                modalInstance.show();
                console.log('Booking modal shown successfully using Bootstrap');
                
                // Set the delivery date and DR number in the form AFTER the modal is shown
                // This ensures it's not cleared by any form reset operations
                setTimeout(() => {
                    // Set delivery date
                    const deliveryDateEl = document.getElementById('deliveryDate');
                    if (deliveryDateEl) {
                        deliveryDateEl.value = dateStr;
                        console.log('Delivery date set to:', dateStr);
                    }
                    
                    // Set DR number
                    const randomNumber = Math.floor(Math.random() * 9000) + 1000;
                    const drNumber = `DR-${randomNumber}`;
                    const drNumberEl = document.getElementById('drNumber');
                    if (drNumberEl) {
                        drNumberEl.value = drNumber;
                        console.log('DR number set to:', drNumber);
                    } else {
                        console.error('DR number element not found');
                        // Try to find it in the modal
                        const bookingModalElement = document.getElementById('bookingModal');
                        if (bookingModalElement) {
                            const altDrNumberEl = bookingModalElement.querySelector('#drNumber');
                            console.log('Alternative DR Number element search:', altDrNumberEl);
                            if (altDrNumberEl) {
                                altDrNumberEl.value = drNumber;
                                console.log('DR Number value set to:', altDrNumberEl.value);
                            } else {
                                // Try to find by class name as fallback
                                const classDrNumberEl = bookingModalElement.querySelector('.dr-number-input');
                                console.log('Class-based DR Number element search:', classDrNumberEl);
                                if (classDrNumberEl) {
                                    classDrNumberEl.value = drNumber;
                                    console.log('DR Number value set via class selector:', classDrNumberEl.value);
                                }
                            }
                        }
                    }
                }, 100);
                
                return;
            } catch (bootstrapError) {
                console.error('Error using Bootstrap modal:', bootstrapError);
                // Fall through to direct DOM manipulation
            }
        }
        
        // Show modal directly using DOM manipulation as last resort
        console.log('Using direct DOM manipulation for fallback');
        bookingModal.style.display = 'block';
        bookingModal.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
        
        console.log('Modal shown using direct method');
        
        // Set the delivery date and DR number in the form AFTER the modal is shown
        // This ensures it's not cleared by any form reset operations
        setTimeout(() => {
            // Set delivery date
            const deliveryDateEl = document.getElementById('deliveryDate');
            if (deliveryDateEl) {
                deliveryDateEl.value = dateStr;
                console.log('Delivery date set to:', dateStr);
            }
            
            // Set DR number
            const randomNumber = Math.floor(Math.random() * 9000) + 1000;
            const drNumber = `DR-${randomNumber}`;
            const drNumberEl = document.getElementById('drNumber');
            if (drNumberEl) {
                drNumberEl.value = drNumber;
                console.log('DR number set to:', drNumber);
            } else {
                console.error('DR number element not found');
                // Try to find it in the modal
                const bookingModalElement = document.getElementById('bookingModal');
                if (bookingModalElement) {
                    const altDrNumberEl = bookingModalElement.querySelector('#drNumber');
                    console.log('Alternative DR Number element search:', altDrNumberEl);
                    if (altDrNumberEl) {
                        altDrNumberEl.value = drNumber;
                        console.log('DR Number value set to:', altDrNumberEl.value);
                    } else {
                        // Try to find by class name as fallback
                        const classDrNumberEl = bookingModalElement.querySelector('.dr-number-input');
                        console.log('Class-based DR Number element search:', classDrNumberEl);
                        if (classDrNumberEl) {
                            classDrNumberEl.value = drNumber;
                            console.log('DR Number value set via class selector:', classDrNumberEl.value);
                        }
                    }
                }
            }
        }, 100);
    } else {
        console.error('Booking modal not found for direct method');
        
        // Try to find all elements with class 'modal'
        const allModals = document.querySelectorAll('.modal');
        console.log('All modal elements found:', allModals.length);
        allModals.forEach((modal, index) => {
            console.log(`Modal ${index}:`, modal.id || 'no id');
        });
        
        // Also check for elements with ID containing 'booking'
        const bookingElements = document.querySelectorAll('[id*="booking"]');
        console.log('Elements with ID containing "booking":', bookingElements.length);
        bookingElements.forEach((element, index) => {
            console.log(`Booking element ${index}:`, element.id, element.tagName);
        });
    }
}

// Enhanced function to add event listeners to calendar cells
function addCalendarCellEventListeners() {
    console.log('=== ADDING CALENDAR CELL EVENT LISTENERS ===');
    
    // Add event listeners to all calendar cells in the main calendar
    const calendarCells = document.querySelectorAll('.calendar-cell[data-date]');
    console.log('Found calendar cells to attach listeners to:', calendarCells.length);
    
    calendarCells.forEach((cell, index) => {
        console.log(`Attaching listeners to cell ${index}:`, cell.dataset.date);
        
        // Remove any existing listeners first to prevent duplicates
        const newCell = cell.cloneNode(true);
        cell.parentNode.replaceChild(newCell, cell);
        
        // Add click event listener
        newCell.addEventListener('click', function(event) {
            console.log('=== MAIN CALENDAR CELL CLICKED ===');
            console.log('Event details:', {
                type: event.type,
                target: event.target,
                currentTarget: event.currentTarget,
                date: this.dataset.date
            });
            
            // Prevent default and stop propagation
            event.preventDefault();
            event.stopPropagation();
            
            const dateStr = this.dataset.date;
            console.log('Opening booking modal for date:', dateStr);
            
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
        
        // Add mouse events for better UX
        newCell.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e3f2fd';
        });
        
        newCell.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    });
    
    console.log('=== FINISHED ADDING CALENDAR CELL EVENT LISTENERS ===');
}

// Enhanced function to add event listeners to modal calendar cells
function addModalCalendarCellEventListeners() {
    console.log('=== ADDING MODAL CALENDAR CELL EVENT LISTENERS ===');
    
    // Add event listeners to all calendar cells in the modal
    const modalCalendarCells = document.querySelectorAll('#calendarGridModal .calendar-cell[data-date]');
    console.log('Found modal calendar cells to attach listeners to:', modalCalendarCells.length);
    
    modalCalendarCells.forEach((cell, index) => {
        console.log(`Attaching listeners to modal cell ${index}:`, cell.dataset.date);
        
        // Remove any existing listeners first to prevent duplicates
        const newCell = cell.cloneNode(true);
        cell.parentNode.replaceChild(newCell, cell);
        
        // Add click event listener
        newCell.addEventListener('click', function(event) {
            console.log('=== MODAL CALENDAR CELL CLICKED ===');
            console.log('Event details:', {
                type: event.type,
                target: event.target,
                currentTarget: event.currentTarget,
                date: this.dataset.date
            });
            
            // Prevent default and stop propagation
            event.preventDefault();
            event.stopPropagation();
            
            const dateStr = this.dataset.date;
            console.log('Opening booking modal for date:', dateStr);
            
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
        
        // Add mouse events for better UX
        newCell.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e3f2fd';
        });
        
        newCell.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    });
    
    console.log('=== FINISHED ADDING MODAL CALENDAR CELL EVENT LISTENERS ===');
}

// Enhanced updateCalendar function with better error handling and retry logic
function updateCalendar() {
    console.log('=== UPDATE CALENDAR FUNCTION CALLED ===');
    
    // Check if booking view is active
    const bookingView = document.getElementById('bookingView');
    if (!bookingView || !bookingView.classList.contains('active')) {
        console.log('Booking view is not active, skipping calendar update');
        return;
    }
    
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) {
        console.warn('Calendar grid element not found, retrying in 100ms...');
        // Retry after a short delay to allow DOM to be ready
        setTimeout(() => {
            const retryCalendarGrid = document.getElementById('calendarGrid');
            if (retryCalendarGrid) {
                console.log('Calendar grid found on retry, updating calendar');
                updateCalendar();
            } else {
                console.error('Calendar grid element still not found after retry');
            }
        }, 100);
        return;
    }
    
    // Clear existing calendar
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const headerCell = document.createElement('div');
        headerCell.className = 'calendar-day-header';
        headerCell.textContent = day;
        calendarGrid.appendChild(headerCell);
    });
    
    // Get first day of month and days in month
    const firstDay = new Date(currentYear, currentMonthIndex, 1);
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-cell empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    // Add cells for each day of the month
    const today = new Date();
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
        
        // Add visual indicator that cell was added
        cell.style.border = '1px solid #ddd';
    }
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthElement = document.getElementById('currentMonth');
    if (currentMonthElement) {
        currentMonthElement.textContent = `${monthNames[currentMonthIndex]} ${currentYear}`;
    }
    
    // Add event listeners to calendar cells
    setTimeout(addCalendarCellEventListeners, 100);
    
    console.log('=== UPDATE CALENDAR FUNCTION COMPLETED ===');
}

// Modify the updateCalendarModal function to ensure event listeners are added
function updateCalendarModal() {
    console.log('=== UPDATE CALENDAR MODAL FUNCTION CALLED ===');
    
    const calendarGridModal = document.getElementById('calendarGridModal');
    if (!calendarGridModal) {
        console.error('Modal calendar grid element not found');
        return;
    }
    
    // Clear existing calendar
    calendarGridModal.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const headerCell = document.createElement('div');
        headerCell.className = 'calendar-day-header';
        headerCell.textContent = day;
        calendarGridModal.appendChild(headerCell);
    });
    
    // Get first day of month and days in month
    const firstDay = new Date(currentYearModal, currentMonthIndexModal, 1);
    const daysInMonth = new Date(currentYearModal, currentMonthIndexModal + 1, 0).getDate();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-cell empty';
        calendarGridModal.appendChild(emptyCell);
    }
    
    // Add cells for each day of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        
        const dateStr = `${currentYearModal}-${(currentMonthIndexModal + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        cell.dataset.date = dateStr;
        
        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = day;
        cell.appendChild(dateNumber);
        
        // Check if this is today
        if (currentYearModal === today.getFullYear() &&
            currentMonthIndexModal === today.getMonth() &&
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
        
        calendarGridModal.appendChild(cell);
        
        // Add visual indicator that cell was added
        cell.style.border = '1px solid #ddd';
    }
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonthModal').textContent = `${monthNames[currentMonthIndexModal]} ${currentYearModal}`;
    
    // Add event listeners to modal calendar cells
    setTimeout(addModalCalendarCellEventListeners, 100);
    
    console.log('=== UPDATE CALENDAR MODAL FUNCTION COMPLETED ===');
}

// Make refresh function globally available
window.refreshCalendarData = function() {
    console.log('Calendar: Refreshing calendar data...');
    
    try {
        // Show loading indicator
        const calendarGrid = document.getElementById('calendarGrid');
        console.log('Calendar grid element for refresh:', calendarGrid);
        
        if (calendarGrid) {
            calendarGrid.style.opacity = '0.6';
            calendarGrid.style.pointerEvents = 'none';
            
            // Add a subtle loading animation
            setTimeout(() => {
                console.log('Updating main calendar');
                updateCalendar();
                calendarGrid.style.opacity = '1';
                calendarGrid.style.pointerEvents = 'auto';
            }, 200);
        } else {
            console.log('Calendar grid not found, updating calendar directly');
            updateCalendar();
        }
        
        // Also refresh modal calendar
        const calendarGridModal = document.getElementById('calendarGridModal');
        console.log('Modal calendar grid element for refresh:', calendarGridModal);
        if (calendarGridModal) {
            calendarGridModal.style.opacity = '0.6';
            calendarGridModal.style.pointerEvents = 'none';
            
            setTimeout(() => {
                console.log('Updating modal calendar');
                updateCalendarModal();
                calendarGridModal.style.opacity = '1';
                calendarGridModal.style.pointerEvents = 'auto';
            }, 200);
        } else {
            console.log('Modal calendar grid not found, updating modal calendar directly');
            updateCalendarModal();
        }
    } catch (error) {
        console.error('Error in refreshCalendarData:', error);
        // Fallback to direct updates
        updateCalendar();
        updateCalendarModal();
    }
};

// Make fallback function globally available
window.fallbackShowBookingModal = fallbackShowBookingModal;

// Make openBookingModal function globally available
window.openBookingModal = openBookingModal;

// Test function to manually trigger the booking modal
window.testBookingModal = function(dateStr = '2023-10-24') {
    console.log('Testing booking modal with date:', dateStr);
    if (typeof openBookingModal === 'function') {
        openBookingModal(dateStr);
    } else if (typeof window.openBookingModal === 'function') {
        window.openBookingModal(dateStr);
    } else {
        fallbackShowBookingModal(dateStr);
    }
};

// Make initCalendar function globally available
window.initCalendar = initCalendar;

// Make calendar update functions globally available
window.updateCalendarFromCalendarJs = updateCalendarFromCalendarJs;
window.updateCalendarModalFromCalendarJs = updateCalendarModalFromCalendarJs;

// Test function to manually initialize the calendar
window.testInitCalendar = function() {
    console.log('=== TESTING CALENDAR INITIALIZATION ===');
    
    // Check if initCalendar function exists
    console.log('initCalendar function exists:', typeof window.initCalendar);
    console.log('initCalendar in window:', window.initCalendar);
    
    if (typeof window.initCalendar === 'function') {
        console.log('Calling window.initCalendar');
        try {
            window.initCalendar();
            console.log('window.initCalendar executed successfully');
        } catch (error) {
            console.error('Error calling window.initCalendar:', error);
        }
    } else if (typeof initCalendar === 'function') {
        console.log('Calling initCalendar');
        try {
            initCalendar();
            console.log('initCalendar executed successfully');
        } catch (error) {
            console.error('Error calling initCalendar:', error);
        }
    } else {
        console.error('initCalendar function not found!');
        // List all available functions
        const allFunctions = Object.keys(window).filter(key => typeof window[key] === 'function');
        console.log('Available functions:', allFunctions.filter(name => name.includes('calendar') || name.includes('init')));
    }
};

// Test function to manually update the calendar
window.testUpdateCalendar = function() {
    console.log('=== TESTING CALENDAR UPDATE ===');
    
    // Check if updateCalendar function exists
    console.log('updateCalendar function exists:', typeof window.updateCalendar);
    console.log('updateCalendar in window:', window.updateCalendar);
    
    if (typeof window.updateCalendar === 'function') {
        console.log('Calling window.updateCalendar');
        try {
            window.updateCalendar();
            console.log('window.updateCalendar executed successfully');
        } catch (error) {
            console.error('Error calling window.updateCalendar:', error);
        }
    } else if (typeof updateCalendar === 'function') {
        console.log('Calling updateCalendar');
        try {
            updateCalendar();
            console.log('updateCalendar executed successfully');
        } catch (error) {
            console.error('Error calling updateCalendar:', error);
        }
    } else {
        console.error('updateCalendar function not found!');
        // List all available functions
        const allFunctions = Object.keys(window).filter(key => typeof window[key] === 'function');
        console.log('Available functions:', allFunctions.filter(name => name.includes('calendar') || name.includes('update')));
    }
};

// Test function to check if all required elements exist
window.testCheckElements = function() {
    console.log('=== TESTING ELEMENT EXISTENCE ===');
    
    const elementsToCheck = [
        'bookingView',
        'calendarGrid',
        'calendarGridModal',
        'bookingModal',
        'prevMonth',
        'nextMonth',
        'prevMonthModal',
        'nextMonthModal'
    ];
    
    elementsToCheck.forEach(elementId => {
        const element = document.getElementById(elementId);
        console.log(`${elementId}:`, element ? 'FOUND' : 'NOT FOUND');
        if (element) {
            console.log(`  Element details:`, {
                id: element.id,
                className: element.className,
                tagName: element.tagName
            });
        }
    });
    
    // Check for calendar cells
    const calendarCells = document.querySelectorAll('.calendar-cell');
    console.log('Calendar cells found:', calendarCells.length);
    
    const modalCalendarCells = document.querySelectorAll('#calendarGridModal .calendar-cell');
    console.log('Modal calendar cells found:', modalCalendarCells.length);
};

// Test function to manually trigger calendar cell click
window.testCalendarCellClick = function() {
    console.log('=== TESTING CALENDAR CELL CLICK ===');
    
    // Try to find a calendar cell manually
    const calendarCells = document.querySelectorAll('.calendar-cell[data-date]');
    console.log('Calendar cells found:', calendarCells.length);
    
    if (calendarCells.length > 0) {
        const firstCell = calendarCells[0];
        console.log('Clicking first cell with date:', firstCell.dataset.date);
        
        // Simulate a click event
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        firstCell.dispatchEvent(clickEvent);
        console.log('Click event dispatched to first calendar cell');
    } else {
        console.error('No calendar cells found');
    }
};

// Add a comprehensive test function to manually trigger everything
window.testCalendarFull = function() {
    console.log('=== TESTING FULL CALENDAR FUNCTIONALITY ===');
    
    // Check if all required functions are available
    console.log('Checking function availability:');
    console.log('initCalendar:', typeof window.initCalendar);
    console.log('updateCalendarFromCalendarJs:', typeof window.updateCalendarFromCalendarJs);
    console.log('openBookingModal:', typeof window.openBookingModal);
    console.log('Bootstrap:', typeof bootstrap);
    
    // Try to initialize calendar
    if (typeof window.initCalendar === 'function') {
        console.log('Calling initCalendar');
        try {
            window.initCalendar();
            console.log('initCalendar executed successfully');
        } catch (error) {
            console.error('Error calling initCalendar:', error);
        }
    } else {
        console.error('initCalendar function not available');
    }
    
    // Try to update calendar
    if (typeof window.updateCalendarFromCalendarJs === 'function') {
        console.log('Calling updateCalendarFromCalendarJs');
        try {
            window.updateCalendarFromCalendarJs();
            console.log('updateCalendarFromCalendarJs executed successfully');
        } catch (error) {
            console.error('Error calling updateCalendarFromCalendarJs:', error);
        }
    } else {
        console.error('updateCalendarFromCalendarJs function not available');
    }
    
    // Check if calendar cells were created
    setTimeout(() => {
        const calendarCells = document.querySelectorAll('.calendar-cell[data-date]');
        console.log('Calendar cells found:', calendarCells.length);
        
        if (calendarCells.length > 0) {
            console.log('First cell details:', {
                element: calendarCells[0],
                date: calendarCells[0].dataset.date,
                hasListeners: calendarCells[0].hasAttribute('data-has-listeners')
            });
            
            // Try to click the first cell
            console.log('Attempting to click first calendar cell');
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            calendarCells[0].dispatchEvent(clickEvent);
        } else {
            console.error('No calendar cells found');
        }
    }, 500);
};

// Ensure event listeners are added when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CONTENT LOADED - ADDING CALENDAR EVENT LISTENERS ===');
    
    // Add event listeners after a delay to ensure DOM is fully ready
    setTimeout(() => {
        addCalendarCellEventListeners();
        addModalCalendarCellEventListeners();
    }, 500);
    
    console.log('=== DOM CONTENT LOADED - CALENDAR EVENT LISTENERS ADDED ===');
});
