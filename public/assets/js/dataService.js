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
        console.log('Initializing DataService...');
        if (this.initialized) {
            console.log('DataService already initialized');
            return true;
        }

        try {
            // Get Supabase client
            this.supabase = window.getSupabaseClient();
            if (!this.supabase) {
                console.warn('Supabase client not available, falling back to localStorage');
                this.initialized = true; // Still mark as initialized for localStorage usage
                return true;
            }

            this.initialized = true;
            console.log('DataService initialized with Supabase');
            
            // Try to sync localStorage data to Supabase
            setTimeout(() => {
                this.syncLocalStorageToSupabase();
            }, 2000); // Delay to allow authentication to complete
            
            return true;
        } catch (error) {
            console.error('Error initializing DataService:', error);
            this.initialized = true; // Mark as initialized even on error to allow localStorage fallback
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
                
                // If there's an authentication error, we still might be able to use Supabase
                // but the user needs to log in
                if (error && error.status === 401) {
                    console.log('Supabase available but user not authenticated');
                    this.supabaseTested = true;
                    this.supabaseWorking = true;
                    return true;
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

    // Enhanced saveDelivery method with better sync handling
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

            // Also save to localStorage as backup
            try {
                let deliveries = [];
                const saved = localStorage.getItem('mci-activeDeliveries');
                if (saved) {
                    deliveries = JSON.parse(saved);
                }
                
                // Check if delivery already exists
                const existingIndex = deliveries.findIndex(d => d.id === result.id);
                if (existingIndex >= 0) {
                    deliveries[existingIndex] = result;
                } else {
                    deliveries.push(result);
                }
                
                localStorage.setItem('mci-activeDeliveries', JSON.stringify(deliveries));
            } catch (storageError) {
                console.warn('Failed to save delivery to localStorage backup:', storageError);
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
            const records = saved ? JSON.parse(saved) : [];
            console.log('EPOD records loaded from localStorage:', records.length);
            return records;
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
                    const records = saved ? JSON.parse(saved) : [];
                    console.log('EPOD records loaded from localStorage (404 fallback):', records.length);
                    return records;
                }
                throw error;
            }
            // Map database records to application format
            const mappedRecords = data ? data.map(record => this.mapEPodRecordFromDB(record)) : [];
            console.log('EPOD records loaded from Supabase:', mappedRecords.length);
            return mappedRecords;
        } catch (error) {
            console.error('Error fetching E-POD records:', error);
            // Always fallback to localStorage on any error
            const saved = localStorage.getItem('ePodRecords');
            const records = saved ? JSON.parse(saved) : [];
            console.log('EPOD records loaded from localStorage (error fallback):', records.length);
            return records;
        }
    }

    async saveEPodRecord(record) {
        console.log('DataService.saveEPodRecord called with record:', record.drNumber);
        
        // Always try localStorage as backup, regardless of Supabase status
        try {
            let records = [];
            const saved = localStorage.getItem('ePodRecords');
            if (saved) {
                records = JSON.parse(saved);
            }
            
            // Check if record already exists
            const existingIndex = records.findIndex(r => r.drNumber === record.drNumber);
            if (existingIndex >= 0) {
                records[existingIndex] = record;
                console.log('Updated existing EPOD record in localStorage');
            } else {
                records.push(record);
                console.log('Added new EPOD record to localStorage');
            }
            
            localStorage.setItem('ePodRecords', JSON.stringify(records));
            console.log('EPOD record saved to localStorage. Total records now:', records.length);
        } catch (storageError) {
            console.error('Error saving to localStorage:', storageError);
        }
        
        // If Supabase is not available or not working, return early with localStorage result
        if (!await this.isSupabaseAvailable()) {
            console.log('Supabase not available, returning localStorage result');
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
                console.error('Error checking for existing EPOD record:', fetchError);
                // Always fallback to localStorage on any error
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
                    console.error('Error updating EPOD record:', error);
                    // Always fallback to localStorage on any error
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
                    console.error('Error inserting EPOD record:', error);
                    // Always fallback to localStorage on any error
                    throw error;
                }
                result = this.mapEPodRecordFromDB(data);
            }

            console.log('EPOD record saved via Supabase:', result.drNumber);
            return result;
        } catch (error) {
            console.error('Error saving E-POD record via Supabase:', error);
            // Always return the record (from localStorage) even on Supabase errors
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

    // Sync localStorage data to Supabase when connection is restored
    async syncLocalStorageToSupabase() {
        if (!await this.isSupabaseAvailable()) {
            return;
        }

        console.log('Attempting to sync localStorage data to Supabase...');

        try {
            // Sync deliveries
            const savedDeliveries = localStorage.getItem('mci-activeDeliveries');
            if (savedDeliveries) {
                const deliveries = JSON.parse(savedDeliveries);
                console.log(`Found ${deliveries.length} deliveries in localStorage to sync`);
                
                for (const delivery of deliveries) {
                    try {
                        await this.saveDelivery(delivery);
                        console.log(`Synced delivery ${delivery.id} to Supabase`);
                    } catch (error) {
                        console.error(`Failed to sync delivery ${delivery.id}:`, error);
                    }
                }
            }

            // Sync customers
            const savedCustomers = localStorage.getItem('mci-customers');
            if (savedCustomers) {
                const customers = JSON.parse(savedCustomers);
                console.log(`Found ${customers.length} customers in localStorage to sync`);
                
                for (const customer of customers) {
                    try {
                        await this.saveCustomer(customer);
                        console.log(`Synced customer ${customer.id} to Supabase`);
                    } catch (error) {
                        console.error(`Failed to sync customer ${customer.id}:`, error);
                    }
                }
            }

            // Sync E-POD records
            const savedEPodRecords = localStorage.getItem('ePodRecords');
            if (savedEPodRecords) {
                const ePodRecords = JSON.parse(savedEPodRecords);
                console.log(`Found ${ePodRecords.length} E-POD records in localStorage to sync`);
                
                for (const record of ePodRecords) {
                    try {
                        await this.saveEPodRecord(record);
                        console.log(`Synced E-POD record ${record.drNumber} to Supabase`);
                    } catch (error) {
                        console.error(`Failed to sync E-POD record ${record.drNumber}:`, error);
                    }
                }
            }

            console.log('Finished syncing localStorage data to Supabase');
        } catch (error) {
            console.error('Error during localStorage to Supabase sync:', error);
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

// Fallback implementation for loading from database
async function fallbackLoadFromDatabase() {
    try {
        // Load active deliveries
        const getDeliveries = typeof window.getDeliveries === 'function' ? window.getDeliveries : null;
        if (getDeliveries) {
            const deliveries = await getDeliveries();
            activeDeliveries = deliveries.filter(d => d.status !== 'Completed');
            deliveryHistory = deliveries.filter(d => d.status === 'Completed');
            
            console.log('Active deliveries loaded from database:', activeDeliveries.length);
            console.log('Delivery history loaded from database:', deliveryHistory.length);
            
            // Update global references
            window.activeDeliveries = activeDeliveries;
            window.deliveryHistory = deliveryHistory;
            
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error loading from database:', error);
        return false;
    }
}

// Load data from localStorage (fallback)
function loadFromLocalStorage() {
    try {
        const savedActive = localStorage.getItem('mci-active-deliveries');
        const savedHistory = localStorage.getItem('mci-deliveryHistory');
        
        if (savedActive) {
            activeDeliveries = JSON.parse(savedActive);
            console.log('Active deliveries loaded from localStorage:', activeDeliveries.length);
        }
        
        if (savedHistory) {
            deliveryHistory = JSON.parse(savedHistory);
            console.log('Delivery history loaded from localStorage:', deliveryHistory.length);
        }
        
        // Update global references
        window.activeDeliveries = activeDeliveries;
        window.deliveryHistory = deliveryHistory;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}
