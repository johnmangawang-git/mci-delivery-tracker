/**
 * CUSTOMER DELIVERY TRACKING MODULE
 * Allows customers to track their deliveries without logging in
 */

console.log('🔧 Loading Customer Delivery Tracking...');

(function() {
    'use strict';
    
    /**
     * Status mapping for public display
     */
    const publicStatusMap = {
        'Active': 'Order Confirmed',
        'In Transit': 'Out for Delivery',
        'Delivered': 'Delivered',
        'Signed': 'Completed',
        'Cancelled': 'Cancelled'
    };
    
    /**
     * Validate DR number format
     */
    function validateDRNumber(drNumber) {
        if (!drNumber || typeof drNumber !== 'string') {
            return { valid: false, message: 'Please enter a DR number' };
        }
        
        const trimmed = drNumber.trim().toUpperCase();
        
        // Basic format validation (DR-YYYY-XXXXXX or similar)
        if (trimmed.length < 5) {
            return { valid: false, message: 'DR number too short' };
        }
        
        // Allow various formats: DR-2024-001234, DR2024001234, 2024001234, etc.
        const drPattern = /^(DR[-_]?)?(\d{4}[-_]?)?\d{3,8}$/i;
        if (!drPattern.test(trimmed)) {
            return { valid: false, message: 'Invalid DR number format' };
        }
        
        return { valid: true, formatted: trimmed };
    }
    
    /**
     * Format delivery data for public display
     */
    function formatDeliveryForPublic(delivery) {
        if (!delivery) return null;
        
        // Mask sensitive information
        const maskPhone = (phone) => {
            if (!phone) return 'Not provided';
            const str = phone.toString();
            if (str.length > 6) {
                return str.substring(0, 3) + ' ***-**' + str.substring(str.length - 2);
            }
            return '***-***-**' + str.substring(str.length - 2);
        };
        
        const maskAddress = (address) => {
            if (!address) return 'Not provided';
            // Show only city/area, hide specific address
            const parts = address.split(',');
            if (parts.length > 1) {
                return parts[parts.length - 1].trim(); // Last part (usually city)
            }
            return address.length > 20 ? address.substring(0, 20) + '...' : address;
        };
        
        const maskCustomerName = (name) => {
            if (!name) return 'Customer';
            const parts = name.split(' ');
            if (parts.length > 1) {
                return parts[0] + ' ' + parts[1].charAt(0) + '.';
            }
            return name.charAt(0).toUpperCase() + name.substring(1, 3) + '***';
        };
        
        return {
            dr_number: delivery.dr_number || delivery.drNumber,
            status: publicStatusMap[delivery.status] || delivery.status,
            customer_name: maskCustomerName(delivery.customer_name || delivery.customerName),
            origin: maskAddress(delivery.origin),
            destination: maskAddress(delivery.destination),
            phone: maskPhone(delivery.vendor_number || delivery.vendorNumber),
            created_date: delivery.created_date || delivery.deliveryDate,
            estimated_delivery: delivery.estimated_delivery || 'Contact us for updates'
        };
    }
    
    /**
     * Search for delivery in Supabase
     */
    async function searchDeliveryInSupabase(drNumber) {
        try {
            if (!window.supabaseClient) {
                throw new Error('Database connection not available');
            }
            
            const client = window.supabaseClient();
            if (!client) {
                throw new Error('Database client not initialized');
            }
            
            console.log('🔍 Searching for delivery:', drNumber);
            
            // Search by exact DR number match
            const { data, error } = await client
                .from('deliveries')
                .select('dr_number, customer_name, vendor_number, origin, destination, status, created_date, estimated_delivery')
                .or(`dr_number.eq.${drNumber},dr_number.ilike.%${drNumber}%`)
                .limit(1);
            
            if (error) {
                console.error('❌ Supabase search error:', error);
                throw new Error('Search failed. Please try again.');
            }
            
            if (!data || data.length === 0) {
                return null;
            }
            
            console.log('✅ Delivery found:', data[0].dr_number);
            return data[0];
            
        } catch (error) {
            console.error('❌ Error searching delivery:', error);
            throw error;
        }
    }
    
    /**
     * Search for delivery in localStorage (fallback)
     */
    function searchDeliveryInLocalStorage(drNumber) {
        try {
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            const allDeliveries = [...activeDeliveries, ...deliveryHistory];
            
            console.log('🔍 Searching localStorage for:', drNumber, 'in', allDeliveries.length, 'deliveries');
            
            const found = allDeliveries.find(delivery => {
                const deliveryDR = (delivery.dr_number || delivery.drNumber || '').toString().toUpperCase();
                return deliveryDR === drNumber || deliveryDR.includes(drNumber);
            });
            
            if (found) {
                console.log('✅ Delivery found in localStorage:', found.dr_number || found.drNumber);
            }
            
            return found || null;
            
        } catch (error) {
            console.error('❌ Error searching localStorage:', error);
            return null;
        }
    }
    
    /**
     * Main tracking function
     */
    async function trackDelivery(drNumber) {
        const validation = validateDRNumber(drNumber);
        if (!validation.valid) {
            throw new Error(validation.message);
        }
        
        const formattedDR = validation.formatted;
        console.log('🚀 Tracking delivery:', formattedDR);
        
        let delivery = null;
        
        // Try Supabase first
        try {
            delivery = await searchDeliveryInSupabase(formattedDR);
        } catch (error) {
            console.warn('⚠️ Supabase search failed, trying localStorage:', error.message);
        }
        
        // Fallback to localStorage
        if (!delivery) {
            delivery = searchDeliveryInLocalStorage(formattedDR);
        }
        
        if (!delivery) {
            throw new Error('Delivery not found. Please check your DR number or contact us.');
        }
        
        return formatDeliveryForPublic(delivery);
    }
    
    /**
     * Display tracking result
     */
    function displayTrackingResult(delivery, container) {
        if (!container) {
            console.error('❌ Result container not found');
            return;
        }
        
        const resultHTML = `
            <div class="tracking-result success">
                <div class="result-header">
                    <i class="bi bi-check-circle-fill text-success"></i>
                    <h5>Delivery Found: ${delivery.dr_number}</h5>
                </div>
                <div class="result-body">
                    <div class="row">
                        <div class="col-6">
                            <strong>Status:</strong><br>
                            <span class="status-badge status-${delivery.status.toLowerCase().replace(/\s+/g, '-')}">${delivery.status}</span>
                        </div>
                        <div class="col-6">
                            <strong>Customer:</strong><br>
                            ${delivery.customer_name}
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">
                            <strong>From:</strong><br>
                            ${delivery.origin}
                        </div>
                        <div class="col-6">
                            <strong>To:</strong><br>
                            ${delivery.destination}
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">
                            <strong>Contact:</strong><br>
                            ${delivery.phone}
                        </div>
                        <div class="col-6">
                            <strong>Est. Delivery:</strong><br>
                            ${delivery.estimated_delivery}
                        </div>
                    </div>
                </div>
                <div class="result-footer">
                    <small class="text-muted">
                        <i class="bi bi-info-circle"></i>
                        Need help? Call us at <strong>+63 917 123 4567</strong>
                    </small>
                </div>
            </div>
        `;
        
        container.innerHTML = resultHTML;
        container.style.display = 'block';
    }
    
    /**
     * Display error message
     */
    function displayError(message, container) {
        if (!container) {
            console.error('❌ Result container not found');
            return;
        }
        
        const errorHTML = `
            <div class="tracking-result error">
                <div class="result-header">
                    <i class="bi bi-exclamation-triangle-fill text-warning"></i>
                    <h5>Delivery Not Found</h5>
                </div>
                <div class="result-body">
                    <p>${message}</p>
                    <p class="mb-0">
                        <strong>Need assistance?</strong><br>
                        📞 Call: <strong>+63 917 123 4567</strong><br>
                        📧 Email: <strong>support@mci-delivery.com</strong>
                    </p>
                </div>
            </div>
        `;
        
        container.innerHTML = errorHTML;
        container.style.display = 'block';
    }
    
    /**
     * Initialize tracking functionality
     */
    function initializeTracking() {
        console.log('🚀 Initializing delivery tracking...');
        
        const trackingForm = document.getElementById('trackingForm');
        const trackingInput = document.getElementById('trackingDRNumber');
        const trackingButton = document.getElementById('trackingButton');
        const resultContainer = document.getElementById('trackingResult');
        
        if (!trackingForm || !trackingInput || !trackingButton || !resultContainer) {
            console.warn('⚠️ Tracking elements not found, skipping initialization');
            return;
        }
        
        // Handle form submission
        trackingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const drNumber = trackingInput.value.trim();
            if (!drNumber) {
                displayError('Please enter a DR number', resultContainer);
                return;
            }
            
            // Show loading state
            const originalText = trackingButton.innerHTML;
            trackingButton.innerHTML = '<i class="bi bi-arrow-repeat spin me-2"></i>Tracking...';
            trackingButton.disabled = true;
            resultContainer.style.display = 'none';
            
            try {
                const delivery = await trackDelivery(drNumber);
                displayTrackingResult(delivery, resultContainer);
                
                // Log tracking attempt (for analytics)
                console.log('📊 Tracking successful:', drNumber);
                
            } catch (error) {
                displayError(error.message, resultContainer);
                console.log('📊 Tracking failed:', drNumber, error.message);
                
            } finally {
                // Restore button state
                trackingButton.innerHTML = originalText;
                trackingButton.disabled = false;
            }
        });
        
        // Add input formatting
        trackingInput.addEventListener('input', function(e) {
            let value = e.target.value.toUpperCase();
            // Auto-format DR number
            if (value && !value.startsWith('DR') && /^\d/.test(value)) {
                value = 'DR-' + value;
            }
            e.target.value = value;
        });
        
        // Add placeholder examples
        trackingInput.placeholder = 'e.g., DR-2024-001234';
        
        console.log('✅ Delivery tracking initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTracking);
    } else {
        initializeTracking();
    }
    
    // Export functions globally
    window.trackDelivery = trackDelivery;
    window.initializeTracking = initializeTracking;
    
    console.log('✅ Customer Delivery Tracking module loaded');
    
})();

// Export module info
window.deliveryTracking = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};