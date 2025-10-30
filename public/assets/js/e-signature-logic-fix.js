/**
 * E-SIGNATURE LOGIC FIX
 * Reverses the logic to match business requirements:
 * - Multiple DIFFERENT DRs: Show warning (unusual case)
 * - Multiple SAME DRs: Allow seamless signing (normal case)
 */

console.log('📝 Loading E-Signature Logic Fix...');

(function() {
    'use strict';
    
    /**
     * Analyze selected deliveries for e-signature
     */
    function analyzeSelectedDeliveries(selectedDeliveries) {
        if (!selectedDeliveries || selectedDeliveries.length === 0) {
            return { type: 'none', drNumbers: [], uniqueDRs: [] };
        }
        
        if (selectedDeliveries.length === 1) {
            return { 
                type: 'single', 
                drNumbers: [selectedDeliveries[0].drNumber || selectedDeliveries[0].dr_number],
                uniqueDRs: [selectedDeliveries[0].drNumber || selectedDeliveries[0].dr_number]
            };
        }
        
        // Multiple deliveries - analyze DR numbers
        const drNumbers = selectedDeliveries.map(d => d.drNumber || d.dr_number);
        const uniqueDRs = [...new Set(drNumbers)];
        
        if (uniqueDRs.length === 1) {
            // All same DR number - this is NORMAL and should proceed smoothly
            return {
                type: 'multiple_same',
                drNumbers: drNumbers,
                uniqueDRs: uniqueDRs,
                count: selectedDeliveries.length
            };
        } else {
            // Multiple different DR numbers - this is UNUSUAL and needs warning
            return {
                type: 'multiple_different',
                drNumbers: drNumbers,
                uniqueDRs: uniqueDRs,
                count: selectedDeliveries.length
            };
        }
    }
    
    /**
     * Show warning for multiple different DRs
     */
    function showMultipleDifferentDRsWarning(analysis, selectedDeliveries) {
        const drList = analysis.uniqueDRs.join(', ');
        
        return new Promise((resolve) => {
            // Create warning modal
            const modalHtml = `
                <div class="modal fade" id="multipleDRWarningModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-warning text-dark">
                                <h5 class="modal-title">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    Multiple Different DRs Selected
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-warning">
                                    <strong>Unusual Selection Detected!</strong>
                                </div>
                                <p>You have selected <strong>${analysis.count} deliveries</strong> with <strong>${analysis.uniqueDRs.length} different DR numbers</strong>:</p>
                                <ul class="list-group mb-3">
                                    ${analysis.uniqueDRs.map(dr => `<li class="list-group-item">${dr}</li>`).join('')}
                                </ul>
                                <p><strong>Are you sure you want to sign all these different DRs with one signature?</strong></p>
                                <div class="bg-light p-3 rounded">
                                    <small class="text-muted">
                                        <strong>Note:</strong> Typically, you would sign multiple items with the <em>same</em> DR number. 
                                        Signing different DR numbers together is unusual.
                                    </small>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" onclick="window.multipleDRWarningResolve('cancel')">
                                    <i class="bi bi-x-circle me-2"></i>Cancel
                                </button>
                                <button type="button" class="btn btn-warning" onclick="window.multipleDRWarningResolve('proceed')">
                                    <i class="bi bi-pen me-2"></i>Yes, Sign All Different DRs
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if any
            const existingModal = document.getElementById('multipleDRWarningModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Add modal to DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Set up resolver
            window.multipleDRWarningResolve = (action) => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('multipleDRWarningModal'));
                if (modal) {
                    modal.hide();
                }
                
                setTimeout(() => {
                    const modalElement = document.getElementById('multipleDRWarningModal');
                    if (modalElement) {
                        modalElement.remove();
                    }
                    delete window.multipleDRWarningResolve;
                }, 300);
                
                resolve(action);
            };
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('multipleDRWarningModal'));
            modal.show();
        });
    }
    
    /**
     * Enhanced e-signature handler with corrected logic
     */
    async function handleEnhancedESignature(selectedDeliveries) {
        console.log('📝 Enhanced E-Signature Handler called with:', selectedDeliveries);
        
        const analysis = analyzeSelectedDeliveries(selectedDeliveries);
        console.log('📊 Analysis result:', analysis);
        
        switch (analysis.type) {
            case 'single':
                // Single delivery - proceed normally
                console.log('✅ Single delivery - proceeding normally');
                return proceedWithESignature(selectedDeliveries, analysis);
                
            case 'multiple_same':
                // Multiple same DRs - this is NORMAL, proceed smoothly
                console.log('✅ Multiple same DRs - proceeding smoothly (normal case)');
                showToast(`Signing ${analysis.count} items with DR: ${analysis.uniqueDRs[0]}`, 'info');
                return proceedWithESignature(selectedDeliveries, analysis);
                
            case 'multiple_different':
                // Multiple different DRs - this is UNUSUAL, show warning
                console.log('⚠️ Multiple different DRs - showing warning (unusual case)');
                const userChoice = await showMultipleDifferentDRsWarning(analysis, selectedDeliveries);
                
                if (userChoice === 'proceed') {
                    console.log('✅ User confirmed - proceeding with multiple different DRs');
                    showToast(`Signing ${analysis.count} deliveries with different DR numbers`, 'warning');
                    return proceedWithESignature(selectedDeliveries, analysis);
                } else {
                    console.log('❌ User cancelled - aborting e-signature');
                    showToast('E-signature cancelled', 'info');
                    return false;
                }
                
            default:
                console.warn('⚠️ Unknown analysis type:', analysis.type);
                return false;
        }
    }
    
    /**
     * Proceed with e-signature after validation
     */
    function proceedWithESignature(selectedDeliveries, analysis) {
        const firstDelivery = selectedDeliveries[0];
        
        // Prepare data for e-signature modal
        const drNumbers = analysis.drNumbers;
        const customerName = firstDelivery.customerName || firstDelivery.customer_name || '';
        const customerContact = firstDelivery.vendorNumber || firstDelivery.vendor_number || '';
        const truckPlate = firstDelivery.truckPlateNumber || firstDelivery.truck_plate_number || '';
        const deliveryRoute = `${firstDelivery.origin || ''} to ${firstDelivery.destination || ''}`;
        
        console.log('🖊️ Opening E-Signature with data:', {
            drNumbers,
            customerName,
            customerContact,
            truckPlate,
            deliveryRoute
        });
        
        // Call the e-signature modal
        if (typeof window.openRobustSignaturePad === 'function') {
            window.openRobustSignaturePad(
                drNumbers[0], // Primary DR number
                customerName,
                customerContact,
                truckPlate,
                deliveryRoute,
                drNumbers // All DR numbers
            );
            return true;
        } else {
            console.error('❌ openRobustSignaturePad function not available');
            showToast('E-signature system not available', 'error');
            return false;
        }
    }
    
    /**
     * Override the existing e-signature handler in app.js
     */
    function overrideESignatureHandler() {
        // Store original function if it exists
        if (typeof window.originalESignatureHandler === 'undefined' && typeof window.handleESignatureClick === 'function') {
            window.originalESignatureHandler = window.handleESignatureClick;
        }
        
        // Override with enhanced logic
        window.handleESignatureClick = async function() {
            console.log('📝 Enhanced E-Signature Click Handler');
            
            const selectedDeliveries = getSelectedDeliveries();
            if (!selectedDeliveries || selectedDeliveries.length === 0) {
                showToast('Please select deliveries to sign', 'warning');
                return;
            }
            
            return await handleEnhancedESignature(selectedDeliveries);
        };
        
        console.log('✅ E-Signature handler overridden with enhanced logic');
    }
    
    /**
     * Get selected deliveries (helper function)
     */
    function getSelectedDeliveries() {
        const checkboxes = document.querySelectorAll('.delivery-checkbox:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-delivery-id'));
        
        if (window.activeDeliveries && Array.isArray(window.activeDeliveries)) {
            return window.activeDeliveries.filter(d => selectedIds.includes(d.id));
        }
        
        return [];
    }
    
    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log(`Toast (${type}): ${message}`);
        }
    }
    
    /**
     * Initialize the e-signature logic fix
     */
    function initESignatureLogicFix() {
        console.log('🚀 Initializing E-Signature Logic Fix...');
        
        // Override the e-signature handler
        overrideESignatureHandler();
        
        // Make functions available globally
        window.enhancedESignatureHandler = {
            analyzeSelectedDeliveries,
            handleEnhancedESignature,
            showMultipleDifferentDRsWarning
        };
        
        console.log('✅ E-Signature Logic Fix initialized');
        console.log('📋 New behavior:');
        console.log('  - Multiple SAME DRs: Proceed smoothly ✅');
        console.log('  - Multiple DIFFERENT DRs: Show warning ⚠️');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initESignatureLogicFix);
    } else {
        initESignatureLogicFix();
    }
    
    console.log('✅ E-Signature Logic Fix loaded');
    
})();