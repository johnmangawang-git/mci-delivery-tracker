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
        const client = window.supabaseClient && window.supabaseClient();
        const isOnline = window.isSupabaseOnline && window.isSupabaseOnline();
        
        console.log('🔍 Supabase availability check:', {
            clientAvailable: !!client,
            isOnline: isOnline,
            clientType: typeof client
        });
        
        return client && isOnline;
    }

    /**
     * Execute operation with storage priority (NEW APPROACH)
     */
    async executeWithStoragePriority(operation, tableName, data, localStorageKey) {
        // Use storage priority service if available
        if (window.storagePriorityService) {
            console.log(`🔄 Using storage priority service for ${tableName}`);
            try {
                const result = await window.storagePriorityService.executeWithPriority(operation, tableName, data);
                console.log(`✅ Storage priority operation successful:`, result);
                return result.data;
            } catch (error) {
                console.warn(`⚠️ Storage priority operation failed, using fallback:`, error);
            }
        }
        
        // Fallback to original auto-sync approach
        if (window.autoSyncService) {
            console.log(`🔄 Using auto-sync for ${tableName}`);
            return await window.autoSyncService.syncData(operation, tableName, data, localStorageKey);
        }
        
        // Fallback to original method
        return await this.executeWithFallback(
            async () => {
                const client = window.supabaseClient();
                const { data: result, error } = await client.from(tableName).upsert(data).select();
                if (error) throw error;
                return result;
            },
            async () => {
                // Save to localStorage
                const existing = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
                const updated = Array.isArray(data) ? [...existing, ...data] : [...existing, data];
                localStorage.setItem(localStorageKey, JSON.stringify(updated));
                return data;
            },
            tableName
        );
    }

    /**
     * Execute operation with fallback (legacy method)
     */
    async executeWithFallback(supabaseOperation, localStorageOperation, tableName = '') {
        // NEW APPROACH: Try Supabase first as primary storage
        if (this.isSupabaseAvailable()) {
            try {
                console.log(`Attempting Supabase operation for ${tableName} (primary storage)`);
                const result = await supabaseOperation();
                // Only save to localStorage as backup after successful Supabase operation
                try {
                    await localStorageOperation();
                    console.log(`✅ Saved to localStorage as backup for ${tableName}`);
                } catch (localStorageError) {
                    console.warn(`⚠️ Failed to save to localStorage backup for ${tableName}:`, localStorageError);
                    // Don't fail the operation if localStorage backup fails
                }
                return result;
            } catch (error) {
                console.warn(`⚠️ Supabase operation failed for ${tableName}, using localStorage fallback:`, error);
                this.isOnline = false;
            }
        } else {
            console.log(`Supabase not available for ${tableName}, using localStorage fallback`);
        }

        // Fallback to localStorage when Supabase is not available or fails
        return await localStorageOperation();
    }

    /**
     * DELIVERY OPERATIONS
     */

    async saveDelivery(delivery) {
        // NEW APPROACH: Use storage priority service
        if (window.storagePriorityService) {
            try {
                const result = await window.storagePriorityService.executeWithPriority('upsert', 'deliveries', delivery);
                console.log('✅ Delivery saved with storage priority:', result);
                return result.data;
            } catch (error) {
                console.warn('⚠️ Storage priority save failed:', error);
            }
        }

        // Fallback to original approach
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            
            // Prepare data for Supabase - remove custom ID to let Supabase generate UUID
            const supabaseData = {
                ...delivery,
                updated_at: new Date().toISOString()
            };
            
            // Remove custom ID if it's not a valid UUID format
            if (supabaseData.id && !supabaseData.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                console.log('🔧 Removing custom ID for Supabase UUID generation:', supabaseData.id);
                delete supabaseData.id;
            }
            
            // Check if record with this DR number already exists
            if (supabaseData.dr_number) {
                const { data: existingRecord } = await client
                    .from('deliveries')
                    .select('*')
                    .eq('dr_number', supabaseData.dr_number)
                    .single();
                
                if (existingRecord) {
                    console.log('✅ DR number already exists, updating existing record:', supabaseData.dr_number);
                    // Update existing record
                    const { data, error } = await client
                        .from('deliveries')
                        .update(supabaseData)
                        .eq('dr_number', supabaseData.dr_number)
                        .select();
                    
                    if (error) throw error;
                    
                    // ENHANCED: Also update individual cost items in additional_cost_items table
                    const updatedDelivery = data[0];
                    if (updatedDelivery && supabaseData.additional_cost_items && Array.isArray(supabaseData.additional_cost_items)) {
                        console.log('💾 Updating individual cost items in additional_cost_items table...');
                        
                        try {
                            // First, delete existing cost items for this delivery
                            const { error: deleteError } = await client
                                .from('additional_cost_items')
                                .delete()
                                .eq('delivery_id', updatedDelivery.id);
                            
                            if (deleteError) {
                                console.warn('⚠️ Could not delete existing cost items:', deleteError);
                            } else {
                                console.log('🗑️ Deleted existing cost items for delivery:', updatedDelivery.id);
                            }
                            
                            // Then, insert new cost items if any
                            if (supabaseData.additional_cost_items.length > 0) {
                                const costItemsToInsert = supabaseData.additional_cost_items.map(item => ({
                                    delivery_id: updatedDelivery.id,
                                    description: item.description || 'Unknown Cost',
                                    amount: parseFloat(item.amount) || 0,
                                    category: item.category || 'Other',
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                }));
                                
                                const { data: costItemsData, error: costItemsError } = await client
                                    .from('additional_cost_items')
                                    .insert(costItemsToInsert)
                                    .select();
                                
                                if (costItemsError) {
                                    console.warn('⚠️ Could not insert updated cost items:', costItemsError);
                                } else {
                                    console.log('✅ Successfully updated cost items in additional_cost_items table:', costItemsData?.length || 0);
                                }
                            }
                        } catch (costItemsException) {
                            console.warn('⚠️ Exception updating cost items:', costItemsException.message);
                        }
                    }
                    
                    return updatedDelivery;
                }
            }
            
            // Use safe upsert to handle duplicate DR numbers
            let data, error;
            if (window.safeUpsertDelivery) {
                console.log('🔄 Using safe upsert for delivery:', supabaseData.dr_number);
                const result = await window.safeUpsertDelivery(supabaseData);
                data = result.data;
                error = result.error;
            } else {
                // Fallback to direct insert if safe upsert not available
                console.log('⚠️ Safe upsert not available, using direct insert');
                const result = await client
                    .from('deliveries')
                    .insert(supabaseData)
                    .select();
                data = result.data;
                error = result.error;
            }
            
            if (error) throw error;
            
            // ENHANCED: Also save individual cost items to additional_cost_items table
            const savedDelivery = data[0];
            if (savedDelivery && supabaseData.additional_cost_items && Array.isArray(supabaseData.additional_cost_items) && supabaseData.additional_cost_items.length > 0) {
                console.log('💾 Saving individual cost items to additional_cost_items table...', supabaseData.additional_cost_items.length);
                
                try {
                    // Prepare cost items for insertion
                    const costItemsToInsert = supabaseData.additional_cost_items.map(item => ({
                        delivery_id: savedDelivery.id,
                        description: item.description || 'Unknown Cost',
                        amount: parseFloat(item.amount) || 0,
                        category: item.category || 'Other',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }));
                    
                    // Insert cost items to dedicated table
                    const { data: costItemsData, error: costItemsError } = await client
                        .from('additional_cost_items')
                        .insert(costItemsToInsert)
                        .select();
                    
                    if (costItemsError) {
                        console.warn('⚠️ Could not save cost items to additional_cost_items table:', costItemsError);
                        // Don't fail the whole operation, just log the warning
                    } else {
                        console.log('✅ Successfully saved cost items to additional_cost_items table:', costItemsData?.length || 0);
                    }
                } catch (costItemsException) {
                    console.warn('⚠️ Exception saving cost items:', costItemsException.message);
                    // Don't fail the whole operation
                }
            }
            
            return savedDelivery;
        };

        const localStorageOp = async () => {
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            
            // Remove from both arrays first using both id and dr_number for robustness
            const filteredActive = activeDeliveries.filter(d => 
                (d.id !== delivery.id && (d.dr_number || d.drNumber) !== (delivery.dr_number || delivery.drNumber))
            );
            const filteredHistory = deliveryHistory.filter(d => 
                (d.id !== delivery.id && (d.dr_number || d.drNumber) !== (delivery.dr_number || delivery.drNumber))
            );
            
            // Add to appropriate array based on status
            if (delivery.status === 'Completed') {
                // For completed deliveries, ensure we're not duplicating in active
                filteredHistory.unshift(delivery);
                localStorage.setItem('mci-delivery-history', JSON.stringify(filteredHistory));
                localStorage.setItem('mci-active-deliveries', JSON.stringify(filteredActive));
                
                // Update global arrays
                window.deliveryHistory = filteredHistory;
                window.activeDeliveries = filteredActive;
                
                // Update analytics dashboard stats
                if (typeof window.updateDashboardStats === 'function') {
                    setTimeout(() => {
                        window.updateDashboardStats();
                    }, 100);
                }
            } else {
                // For active deliveries, ensure we're not duplicating in history
                filteredActive.push(delivery);
                localStorage.setItem('mci-active-deliveries', JSON.stringify(filteredActive));
                localStorage.setItem('mci-delivery-history', JSON.stringify(filteredHistory));
                
                // Update global arrays
                window.activeDeliveries = filteredActive;
                window.deliveryHistory = filteredHistory;
                
                // Update analytics dashboard stats
                if (typeof window.updateDashboardStats === 'function') {
                    setTimeout(() => {
                        window.updateDashboardStats();
                    }, 100);
                }
            }
            
            return delivery;
        };

        return this.executeWithStoragePriority('upsert', 'deliveries', delivery, 'mci-active-deliveries');
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
            
            // Ensure we're using the correct field name for status filtering
            if (filters.status) {
                if (filters.status === 'Completed') {
                    // For completed status, filter by both field name formats
                    allDeliveries = allDeliveries.filter(d => 
                        (d.status === 'Completed') || 
                        (d.status === 'Signed') ||
                        (d.status === 'Completed' && (d.dr_number || d.drNumber))
                    );
                } else {
                    // For other statuses, exclude completed deliveries
                    allDeliveries = allDeliveries.filter(d => 
                        (d.status !== 'Completed') && 
                        (d.status !== 'Signed')
                    );
                }
            }
            
            return allDeliveries;
        };

        return this.executeWithFallback(supabaseOp, localStorageOp, 'deliveries');
    }

    async updateDeliveryStatusInSupabase(drNumber, newStatus) {
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            const { data, error } = await client
                .from('deliveries')
                .update({ 
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('dr_number', drNumber)
                .select();

            if (error) {
                console.error(`Error updating status in Supabase for DR ${drNumber}:`, error);
                throw error;
            }
            console.log(`Successfully updated status to ${newStatus} for DR ${drNumber} in Supabase.`, data);
            return data;
        };

        // This operation is critical for Supabase, so the fallback is just to log an error.
        const localStorageOp = async () => {
            console.warn(`Supabase is offline. Could not update status for DR ${drNumber} to ${newStatus}.`);
            // We can try to update the local storage as a fallback, but the source of truth is Supabase
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            const deliveryIndex = activeDeliveries.findIndex(d => (d.drNumber || d.dr_number) === drNumber);
            if (deliveryIndex !== -1) {
                activeDeliveries[deliveryIndex].status = newStatus;
                localStorage.setItem('mci-active-deliveries', JSON.stringify(activeDeliveries));
            }
            return null; // Indicate that the primary operation failed.
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
            
            // Filter using both id and dr_number/drNumber for robustness
            const filteredActive = activeDeliveries.filter(d => 
                d.id !== deliveryId && (d.dr_number || d.drNumber) !== deliveryId
            );
            const filteredHistory = deliveryHistory.filter(d => 
                d.id !== deliveryId && (d.dr_number || d.drNumber) !== deliveryId
            );
            
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
            
            // Log the EPOD record being saved for debugging
            console.log('📝 Saving EPOD record to Supabase:', epodRecord);
            
            // Validate required fields
            if (!epodRecord.dr_number) {
                throw new Error('Missing required field: dr_number');
            }
            
            console.log('🔍 Supabase client status:', {
                clientAvailable: !!client,
                clientType: typeof client
            });
            
            if (!client) {
                throw new Error('Supabase client not available');
            }
            
            const { data, error } = await client
                .from('epod_records')
                .insert(epodRecord)
                .select();
            
            if (error) {
                console.error('❌ Supabase EPOD save error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });
                console.error('📝 EPOD record that failed to save:', epodRecord);
                throw error;
            }
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
            
            console.log('🔍 Supabase client status for getEPodRecords:', {
                clientAvailable: !!client,
                clientType: typeof client
            });
            
            if (!client) {
                throw new Error('Supabase client not available');
            }
            
            const { data, error } = await client
                .from('epod_records')
                .select('*')
                .order('signed_at', { ascending: false });
            
            if (error) {
                console.error('❌ Supabase EPOD fetch error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });
                throw error;
            }
            return data || [];
        };

        const localStorageOp = async () => {
            const epodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
            return epodRecords;
        };

        return this.executeWithFallback(supabaseOp, localStorageOp, 'epod_records');
    }

    /**
     * ADDITIONAL COST ITEMS OPERATIONS
     */

    async getAdditionalCostItems(filters = {}) {
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            let query = client.from('additional_cost_items').select('*');
            
            if (filters.delivery_id) {
                query = query.eq('delivery_id', filters.delivery_id);
            }
            
            if (filters.category) {
                query = query.eq('category', filters.category);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        };

        const localStorageOp = async () => {
            // DISCONNECTED: No longer read from localStorage for cost breakdown
            // const costBreakdown = JSON.parse(localStorage.getItem('analytics-cost-breakdown') || '[]');
            // return costBreakdown;
            
            // Instead, extract from delivery records' additional_cost_items field
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            const allDeliveries = [...activeDeliveries, ...deliveryHistory];
            
            const costItems = [];
            
            allDeliveries.forEach(delivery => {
                if (delivery.additional_cost_items && Array.isArray(delivery.additional_cost_items)) {
                    delivery.additional_cost_items.forEach(item => {
                        costItems.push({
                            id: `local-${Date.now()}-${Math.random()}`,
                            delivery_id: delivery.id,
                            description: item.description,
                            amount: parseFloat(item.amount) || 0,
                            category: item.category || 'Other',
                            created_at: delivery.created_at || new Date().toISOString()
                        });
                    });
                }
            });
            
            return costItems;
        };

        return this.executeWithFallback(supabaseOp, localStorageOp, 'additional_cost_items');
    }

    async saveAdditionalCostItem(costItem) {
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            const { data, error } = await client
                .from('additional_cost_items')
                .insert({
                    ...costItem,
                    updated_at: new Date().toISOString()
                })
                .select();
            
            if (error) throw error;
            return data[0];
        };

        const localStorageOp = async () => {
            // DISCONNECTED: No longer save to localStorage analytics-cost-breakdown
            // const costBreakdown = JSON.parse(localStorage.getItem('analytics-cost-breakdown') || '[]');
            // costBreakdown.push(costItem);
            // localStorage.setItem('analytics-cost-breakdown', JSON.stringify(costBreakdown));
            
            // Instead, this should be handled by the delivery save process
            console.warn('⚠️ Cost item save fallback - should be handled by delivery save process');
            return costItem;
        };

        return this.executeWithFallback(supabaseOp, localStorageOp, 'additional_cost_items');
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

    /**
     * AUTO-SYNC INTEGRATION METHODS
     */
    
    /**
     * Save delivery with auto-sync
     */
    async saveDeliveryWithSync(delivery) {
        console.log('💾 Saving delivery with auto-sync:', delivery.dr_number);
        
        if (window.syncDelivery) {
            return await window.syncDelivery(delivery);
        } else {
            // Fallback to original method
            return await this.saveDelivery(delivery);
        }
    }
    
    /**
     * Save customer with auto-sync
     */
    async saveCustomerWithSync(customer) {
        console.log('💾 Saving customer with auto-sync:', customer.name);
        
        if (window.syncCustomer) {
            return await window.syncCustomer(customer);
        } else {
            // Fallback to original method
            return await this.saveCustomer(customer);
        }
    }
    
    /**
     * Save delivery history with auto-sync
     */
    async saveDeliveryHistoryWithSync(historyItem) {
        console.log('💾 Saving delivery history with auto-sync:', historyItem.dr_number);
        
        if (window.syncDeliveryHistory) {
            return await window.syncDeliveryHistory(historyItem);
        } else {
            // Fallback to localStorage
            const history = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            history.push(historyItem);
            localStorage.setItem('mci-delivery-history', JSON.stringify(history));
            return historyItem;
        }
    }
    
    /**
     * Force sync all data
     */
    async forceSyncAll() {
        console.log('🚀 Force syncing all data...');
        
        if (window.forceSyncAll) {
            return await window.forceSyncAll();
        } else {
            console.warn('⚠️ Auto-sync service not available');
        }
    }
    
    /**
     * Get sync status
     */
    getSyncStatus() {
        if (window.getSyncStatus) {
            return window.getSyncStatus();
        } else {
            return { 
                online: navigator.onLine, 
                queueLength: 0, 
                syncInProgress: false,
                autoSyncAvailable: false
            };
        }
    }
}

// Create global instance
const dataService = new DataService();

// Export to global scope
window.dataService = dataService;

// Auto-sync every 30 seconds if online
// DISABLED: This might be interfering with status updates
// setInterval(() => {
//     if (dataService.isSupabaseAvailable()) {
//         dataService.syncData();
//     }
// }, 30000);

console.log('✅ Data Service loaded successfully');