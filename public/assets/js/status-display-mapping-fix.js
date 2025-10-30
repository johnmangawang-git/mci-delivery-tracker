/**
 * Status Display Mapping Fix
 * Changes UI display of "Delayed" to "Canceled" while keeping code unchanged
 */

console.log('🏷️ Loading Status Display Mapping Fix...');

window.statusDisplayMapping = {
    
    // Mapping from internal status to display text
    statusMap: {
        'Delayed': 'Canceled',
        'In Transit': 'In Transit',
        'On Schedule': 'On Schedule',
        'Completed': 'Completed',
        'Signed': 'Signed',
        'Active': 'Active',
        'Pending': 'Pending'
    },
    
    // Reverse mapping for internal use
    reverseMap: {
        'Canceled': 'Delayed',
        'In Transit': 'In Transit',
        'On Schedule': 'On Schedule',
        'Completed': 'Completed',
        'Signed': 'Signed',
        'Active': 'Active',
        'Pending': 'Pending'
    },
    
    /**
     * Get display text for internal status
     */
    getDisplayText(internalStatus) {
        return this.statusMap[internalStatus] || internalStatus;
    },
    
    /**
     * Get internal status from display text
     */
    getInternalStatus(displayText) {
        return this.reverseMap[displayText] || displayText;
    },
    
    /**
     * Override the generateStatusOptions function to use display mapping
     */
    overrideStatusGeneration() {
        // Store original function
        if (typeof window.generateStatusOptions === 'function') {
            window.originalGenerateStatusOptions = window.generateStatusOptions;
            
            // Store reference to this object for use in the override
            const statusMapping = this;
            
            // Override with display mapping
            window.generateStatusOptions = (currentStatus, deliveryId) => {
                const availableStatuses = ['In Transit', 'On Schedule', 'Delayed', 'Canceled'];
                
                // Don't allow changing from Completed or Signed status
                if (currentStatus === 'Completed' || currentStatus === 'Signed') {
                    return `<div class="status-option disabled">Status cannot be changed</div>`;
                }
                
                return availableStatuses.map(status => {
                    const isSelected = status === currentStatus ? 'selected' : '';
                    const statusInfo = window.getStatusInfo ? window.getStatusInfo(status) : { class: 'bg-secondary', icon: 'bi-question-circle' };
                    
                    // Use proper display text mapping
                    let displayText = status;
                                if (status === 'Delayed') {
                                    displayText = 'Canceled';
                                } else if (status === 'Canceled') {
                                    displayText = 'Canceled';                    }
                    
                    return `
                        <div class="status-option ${isSelected}" 
                             onclick="updateDeliveryStatusById('${deliveryId}', '${status}')">
                            <i class="bi ${statusInfo.icon}"></i> ${displayText}
                        </div>
                    `;
                }).join('');
            };
            
            console.log('✅ Status generation function overridden with display mapping');
        }
    },
    
    /**
     * Update status badges in tables to show display text
     */
    updateStatusBadges() {
        try {
            // Update status badges in active deliveries table
            const statusBadges = document.querySelectorAll('.badge');
            
            statusBadges.forEach(badge => {
                const currentText = badge.textContent.trim();
                
                // Check if this is a status badge containing "Delayed"
                if (currentText.includes('Delayed')) {
                    const displayText = this.getDisplayText('Delayed');
                    badge.innerHTML = badge.innerHTML.replace('Delayed', displayText);
                }
            });
            
            // Update status cells in tables
            const statusCells = document.querySelectorAll('td');
            statusCells.forEach(cell => {
                if (cell.textContent.trim() === 'Delayed') {
                    cell.textContent = this.getDisplayText('Delayed');
                }
            });
            
        } catch (error) {
            console.warn('Error updating status badges:', error);
        }
    },
    
    /**
     * Override toast messages to show display text
     */
    overrideToastMessages() {
        if (typeof window.showToast === 'function') {
            window.originalShowToast = window.showToast;
            
            window.showToast = (message, type) => {
                // Replace internal status names with display names in messages
                let displayMessage = message;
                for (const [internal, display] of Object.entries(this.statusMap)) {
                    displayMessage = displayMessage.replace(new RegExp(`"${internal}"`, 'g'), `"${display}"`);
                    displayMessage = displayMessage.replace(new RegExp(`${internal}`, 'g'), display);
                }
                
                return window.originalShowToast(displayMessage, type);
            };
        }
    },
    
    /**
     * Monitor for dynamic content updates and apply mapping
     */
    startMonitoring() {
        // Use MutationObserver to watch for DOM changes
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    shouldUpdate = true;
                }
            });
            
            if (shouldUpdate) {
                // Debounce updates
                clearTimeout(this.updateTimeout);
                this.updateTimeout = setTimeout(() => {
                    this.updateStatusBadges();
                }, 100);
            }
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        console.log('✅ Status display monitoring started');
    },
    
    /**
     * Initialize status display mapping
     */
    initialize() {
        console.log('🚀 Initializing status display mapping...');
        
        // Override functions
        this.overrideStatusGeneration();
        this.overrideToastMessages();
        
        // Update existing content
        this.updateStatusBadges();
        
        // Start monitoring for changes
        this.startMonitoring();
        
        // Update periodically to catch any missed updates
        setInterval(() => {
            this.updateStatusBadges();
        }, 5000); // Every 5 seconds
        
        console.log('✅ Status display mapping initialized');
        console.log('📋 Status mapping: "Delayed" → "Canceled"');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.statusDisplayMapping.initialize();
    }, 1000);
});

// Also initialize when data is loaded
window.addEventListener('deliveriesLoaded', function() {
    setTimeout(() => {
        window.statusDisplayMapping.updateStatusBadges();
    }, 500);
});

console.log('✅ Status Display Mapping Fix loaded');