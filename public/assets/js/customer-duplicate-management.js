/**
 * CUSTOMER DUPLICATE MANAGEMENT
 * Comprehensive duplicate customer detection, merging, and prevention system
 * Integrates with all existing customer functions and ensures no duplicates in the modal
 */

console.log('🔧 Loading Customer Duplicate Management...');

(function() {
    'use strict';
    
    /**
     * Advanced duplicate detection with multiple criteria
     */
    function detectDuplicateCustomers(customers) {
        console.log('🔍 Detecting duplicate customers...');
        
        if (!customers || customers.length === 0) {
            return { duplicates: [], unique: [] };
        }
        
        const duplicateGroups = new Map();
        const processed = new Set();
        
        // Multiple matching criteria for better duplicate detection
        const getMatchingKeys = (customer) => {
            const keys = [];
            
            // Normalize customer data
            const name = (customer.contactPerson || customer.name || '').toLowerCase().trim();
            const phone = (customer.phone || '').replace(/\D/g, ''); // Remove non-digits
            const email = (customer.email || '').toLowerCase().trim();
            
            // Primary key: name + phone
            if (name && phone) {
                keys.push(`name_phone:${name}|${phone}`);
            }
            
            // Secondary key: name + email (if email exists)
            if (name && email) {
                keys.push(`name_email:${name}|${email}`);
            }
            
            // Tertiary key: phone only (for cases where name might be slightly different)
            if (phone && phone.length >= 10) {
                keys.push(`phone:${phone}`);
            }
            
            return keys;
        };
        
        // Group customers by matching criteria
        customers.forEach((customer, index) => {
            if (processed.has(index)) return;
            
            const matchingKeys = getMatchingKeys(customer);
            let foundGroup = null;
            
            // Check if this customer matches any existing group
            for (const key of matchingKeys) {
                if (duplicateGroups.has(key)) {
                    foundGroup = duplicateGroups.get(key);
                    break;
                }
            }
            
            if (foundGroup) {
                // Add to existing group
                foundGroup.customers.push({ customer, index });
                processed.add(index);
                
                // Add all matching keys to this group
                matchingKeys.forEach(key => {
                    duplicateGroups.set(key, foundGroup);
                });
            } else {
                // Create new group
                const newGroup = {
                    id: `group_${duplicateGroups.size}`,
                    customers: [{ customer, index }],
                    keys: matchingKeys
                };
                
                matchingKeys.forEach(key => {
                    duplicateGroups.set(key, newGroup);
                });
                processed.add(index);
            }
        });
        
        // Separate duplicates from unique customers
        const duplicates = [];
        const unique = [];
        
        const groupsProcessed = new Set();
        
        Array.from(duplicateGroups.values()).forEach(group => {
            if (groupsProcessed.has(group.id)) return;
            groupsProcessed.add(group.id);
            
            if (group.customers.length > 1) {
                duplicates.push(group);
            } else {
                unique.push(group.customers[0].customer);
            }
        });
        
        console.log(`🔍 Duplicate detection results: ${duplicates.length} duplicate groups, ${unique.length} unique customers`);
        
        return { duplicates, unique };
    }
    
    /**
     * Intelligent duplicate merging with conflict resolution
     */
    function mergeDuplicateGroup(duplicateGroup) {
        console.log(`🔄 Merging duplicate group with ${duplicateGroup.customers.length} customers`);
        
        const customers = duplicateGroup.customers.map(item => item.customer);
        
        // Sort by priority: most recent, most complete data, highest booking count
        customers.sort((a, b) => {
            // Priority 1: Most recent creation/update date
            const dateA = new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at || 0);
            const dateB = new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at || 0);
            if (dateB - dateA !== 0) return dateB - dateA;
            
            // Priority 2: Highest booking count
            const bookingsA = a.bookingsCount || a.bookings_count || 0;
            const bookingsB = b.bookingsCount || b.bookings_count || 0;
            if (bookingsB - bookingsA !== 0) return bookingsB - bookingsA;
            
            // Priority 3: Most complete data (more fields filled)
            const completenessA = [a.email, a.address, a.notes].filter(field => field && field.trim()).length;
            const completenessB = [b.email, b.address, b.notes].filter(field => field && field.trim()).length;
            return completenessB - completenessA;
        });
        
        // Use the highest priority customer as the base
        const primaryCustomer = { ...customers[0] };
        
        // Merge data from all duplicates
        let totalBookings = 0;
        let latestDeliveryDate = null;
        const allNotes = [];
        const allEmails = [];
        const allAddresses = [];
        
        customers.forEach(customer => {
            // Sum booking counts
            totalBookings += customer.bookingsCount || customer.bookings_count || 0;
            
            // Find latest delivery date
            if (customer.lastDelivery || customer.last_delivery) {
                const deliveryDate = new Date(customer.lastDelivery || customer.last_delivery);
                if (!latestDeliveryDate || deliveryDate > latestDeliveryDate) {
                    latestDeliveryDate = deliveryDate;
                }
            }
            
            // Collect unique notes
            if (customer.notes && customer.notes.trim() && !allNotes.includes(customer.notes.trim())) {
                allNotes.push(customer.notes.trim());
            }
            
            // Collect unique emails
            if (customer.email && customer.email.trim() && !allEmails.includes(customer.email.trim())) {
                allEmails.push(customer.email.trim());
            }
            
            // Collect unique addresses
            if (customer.address && customer.address.trim() && !allAddresses.includes(customer.address.trim())) {
                allAddresses.push(customer.address.trim());
            }
        });
        
        // Apply merged data to primary customer
        primaryCustomer.bookingsCount = totalBookings;
        primaryCustomer.bookings_count = totalBookings;
        
        if (latestDeliveryDate) {
            primaryCustomer.lastDelivery = latestDeliveryDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            primaryCustomer.last_delivery = primaryCustomer.lastDelivery;
        }
        
        // Use the most complete email (longest one)
        if (allEmails.length > 0) {
            primaryCustomer.email = allEmails.reduce((longest, current) => 
                current.length > longest.length ? current : longest
            );
        }
        
        // Use the most complete address (longest one)
        if (allAddresses.length > 0) {
            primaryCustomer.address = allAddresses.reduce((longest, current) => 
                current.length > longest.length ? current : longest
            );
        }
        
        // Merge notes intelligently
        if (allNotes.length > 0) {
            // Remove redundant notes and merge
            const uniqueNotes = allNotes.filter((note, index, array) => 
                !array.some((otherNote, otherIndex) => 
                    otherIndex !== index && otherNote.includes(note)
                )
            );
            primaryCustomer.notes = uniqueNotes.join('; ');
        }
        
        // Update timestamps
        primaryCustomer.updatedAt = new Date().toISOString();
        primaryCustomer.updated_at = primaryCustomer.updatedAt;
        
        console.log(`✅ Merged ${customers.length} duplicates into one customer: ${primaryCustomer.contactPerson || primaryCustomer.name}`);
        
        return primaryCustomer;
    }
    
    /**
     * Comprehensive duplicate management for customer modal
     */
    async function manageDuplicatesForModal(customers) {
        console.log('🎯 Managing duplicates for customer modal...');
        
        if (!customers || customers.length === 0) {
            console.log('📊 No customers to process');
            return [];
        }
        
        // Detect duplicates
        const { duplicates, unique } = detectDuplicateCustomers(customers);
        
        if (duplicates.length === 0) {
            console.log('✅ No duplicates found, returning original customers');
            return customers;
        }
        
        // Merge all duplicate groups
        const mergedCustomers = [...unique];
        
        for (const duplicateGroup of duplicates) {
            const mergedCustomer = mergeDuplicateGroup(duplicateGroup);
            mergedCustomers.push(mergedCustomer);
        }
        
        // Sort the final list by name
        mergedCustomers.sort((a, b) => {
            const nameA = (a.contactPerson || a.name || '').toLowerCase();
            const nameB = (b.contactPerson || b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        console.log(`🎯 Duplicate management complete: ${customers.length} → ${mergedCustomers.length} customers`);
        
        // Save the cleaned data back to localStorage
        try {
            localStorage.setItem('mci-customers', JSON.stringify(mergedCustomers));
            console.log('💾 Saved deduplicated customers to localStorage');
        } catch (error) {
            console.error('❌ Error saving deduplicated customers:', error);
        }
        
        return mergedCustomers;
    }
    
    /**
     * Enhanced customer loading with automatic duplicate management
     */
    async function loadCustomersWithDuplicateManagement() {
        console.log('🚀 Loading customers with automatic duplicate management...');
        
        try {
            let customers = [];
            
            // Try to load from dataService first
            if (window.dataService && typeof window.dataService.getCustomers === 'function') {
                try {
                    customers = await window.dataService.getCustomers();
                    console.log(`📥 Loaded ${customers.length} customers from dataService`);
                } catch (error) {
                    console.warn('⚠️ DataService failed, falling back to localStorage:', error.message);
                }
            }
            
            // Fallback to localStorage if needed
            if (customers.length === 0) {
                const savedCustomers = localStorage.getItem('mci-customers');
                if (savedCustomers) {
                    try {
                        customers = JSON.parse(savedCustomers);
                        console.log(`📥 Loaded ${customers.length} customers from localStorage`);
                    } catch (error) {
                        console.error('❌ Error parsing localStorage customers:', error);
                        customers = [];
                    }
                }
            }
            
            // Apply duplicate management
            customers = await manageDuplicatesForModal(customers);
            
            // Update global array
            window.customers = customers;
            
            console.log(`✅ Customer loading with duplicate management complete: ${customers.length} customers`);
            
            return customers;
            
        } catch (error) {
            console.error('❌ Error in loadCustomersWithDuplicateManagement:', error);
            window.customers = window.customers || [];
            return window.customers;
        }
    }
    
    /**
     * Override existing customer loading functions
     */
    function integrateWithExistingFunctions() {
        console.log('🔗 Integrating duplicate management with existing functions...');
        
        // Override the main loadCustomers function
        if (typeof window.loadCustomers === 'function') {
            window.originalLoadCustomers = window.loadCustomers;
        }
        window.loadCustomers = loadCustomersWithDuplicateManagement;
        
        // Override enhanced loadCustomers if it exists
        if (typeof window.enhancedLoadCustomers === 'function') {
            window.originalEnhancedLoadCustomers = window.enhancedLoadCustomers;
        }
        window.enhancedLoadCustomers = loadCustomersWithDuplicateManagement;
        
        // Enhance displayCustomers to always check for duplicates
        if (typeof window.displayCustomers === 'function') {
            const originalDisplayCustomers = window.displayCustomers;
            window.displayCustomers = async function() {
                console.log('🎨 Enhanced displayCustomers with duplicate check...');
                
                // Ensure customers are deduplicated before display
                if (window.customers && window.customers.length > 0) {
                    window.customers = await manageDuplicatesForModal(window.customers);
                }
                
                // Call original display function
                return originalDisplayCustomers.call(this);
            };
        }
        
        console.log('✅ Integration with existing functions complete');
    }
    
    /**
     * Initialize duplicate management system
     */
    function initializeDuplicateManagement() {
        console.log('🚀 Initializing Customer Duplicate Management System...');
        
        // Wait for other customer scripts to load
        setTimeout(() => {
            integrateWithExistingFunctions();
            
            // Auto-run duplicate management if customers already exist
            if (window.customers && window.customers.length > 0) {
                console.log('🔄 Running duplicate management on existing customers...');
                manageDuplicatesForModal(window.customers).then(cleanedCustomers => {
                    window.customers = cleanedCustomers;
                    
                    // Refresh display if function exists
                    if (typeof window.displayCustomers === 'function') {
                        window.displayCustomers();
                    }
                });
            }
        }, 1000);
    }
    
    // Export functions to global scope
    window.detectDuplicateCustomers = detectDuplicateCustomers;
    window.mergeDuplicateGroup = mergeDuplicateGroup;
    window.manageDuplicatesForModal = manageDuplicatesForModal;
    window.loadCustomersWithDuplicateManagement = loadCustomersWithDuplicateManagement;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDuplicateManagement);
    } else {
        initializeDuplicateManagement();
    }
    
    console.log('✅ Customer Duplicate Management loaded successfully');
    
})();

// Export for external access
window.customerDuplicateManagement = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};