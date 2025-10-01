// Data service for handling all database operations with Supabase
// This file abstracts all database operations and provides a clean API for the application

// Import Supabase client
// Note: In a real application, you might want to import this differently
// For now, we'll assume it's available globally

class DataService {
    constructor() {
        this.supabase = null;
        this.initialized = false;
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
    isSupabaseAvailable() {
        return this.initialized && this.supabase !== null;
    }

    // Get current user ID
    async getCurrentUserId() {
        if (!this.isSupabaseAvailable()) {
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
        if (!this.isSupabaseAvailable()) {
            // Fallback to localStorage
            const saved = localStorage.getItem('mci-activeDeliveries');
            return saved ? JSON.parse(saved) : [];
        }

        try {
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await this.supabase
                .from('deliveries')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching deliveries:', error);
            // Fallback to localStorage
            const saved = localStorage.getItem('mci-activeDeliveries');
            return saved ? JSON.parse(saved) : [];
        }
    }

    async saveDelivery(delivery) {
        if (!this.isSupabaseAvailable()) {
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
                
                if (error) throw error;
                result = data;
            } else {
                // Insert new delivery
                const { data, error } = await this.supabase
                    .from('deliveries')
                    .insert([deliveryWithUser])
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            }

            return result;
        } catch (error) {
            console.error('Error saving delivery:', error);
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
    }

    async deleteDelivery(deliveryId) {
        if (!this.isSupabaseAvailable()) {
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

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting delivery:', error);
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
    }

    // Customers operations
    async getCustomers() {
        if (!this.isSupabaseAvailable()) {
            // Fallback to localStorage
            const saved = localStorage.getItem('mci-customers');
            return saved ? JSON.parse(saved) : [];
        }

        try {
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await this.supabase
                .from('customers')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching customers:', error);
            // Fallback to localStorage
            const saved = localStorage.getItem('mci-customers');
            return saved ? JSON.parse(saved) : [];
        }
    }

    async saveCustomer(customer) {
        if (!this.isSupabaseAvailable()) {
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
                
                if (error) throw error;
                result = data;
            } else {
                // Insert new customer
                const { data, error } = await this.supabase
                    .from('customers')
                    .insert([customerWithUser])
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            }

            return result;
        } catch (error) {
            console.error('Error saving customer:', error);
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
    }

    async deleteCustomer(customerId) {
        if (!this.isSupabaseAvailable()) {
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

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting customer:', error);
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
    }

    // E-POD operations
    async getEPodRecords() {
        if (!this.isSupabaseAvailable()) {
            // Fallback to localStorage
            const saved = localStorage.getItem('ePodRecords');
            return saved ? JSON.parse(saved) : [];
        }

        try {
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await this.supabase
                .from('e_pod_records')
                .select('*')
                .eq('user_id', userId)
                .order('signed_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching E-POD records:', error);
            // Fallback to localStorage
            const saved = localStorage.getItem('ePodRecords');
            return saved ? JSON.parse(saved) : [];
        }
    }

    async saveEPodRecord(record) {
        if (!this.isSupabaseAvailable()) {
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

            if (fetchError) throw fetchError;

            if (existingRecords && existingRecords.length > 0) {
                // Update existing record
                const { data, error } = await this.supabase
                    .from('e_pod_records')
                    .update(dbRecord)
                    .eq('dr_number', record.drNumber)
                    .eq('user_id', userId)
                    .select()
                    .single();
                
                if (error) throw error;
                result = this.mapEPodRecordFromDB(data);
            } else {
                // Insert new record
                const { data, error } = await this.supabase
                    .from('e_pod_records')
                    .insert([dbRecord])
                    .select()
                    .single();
                
                if (error) throw error;
                result = this.mapEPodRecordFromDB(data);
            }

            return result;
        } catch (error) {
            console.error('Error saving E-POD record:', error);
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
        if (!this.isSupabaseAvailable()) {
            // No localStorage fallback for additional costs in the current implementation
            return [];
        }

        try {
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await this.supabase
                .from('additional_costs')
                .select('*')
                .eq('delivery_id', deliveryId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching additional costs:', error);
            return [];
        }
    }

    async saveAdditionalCost(cost) {
        if (!this.isSupabaseAvailable()) {
            // No localStorage fallback for additional costs in the current implementation
            return cost;
        }

        try {
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
                
                if (error) throw error;
                result = data;
            } else {
                // Insert new cost
                const { data, error } = await this.supabase
                    .from('additional_costs')
                    .insert([cost])
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            }

            return result;
        } catch (error) {
            console.error('Error saving additional cost:', error);
            return cost;
        }
    }

    async deleteAdditionalCost(costId) {
        if (!this.isSupabaseAvailable()) {
            // No localStorage fallback for additional costs in the current implementation
            return true;
        }

        try {
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const { error } = await this.supabase
                .from('additional_costs')
                .delete()
                .eq('id', costId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting additional cost:', error);
            return false;
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