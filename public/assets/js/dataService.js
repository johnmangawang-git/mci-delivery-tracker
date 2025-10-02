// Data service for handling all database operations with Supabase
// This file abstracts all database operations and provides a clean API for the application

// Import Supabase client
// Note: In a real application, you might want to import this differently
// For now, we'll assume it's available globally

class DataService {
    constructor() {
        this.supabase = null;
        this.initialized = false;
        this.supabaseTested = false;
        this.supabaseWorking = false;
    }

    // Initialize the data service
    async init() {
        if (this.initialized) {
            return true;
        }

        try {
            // Get Supabase client
            this.supabase = window.getSupabaseClient();
            if (!this.supabase) {
                console.warn('Supabase client not available, falling back to localStorage');
                return false;
            }

            this.initialized = true;
            console.log('Data service initialized with Supabase');
            return true;
        } catch (error) {
            console.error('Error initializing data service:', error);
            return false;
        }
    }

    // Check if we're using Supabase or fallback to localStorage
    async isSupabaseAvailable() {
        // First check if Supabase is initialized
        if (!this.initialized || this.supabase === null) {
            console.log('Supabase not initialized, using localStorage');
            return false;
        }

        // If we've already tested Supabase, return the cached result
        if (this.supabaseTested) {
            console.log('Supabase availability (cached):', this.supabaseWorking);
            return this.supabaseWorking;
        }

        console.log('Testing Supabase connection...');

        // Test multiple tables to ensure they all exist
        const tablesToCheck = ['deliveries', 'customers', 'additional_costs', 'e_pod_records'];
        
        try {
            // Try checking each table
            for (const table of tablesToCheck) {
                console.log(`Checking table: ${table}`);
                const { data, error } = await this.supabase
                    .from(table)
                    .select('id')
                    .limit(1);
                
                console.log(`Table ${table} check result:`, { data, error });
                
                // If there's an error about the table not existing, fallback to localStorage
                if (error && (error.code === 'PGRST205' || 
                             error.message.includes('Could not find the table') ||
                             error.message.includes('The resource does not exist') ||
                             error.hint?.includes('Perhaps you meant') ||
                             error.status === 404)) {  // Add 404 status check
                    console.warn(`Supabase table '${table}' not found, falling back to localStorage`);
                    this.supabaseTested = true;
                    this.supabaseWorking = false;
                    return false;
                }
            }
            
            // All tables exist, we can use Supabase
            console.log('All Supabase tables found, using Supabase');
            this.supabaseTested = true;
            this.supabaseWorking = true;
            return true;
        } catch (error) {
            console.warn('Error testing Supabase connection, falling back to localStorage:', error);
            this.supabaseTested = true;
            this.supabaseWorking = false;
            return false;
        }
    }

    // Get current user ID
    async getCurrentUserId() {
        if (!await this.isSupabaseAvailable()) {
            return null;
        }

        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            return session?.user?.id || null;
        } catch (error) {
            console.error('Error getting current user ID:', error);
            return null;
        }
    }

    // Deliveries operations
    async getDeliveries() {
        console.log('Getting deliveries, checking Supabase availability...');
        if (!await this.isSupabaseAvailable()) {
            console.log('Using localStorage for deliveries');
            // Fallback to localStorage
            const saved = localStorage.getItem('mci-activeDeliveries');
            return saved ? JSON.parse(saved) : [];
        }

        try {
            console.log('Using Supabase for deliveries');
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await this.supabase
                .from('deliveries')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                // If it's a 404 error, fallback to localStorage
                if (error.status === 404) {
                    console.warn('Deliveries table not found, falling back to localStorage');
                    const saved = localStorage.getItem('mci-activeDeliveries');
                    return saved ? JSON.parse(saved) : [];
                }
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('Error fetching deliveries:', error);
            // Always fallback to localStorage on any error
            const saved = localStorage.getItem('mci-activeDeliveries');
            return saved ? JSON.parse(saved) : [];
        }
    }

    async saveDelivery(delivery) {
        if (!await this.isSupabaseAvailable()) {
            // Fallback to localStorage
            let deliveries = [];
            const saved = localStorage.getItem('mci-activeDeliveries');
            if (saved) {
                deliveries = JSON.parse(saved);
            }
            
            // Check if delivery already exists
            const existingIndex = deliveries.findIndex(d => d.id === delivery.id);
            if (existingIndex >= 0) {
                deliveries[existingIndex] = delivery;
            } else {
                deliveries.push(delivery);
            }
            
            localStorage.setItem('mci-activeDeliveries', JSON.stringify(deliveries));
            return delivery;
        }

        try {
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            // Add user_id to delivery
            const deliveryWithUser = {
                ...delivery,
                user_id: userId
            };

            let result;
            if (delivery.id && typeof delivery.id === 'number') {
                // Update existing delivery
                const { data, error } = await this.supabase
                    .from('deliveries')
                    .update(deliveryWithUser)
                    .eq('id', delivery.id)
                    .eq('user_id', userId)
                    .select()
                    .single();
                
                if (error) {
                    // If it's a 404 error, fallback to localStorage
                    if (error.status === 404) {
                        console.warn('Deliveries table not found, falling back to localStorage');
                        let deliveries = [];
                        const saved = localStorage.getItem('mci-activeDeliveries');
                        if (saved) {
                            deliveries = JSON.parse(saved);
                        }
                        
                        // Check if delivery already exists
                        const existingIndex = deliveries.findIndex(d => d.id === delivery.id);
                        if (existingIndex >= 0) {
                            deliveries[existingIndex] = delivery;
                        } else {
                            deliveries.push(delivery);
                        }
                        
                        localStorage.setItem('mci-activeDeliveries', JSON.stringify(deliveries));
                        return delivery;
                    }
                    throw error;
                }
                result = data;
            } else {
                // Insert new delivery
                const { data, error } = await this.supabase
                    .from('deliveries')
                    .insert([deliveryWithUser])
                    .select()
                    .single();
                
                if (error) {
                    // If it's a 404 error, fallback to localStorage
                    if (error.status === 404) {
                        console.warn('Deliveries table not found, falling back to localStorage');
                        let deliveries = [];
                        const saved = localStorage.getItem('mci-activeDeliveries');
                        if (saved) {
                            deliveries = JSON.parse(saved);
                        }
                        
                        // Add new delivery
                        deliveries.push(delivery);
                        
                        localStorage.setItem('mci-activeDeliveries', JSON.stringify(deliveries));
                        return delivery;
                    }
                    throw error;
                }
                result = data;
            }

            return result;
        } catch (error) {
            console.error('Error saving delivery:', error);
            // Fallback to localStorage on any error
            let deliveries = [];
            const saved = localStorage.getItem('mci-activeDeliveries');
            if (saved) {
                deliveries = JSON.parse(saved);
            }
            
            // Check if delivery already exists
            const existingIndex = deliveries.findIndex(d => d.id === delivery.id);
            if (existingIndex >= 0) {
                deliveries[existingIndex] = delivery;
            } else {
                deliveries.push(delivery);
            }
            
            localStorage.setItem('mci-activeDeliveries', JSON.stringify(deliveries));
            return delivery;
        }
    }

    async deleteDelivery(deliveryId) {
        if (!await this.isSupabaseAvailable()) {
            // Fallback to localStorage
            let deliveries = [];
            const saved = localStorage.getItem('mci-activeDeliveries');
            if (saved) {
                deliveries = JSON.parse(saved);
            }
            
            deliveries = deliveries.filter(d => d.id !== deliveryId);
            localStorage.setItem('mci-activeDeliveries', JSON.stringify(deliveries));
            return true;
        }

        try {
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const { error } = await this.supabase
                .from('deliveries')
                .delete()
                .eq('id', deliveryId)
                .eq('user_id', userId);

            if (error) {
                // If it's a 404 error, fallback to localStorage
                if (error.status === 404) {
                    console.warn('Deliveries table not found, falling back to localStorage');
                    let deliveries = [];
                    const saved = localStorage.getItem('mci-activeDeliveries');
                    if (saved) {
                        deliveries = JSON.parse(saved);
                    }
                    
                    deliveries = deliveries.filter(d => d.id !== deliveryId);
                    localStorage.setItem('mci-activeDeliveries', JSON.stringify(deliveries));
                    return true;
                }
                throw error;
            }
            return true;
        } catch (error) {
            console.error('Error deleting delivery:', error);
            // Fallback to localStorage on any error
            let deliveries = [];
            const saved = localStorage.getItem('mci-activeDeliveries');
            if (saved) {
                deliveries = JSON.parse(saved);
            }
            
            deliveries = deliveries.filter(d => d.id !== deliveryId);
            localStorage.setItem('mci-activeDeliveries', JSON.stringify(deliveries));
            return true;
        }
    }

    // Customers operations
    async getCustomers() {
        console.log('Getting customers, checking Supabase availability...');
        if (!await this.isSupabaseAvailable()) {
            console.log('Using localStorage for customers');
            // Fallback to localStorage
            const saved = localStorage.getItem('mci-customers');
            return saved ? JSON.parse(saved) : [];
        }

        try {
            console.log('Using Supabase for customers');
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await this.supabase
                .from('customers')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                // If it's a 404 error, fallback to localStorage
                if (error.status === 404) {
                    console.warn('Customers table not found, falling back to localStorage');
                    const saved = localStorage.getItem('mci-customers');
                    return saved ? JSON.parse(saved) : [];
                }
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('Error fetching customers:', error);
            // Always fallback to localStorage on any error
            const saved = localStorage.getItem('mci-customers');
            return saved ? JSON.parse(saved) : [];
        }
    }

    async saveCustomer(customer) {
        if (!await this.isSupabaseAvailable()) {
            // Fallback to localStorage
            let customers = [];
            const saved = localStorage.getItem('mci-customers');
            if (saved) {
                customers = JSON.parse(saved);
            }
            
            // Check if customer already exists
            const existingIndex = customers.findIndex(c => c.id === customer.id);
            if (existingIndex >= 0) {
                customers[existingIndex] = customer;
            } else {
                customers.push(customer);
            }
            
            localStorage.setItem('mci-customers', JSON.stringify(customers));
            return customer;
        }

        try {
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            // Add user_id to customer
            const customerWithUser = {
                ...customer,
                user_id: userId
            };

            let result;
            if (customer.id && typeof customer.id === 'number') {
                // Update existing customer
                const { data, error } = await this.supabase
                    .from('customers')
                    .update(customerWithUser)
                    .eq('id', customer.id)
                    .eq('user_id', userId)
                    .select()
                    .single();
                
                if (error) {
                    // If it's a 404 error, fallback to localStorage
                    if (error.status === 404) {
                        console.warn('Customers table not found, falling back to localStorage');
                        let customers = [];
                        const saved = localStorage.getItem('mci-customers');
                        if (saved) {
                            customers = JSON.parse(saved);
                        }
                        
                        // Check if customer already exists
                        const existingIndex = customers.findIndex(c => c.id === customer.id);
                        if (existingIndex >= 0) {
                            customers[existingIndex] = customer;
                        } else {
                            customers.push(customer);
                        }
                        
                        localStorage.setItem('mci-customers', JSON.stringify(customers));
                        return customer;
                    }
                    throw error;
                }
                result = data;
            } else {
                // Insert new customer
                const { data, error } = await this.supabase
                    .from('customers')
                    .insert([customerWithUser])
                    .select()
                    .single();
                
                if (error) {
                    // If it's a 404 error, fallback to localStorage
                    if (error.status === 404) {
                        console.warn('Customers table not found, falling back to localStorage');
                        let customers = [];
                        const saved = localStorage.getItem('mci-customers');
                        if (saved) {
                            customers = JSON.parse(saved);
                        }
                        
                        // Add new customer
                        customers.push(customer);
                        
                        localStorage.setItem('mci-customers', JSON.stringify(customers));
                        return customer;
                    }
                    throw error;
                }
                result = data;
            }

            return result;
        } catch (error) {
            console.error('Error saving customer:', error);
            // Fallback to localStorage on any error
            let customers = [];
            const saved = localStorage.getItem('mci-customers');
            if (saved) {
                customers = JSON.parse(saved);
            }
            
            // Check if customer already exists
            const existingIndex = customers.findIndex(c => c.id === customer.id);
            if (existingIndex >= 0) {
                customers[existingIndex] = customer;
            } else {
                customers.push(customer);
            }
            
            localStorage.setItem('mci-customers', JSON.stringify(customers));
            return customer;
        }
    }

    async deleteCustomer(customerId) {
        if (!await this.isSupabaseAvailable()) {
            // Fallback to localStorage
            let customers = [];
            const saved = localStorage.getItem('mci-customers');
            if (saved) {
                customers = JSON.parse(saved);
            }
            
            customers = customers.filter(c => c.id !== customerId);
            localStorage.setItem('mci-customers', JSON.stringify(customers));
            return true;
        }

        try {
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const { error } = await this.supabase
                .from('customers')
                .delete()
                .eq('id', customerId)
                .eq('user_id', userId);

            if (error) {
                // If it's a 404 error, fallback to localStorage
                if (error.status === 404) {
                    console.warn('Customers table not found, falling back to localStorage');
                    let customers = [];
                    const saved = localStorage.getItem('mci-customers');
                    if (saved) {
                        customers = JSON.parse(saved);
                    }
                    
                    customers = customers.filter(c => c.id !== customerId);
                    localStorage.setItem('mci-customers', JSON.stringify(customers));
                    return true;
                }
                throw error;
            }
            return true;
        } catch (error) {
            console.error('Error deleting customer:', error);
            // Fallback to localStorage on any error
            let customers = [];
            const saved = localStorage.getItem('mci-customers');
            if (saved) {
                customers = JSON.parse(saved);
            }
            
            customers = customers.filter(c => c.id !== customerId);
            localStorage.setItem('mci-customers', JSON.stringify(customers));
            return true;
        }
    }

    // E-POD operations
    async getEPodRecords() {
        console.log('Getting E-POD records, checking Supabase availability...');
        if (!await this.isSupabaseAvailable()) {
            console.log('Using localStorage for E-POD records');
            // Fallback to localStorage
            const saved = localStorage.getItem('ePodRecords');
            return saved ? JSON.parse(saved) : [];
        }

        try {
            console.log('Using Supabase for E-POD records');
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await this.supabase
                .from('e_pod_records')
                .select('*')
                .eq('user_id', userId)
                .order('signed_at', { ascending: false });

            if (error) {
                // If it's a 404 error, fallback to localStorage
                if (error.status === 404) {
                    console.warn('E-POD records table not found, falling back to localStorage');
                    const saved = localStorage.getItem('ePodRecords');
                    return saved ? JSON.parse(saved) : [];
                }
                throw error;
            }
            // Map database records to application format
            return data ? data.map(record => this.mapEPodRecordFromDB(record)) : [];
        } catch (error) {
            console.error('Error fetching E-POD records:', error);
            // Always fallback to localStorage on any error
            const saved = localStorage.getItem('ePodRecords');
            return saved ? JSON.parse(saved) : [];
        }
    }

    async saveEPodRecord(record) {
        if (!await this.isSupabaseAvailable()) {
            // Fallback to localStorage
            let records = [];
            const saved = localStorage.getItem('ePodRecords');
            if (saved) {
                records = JSON.parse(saved);
            }
            
            // Check if record already exists
            const existingIndex = records.findIndex(r => r.drNumber === record.drNumber);
            if (existingIndex >= 0) {
                records[existingIndex] = record;
            } else {
                records.push(record);
            }
            
            localStorage.setItem('ePodRecords', JSON.stringify(records));
            return record;
        }

        try {
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            // Map the record to the database schema
            const dbRecord = {
                dr_number: record.drNumber,
                customer_name: record.customerName,
                customer_contact: record.customerContact,
                truck_plate: record.truckPlate,
                origin: record.origin,
                destination: record.destination,
                signature: record.signature,
                status: record.status || 'Completed',
                signed_at: record.signedAt || new Date().toISOString(),
                user_id: userId
            };

            let result;
            // Check if record already exists by DR number
            const { data: existingRecords, error: fetchError } = await this.supabase
                .from('e_pod_records')
                .select('id')
                .eq('dr_number', record.drNumber)
                .eq('user_id', userId);

            if (fetchError) {
                // If it's a 404 error, fallback to localStorage
                if (fetchError.status === 404) {
                    console.warn('E-POD records table not found, falling back to localStorage');
                    let records = [];
                    const saved = localStorage.getItem('ePodRecords');
                    if (saved) {
                        records = JSON.parse(saved);
                    }
                    
                    // Check if record already exists
                    const existingIndex = records.findIndex(r => r.drNumber === record.drNumber);
                    if (existingIndex >= 0) {
                        records[existingIndex] = record;
                    } else {
                        records.push(record);
                    }
                    
                    localStorage.setItem('ePodRecords', JSON.stringify(records));
                    return record;
                }
                throw fetchError;
            }

            if (existingRecords && existingRecords.length > 0) {
                // Update existing record
                const { data, error } = await this.supabase
                    .from('e_pod_records')
                    .update(dbRecord)
                    .eq('dr_number', record.drNumber)
                    .eq('user_id', userId)
                    .select()
                    .single();
                
                if (error) {
                    // If it's a 404 error, fallback to localStorage
                    if (error.status === 404) {
                        console.warn('E-POD records table not found, falling back to localStorage');
                        let records = [];
                        const saved = localStorage.getItem('ePodRecords');
                        if (saved) {
                            records = JSON.parse(saved);
                        }
                        
                        // Check if record already exists
                        const existingIndex = records.findIndex(r => r.drNumber === record.drNumber);
                        if (existingIndex >= 0) {
                            records[existingIndex] = record;
                        } else {
                            records.push(record);
                        }
                        
                        localStorage.setItem('ePodRecords', JSON.stringify(records));
                        return record;
                    }
                    throw error;
                }
                result = this.mapEPodRecordFromDB(data);
            } else {
                // Insert new record
                const { data, error } = await this.supabase
                    .from('e_pod_records')
                    .insert([dbRecord])
                    .select()
                    .single();
                
                if (error) {
                    // If it's a 404 error, fallback to localStorage
                    if (error.status === 404) {
                        console.warn('E-POD records table not found, falling back to localStorage');
                        let records = [];
                        const saved = localStorage.getItem('ePodRecords');
                        if (saved) {
                            records = JSON.parse(saved);
                        }
                        
                        // Add new record
                        records.push(record);
                        
                        localStorage.setItem('ePodRecords', JSON.stringify(records));
                        return record;
                    }
                    throw error;
                }
                result = this.mapEPodRecordFromDB(data);
            }

            return result;
        } catch (error) {
            console.error('Error saving E-POD record:', error);
            // Fallback to localStorage on any error
            let records = [];
            const saved = localStorage.getItem('ePodRecords');
            if (saved) {
                records = JSON.parse(saved);
            }
            
            // Check if record already exists
            const existingIndex = records.findIndex(r => r.drNumber === record.drNumber);
            if (existingIndex >= 0) {
                records[existingIndex] = record;
            } else {
                records.push(record);
            }
            
            localStorage.setItem('ePodRecords', JSON.stringify(records));
            return record;
        }
    }

    // Helper function to map database record to application format
    mapEPodRecordFromDB(dbRecord) {
        return {
            drNumber: dbRecord.dr_number,
            customerName: dbRecord.customer_name,
            customerContact: dbRecord.customer_contact,
            truckPlate: dbRecord.truck_plate,
            origin: dbRecord.origin,
            destination: dbRecord.destination,
            signature: dbRecord.signature,
            status: dbRecord.status,
            signedAt: dbRecord.signed_at,
            timestamp: dbRecord.created_at
        };
    }

    // Additional costs operations
    async getAdditionalCosts(deliveryId) {
        console.log('Getting additional costs, checking Supabase availability...');
        if (!await this.isSupabaseAvailable()) {
            console.log('Using localStorage for additional costs (empty array)');
            // No localStorage fallback for additional costs in the current implementation
            return [];
        }

        try {
            console.log('Using Supabase for additional costs');
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await this.supabase
                .from('additional_costs')
                .select('*')
                .eq('delivery_id', deliveryId)
                .order('created_at', { ascending: false });

            if (error) {
                // If it's a 404 error, return empty array
                if (error.status === 404) {
                    console.warn('Additional costs table not found, returning empty array');
                    return [];
                }
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('Error fetching additional costs:', error);
            // Always return empty array on any error
            return [];
        }
    }

    async saveAdditionalCost(cost) {
        if (!await this.isSupabaseAvailable()) {
            console.log('Using localStorage for additional costs (returning cost as-is)');
            // No localStorage fallback for additional costs in the current implementation
            return cost;
        }

        try {
            console.log('Using Supabase for additional costs');
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            let result;
            if (cost.id && typeof cost.id === 'number') {
                // Update existing cost
                const { data, error } = await this.supabase
                    .from('additional_costs')
                    .update(cost)
                    .eq('id', cost.id)
                    .select()
                    .single();
                
                if (error) {
                    // If it's a 404 error, return the original cost
                    if (error.status === 404) {
                        console.warn('Additional costs table not found, returning original cost');
                        return cost;
                    }
                    throw error;
                }
                result = data;
            } else {
                // Insert new cost
                const { data, error } = await this.supabase
                    .from('additional_costs')
                    .insert([cost])
                    .select()
                    .single();
                
                if (error) {
                    // If it's a 404 error, return the original cost
                    if (error.status === 404) {
                        console.warn('Additional costs table not found, returning original cost');
                        return cost;
                    }
                    throw error;
                }
                result = data;
            }

            return result;
        } catch (error) {
            console.error('Error saving additional cost:', error);
            // Return the original cost on any error
            return cost;
        }
    }

    async deleteAdditionalCost(costId) {
        if (!await this.isSupabaseAvailable()) {
            console.log('Using localStorage for additional costs (returning true)');
            // No localStorage fallback for additional costs in the current implementation
            return true;
        }

        try {
            console.log('Using Supabase for additional costs');
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const { error } = await this.supabase
                .from('additional_costs')
                .delete()
                .eq('id', costId);

            if (error) {
                // If it's a 404 error, return true
                if (error.status === 404) {
                    console.warn('Additional costs table not found, returning true');
                    return true;
                }
                throw error;
            }
            return true;
        } catch (error) {
            console.error('Error deleting additional cost:', error);
            // Return true on any error
            return true;
        }
    }
}

// Create a singleton instance
const dataService = new DataService();

// Initialize the data service when the DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    await dataService.init();
});

// Make the data service globally accessible
window.dataService = dataService;

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { dataService, DataService };
}

// Export individual functions for backward compatibility
window.getDeliveries = dataService.getDeliveries.bind(dataService);
window.saveDelivery = dataService.saveDelivery.bind(dataService);
window.deleteDelivery = dataService.deleteDelivery.bind(dataService);
window.getCustomers = dataService.getCustomers.bind(dataService);
window.saveCustomer = dataService.saveCustomer.bind(dataService);
window.deleteCustomer = dataService.deleteCustomer.bind(dataService);
window.getEPodRecords = dataService.getEPodRecords.bind(dataService);
window.saveEPodRecord = dataService.saveEPodRecord.bind(dataService);