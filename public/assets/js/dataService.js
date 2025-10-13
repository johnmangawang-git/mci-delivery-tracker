/**
 * Data Service Layer
 * Provides unified interface for all data operations with Supabase/localStorage fallback
 */

console.log('🔧 Loading Data Service...');

class DataService {
    constructor() {
        this.isOnline = true;
        this.retryQueue = [];
    }

    /**
     * Check if Supabase is available and online
     */
    isSupabaseAvailable() {
        return window.supabaseClient && window.supabaseClient() && window.isSupabaseOnline();
    }

    /**
     * Execute operation with fallback
     */
    async executeWithFallback(supabaseOperation, localStorageOperation, tableName = '') {
        if (!this.isSupabaseAvailable()) {
            console.log(`Using localStorage fallback for ${tableName}`);
            return await localStorageOperation();
        }

        try {
            const result = await supabaseOperation();
            return result;
        } catch (error) {
            console.warn(`Supabase operation failed for ${tableName}, using fallback:`, error);
            this.isOnline = false;
            return await localStorageOperation();
        }
    }

    /**
     * DELIVERY OPERATIONS
     */

    async saveDelivery(delivery) {
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            const { data, error } = await client
                .from('deliveries')
                .upsert({
                    ...delivery,
                    updated_at: new Date().toISOString()
                })
                .select();
            
            if (error) throw error;
            return data[0];
        };

        const localStorageOp = async () => {
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            
            // Remove from both arrays first
            const filteredActive = activeDeliveries.filter(d => d.id !== delivery.id && d.dr_number !== delivery.dr_number);
            const filteredHistory = deliveryHistory.filter(d => d.id !== delivery.id && d.dr_number !== delivery.dr_number);
            
            // Add to appropriate array based on status
            if (delivery.status === 'Completed') {
                filteredHistory.unshift(delivery);
                localStorage.setItem('mci-delivery-history', JSON.stringify(filteredHistory));
                localStorage.setItem('mci-active-deliveries', JSON.stringify(filteredActive));
                
                // Update global arrays
                window.deliveryHistory = filteredHistory;
                window.activeDeliveries = filteredActive;
            } else {
                filteredActive.push(delivery);
                localStorage.setItem('mci-active-deliveries', JSON.stringify(filteredActive));
                
                // Update global arrays
                window.activeDeliveries = filteredActive;
            }
            
            return delivery;
        };

        return this.executeWithFallback(supabaseOp, localStorageOp, 'deliveries');
    }

    async getDeliveries(filters = {}) {
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            let query = client.from('deliveries').select('*');
            
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        };

        const localStorageOp = async () => {
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            
            let allDeliveries = [...activeDeliveries, ...deliveryHistory];
            
            if (filters.status) {
                if (filters.status === 'Completed') {
                    allDeliveries = deliveryHistory;
                } else {
                    allDeliveries = activeDeliveries.filter(d => d.status === filters.status);
                }
            }
            
            return allDeliveries;
        };

        return this.executeWithFallback(supabaseOp, localStorageOp, 'deliveries');
    }

    async deleteDelivery(deliveryId) {
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            const { error } = await client
                .from('deliveries')
                .delete()
                .eq('id', deliveryId);
            
            if (error) throw error;
            return true;
        };

        const localStorageOp = async () => {
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            
            const filteredActive = activeDeliveries.filter(d => d.id !== deliveryId);
            const filteredHistory = deliveryHistory.filter(d => d.id !== deliveryId);
            
            localStorage.setItem('mci-active-deliveries', JSON.stringify(filteredActive));
            localStorage.setItem('mci-delivery-history', JSON.stringify(filteredHistory));
            
            // Update global arrays
            window.activeDeliveries = filteredActive;
            window.deliveryHistory = filteredHistory;
            
            return true;
        };

        return this.executeWithFallback(supabaseOp, localStorageOp, 'deliveries');
    }

    /**
     * CUSTOMER OPERATIONS
     */

    async saveCustomer(customer) {
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            const { data, error } = await client
                .from('customers')
                .upsert({
                    ...customer,
                    updated_at: new Date().toISOString()
                })
                .select();
            
            if (error) throw error;
            return data[0];
        };

        const localStorageOp = async () => {
            const customers = JSON.parse(localStorage.getItem('mci-customers') || '[]');
            const existingIndex = customers.findIndex(c => c.id === customer.id);
            
            if (existingIndex >= 0) {
                customers[existingIndex] = customer;
            } else {
                customers.push(customer);
            }
            
            localStorage.setItem('mci-customers', JSON.stringify(customers));
            
            // Update global array
            window.customers = customers;
            
            return customer;
        };

        return this.executeWithFallback(supabaseOp, localStorageOp, 'customers');
    }

    async getCustomers() {
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            const { data, error } = await client
                .from('customers')
                .select('*')
                .order('name', { ascending: true });
            
            if (error) throw error;
            return data || [];
        };

        const localStorageOp = async () => {
            const customers = JSON.parse(localStorage.getItem('mci-customers') || '[]');
            return customers;
        };

        return this.executeWithFallback(supabaseOp, localStorageOp, 'customers');
    }

    async deleteCustomer(customerId) {
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            const { error } = await client
                .from('customers')
                .delete()
                .eq('id', customerId);
            
            if (error) throw error;
            return true;
        };

        const localStorageOp = async () => {
            const customers = JSON.parse(localStorage.getItem('mci-customers') || '[]');
            const filtered = customers.filter(c => c.id !== customerId);
            
            localStorage.setItem('mci-customers', JSON.stringify(filtered));
            
            // Update global array
            window.customers = filtered;
            
            return true;
        };

        return this.executeWithFallback(supabaseOp, localStorageOp, 'customers');
    }

    /**
     * E-POD OPERATIONS
     */

    async saveEPodRecord(epodRecord) {
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            const { data, error } = await client
                .from('epod_records')
                .insert(epodRecord)
                .select();
            
            if (error) throw error;
            return data[0];
        };

        const localStorageOp = async () => {
            const epodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
            epodRecords.push(epodRecord);
            localStorage.setItem('ePodRecords', JSON.stringify(epodRecords));
            return epodRecord;
        };

        return this.executeWithFallback(supabaseOp, localStorageOp, 'epod_records');
    }

    async getEPodRecords() {
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            const { data, error } = await client
                .from('epod_records')
                .select('*')
                .order('signed_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        };

        const localStorageOp = async () => {
            const epodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
            return epodRecords;
        };

        return this.executeWithFallback(supabaseOp, localStorageOp, 'epod_records');
    }

    /**
     * USER PROFILE OPERATIONS
     */

    async saveUserProfile(profile) {
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            const { data, error } = await client
                .from('user_profiles')
                .upsert({
                    ...profile,
                    updated_at: new Date().toISOString()
                })
                .select();
            
            if (error) throw error;
            return data[0];
        };

        const localStorageOp = async () => {
            localStorage.setItem('mci-user-profile', JSON.stringify(profile));
            return profile;
        };

        return this.executeWithFallback(supabaseOp, localStorageOp, 'user_profiles');
    }

    async getUserProfile(userId) {
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            const { data, error } = await client
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        };

        const localStorageOp = async () => {
            const profile = localStorage.getItem('mci-user-profile');
            return profile ? JSON.parse(profile) : null;
        };

        return this.executeWithFallback(supabaseOp, localStorageOp, 'user_profiles');
    }

    /**
     * MIGRATION OPERATIONS
     */

    async migrateLocalStorageToSupabase() {
        if (!this.isSupabaseAvailable()) {
            console.warn('Supabase not available, cannot migrate data');
            return false;
        }

        try {
            console.log('🔄 Starting data migration to Supabase...');
            
            // Migrate active deliveries
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            for (const delivery of activeDeliveries) {
                await this.saveDelivery(delivery);
            }
            console.log(`✅ Migrated ${activeDeliveries.length} active deliveries`);
            
            // Migrate delivery history
            const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            for (const delivery of deliveryHistory) {
                await this.saveDelivery(delivery);
            }
            console.log(`✅ Migrated ${deliveryHistory.length} delivery history items`);
            
            // Migrate customers
            const customers = JSON.parse(localStorage.getItem('mci-customers') || '[]');
            for (const customer of customers) {
                await this.saveCustomer(customer);
            }
            console.log(`✅ Migrated ${customers.length} customers`);
            
            // Migrate E-POD records
            const epodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
            for (const record of epodRecords) {
                await this.saveEPodRecord(record);
            }
            console.log(`✅ Migrated ${epodRecords.length} E-POD records`);
            
            console.log('🎉 Data migration completed successfully!');
            return true;
            
        } catch (error) {
            console.error('❌ Data migration failed:', error);
            return false;
        }
    }

    /**
     * SYNC OPERATIONS
     */

    async syncData() {
        if (!this.isSupabaseAvailable()) {
            console.log('Supabase not available, skipping sync');
            return;
        }

        try {
            console.log('🔄 Syncing data with Supabase...');
            
            // Load fresh data from Supabase
            const deliveries = await this.getDeliveries();
            const customers = await this.getCustomers();
            
            // Update local storage and global arrays
            const activeDeliveries = deliveries.filter(d => d.status !== 'Completed');
            const deliveryHistory = deliveries.filter(d => d.status === 'Completed');
            
            localStorage.setItem('mci-active-deliveries', JSON.stringify(activeDeliveries));
            localStorage.setItem('mci-delivery-history', JSON.stringify(deliveryHistory));
            localStorage.setItem('mci-customers', JSON.stringify(customers));
            
            // Update global arrays
            window.activeDeliveries = activeDeliveries;
            window.deliveryHistory = deliveryHistory;
            window.customers = customers;
            
            console.log('✅ Data sync completed');
            
        } catch (error) {
            console.error('❌ Data sync failed:', error);
        }
    }
}

// Create global instance
const dataService = new DataService();

// Export to global scope
window.dataService = dataService;

// Auto-sync every 30 seconds if online
setInterval(() => {
    if (dataService.isSupabaseAvailable()) {
        dataService.syncData();
    }
}, 30000);

console.log('✅ Data Service loaded successfully');