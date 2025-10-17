/**
 * TRUCK TYPE UPDATE FIX
 * Updates truck type dropdown options in both booking modal and DR upload modal
 */

console.log('🔧 Loading Truck Type Update Fix...');

(function() {
    'use strict';
    
    // New truck type options as requested
    const newTruckTypes = [
        { value: 'L300', label: 'L300' },
        { value: 'Canter', label: 'Canter' },
        { value: '3PL - AC Logistics', label: '3PL - AC Logistics' },
        { value: '3PL - Linkasia', label: '3PL - Linkasia' },
        { value: '3PL - Crest', label: '3PL - Crest' },
        { value: '3PL - JRS', label: '3PL - JRS' },
        { value: '3PL - AIR21', label: '3PL - AIR21' },
        { value: '3PL - Lalamove', label: '3PL - Lalamove' },
        { value: '3PL - Transportify', label: '3PL - Transportify' }
    ];
    
    /**
     * Update truck type dropdown options
     */
    function updateTruckTypeDropdown(selectElement) {
        if (!selectElement) {
            console.warn('⚠️ Truck type select element not found');
            return false;
        }
        
        console.log('🔄 Updating truck type dropdown:', selectElement.id);
        
        // Store current selected value
        const currentValue = selectElement.value;
        
        // Clear existing options except the first placeholder
        selectElement.innerHTML = '<option value="">Select truck type</option>';
        
        // Add new options
        newTruckTypes.forEach(truckType => {
            const option = document.createElement('option');
            option.value = truckType.value;
            option.textContent = truckType.label;
            selectElement.appendChild(option);
        });
        
        // Restore selected value if it still exists
        if (currentValue && newTruckTypes.some(t => t.value === currentValue)) {
            selectElement.value = currentValue;
        }
        
        console.log(`✅ Updated truck type dropdown with ${newTruckTypes.length} options`);
        return true;
    }
    
    /**
     * Update all truck type dropdowns on the page
     */
    function updateAllTruckTypeDropdowns() {
        console.log('🔄 Updating all truck type dropdowns...');
        
        let updatedCount = 0;
        
        // Update booking modal truck type dropdown
        const bookingTruckType = document.getElementById('truckType');
        if (bookingTruckType) {
            if (updateTruckTypeDropdown(bookingTruckType)) {
                updatedCount++;
                console.log('✅ Updated booking modal truck type dropdown');
            }
        }
        
        // Update DR upload modal truck type dropdown
        const drTruckType = document.getElementById('drTruckType');
        if (drTruckType) {
            if (updateTruckTypeDropdown(drTruckType)) {
                updatedCount++;
                console.log('✅ Updated DR upload modal truck type dropdown');
            }
        }
        
        // Look for any other truck type dropdowns that might exist
        const allTruckSelects = document.querySelectorAll('select[id*="truck" i], select[id*="Truck" i]');
        allTruckSelects.forEach(select => {
            if (select.id !== 'truckType' && select.id !== 'drTruckType') {
                // Check if this looks like a truck type dropdown by examining options
                const hasL300 = Array.from(select.options).some(opt => opt.value === 'L300');
                const hasCanter = Array.from(select.options).some(opt => opt.value === 'Canter');
                
                if (hasL300 || hasCanter) {
                    if (updateTruckTypeDropdown(select)) {
                        updatedCount++;
                        console.log(`✅ Updated additional truck type dropdown: ${select.id}`);
                    }
                }
            }
        });
        
        console.log(`🎉 Updated ${updatedCount} truck type dropdowns total`);
        return updatedCount;
    }
    
    /**
     * Monitor for dynamically created dropdowns
     */
    function setupTruckTypeMonitoring() {
        console.log('👀 Setting up truck type dropdown monitoring...');
        
        // Monitor for new elements being added to the DOM
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the added node contains truck type dropdowns
                            const truckSelects = node.querySelectorAll ? 
                                node.querySelectorAll('select[id*="truck" i], select[id*="Truck" i]') : [];
                            
                            truckSelects.forEach(select => {
                                // Check if this looks like a truck type dropdown
                                const hasL300 = Array.from(select.options).some(opt => opt.value === 'L300');
                                const hasCanter = Array.from(select.options).some(opt => opt.value === 'Canter');
                                
                                if (hasL300 || hasCanter) {
                                    console.log('🔍 Found dynamically created truck type dropdown:', select.id);
                                    setTimeout(() => updateTruckTypeDropdown(select), 100);
                                }
                            });
                        }
                    });
                }
            });
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ Truck type dropdown monitoring active');
    }
    
    /**
     * Handle modal show events to update dropdowns
     */
    function setupModalEventHandlers() {
        console.log('🔗 Setting up modal event handlers...');
        
        // Handle booking modal
        const bookingModal = document.getElementById('bookingModal');
        if (bookingModal) {
            bookingModal.addEventListener('shown.bs.modal', function() {
                console.log('📋 Booking modal shown, updating truck type dropdown...');
                setTimeout(() => {
                    const truckType = document.getElementById('truckType');
                    if (truckType) {
                        updateTruckTypeDropdown(truckType);
                    }
                }, 100);
            });
        }
        
        // Handle DR upload modal
        const drUploadModal = document.getElementById('drUploadModal');
        if (drUploadModal) {
            drUploadModal.addEventListener('shown.bs.modal', function() {
                console.log('📤 DR upload modal shown, updating truck type dropdown...');
                setTimeout(() => {
                    const drTruckType = document.getElementById('drTruckType');
                    if (drTruckType) {
                        updateTruckTypeDropdown(drTruckType);
                    }
                }, 100);
            });
        }
        
        console.log('✅ Modal event handlers set up');
    }
    
    /**
     * Initialize truck type updates
     */
    function initializeTruckTypeUpdates() {
        console.log('🚀 Initializing Truck Type Update Fix...');
        
        // Update existing dropdowns immediately
        updateAllTruckTypeDropdowns();
        
        // Set up monitoring for dynamic dropdowns
        setupTruckTypeMonitoring();
        
        // Set up modal event handlers
        setupModalEventHandlers();
        
        // Periodic check to ensure dropdowns stay updated
        setInterval(() => {
            const bookingTruckType = document.getElementById('truckType');
            const drTruckType = document.getElementById('drTruckType');
            
            // Check if dropdowns need updating (if they still have old options)
            if (bookingTruckType && bookingTruckType.options.length < newTruckTypes.length + 1) {
                console.log('🔄 Periodic update: Booking modal truck type dropdown');
                updateTruckTypeDropdown(bookingTruckType);
            }
            
            if (drTruckType && drTruckType.options.length < newTruckTypes.length + 1) {
                console.log('🔄 Periodic update: DR upload modal truck type dropdown');
                updateTruckTypeDropdown(drTruckType);
            }
        }, 5000); // Check every 5 seconds
        
        console.log('✅ Truck Type Update Fix initialized successfully');
    }
    
    // Export functions for external use
    window.updateTruckTypeDropdown = updateTruckTypeDropdown;
    window.updateAllTruckTypeDropdowns = updateAllTruckTypeDropdowns;
    window.getTruckTypes = () => newTruckTypes;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTruckTypeUpdates);
    } else {
        initializeTruckTypeUpdates();
    }
    
    console.log('✅ Truck Type Update Fix loaded');
    
})();

// Export module info
window.truckTypeUpdateFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString(),
    truckTypes: [
        'L300',
        'Canter', 
        '3PL - AC Logistics',
        '3PL - Linkasia',
        '3PL - Crest',
        '3PL - JRS',
        '3PL - AIR21',
        '3PL - Lalamove',
        '3PL - Transportify'
    ]
};