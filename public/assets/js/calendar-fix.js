// Calendar fix script to ensure proper initialization
console.log('=== CALENDAR FIX SCRIPT LOADED ===');

// Function to initialize the calendar properly
function fixCalendarInitialization() {
    console.log('=== FIXING CALENDAR INITIALIZATION ===');
    
    // Check if the calendar grid element exists
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) {
        console.error('Calendar grid element not found!');
        return;
    }
    
    // Check if calendar is already initialized
    if (window.calendarInitialized) {
        console.log('Calendar already initialized');
        return;
    }
    
    // Make sure required functions are available
    if (typeof window.initCalendar !== 'function') {
        console.error('initCalendar function not available');
        // Try to find it in different places
        if (typeof window.initCalendar === 'function') {
            window.initCalendar = window.initCalendar;
        } else {
            console.error('initCalendar function not found anywhere');
            return;
        }
    }
    
    // Initialize the calendar
    try {
        console.log('Calling initCalendar function');
        window.initCalendar();
        window.calendarInitialized = true;
        console.log('Calendar initialized successfully');
    } catch (error) {
        console.error('Error initializing calendar:', error);
        // Try alternative initialization
        tryAlternativeCalendarInit();
    }
}

// Alternative calendar initialization
function tryAlternativeCalendarInit() {
    console.log('=== TRYING ALTERNATIVE CALENDAR INITIALIZATION ===');
    
    // Check if updateCalendarFromCalendarJs is available
    if (typeof window.updateCalendarFromCalendarJs === 'function') {
        console.log('Calling updateCalendarFromCalendarJs');
        try {
            window.updateCalendarFromCalendarJs();
            console.log('Calendar updated successfully with alternative method');
        } catch (error) {
            console.error('Error with alternative calendar update:', error);
        }
    } else {
        console.error('updateCalendarFromCalendarJs function not available');
        // Try to manually create the calendar
        createCalendarManually();
    }
}

// Manual calendar creation
function createCalendarManually() {
    console.log('=== CREATING CALENDAR MANUALLY ===');
    
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) {
        console.error('Calendar grid element not found for manual creation');
        return;
    }
    
    // Clear existing content
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const headerCell = document.createElement('div');
        headerCell.className = 'calendar-day-header';
        headerCell.textContent = day;
        calendarGrid.appendChild(headerCell);
    });
    
    // Get current date
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get first day of month and days in month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-cell empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        
        const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        cell.dataset.date = dateStr;
        
        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = day;
        cell.appendChild(dateNumber);
        
        // Check if this is today
        const today = new Date();
        if (currentYear === today.getFullYear() &&
            currentMonth === today.getMonth() &&
            day === today.getDate()) {
            cell.classList.add('today');
        }
        
        // Add click event to open booking modal
        cell.addEventListener('click', function() {
            console.log('Calendar cell clicked:', dateStr);
            if (typeof window.openBookingModal === 'function') {
                window.openBookingModal(dateStr);
            } else {
                console.error('openBookingModal function not available');
                // Try fallback method
                if (typeof window.fallbackShowBookingModal === 'function') {
                    window.fallbackShowBookingModal(dateStr);
                }
            }
        });
        
        // Add visual indicator
        const indicator = document.createElement('div');
        indicator.className = 'booking-indicator';
        cell.appendChild(indicator);
        
        calendarGrid.appendChild(cell);
    }
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthElement = document.getElementById('currentMonth');
    if (currentMonthElement) {
        currentMonthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
    
    console.log('Calendar created manually');
}

// Function to ensure calendar functions are globally available
function ensureCalendarFunctions() {
    console.log('=== ENSURING CALENDAR FUNCTIONS ARE AVAILABLE ===');
    
    // Make sure all calendar functions are globally available
    if (typeof window.initCalendar !== 'function' && typeof initCalendar === 'function') {
        window.initCalendar = initCalendar;
        console.log('initCalendar function made globally available');
    }
    
    if (typeof window.openBookingModal !== 'function' && typeof openBookingModal === 'function') {
        window.openBookingModal = openBookingModal;
        console.log('openBookingModal function made globally available');
    }
    
    if (typeof window.updateCalendarFromCalendarJs !== 'function' && typeof updateCalendarFromCalendarJs === 'function') {
        window.updateCalendarFromCalendarJs = updateCalendarFromCalendarJs;
        console.log('updateCalendarFromCalendarJs function made globally available');
    }
}

// Function to check if we're on the booking view and initialize calendar
function checkAndInitCalendar() {
    console.log('=== CHECKING AND INITIALIZATING CALENDAR ===');
    
    // Check if we're on the booking view
    const bookingView = document.getElementById('bookingView');
    if (bookingView && bookingView.classList.contains('active')) {
        console.log('Booking view is active, initializing calendar');
        fixCalendarInitialization();
    } else {
        console.log('Booking view is not active');
        // Listen for view changes
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.id === 'bookingView' && target.classList.contains('active')) {
                        console.log('Booking view became active, initializing calendar');
                        fixCalendarInitialization();
                        // Disconnect observer after initialization
                        observer.disconnect();
                    }
                }
            });
        });
        
        if (bookingView) {
            observer.observe(bookingView, { attributes: true });
        }
    }
}

// Run when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CONTENT LOADED - CALENDAR FIX ===');
    
    // Ensure functions are available
    ensureCalendarFunctions();
    
    // Small delay to ensure all scripts are loaded
    setTimeout(checkAndInitCalendar, 500);
});

// Also run when window is loaded
window.addEventListener('load', function() {
    console.log('=== WINDOW LOADED - CALENDAR FIX ===');
    
    // Ensure functions are available
    ensureCalendarFunctions();
    
    // Small delay to ensure all scripts are loaded
    setTimeout(checkAndInitCalendar, 1000);
});

// Test function to manually trigger calendar initialization
window.testCalendarFix = function() {
    console.log('=== MANUAL CALENDAR FIX TEST ===');
    fixCalendarInitialization();
};

// Test function to manually create calendar
window.testCreateCalendar = function() {
    console.log('=== MANUAL CALENDAR CREATION TEST ===');
    createCalendarManually();
};

console.log('=== CALENDAR FIX SCRIPT LOADED COMPLETE ===');