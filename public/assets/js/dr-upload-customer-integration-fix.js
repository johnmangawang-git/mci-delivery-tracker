/**
 * DR Upload Customer Integration Fix
 * Ensures customer data from DR uploads is properly saved to customers modal
 * Fixes duplicate prevention and data flow issues
 */

console.log('🔧 Loading DR Upload Customer Integration Fix...');

window.drUploadCustomerFix = {
    
    /**
     * Enhanced customer creation from DR upload
     */
    async enhancedAutoCreateCustomer(customerName, vendorNumber, destination) {
        try {
            console.log('🔄 Enhanced auto-create customer called:', { customerName, vendorNumber, destination });
            
            // Validate input data
            if (!customerName || customerName.trim() === '') {
                console.warn('⚠️ Customer name is empty, skipping customer creation');
                return null;
            }
            
            // Initialize customers array if needed
            if (!window.customers) {
                window.customers = [];
                console.log('📋 Initialized window.customers array');
            }
            
            // Load existing customers from all sources
            await this.loadCustomersFromAllSources();
            
            // Normalize customer data
            const normalizedCustomerName = customerName.trim();
            const normalizedVendorNumber = (vendorNumber || '').trim();
            const normalizedDestination = (destination || '').trim();
            
            // Enhanced duplicate detection
            const existingCustomer = this.findExistingCustomer(normalizedCustomerName, normalizedVendorNumber);
            
            if (existingCustomer) {
                console.log('✅ Customer already exists, updating booking count:', existingCustomer.contactPerson);
                
                // Update existing customer
                existingCustomer.bookingsCount = (existingCustomer.bookingsCount || 0) + 1;
                existingCustomer.lastDelivery = new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                // Save updated data
                await this.saveCustomerData();
                
                // Refresh customer display
                this.refreshCustomerDisplay();
                
                return existingCustomer;
            }
            
            // Create new customer
            const newCustomer = {
                id: this.generateCustomerId(),
                contactPerson: normalizedCustomerName,
                name: normalizedCustomerName, // For Supabase compatibility
                phone: normalizedVendorNumber,
                address: normalizedDestination,
                accountType: 'Individual',
                email: '',
                status: 'active',
                notes: `Auto-created from DR upload on ${new Date().toLocaleDateString()}`,
                bookingsCount: 1,
                lastDelivery: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                createdAt: new Date().toISOString(),
                created_at: new Date().toISOString() // For Supabase compatibility
            };
            
            console.log('📝 Creating new customer:', newCustomer);
            
            // Add to customers array
            window.customers.push(newCustomer);
            
            // Save to all storage locations
            await this.saveCustomerData();
            
            // Save to Supabase if available
            await this.saveToSupabase(newCustomer);
            
            // Refresh customer display
            this.refreshCustomerDisplay();
            
            // Show success message
            if (typeof window.showToast === 'function') {
                window.showToast(`✅ Customer "${normalizedCustomerName}" added to Customer Management!`, 'success');
            }
            
            console.log('✅ New customer created successfully:', newCustomer.contactPerson);
            return newCustomer;
            
        } catch (error) {
            console.error('❌ Error in enhanced auto-create customer:', error);
            
            if (typeof window.showToast === 'function') {
                window.showToast(`⚠️ Customer creation failed: ${error.message}`, 'warning');
            }
            
            return null;
        }
    },
    
    /**
     * Load customers from all available sources
     */
    async loadCustomersFromAllSources() {
        try {
            let customersLoaded = false;
            
            // Try Supabase first
            if (window.dataService && typeof window.dataService.getCustomers === 'function') {
                try {
                    const supabaseCustomers = await window.dataService.getCustomers();
                    if (supabaseCustomers && supabaseCustomers.length > 0) {
                        window.customers = supabaseCustomers;
                        customersLoaded = true;
                        console.log(`📊 Loaded ${supabaseCustomers.length} customers from Supabase`);
                    }
                } catch (error) {
                    console.warn('⚠️ Supabase customer loading failed:', error);
                }
            }
            
            // Fallback to localStorage
            if (!customersLoaded) {
                const savedCustomers = localStorage.getItem('mci-customers');
                if (savedCustomers) {
                    try {
                        const parsed = JSON.parse(savedCustomers);
                        if (parsed && Array.isArray(parsed)) {
                            window.customers = parsed;
                            console.log(`📊 Loaded ${parsed.length} customers from localStorage`);
                        }
                    } catch (error) {
                        console.warn('⚠️ localStorage customer parsing failed:', error);
                    }
                }
            }
            
            // Ensure array exists
            if (!window.customers) {
                window.customers = [];
            }
            
        } catch (error) {
            console.error('❌ Error loading customers from all sources:', error);
        }
    },
    
    /**
     * Enhanced duplicate detection
     */
    findExistingCustomer(customerName, vendorNumber) {
        if (!window.customers || window.customers.length === 0) {
            return null;
        }
        
        const normalizedName = customerName.toLowerCase().trim();
        const normalizedPhone = (vendorNumber || '').replace(/\D/g, ''); // Remove non-digits
        
        return window.customers.find(customer => {
            const existingName = (customer.contactPerson || customer.name || '').toLowerCase().trim();
            const existingPhone = (customer.phone || '').replace(/\D/g, '');
            
            // Match by name (exact)
            if (existingName === normalizedName) {
                return true;
            }
            
            // Match by phone (if both have phone numbers)
            if (normalizedPhone && existingPhone && normalizedPhone === existingPhone) {
                return true;
            }
            
            return false;
        });
    },
    
    /**
     * Generate unique customer ID
     */
    generateCustomerId() {
        const existingIds = window.customers.map(c => c.id).filter(id => id && id.startsWith('CUST-'));
        const numbers = existingIds.map(id => parseInt(id.replace('CUST-', '')) || 0);
        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
        return 'CUST-' + String(maxNumber + 1).padStart(3, '0');
    },
    
    /**
     * Save customer data to all storage locations
     */
    async saveCustomerData() {
        try {
            // Save to localStorage
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
            console.log('💾 Saved customers to localStorage');
            
            // Sync with HTML customers array if it exists
            if (typeof customers !== 'undefined') {
                customers.length = 0; // Clear existing
                customers.push(...window.customers); // Add all customers
                console.log('🔄 Synced with HTML customers array');
            }
            
        } catch (error) {
            console.error('❌ Error saving customer data:', error);
        }
    },
    
    /**
     * Save customer to Supabase
     */
    async saveToSupabase(customer) {
        try {
            if (window.dataService && typeof window.dataService.saveCustomer === 'function') {
                await window.dataService.saveCustomer(customer);
                console.log('💾 Saved customer to Supabase:', customer.contactPerson);
            }
        } catch (error) {
            console.warn('⚠️ Supabase customer save failed:', error);
        }
    },
    
    /**
     * Refresh customer display in all relevant places
     */
    refreshCustomerDisplay() {
        try {
            // Refresh main customer display
            if (typeof window.loadCustomers === 'function') {
                window.loadCustomers();
            }
            
            // Refresh HTML customer display
            if (typeof loadCustomers === 'function') {
                loadCustomers();
            }
            
            // Trigger custom event
            const event = new CustomEvent('customersUpdated', {
                detail: { customers: window.customers }
            });
            window.dispatchEvent(event);
            
            // Force refresh customer modal if it's open
            setTimeout(() => {
                const customerModal = document.getElementById('customerModal');
                if (customerModal && customerModal.classList.contains('show')) {
                    if (typeof window.loadCustomers === 'function') {
                        window.loadCustomers();
                    }
                }
            }, 500);
            
            console.log('🔄 Customer display refreshed');
            
        } catch (error) {
            console.warn('⚠️ Error refreshing customer display:', error);
        }
    },
    
    /**
     * Override the original autoCreateCustomer function
     */
    overrideAutoCreateCustomer() {
        // Store original function
        if (typeof window.autoCreateCustomer === 'function') {
            window.originalAutoCreateCustomer = window.autoCreateCustomer;
        }
        
        // Override with enhanced version
        window.autoCreateCustomer = async (customerName, vendorNumber, destination) => {
            return await this.enhancedAutoCreateCustomer(customerName, vendorNumber, destination);
        };
        
        console.log('✅ Overridden autoCreateCustomer with enhanced version');
    },
    
    /**
     * Initialize the fix
     */
    initialize() {
        console.log('🚀 Initializing DR Upload Customer Integration Fix...');
        
        // Override the autoCreateCustomer function
        this.overrideAutoCreateCustomer();
        
        // Listen for DR upload events
        document.addEventListener('drUploadCompleted', (event) => {
            console.log('📋 DR upload completed, ensuring customers are refreshed');
            setTimeout(() => {
                this.refreshCustomerDisplay();
            }, 1000);
        });
        
        console.log('✅ DR Upload Customer Integration Fix initialized');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            window.drUploadCustomerFix.initialize();
        }, 2000);
    });
} else {
    setTimeout(() => {
        window.drUploadCustomerFix.initialize();
    }, 2000);
}

console.log('✅ DR Upload Customer Integration Fix loaded');