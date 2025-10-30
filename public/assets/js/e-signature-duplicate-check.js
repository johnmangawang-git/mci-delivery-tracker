/**
 * E-SIGNATURE DUPLICATE CHECK
 * Adds duplicate DR detection before opening e-signature modal
 * Allows customization of duplicate handling behavior
 */

console.log('🔍 Loading E-Signature Duplicate Check...');

(function() {
    'use strict';
    
    /**
     * Configuration for duplicate handling
     */
    const duplicateConfig = {
        // What field to use for duplicate detection
        primaryKey: 'drNumber', // Options: 'drNumber', 'serialNumber', 'itemNumber', 'id'
        
        // Alternative fields to check (fallbacks)
        alternativeKeys: ['dr_number', 'DR_Number', 'drNum'],
        
        // How to handle duplicates when found
        duplicateAction: 'prompt', // Options: 'prompt', 'signAll', 'signFirst', 'cancel'
        
        // Whether to show duplicate info in the modal
        showDuplicateInfo: true,
        
        // Custom message for duplicate prompt
        duplicateMessage: 'Multiple deliveries found with the same DR number. How would you like to proceed?'
    };
    
    /**
     * Find duplicates based on the configured key
     */
    function findDuplicates(targetValue, searchKey = duplicateConfig.primaryKey) {
        const activeDeliveries = window.activeDeliveries || [];
        const duplicates = [];
        
        // Search in active deliveries
        activeDeliveries.forEach((delivery, index) => {
            const primaryValue = getFieldValue(delivery, searchKey);
            const alternativeValues = duplicateConfig.alternativeKeys.map(key => getFieldValue(delivery, key));
            
            if (primaryValue === targetValue || alternativeValues.includes(targetValue)) {
                duplicates.push({
                    ...delivery,
                    source: 'active',
                    index: index,
                    matchedField: primaryValue === targetValue ? searchKey : 
                                 alternativeValues.find(val => val === targetValue)
                });
            }
        });
        
        return duplicates;
    }
    
    /**
     * Get field value with fallbacks
     */
    function getFieldValue(obj, fieldName) {
        return obj[fieldName] || obj[fieldName.toLowerCase()] || obj[fieldName.toUpperCase()] || '';
    }
    
    /**
     * Show duplicate selection modal
     */
    function showDuplicateSelectionModal(duplicates, originalParams) {
        const modalHtml = `
            <div class="modal fade" id="duplicateSelectionModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Duplicate ${duplicateConfig.primaryKey.toUpperCase()} Found
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-3">${duplicateConfig.duplicateMessage}</p>
                            
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Select</th>
                                            <th>DR Number</th>
                                            <th>Customer</th>
                                            <th>Item Description</th>
                                            <th>Serial Number</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${duplicates.map((dup, index) => `
                                            <tr>
                                                <td>
                                                    <input type="checkbox" class="form-check-input duplicate-select" 
                                                           value="${index}" ${index === 0 ? 'checked' : ''}>
                                                </td>
                                                <td><strong>${dup.drNumber || dup.dr_number || 'N/A'}</strong></td>
                                                <td>${dup.customerName || dup.customer_name || 'N/A'}</td>
                                                <td>${dup.itemDescription || dup.item_description || 'N/A'}</td>
                                                <td>${dup.serialNumber || dup.serial_number || 'N/A'}</td>
                                                <td>
                                                    <span class="badge bg-${getStatusColor(dup.status)}">${dup.status || 'N/A'}</span>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="alert alert-info mt-3">
                                <strong>Options:</strong>
                                <ul class="mb-0">
                                    <li><strong>Sign Selected:</strong> Open e-signature for selected items only</li>
                                    <li><strong>Sign All:</strong> Group all items under one signature</li>
                                    <li><strong>Cancel:</strong> Return without signing</li>
                                </ul>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="signSelectedDuplicates()">Sign Selected</button>
                            <button type="button" class="btn btn-success" onclick="signAllDuplicates()">Sign All</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('duplicateSelectionModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Store data for later use
        window.duplicateSelectionData = {
            duplicates: duplicates,
            originalParams: originalParams
        };
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('duplicateSelectionModal'));
        modal.show();
    }
    
    /**
     * Get status color for badge
     */
    function getStatusColor(status) {
        switch (status?.toLowerCase()) {
            case 'active': return 'success';
            case 'in transit': return 'primary';
            case 'delayed': return 'warning';
            case 'completed': return 'success';
            case 'signed': return 'info';
            default: return 'secondary';
        }
    }
    
    /**
     * Handle signing selected duplicates
     */
    function signSelectedDuplicates() {
        const selectedCheckboxes = document.querySelectorAll('.duplicate-select:checked');
        const selectedIndices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
        
        if (selectedIndices.length === 0) {
            alert('Please select at least one item to sign.');
            return;
        }
        
        const { duplicates, originalParams } = window.duplicateSelectionData;
        const selectedDuplicates = selectedIndices.map(index => duplicates[index]);
        
        // Close duplicate modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('duplicateSelectionModal'));
        modal.hide();
        
        // Open e-signature with selected items
        if (selectedDuplicates.length === 1) {
            const item = selectedDuplicates[0];
            openOriginalESignature(
                item.drNumber || item.dr_number,
                item.customerName || item.customer_name,
                item.vendorNumber || item.vendor_number,
                item.truckPlateNumber || item.truck_plate_number,
                `${item.origin || ''} to ${item.destination || ''}`,
                null
            );
        } else {
            // Multiple items - pass array of DR numbers
            const drNumbers = selectedDuplicates.map(item => item.drNumber || item.dr_number);
            openOriginalESignature(
                drNumbers[0], // Primary DR
                selectedDuplicates[0].customerName || selectedDuplicates[0].customer_name,
                selectedDuplicates[0].vendorNumber || selectedDuplicates[0].vendor_number,
                selectedDuplicates[0].truckPlateNumber || selectedDuplicates[0].truck_plate_number,
                `${selectedDuplicates[0].origin || ''} to ${selectedDuplicates[0].destination || ''}`,
                drNumbers
            );
        }
    }
    
    /**
     * Handle signing all duplicates
     */
    function signAllDuplicates() {
        const { duplicates, originalParams } = window.duplicateSelectionData;
        
        // Close duplicate modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('duplicateSelectionModal'));
        modal.hide();
        
        // Open e-signature with all items
        const drNumbers = duplicates.map(item => item.drNumber || item.dr_number);
        openOriginalESignature(
            duplicates[0].drNumber || duplicates[0].dr_number,
            duplicates[0].customerName || duplicates[0].customer_name,
            duplicates[0].vendorNumber || duplicates[0].vendor_number,
            duplicates[0].truckPlateNumber || duplicates[0].truck_plate_number,
            `${duplicates[0].origin || ''} to ${duplicates[0].destination || ''}`,
            drNumbers
        );
    }
    
    /**
     * Enhanced e-signature opener with duplicate detection
     */
    function openESignatureWithDuplicateCheck(drNumber, customerName, customerContact, truckPlate, deliveryRoute, drNumbers) {
        console.log('🔍 Checking for duplicates before opening e-signature:', drNumber);
        
        // Find duplicates
        const duplicates = findDuplicates(drNumber);
        
        console.log(`🔍 Found ${duplicates.length} items with ${duplicateConfig.primaryKey}: ${drNumber}`);
        
        if (duplicates.length > 1) {
            // Handle duplicates based on configuration
            switch (duplicateConfig.duplicateAction) {
                case 'prompt':
                    showDuplicateSelectionModal(duplicates, {
                        drNumber, customerName, customerContact, truckPlate, deliveryRoute, drNumbers
                    });
                    break;
                    
                case 'signAll':
                    const allDrNumbers = duplicates.map(item => item.drNumber || item.dr_number);
                    openOriginalESignature(drNumber, customerName, customerContact, truckPlate, deliveryRoute, allDrNumbers);
                    break;
                    
                case 'signFirst':
                    openOriginalESignature(drNumber, customerName, customerContact, truckPlate, deliveryRoute, drNumbers);
                    break;
                    
                case 'cancel':
                    alert(`Multiple items found with ${duplicateConfig.primaryKey}: ${drNumber}. E-signature cancelled.`);
                    break;
                    
                default:
                    openOriginalESignature(drNumber, customerName, customerContact, truckPlate, deliveryRoute, drNumbers);
            }
        } else {
            // No duplicates, proceed normally
            openOriginalESignature(drNumber, customerName, customerContact, truckPlate, deliveryRoute, drNumbers);
        }
    }
    
    /**
     * Store reference to original e-signature function
     */
    function openOriginalESignature(drNumber, customerName, customerContact, truckPlate, deliveryRoute, drNumbers) {
        if (typeof window.openRobustSignaturePad === 'function') {
            window.openRobustSignaturePad(drNumber, customerName, customerContact, truckPlate, deliveryRoute, drNumbers);
        } else if (typeof window.openSignaturePad === 'function') {
            window.openSignaturePad(drNumber, customerName, customerContact, truckPlate, deliveryRoute, drNumbers);
        } else {
            console.error('No e-signature function available');
            alert('E-signature function not available');
        }
    }
    
    /**
     * Configuration functions
     */
    function setDuplicateDetectionKey(key) {
        duplicateConfig.primaryKey = key;
        console.log(`🔧 Duplicate detection key set to: ${key}`);
    }
    
    function setDuplicateAction(action) {
        duplicateConfig.duplicateAction = action;
        console.log(`🔧 Duplicate action set to: ${action}`);
    }
    
    /**
     * Initialize duplicate check system
     */
    function initESignatureDuplicateCheck() {
        console.log('🚀 Initializing E-Signature Duplicate Check...');
        
        // Override the original e-signature functions
        if (typeof window.openRobustSignaturePad === 'function') {
            window.originalOpenRobustSignaturePad = window.openRobustSignaturePad;
            window.openRobustSignaturePad = openESignatureWithDuplicateCheck;
        }
        
        if (typeof window.openSignaturePad === 'function') {
            window.originalOpenSignaturePad = window.openSignaturePad;
            window.openSignaturePad = openESignatureWithDuplicateCheck;
        }
        
        // Make functions globally available
        window.signSelectedDuplicates = signSelectedDuplicates;
        window.signAllDuplicates = signAllDuplicates;
        window.setDuplicateDetectionKey = setDuplicateDetectionKey;
        window.setDuplicateAction = setDuplicateAction;
        
        // Export configuration
        window.eSignatureDuplicateConfig = duplicateConfig;
        
        console.log('✅ E-Signature Duplicate Check initialized');
        console.log(`🔧 Current settings: Key="${duplicateConfig.primaryKey}", Action="${duplicateConfig.duplicateAction}"`);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initESignatureDuplicateCheck);
    } else {
        initESignatureDuplicateCheck();
    }
    
    console.log('✅ E-Signature Duplicate Check loaded');
    
})();