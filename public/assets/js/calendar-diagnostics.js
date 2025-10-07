// Calendar diagnostics script to identify issues
console.log('=== CALENDAR DIAGNOSTICS SCRIPT LOADED ===');

// Function to run comprehensive diagnostics
function runCalendarDiagnostics() {
    console.log('=== RUNNING CALENDAR DIAGNOSTICS ===');
    
    // 1. Check if required DOM elements exist
    checkDOMElements();
    
    // 2. Check if required JavaScript functions are available
    checkJavaScriptFunctions();
    
    // 3. Check if CSS is properly applied
    checkCSS();
    
    // 4. Try to initialize calendar manually
    tryManualInitialization();
    
    console.log('=== CALENDAR DIAGNOSTICS COMPLETE ===');
}

// Check if required DOM elements exist
function checkDOMElements() {
    console.log('=== CHECKING DOM ELEMENTS ===');
    
    const elementsToCheck = [
        'bookingView',
        'calendarGrid',
        'calendarGridModal',
        'bookingModal',
        'prevMonth',
        'nextMonth',
        'prevMonthModal',
        'nextMonthModal',
        'currentMonth'
    ];
    
    elementsToCheck.forEach(elementId => {
        const element = document.getElementById(elementId);
        console.log(`${elementId}:`, element ? 'FOUND' : 'NOT FOUND');
        if (element) {
            console.log(`  Element details:`, {
                id: element.id,
                className: element.className,
                tagName: element.tagName,
                style: {
                    display: window.getComputedStyle(element).display,
                    visibility: window.getComputedStyle(element).visibility
                }
            });
        }
    });
    
    // Check for calendar cells
    const calendarCells = document.querySelectorAll('.calendar-cell');
    console.log('Calendar cells found:', calendarCells.length);
    
    const modalCalendarCells = document.querySelectorAll('#calendarGridModal .calendar-cell');
    console.log('Modal calendar cells found:', modalCalendarCells.length);
}

// Check if required JavaScript functions are available
function checkJavaScriptFunctions() {
    console.log('=== CHECKING JAVASCRIPT FUNCTIONS ===');
    
    const functionsToCheck = [
        'initCalendar',
        'updateCalendar',
        'updateCalendarFromCalendarJs',
        'openBookingModal',
        'fallbackShowBookingModal',
        'initBookingModal'
    ];
    
    functionsToCheck.forEach(funcName => {
        const func = window[funcName];
        console.log(`${funcName}:`, typeof func === 'function' ? 'AVAILABLE' : 'NOT AVAILABLE');
        if (typeof func === 'function') {
            console.log(`  Function source:`, func.toString().substring(0, 100) + '...');
        }
    });
    
    // Check for Bootstrap
    console.log('Bootstrap available:', typeof bootstrap !== 'undefined');
    if (typeof bootstrap !== 'undefined') {
        console.log('Bootstrap Modal available:', typeof bootstrap.Modal !== 'undefined');
    }
}

// Check if CSS is properly applied
function checkCSS() {
    console.log('=== CHECKING CSS ===');
    
    const calendarGrid = document.getElementById('calendarGrid');
    if (calendarGrid) {
        const computedStyle = window.getComputedStyle(calendarGrid);
        console.log('Calendar grid styles:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            height: computedStyle.height,
            opacity: computedStyle.opacity
        });
        
        // Check if calendar grid has children
        console.log('Calendar grid children:', calendarGrid.children.length);
        
        // Check if calendar grid is visible in viewport
        const rect = calendarGrid.getBoundingClientRect();
        console.log('Calendar grid position:', rect);
    }
    
    // Check CSS file inclusion
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    const cssFiles = Array.from(cssLinks).map(link => link.href);
    console.log('CSS files loaded:', cssFiles);
    
    // Check if our CSS file is loaded
    const ourCSS = cssFiles.find(href => href.includes('style.css'));
    console.log('Our CSS file loaded:', !!ourCSS);
}

// Try to initialize calendar manually
function tryManualInitialization() {
    console.log('=== TRYING MANUAL INITIALIZATION ===');
    
    // Check if booking view is active
    const bookingView = document.getElementById('bookingView');
    console.log('Booking view:', bookingView);
    if (bookingView) {
        console.log('Booking view is active:', bookingView.classList.contains('active'));
    }
    
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
        
        // Try alternative methods
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
            
            // Try to manually create calendar
            createCalendarManually();
        }
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
    
    // Add visual indicator that we're creating the calendar
    const loadingIndicator = document.createElement('div');
    loadingIndicator.textContent = 'Creating calendar...';
    loadingIndicator.style.padding = '20px';
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.style.color = '#666';
    calendarGrid.appendChild(loadingIndicator);
    
    // Small delay to ensure DOM update
    setTimeout(() => {
        // Remove loading indicator
        calendarGrid.innerHTML = '';
        
        // Add day headers with visual styling
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const headerCell = document.createElement('div');
            headerCell.className = 'calendar-day-header';
            headerCell.textContent = day;
            headerCell.style.fontWeight = 'bold';
            headerCell.style.textAlign = 'center';
            headerCell.style.padding = '10px';
            headerCell.style.backgroundColor = '#f0f0f0';
            headerCell.style.border = '1px solid #ddd';
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
            emptyCell.style.border = '1px solid #eee';
            emptyCell.style.backgroundColor = '#fafafa';
            emptyCell.style.aspectRatio = '1';
            calendarGrid.appendChild(emptyCell);
        }
        
        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.style.border = '1px solid #ddd';
            cell.style.backgroundColor = '#fff';
            cell.style.aspectRatio = '1';
            cell.style.display = 'flex';
            cell.style.flexDirection = 'column';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.cursor = 'pointer';
            cell.style.transition = 'all 0.2s ease';
            
            const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            cell.dataset.date = dateStr;
            
            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = day;
            dateNumber.style.fontSize = '16px';
            dateNumber.style.fontWeight = '500';
            cell.appendChild(dateNumber);
            
            // Check if this is today
            const today = new Date();
            if (currentYear === today.getFullYear() &&
                currentMonth === today.getMonth() &&
                day === today.getDate()) {
                cell.classList.add('today');
                cell.style.backgroundColor = '#e3f2fd';
                cell.style.fontWeight = 'bold';
                cell.style.boxShadow = '0 0 0 2px #2196f3';
            }
            
            // Add hover effect
            cell.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#e3f2fd';
                this.style.transform = 'scale(1.05)';
            });
            
            cell.addEventListener('mouseleave', function() {
                if (!this.classList.contains('today')) {
                    this.style.backgroundColor = '#fff';
                }
                this.style.transform = 'scale(1)';
            });
            
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
                    } else {
                        console.error('No fallback method available');
                        // Show alert as last resort
                        alert(`Booking for ${dateStr}\n(DR number would be generated here)`);
                    }
                }
            });
            
            // Add visual indicator
            const indicator = document.createElement('div');
            indicator.className = 'booking-indicator';
            indicator.style.width = '8px';
            indicator.style.height = '8px';
            indicator.style.borderRadius = '50%';
            indicator.style.marginTop = '4px';
            indicator.style.backgroundColor = '#4caf50';
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
        
        console.log('Calendar created manually with visual styling');
    }, 100);
}

// Run diagnostics when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CONTENT LOADED - RUNNING CALENDAR DIAGNOSTICS ===');
    
    // Small delay to ensure all scripts are loaded
    setTimeout(runCalendarDiagnostics, 1000);
});

// Also run when window is loaded
window.addEventListener('load', function() {
    console.log('=== WINDOW LOADED - RUNNING CALENDAR DIAGNOSTICS ===');
    
    // Small delay to ensure all scripts are loaded
    setTimeout(runCalendarDiagnostics, 2000);
});

// Make diagnostic function available globally
window.runCalendarDiagnostics = runCalendarDiagnostics;

console.log('=== CALENDAR DIAGNOSTICS SCRIPT LOADED COMPLETE ===');