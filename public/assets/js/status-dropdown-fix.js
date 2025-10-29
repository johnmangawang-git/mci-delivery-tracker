/**
 * Status Dropdown Fix
 * Specifically targets status dropdowns and badges to replace "Delayed" with "Sold Undelivered"
 */

console.log('📋 Loading Status Dropdown Fix...');

window.statusDropdownFix = {
    
    /**
     * Fix status dropdowns specifically
     */
    fixStatusDropdowns() {
        try {
            // Find all select elements that might contain status options
            const selects = document.querySelectorAll('select');
            
            selects.forEach(select => {
                const options = select.querySelectorAll('option');
                options.forEach(option => {
                    if (option.textContent.includes('Delayed')) {
                        option.textContent = option.textContent.replace('Delayed', 'Sold Undelivered');
                        console.log('✅ Fixed dropdown option: Delayed → Sold Undelivered');
                    }
                    if (option.text && option.text.includes('Delayed')) {
                        option.text = option.text.replace('Delayed', 'Sold Undelivered');
                    }
                });
            });
            
        } catch (error) {
            console.warn('Error fixing status dropdowns:', error);
        }
    },
    
    /**
     * Fix status badges
     */
    fixStatusBadges() {
        try {
            // Find all badge elements
            const badges = document.querySelectorAll('.badge, .status-badge, [class*="badge"]');
            
            badges.forEach(badge => {
                if (badge.textContent.includes('Delayed')) {
                    badge.textContent = badge.textContent.replace('Delayed', 'Sold Undelivered');
                    console.log('✅ Fixed status badge: Delayed → Sold Undelivered');
                }
                if (badge.innerHTML.includes('Delayed')) {
                    badge.innerHTML = badge.innerHTML.replace(/Delayed/g, 'Sold Undelivered');
                }
            });
            
        } catch (error) {
            console.warn('Error fixing status badges:', error);
        }
    },
    
    /**
     * Fix table cells with status
     */
    fixTableStatus() {
        try {
            // Find all table cells that might contain status
            const cells = document.querySelectorAll('td, th');
            
            cells.forEach(cell => {
                if (cell.textContent.includes('Delayed')) {
                    cell.textContent = cell.textContent.replace('Delayed', 'Sold Undelivered');
                    console.log('✅ Fixed table cell: Delayed → Sold Undelivered');
                }
                if (cell.innerHTML.includes('Delayed')) {
                    cell.innerHTML = cell.innerHTML.replace(/Delayed/g, 'Sold Undelivered');
                }
            });
            
        } catch (error) {
            console.warn('Error fixing table status:', error);
        }
    },
    
    /**
     * Override common status generation functions
     */
    overrideStatusFunctions() {
        // Override any function that generates status options
        if (typeof window.generateStatusOptions === 'function') {
            const originalGenerateStatusOptions = window.generateStatusOptions;
            window.generateStatusOptions = function(...args) {
                const result = originalGenerateStatusOptions.apply(this, args);
                // Replace Delayed in the result
                if (typeof result === 'string') {
                    return result.replace(/Delayed/g, 'Sold Undelivered');
                }
                return result;
            };
        }
        
        // Override populateActiveDeliveriesTable if it exists
        if (typeof window.populateActiveDeliveriesTable === 'function') {
            const originalPopulate = window.populateActiveDeliveriesTable;
            window.populateActiveDeliveriesTable = function(...args) {
                const result = originalPopulate.apply(this, args);
                // Fix status after table is populated
                setTimeout(() => {
                    window.statusDropdownFix.fixAll();
                }, 100);
                return result;
            };
        }
    },
    
    /**
     * Fix all status displays
     */
    fixAll() {
        this.fixStatusDropdowns();
        this.fixStatusBadges();
        this.fixTableStatus();
    },
    
    /**
     * Initialize status dropdown fix
     */
    initialize() {
        console.log('🚀 Initializing status dropdown fix...');
        
        // Initial fix
        this.fixAll();
        
        // Override functions
        this.overrideStatusFunctions();
        
        // Monitor for changes
        const observer = new MutationObserver(() => {
            this.fixAll();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Periodic fix
        setInterval(() => {
            this.fixAll();
        }, 3000);
        
        console.log('✅ Status dropdown fix initialized');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            window.statusDropdownFix.initialize();
        }, 1500);
    });
} else {
    setTimeout(() => {
        window.statusDropdownFix.initialize();
    }, 1500);
}

// Also run after page load and when tables are updated
window.addEventListener('load', function() {
    setTimeout(() => {
        window.statusDropdownFix.fixAll();
    }, 3000);
});

console.log('✅ Status Dropdown Fix loaded');