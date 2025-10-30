/**
 * CUSTOMER DR INTEGRATION FIX
 * Ensures customers are properly created and saved during DR uploads
 */

console.log('👥 Loading Customer DR Integration Fix...');

(function() {
    'use strict';
    
    /**
     * Enhanced customer creation specifically for DR uploads
     */
    async function createCustomerFromDR(customerName, vendorNumber, destination) {
        console.log('👥 Creating customer from DR upload:', { customerName, vendorNumber, destination });
        
        if (!customerName || customerName.trim() === '') {
            console.warn('⚠️ No customer name provided, skipping customer creation');
            return null;
        }
        
        try {
            // Check if customer already exists
            const existingCustomers = JSON.parse(localStorage.getItem('mci-customers') || '[]');
            const existingCustomer = existingCustomers.find(c => 
                (c.contactPerson === customerName || c.name === customerName) &&
                (c.vendorNumber === vendorNumber || c.vendor_number === vendorNumber)
            );
            
            if (existingCustomer) {
                console.log('👥 Customer already exists:', existingCustomer.contactPerson || existingCustomer.name);
                
                // Update booking count
                existingCustomer.bookingsCount = (existingCustomer.bookingsCount || 0) + 1;
                existingCustomer.bookings_count = existingCustomer.bookingsCount;
                existingCustomer.lastDelivery = new Date().toLocaleDateString('en-US');
                existingCustomer.last_delivery = existingCustomer.lastDelivery;
                existingCustomer.updatedAt = new Date().toISOString();
                existingCustomer.updated_at = existingCustomer.updatedAt;
                
                // Save updated customer
                const customerIndex = existingCustomers.findIndex(c => c.id === existingCustomer.id);
                if (customerIndex !== -1) {
                    existingCustomers[customerIndex] = existingCustomer;
                    localStorage.setItem('mci-customers', JSON.stringify(existingCustomers));
                    
                    // Also save to Supabase if available
                    if (window.dataService && typeof window.dataService.saveCustomer === 'function') {
                        try {
                            await window.dataService.saveCustomer(existingCustomer);
                            console.log('👥 Updated existing customer in Supabase');
                        } catch (error) {
                            console.warn('⚠️ Failed to update customer in Supabase:', error);
                        }
                    }
                }
                
                return existingCustomer;
            }
            
            // Create new customer
            const newCustomer = {
                id: 'CUST-DR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                contactPerson: customerName,
                name: customerName,
                contact_person: customerName,
                phone: vendorNumber || '',
                email: '',
                address: destination || '',
                vendorNumber: vendorNumber || '',
                vendor_number: vendorNumber || '',
                accountType: 'Individual',
                account_type: 'Individual',
                status: 'active',
                notes: 'Auto-created from DR upload',
                bookingsCount: 1,
                bookings_count: 1,
                lastDelivery: new Date().toLocaleDateString('en-US'),
                last_delivery: new Date().toLocaleDateString('en-US'),
                createdAt: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // Save to localStorage
            existingCustomers.push(newCustomer);
            localStorage.setItem('mci-customers', JSON.stringify(existingCustomers));
            
            // Update global customers array
            if (window.customers) {
                window.customers.push(newCustomer);
            } else {
                window.customers = [newCustomer];
            }
            
            console.log('👥 Created new customer:', newCustomer.contactPerson);
            
            // Save to Supabase if available
            if (window.dataService && typeof window.dataService.saveCustomer === 'function') {
                try {
                    await window.dataService.saveCustomer(newCustomer);
                    console.log('👥 Saved new customer to Supabase');
                } catch (error) {
                    console.warn('⚠️ Failed to save customer to Supabase:', error);
                }
            }
            
            // Refresh customer display if function exists
            if (typeof window.loadCustomers === 'function') {
                setTimeout(() => {
                    window.loadCustomers();
                }, 500);
            }
            
            return newCustomer;
            
        } catch (error) {
            console.error('❌ Error creating customer from DR:', error);
            return null;
        }
    }
    
    /**
     * Override the autoCreateCustomer function to ensure it works for DR uploads
     */
    function overrideAutoCreateCustomer() {
        // Store original function if it exists
        if (typeof window.autoCreateCustomer === 'function') {
            window.originalAutoCreateCustomer = window.autoCreateCustomer;
        }
        
        // Override with enhanced version
        window.autoCreateCustomer = async function(customerName, vendorNumber, destination) {
            console.log('👥 Enhanced autoCreateCustomer called from DR upload');
            return await createCustomerFromDR(customerName, vendorNumber, destination);
        };
        
        console.log('✅ autoCreateCustomer function overridden for DR integration');
    }
    
    /**
     * Monitor DR upload completion and ensure customer creation
     */
    function monitorDRUploads() {
        // Override confirmDRUpload to add customer creation monitoring
        if (typeof window.confirmDRUpload === 'function') {
            const originalConfirmDRUpload = window.confirmDRUpload;
            
            window.confirmDRUpload = async function(...args) {
                console.log('👥 Monitoring DR upload for customer creation...');
                
                // Call original function
                const result = await originalConfirmDRUpload.apply(this, args);
                
                // Check if customers were created
                setTimeout(() => {
                    const customers = JSON.parse(localStorage.getItem('mci-customers') || '[]');
                    const recentCustomers = customers.filter(c => {
                        const createdAt = new Date(c.createdAt || c.created_at);
                        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                        return createdAt > fiveMinutesAgo && c.notes && c.notes.includes('DR upload');
                    });
                    
                    if (recentCustomers.length > 0) {
                        console.log(`👥 ✅ ${recentCustomers.length} customers created from DR upload`);
                        
                        // Show success message
                        if (typeof window.showToast === 'function') {
                            window.showToast(`${recentCustomers.length} customers auto-created from DR upload`, 'success');
                        }
                    } else {
                        console.log('👥 ⚠️ No customers were created from DR upload');
                    }
                }, 2000);
                
                return result;
            };
            
            console.log('✅ confirmDRUpload function enhanced for customer monitoring');
        }
    }
    
    /**
     * Add manual customer creation button for testing
     */
    function addTestButton() {
        // Add a test button to manually trigger customer creation
        const testButton = document.createElement('button');
        testButton.innerHTML = '👥 Test Customer Creation';
        testButton.className = 'btn btn-info btn-sm';
        testButton.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            z-index: 9999;
            font-size: 12px;
        `;
        
        testButton.onclick = async () => {
            try {
                const result = await createCustomerFromDR('Test Customer', 'V999', 'Test City');
                if (result) {
                    alert('✅ Test customer created successfully!');
                } else {
                    alert('❌ Failed to create test customer');
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        };
        
        document.body.appendChild(testButton);
        console.log('✅ Test customer creation button added');
    }
    
    /**
     * Initialize customer DR integration fix
     */
    function initCustomerDRIntegrationFix() {
        console.log('🚀 Initializing Customer DR Integration Fix...');
        
        // Override functions
        overrideAutoCreateCustomer();
        monitorDRUploads();
        
        // Add test button for debugging
        addTestButton();
        
        // Make functions available globally
        window.createCustomerFromDR = createCustomerFromDR;
        
        console.log('✅ Customer DR Integration Fix initialized');
        console.log('👥 Customers will now be auto-created during DR uploads');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCustomerDRIntegrationFix);
    } else {
        initCustomerDRIntegrationFix();
    }
    
    console.log('✅ Customer DR Integration Fix loaded');
    
})();