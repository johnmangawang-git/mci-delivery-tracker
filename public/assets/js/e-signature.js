/**
 * Robust E-Signature Implementation
 * A more reliable signature pad solution with enhanced error handling and initialization
 */

// Global variables for the robust E-Signature system
let robustSignaturePad = null;
let signaturePadInitialized = false;

/**
 * Initialize the robust signature pad system
 */
function initRobustESignature() {
    console.log('Initializing robust E-Signature system');
    
    // Make functions globally accessible
    window.openRobustSignaturePad = openRobustSignaturePad;
    window.initializeRobustSignaturePad = initializeRobustSignaturePad;
    window.getRobustSignatureData = getRobustSignatureData;
    window.clearRobustSignature = clearRobustSignature;
    window.destroyRobustSignaturePad = destroyRobustSignaturePad;
    
    console.log('Robust E-Signature system initialized');
}

/**
 * Open the robust signature pad modal
 * @param {string} drNumber - Delivery receipt number
 * @param {string} customerName - Customer name
 * @param {string} customerContact - Customer contact information
 * @param {string} truckPlate - Truck plate number
 * @param {string} deliveryRoute - Delivery route (origin to destination)
 * @param {Array} drNumbers - Optional array of multiple DR numbers
 */
function openRobustSignaturePad(drNumber = '', customerName = '', customerContact = '', truckPlate = '', deliveryRoute = '', drNumbers = null) {
    console.log('Opening robust signature pad with:', { drNumber, customerName, customerContact, truckPlate, deliveryRoute, drNumbers });
    
    try {
        // Set delivery details in modal
        document.getElementById('ePodDrNumber').value = drNumber || '';
        document.getElementById('ePodCustomerName').value = customerName || 'Customer Name';
        document.getElementById('ePodCustomerContact').value = customerContact || '09123456789';
        document.getElementById('ePodTruckPlate').value = truckPlate || 'ABC123';
        document.getElementById('ePodDeliveryRoute').value = deliveryRoute || 'Origin to Destination';
        
        // Store multiple DR numbers if provided
        if (drNumbers && Array.isArray(drNumbers)) {
            window.multipleDRNumbers = drNumbers;
        } else {
            delete window.multipleDRNumbers;
        }
        
        // Show modal using Bootstrap
        const modalElement = document.getElementById('eSignatureModal');
        if (!modalElement) {
            console.error('E-Signature modal element not found');
            showError('E-Signature modal not found');
            return;
        }
        
        const eSignatureModal = new bootstrap.Modal(modalElement);
        eSignatureModal.show();
        
        // Initialize signature pad after modal is fully shown
        const initHandler = function() {
            console.log('E-Signature modal fully shown, initializing signature pad');
            setTimeout(() => {
                initializeRobustSignaturePad();
            }, 200); // Give a bit more time for rendering
            
            // Remove event listener to prevent duplicates
            modalElement.removeEventListener('shown.bs.modal', initHandler);
        };
        
        modalElement.addEventListener('shown.bs.modal', initHandler);
        
    } catch (error) {
        console.error('Error opening robust signature pad:', error);
        showError('Failed to open signature pad. Please try again.');
    }
}

/**
 * Initialize the signature pad with robust error handling
 */
function initializeRobustSignaturePad() {
    console.log('Initializing robust signature pad');
    
    try {
        // Check if SignaturePad library is available
        if (typeof SignaturePad === 'undefined') {
            console.error('SignaturePad library not loaded');
            showError('Signature pad library not loaded. Please refresh the page.');
            return false;
        }
        
        // Get canvas element
        const canvas = document.getElementById('signaturePad');
        if (!canvas) {
            console.error('Signature canvas element not found');
            showError('Signature pad not found. Please refresh the page.');
            return false;
        }
        
        console.log('Canvas element found:', canvas);
        
        // Clean up any existing instance
        if (robustSignaturePad) {
            destroyRobustSignaturePad();
        }
        
        // Ensure canvas has proper dimensions
        const container = canvas.parentElement;
        if (container) {
            // Calculate dimensions based on container
            const rect = container.getBoundingClientRect();
            const width = Math.min(rect.width, 600); // Max 600px width
            const height = Math.min(300, rect.height * 0.8); // Responsive height
            
            console.log('Setting canvas dimensions:', width, 'x', height);
            
            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;
            
            // Ensure canvas style matches
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
        }
        
        // Create new SignaturePad instance with optimized settings
        robustSignaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)',
            minWidth: 1.5,
            maxWidth: 3,
            throttle: 16, // Throttle for performance
            velocityFilterWeight: 0.7
        });
        
        console.log('Robust SignaturePad created successfully:', robustSignaturePad);
        signaturePadInitialized = true;
        
        // Setup UI controls
        setupRobustSignatureControls();
        
        // Add resize handler
        setupResizeHandler(canvas, container);
        
        return true;
        
    } catch (error) {
        console.error('Error initializing robust signature pad:', error);
        showError('Failed to initialize signature pad. Please try again.');
        signaturePadInitialized = false;
        return false;
    }
}

/**
 * Setup signature pad controls (clear and save buttons)
 */
function setupRobustSignatureControls() {
    console.log('Setting up robust signature controls');
    
    try {
        // Setup clear button
        const clearBtn = document.getElementById('clearSignatureBtn');
        if (clearBtn) {
            // Remove existing event listeners by cloning
            const newClearBtn = clearBtn.cloneNode(true);
            clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
            
            // Add click event
            newClearBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                clearRobustSignature();
            });
            
            console.log('Clear button setup completed');
        } else {
            console.warn('Clear button not found');
        }
        
        // Setup save button
        const saveBtn = document.getElementById('saveSignatureBtn');
        if (saveBtn) {
            // Remove existing event listeners by cloning
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            
            // Add click event
            newSaveBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                saveRobustSignature();
            });
            
            console.log('Save button setup completed');
        } else {
            console.warn('Save button not found');
        }
        
    } catch (error) {
        console.error('Error setting up signature controls:', error);
    }
}

/**
 * Setup resize handler for responsive signature pad
 */
function setupResizeHandler(canvas, container) {
    if (!canvas || !container) return;
    
    // Debounced resize handler
    let resizeTimeout;
    const handleResize = function() {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        resizeTimeout = setTimeout(() => {
            if (robustSignaturePad && signaturePadInitialized) {
                console.log('Handling resize for signature pad');
                
                // Get current signature data before resize
                let signatureData = null;
                if (!robustSignaturePad.isEmpty()) {
                    signatureData = robustSignaturePad.toDataURL();
                }
                
                // Resize canvas
                const rect = container.getBoundingClientRect();
                const width = Math.min(rect.width, 600);
                const height = Math.min(300, rect.height * 0.8);
                
                canvas.width = width;
                canvas.height = height;
                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
                
                // Restore signature data after resize
                if (signatureData) {
                    robustSignaturePad.fromDataURL(signatureData);
                }
            }
        }, 250);
    };
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
}

/**
 * Clear the signature pad
 */
function clearRobustSignature() {
    console.log('Clearing robust signature pad');
    
    try {
        if (robustSignaturePad && signaturePadInitialized) {
            robustSignaturePad.clear();
            console.log('Signature cleared successfully');
        } else {
            console.warn('Signature pad not initialized');
        }
    } catch (error) {
        console.error('Error clearing signature:', error);
    }
}

/**
 * Get signature data
 * @returns {string|null} Data URL of signature or null if empty
 */
function getRobustSignatureData() {
    try {
        if (robustSignaturePad && signaturePadInitialized && !robustSignaturePad.isEmpty()) {
            return robustSignaturePad.toDataURL('image/png');
        }
        return null;
    } catch (error) {
        console.error('Error getting signature data:', error);
        return null;
    }
}

/**
 * Save the signature and associated delivery information
 */
function saveRobustSignature() {
    console.log('Saving robust signature');
    
    try {
        // Validate signature pad
        if (!robustSignaturePad || !signaturePadInitialized) {
            showError('Signature pad not initialized');
            return;
        }
        
        // Check if signature is empty
        if (robustSignaturePad.isEmpty()) {
            showError('Please provide a signature before saving');
            return;
        }
        
        // Get signature data
        const signatureData = getRobustSignatureData();
        if (!signatureData) {
            showError('Failed to capture signature. Please try again.');
            return;
        }
        
        // Get delivery details
        const drNumber = document.getElementById('ePodDrNumber').value;
        const customerName = document.getElementById('ePodCustomerName').value;
        const customerContact = document.getElementById('ePodCustomerContact').value;
        const truckPlate = document.getElementById('ePodTruckPlate').value;
        const deliveryRoute = document.getElementById('ePodDeliveryRoute').value;
        
        console.log('Saving signature for:', { drNumber, customerName, customerContact, truckPlate, deliveryRoute });
        
        // Handle multiple DR numbers if present
        if (window.multipleDRNumbers && window.multipleDRNumbers.length > 0) {
            saveMultipleSignatures(window.multipleDRNumbers, {
                customerName,
                customerContact,
                truckPlate,
                deliveryRoute,
                signatureData
            });
        } else {
            // Save single signature
            saveSingleSignature({
                drNumber,
                customerName,
                customerContact,
                truckPlate,
                deliveryRoute,
                signatureData
            });
        }
        
        // Close modal
        const modalElement = document.getElementById('eSignatureModal');
        if (modalElement) {
            const eSignatureModal = bootstrap.Modal.getInstance(modalElement);
            if (eSignatureModal) {
                eSignatureModal.hide();
            }
        }
        
        // Show success message
        showToast('Signature saved successfully!', 'success');
        
        // Refresh views
        refreshDeliveryViews();
        
    } catch (error) {
        console.error('Error saving signature:', error);
        showError('Failed to save signature. Please try again.');
    }
}

/**
 * Save multiple signatures for multiple DR numbers
 */
function saveMultipleSignatures(drNumbers, signatureInfo) {
    console.log('Saving multiple signatures for DR numbers:', drNumbers);
    
    try {
        let ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
        const timestamp = new Date().toISOString();
        
        // Process each DR number
        drNumbers.forEach(drNum => {
            // Parse route information
            const [origin, destination] = signatureInfo.deliveryRoute.split(' to ');
            
            // Create E-POD record
            const ePodRecord = {
                drNumber: drNum,
                customerName: signatureInfo.customerName,
                customerContact: signatureInfo.customerContact,
                truckPlate: signatureInfo.truckPlate,
                origin: origin || 'Unknown Origin',
                destination: destination || 'Unknown Destination',
                signature: signatureInfo.signatureData,
                status: 'Completed',
                signedAt: timestamp,
                timestamp: timestamp
            };
            
            ePodRecords.push(ePodRecord);
            
            // Update delivery status
            updateDeliveryStatus(drNum, 'Completed');
        });
        
        // Save to localStorage
        localStorage.setItem('ePodRecords', JSON.stringify(ePodRecords));
        
        showToast(`Saved signatures for ${drNumbers.length} deliveries`, 'success');
        
    } catch (error) {
        console.error('Error saving multiple signatures:', error);
        throw error;
    }
}

/**
 * Save a single signature
 */
function saveSingleSignature(signatureInfo) {
    console.log('Saving single signature for DR:', signatureInfo.drNumber);
    
    try {
        let ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
        const timestamp = new Date().toISOString();
        
        // Parse route information
        const [origin, destination] = signatureInfo.deliveryRoute.split(' to ');
        
        // Create E-POD record
        const ePodRecord = {
            drNumber: signatureInfo.drNumber,
            customerName: signatureInfo.customerName,
            customerContact: signatureInfo.customerContact,
            truckPlate: signatureInfo.truckPlate,
            origin: origin || 'Unknown Origin',
            destination: destination || 'Unknown Destination',
            signature: signatureInfo.signatureData,
            status: 'Completed',
            signedAt: timestamp,
            timestamp: timestamp
        };
        
        ePodRecords.push(ePodRecord);
        
        // Update delivery status
        updateDeliveryStatus(signatureInfo.drNumber, 'Completed');
        
        // Save to localStorage
        localStorage.setItem('ePodRecords', JSON.stringify(ePodRecords));
        
    } catch (error) {
        console.error('Error saving single signature:', error);
        throw error;
    }
}

/**
 * Refresh delivery views after saving signature
 */
function refreshDeliveryViews() {
    // Refresh active deliveries view
    if (typeof loadActiveDeliveries === 'function') {
        loadActiveDeliveries();
    }
    
    // Refresh E-POD view
    if (typeof loadEPodDeliveries === 'function') {
        loadEPodDeliveries();
    }
    
    // Update dashboard if available
    if (typeof updateBookingViewDashboard === 'function') {
        updateBookingViewDashboard();
    }
}

/**
 * Update delivery status in active deliveries
 */
function updateDeliveryStatus(drNumber, newStatus) {
    console.log(`Updating DR ${drNumber} status to: ${newStatus}`);
    
    try {
        // Update UI if the delivery is in the active deliveries view
        const activeDeliveriesRows = document.querySelectorAll('#activeDeliveriesTableBody tr');
        activeDeliveriesRows.forEach(row => {
            const drCell = row.querySelector('td:nth-child(2)');
            if (drCell && drCell.textContent.trim() === drNumber) {
                const statusCell = row.querySelector('td:nth-child(9)');
                if (statusCell) {
                    statusCell.innerHTML = `<span class="badge bg-success">
                        <i class="bi bi-check-circle"></i> ${newStatus}
                    </span>`;
                }
                
                // Mark the row as signed
                row.classList.add('table-success');
            }
        });
        
        // Update in global activeDeliveries array if it exists
        if (window.activeDeliveries && Array.isArray(window.activeDeliveries)) {
            const deliveryIndex = window.activeDeliveries.findIndex(d => d.drNumber === drNumber);
            if (deliveryIndex !== -1) {
                const delivery = window.activeDeliveries[deliveryIndex];
                delivery.status = newStatus;
                delivery.completedDate = new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        }
        
    } catch (error) {
        console.error('Error updating delivery status:', error);
    }
}

/**
 * Destroy the signature pad instance
 */
function destroyRobustSignaturePad() {
    console.log('Destroying robust signature pad');
    
    try {
        if (robustSignaturePad) {
            robustSignaturePad.off();
            robustSignaturePad = null;
        }
        signaturePadInitialized = false;
        console.log('Signature pad destroyed successfully');
    } catch (error) {
        console.error('Error destroying signature pad:', error);
    }
}

// Initialize the robust E-Signature system when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRobustESignature);
} else {
    initRobustESignature();
}

// Make functions globally accessible as per project requirements
window.openRobustSignaturePad = openRobustSignaturePad;
window.initializeRobustSignaturePad = initializeRobustSignaturePad;
window.getRobustSignatureData = getRobustSignatureData;
window.clearRobustSignature = clearRobustSignature;
window.destroyRobustSignaturePad = destroyRobustSignaturePad;