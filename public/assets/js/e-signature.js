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
 * @param {string} customerContact - Vendor number information
 * @param {string} truckPlate - Truck plate number
 * @param {string} deliveryRoute - Delivery route (origin to destination)
 * @param {Array} drNumbers - Optional array of multiple DR numbers
 */
function openRobustSignaturePad(drNumber = '', customerName = '', customerContact = '', truckPlate = '', deliveryRoute = '', drNumbers = null) {
    console.log('Opening robust signature pad with:', { drNumber, customerName, customerContact, truckPlate, deliveryRoute, drNumbers });
    
    try {
        // Store delivery details temporarily
        window.tempDeliveryDetails = {
            drNumber: drNumber,
            customerName: customerName,
            customerContact: customerContact,
            truckPlate: truckPlate,
            deliveryRoute: deliveryRoute,
            drNumbers: drNumbers
        };
        
        // Show modal using Bootstrap
        const modalElement = document.getElementById('eSignatureModal');
        if (!modalElement) {
            console.error('E-Signature modal element not found');
            showError('E-Signature modal not found');
            return;
        }
        
        // Set up event listener to populate fields after modal is shown
        const initHandler = function() {
            console.log('E-Signature modal fully shown, populating fields');
            
            // Set delivery details in modal after it's visible
            const drNumberField = document.getElementById('ePodDrNumber');
            const customerNameField = document.getElementById('ePodCustomerName');
            const customerContactField = document.getElementById('ePodCustomerContact');
            const truckPlateField = document.getElementById('ePodTruckPlate');
            const deliveryRouteField = document.getElementById('ePodDeliveryRoute');
            
            console.log('Setting field values:', window.tempDeliveryDetails);
            
            if (drNumberField) drNumberField.value = window.tempDeliveryDetails.drNumber || '';
            if (customerNameField) customerNameField.value = window.tempDeliveryDetails.customerName || '';
            if (customerContactField) customerContactField.value = window.tempDeliveryDetails.customerContact || '';
            if (truckPlateField) truckPlateField.value = window.tempDeliveryDetails.truckPlate || '';
            if (deliveryRouteField) deliveryRouteField.value = window.tempDeliveryDetails.deliveryRoute || '';
            
            // Store multiple DR numbers if provided
            if (window.tempDeliveryDetails.drNumbers && Array.isArray(window.tempDeliveryDetails.drNumbers)) {
                window.multipleDRNumbers = window.tempDeliveryDetails.drNumbers;
            } else {
                delete window.multipleDRNumbers;
            }
            
            // Initialize signature pad
            setTimeout(() => {
                initializeRobustSignaturePad();
            }, 200); // Give a bit more time for rendering
            
            // Remove event listener to prevent duplicates
            modalElement.removeEventListener('shown.bs.modal', initHandler);
            
            // Clean up temp data
            delete window.tempDeliveryDetails;
        };
        
        modalElement.addEventListener('shown.bs.modal', initHandler);
        
        // Show the modal
        const eSignatureModal = new bootstrap.Modal(modalElement);
        eSignatureModal.show();
        
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
        // Show loading state
        const saveBtn = document.getElementById('saveSignatureBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        saveBtn.disabled = true;
        
        // Validate signature pad
        if (!robustSignaturePad || !signaturePadInitialized) {
            showError('Signature pad not initialized');
            resetSaveButton(saveBtn, originalText);
            return;
        }
        
        // Check if signature is empty
        if (robustSignaturePad.isEmpty()) {
            showError('Please provide a signature before saving');
            resetSaveButton(saveBtn, originalText);
            return;
        }
        
        // Get signature data
        const signatureData = getRobustSignatureData();
        if (!signatureData) {
            showError('Failed to capture signature. Please try again.');
            resetSaveButton(saveBtn, originalText);
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
            }, saveBtn, originalText);
        } else {
            // Save single signature
            saveSingleSignature({
                drNumber,
                customerName,
                customerContact,
                truckPlate,
                deliveryRoute,
                signatureData
            }, saveBtn, originalText);
        }
        
    } catch (error) {
        console.error('Error saving signature:', error);
        showError('Failed to save signature. Please try again.');
        
        // Reset save button
        const saveBtn = document.getElementById('saveSignatureBtn');
        if (saveBtn) {
            const originalText = '<i class="bi bi-save me-2"></i>Save Signature';
            resetSaveButton(saveBtn, originalText);
        }
    }
}

/**
 * Reset the save button to its original state
 */
function resetSaveButton(button, originalText) {
    if (button) {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

/**
 * Save multiple signatures for multiple DR numbers
 */
function saveMultipleSignatures(drNumbers, signatureInfo, saveBtn = null, originalText = '<i class="bi bi-save me-2"></i>Save Signature') {
    console.log('Saving multiple signatures for DR numbers:', drNumbers);
    
    try {
        // Process each DR number - USING LOCAL SYSTEM TIME
        const timestamp = window.getLocalSystemTimeISO ? window.getLocalSystemTimeISO() : new Date().toISOString();
        const promises = [];
        const ePodRecords = [];
        
        drNumbers.forEach(drNum => {
            // Parse route information
            const [origin, destination] = signatureInfo.deliveryRoute.split(' to ');
            
            // Create E-POD record with field names matching Supabase schema
            const ePodRecord = {
                dr_number: drNum,  // Use drNum instead of signatureInfo.drNumber
                customer_name: signatureInfo.customerName,
                customer_contact: signatureInfo.customerContact,
                vendor_number: signatureInfo.customerContact,  // For compatibility
                truck_plate: signatureInfo.truckPlate,
                origin: origin || 'Unknown Origin',
                destination: destination || 'Unknown Destination',
                signature_data: signatureInfo.signatureData,
                status: 'Completed',
                signed_at: timestamp
            };
            
            ePodRecords.push(ePodRecord);
            
            // Save using dataService if available, otherwise fallback to localStorage
            if (typeof window.dataService !== 'undefined' && typeof window.dataService.saveEPodRecord === 'function') {
                console.log('Saving EPOD record via dataService for DR:', drNum);
                // Chain both the EPOD save and status update
                const savePromise = window.dataService.saveEPodRecord(ePodRecord)
                    .then(() => {
                        console.log('Updating delivery status to Completed for DR:', drNum);
                        return window.dataService.updateDeliveryStatus(drNum, 'Completed');
                    });
                promises.push(savePromise);
            } else {
                console.log('Saving EPOD record via localStorage for DR:', drNum);
                // Fallback to localStorage
                let existingRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
                existingRecords.push(ePodRecord);
                localStorage.setItem('ePodRecords', JSON.stringify(existingRecords));
                // Update delivery status locally
                updateDeliveryStatus(drNum, 'Completed');
            }
        });
        
        // Wait for all saves to complete if there are promises
        if (promises.length > 0) {
            console.log('Waiting for', promises.length, 'EPOD save operations to complete');
            Promise.all(promises).then(async (results) => {
                console.log('All EPOD records saved successfully:', results.length);
                
                // Invalidate cache to ensure fresh data is loaded
                if (window.dataService && typeof window.dataService.invalidateCache === 'function') {
                    console.log('Invalidating deliveries cache');
                    window.dataService.invalidateCache('deliveries');
                }
                
                showToast(`Saved signatures for ${drNumbers.length} deliveries`, 'success');
                
                // Small delay to ensure database propagation
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Refresh views after all saves complete
                refreshDeliveryViews();
            }).catch(error => {
                console.error('Error saving E-POD records:', error);
                // Even if there's an error, still refresh views to show what we can
                refreshDeliveryViews();
                showToast('Error saving some E-POD records. Please try again.', 'error');
            }).finally(() => {
                // Always close modal
                closeESignatureModal();
                // Reset save button
                resetSaveButton(saveBtn, originalText);
            });
        } else {
            // If no promises (using localStorage), show success and refresh immediately
            console.log('EPOD records saved to localStorage, refreshing views');
            showToast(`Saved signatures for ${drNumbers.length} deliveries`, 'success');
            // Refresh views
            refreshDeliveryViews();
            // Close modal
            closeESignatureModal();
            // Reset save button
            resetSaveButton(saveBtn, originalText);
        }
        
    } catch (error) {
        console.error('Error saving multiple signatures:', error);
        showError('Failed to save signatures. Please try again.');
        // Even on error, close modal
        closeESignatureModal();
        // Reset save button
        resetSaveButton(saveBtn, originalText);
        throw error;
    }
}

/**
 * Save a single signature
 */
async function saveSingleSignature(signatureInfo, saveBtn = null, originalText = '<i class="bi bi-save me-2"></i>Save Signature') {
    console.log('Saving single signature for DR:', signatureInfo.drNumber);
    
    try {
        const timestamp = window.getLocalSystemTimeISO ? window.getLocalSystemTimeISO() : new Date().toISOString();
        const [origin, destination] = signatureInfo.deliveryRoute.split(' to ');

        const ePodRecord = {
            dr_number: signatureInfo.drNumber,
            customer_name: signatureInfo.customerName,
            customer_contact: signatureInfo.customerContact,
            vendor_number: signatureInfo.customerContact,
            truck_plate: signatureInfo.truckPlate,
            origin: origin || 'Unknown Origin',
            destination: destination || 'Unknown Destination',
            signature_data: signatureInfo.signatureData,
            status: 'Completed',
            signed_at: timestamp
        };

        console.log('Created EPOD record:', ePodRecord);

        if (typeof window.dataService !== 'undefined' && typeof window.dataService.saveEPodRecord === 'function') {
            console.log('Saving EPOD record via dataService');
            // Step 1: Await saving of the EPOD record.
            const epodResult = await window.dataService.saveEPodRecord(ePodRecord);
            console.log('EPOD record saved via dataService:', epodResult);

            // Step 2: Await the update of the delivery status in the main 'deliveries' table.
            console.log('📝 Step 2: Updating delivery status to Completed in Supabase for DR:', signatureInfo.drNumber);
            const updateResult = await window.dataService.updateDeliveryStatus(signatureInfo.drNumber, 'Completed');
            console.log('✅ Status update result:', updateResult);
            
            // Step 3: Invalidate cache to ensure fresh data is loaded
            if (window.dataService && typeof window.dataService.invalidateCache === 'function') {
                console.log('🗑️ Step 3: Invalidating deliveries cache');
                window.dataService.invalidateCache('deliveries');
            }
            
            // Step 4: If both are successful, show toast and refresh UI from the source of truth (database).
            console.log('✅ Step 4: E-POD saved and status updated successfully!');
            showToast('E-POD saved and status updated successfully!', 'success');
            
            // Small delay to ensure database propagation
            console.log('⏳ Waiting 300ms for database propagation...');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            console.log('🔄 Step 5: Refreshing delivery views...');
            refreshDeliveryViews();
            console.log('✅ Workflow complete! DR should now be in history.');

        } else {
            // Fallback to localStorage (less ideal, but maintained for offline)
            console.log('Saving EPOD record via localStorage - dataService not available');
            let ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
            const existingIndex = ePodRecords.findIndex(r => r.dr_number === ePodRecord.dr_number);
            if (existingIndex >= 0) {
                ePodRecords[existingIndex] = ePodRecord;
            } else {
                ePodRecords.push(ePodRecord);
            }
            localStorage.setItem('ePodRecords', JSON.stringify(ePodRecords));
            
            // Manually trigger the local update logic
            updateDeliveryStatus(signatureInfo.drNumber, 'Completed');
            showToast('E-POD saved successfully (local)!', 'success');
            refreshDeliveryViews();
        }

    } catch (error) {
        console.error('Error in saveSingleSignature flow:', error);
        showError('Failed to save signature and update status. Please check connection and try again.');
        // Do not refresh views on error to avoid inconsistent state
    } finally {
        // Always close modal and reset the button
        closeESignatureModal();
        resetSaveButton(saveBtn, originalText);
    }
}

/**
 * Close the E-Signature modal
 */
function closeESignatureModal() {
    // Close modal
    const modalElement = document.getElementById('eSignatureModal');
    if (modalElement) {
        const eSignatureModal = bootstrap.Modal.getInstance(modalElement);
        if (eSignatureModal) {
            eSignatureModal.hide();
        }
    }
}

/**
 * Refresh delivery views after saving signature
 */
function refreshDeliveryViews() {
    console.log('Refreshing delivery views');
    
    // Refresh active deliveries view
    if (typeof loadActiveDeliveries === 'function') {
        try {
            loadActiveDeliveries();
            console.log('Active deliveries view refreshed');
        } catch (error) {
            console.error('Error refreshing active deliveries view:', error);
        }
    }
    
    // Refresh delivery history view
    if (typeof loadDeliveryHistory === 'function') {
        try {
            loadDeliveryHistory();
            console.log('Delivery history view refreshed');
        } catch (error) {
            console.error('Error refreshing delivery history view:', error);
        }
    }
    
    // Refresh E-POD view
    if (typeof loadEPodDeliveries === 'function') {
        try {
            loadEPodDeliveries();
            console.log('E-POD view refreshed');
        } catch (error) {
            console.error('Error refreshing E-POD view:', error);
        }
    }
    
    // Update dashboard if available
    if (typeof updateBookingViewDashboard === 'function') {
        try {
            setTimeout(() => {
                updateBookingViewDashboard();
                console.log('Booking view dashboard updated');
            }, 100);
        } catch (error) {
            console.error('Error updating booking view dashboard:', error);
        }
    }
}

/**
 * Update delivery status in active deliveries and move to history if completed
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
        
        // Update in global activeDeliveries array if it exists and move to history if completed
        if (window.activeDeliveries && Array.isArray(window.activeDeliveries)) {
            const deliveryIndex = window.activeDeliveries.findIndex(d => (d.drNumber || d.dr_number) === drNumber);
            console.log('Delivery index found in activeDeliveries:', deliveryIndex);
            if (deliveryIndex !== -1) {
                const delivery = window.activeDeliveries[deliveryIndex];
                delivery.status = newStatus;
                
                // Only set completion date if it doesn't already exist to preserve original completion time
                if ((!delivery.completedDate || delivery.completedDate === '') && 
                    (!delivery.completedDateTime || delivery.completedDateTime === '') && 
                    (!delivery.signedAt || delivery.signedAt === '')) {
                    delivery.completedDate = new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    delivery.completedDateTime = new Date().toISOString();
                    delivery.signedAt = new Date().toISOString();
                }
                
                // If status is Completed, move to delivery history
                if (newStatus === 'Completed') {
                    console.log('Moving delivery to history');
                    // Add to delivery history
                    if (!window.deliveryHistory) {
                        window.deliveryHistory = [];
                    }
                    window.deliveryHistory.unshift(delivery);
                    console.log('Added to history, new history length:', window.deliveryHistory.length);
                    
                    // Remove from active deliveries
                    window.activeDeliveries.splice(deliveryIndex, 1);
                    console.log('Removed from active, new active length:', window.activeDeliveries.length);
                    
                    // Save both arrays using the existing save functions - FIXED: Ensure proper saving to database
                    if (typeof window.saveToLocalStorage === 'function') {
                        console.log('Saving to localStorage');
                        window.saveToLocalStorage();
                    }
                    
                    // Also save to Supabase if dataService is available
                    if (typeof window.dataService !== 'undefined' && typeof window.dataService.saveDelivery === 'function') {
                        console.log('Saving to Supabase');
                        // Save the completed delivery to history
                        window.dataService.saveDelivery(delivery).catch(error => {
                            console.error('Error saving completed delivery to Supabase:', error);
                        });
                        
                        // Also update the global arrays in Supabase
                        if (typeof window.saveToDatabase === 'function') {
                            window.saveToDatabase().catch(error => {
                                console.error('Error saving arrays to Supabase:', error);
                            });
                        }
                    }
                }
            } else {
                console.log('Delivery not found in activeDeliveries array');
                // If not found in activeDeliveries, check if it's already in history
                if (window.deliveryHistory && Array.isArray(window.deliveryHistory)) {
                    const historyIndex = window.deliveryHistory.findIndex(d => (d.drNumber || d.dr_number) === drNumber);
                    console.log('Delivery index found in deliveryHistory:', historyIndex);
                    if (historyIndex !== -1) {
                        // Update status in history if needed
                        window.deliveryHistory[historyIndex].status = newStatus;
                        console.log('Updated delivery status in history');
                        
                        // Save to localStorage
                        if (typeof window.saveToLocalStorage === 'function') {
                            window.saveToLocalStorage();
                        }
                        
                        // Also save to Supabase if dataService is available
                        if (typeof window.dataService !== 'undefined' && typeof window.dataService.saveDelivery === 'function') {
                            window.dataService.saveDelivery(window.deliveryHistory[historyIndex]).catch(error => {
                                console.error('Error saving updated delivery to Supabase:', error);
                            });
                        }
                    }
                }
            }
        }
        
        // Also update in the delivery history view if it exists
        const historyRows = document.querySelectorAll('#deliveryHistoryTableBody tr');
        historyRows.forEach(row => {
            const drCell = row.querySelector('td:nth-child(2)'); // DR Number is in the second column
            if (drCell && drCell.textContent.trim() === drNumber) {
                const statusCell = row.querySelector('td:nth-child(9)'); // Status is in the 9th column
                if (statusCell) {
                    statusCell.innerHTML = `<span class="badge bg-success">
                        <i class="bi bi-check-circle"></i> ${newStatus}
                    </span>`;
                    
                    // Add signed badge if not already present
                    const existingSignedBadge = row.querySelector('.badge.bg-warning');
                    if (!existingSignedBadge) {
                        statusCell.innerHTML += `
                            <span class="badge bg-warning text-dark ms-1">
                                <i class="bi bi-pen"></i> Signed
                            </span>
                        `;
                    }
                }
                
                // Mark the row as signed
                row.classList.add('table-success');
            }
        });
        
        // Update analytics dashboard stats
        if (typeof window.updateDashboardStats === 'function') {
            setTimeout(() => {
                window.updateDashboardStats();
            }, 100);
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