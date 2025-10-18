/**
 * Data Service Layer - SUPABASE-ONLY MODE
 * Provides unified interface for all data operations with Supabase (localStorage completely removed)
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
     * Execute Supabase-only operation (localStorage completely removed)
     */
    async executeSupabaseOnly(supabaseOperation, tableName = '') {
        if (!this.isSupabaseAvailable()) {
            throw new Error(`Supabase connection required for ${tableName} operations. Please check your internet connection.`);
        }

        try {
            const result = await supabaseOperation();
            console.log(`✅ SUPABASE-ONLY: ${tableName} operation successful`);
            return result;
        } catch (error) {
            // Handle specific error types
            if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
                console.warn(`⚠️ Duplicate DR number detected for ${tableName}:`, error.message);
                console.warn('This DR number already exists in the database. Using existing record.');
                
                // For duplicate DR numbers, try to fetch the existing record
                if (tableName === 'deliveries' && error.message?.includes('dr_number')) {
                    try {
                        // Extract DR number from error message or details
                        let drNumber = null;
                        
                        // Try to extract from error.details first
                        if (error.details) {
                            const detailsMatch = error.details.match(/dr_number.*?=.*?([^,)]+)/);
                            drNumber = detailsMatch ? detailsMatch[1].replace(/[()'"]/g, '').trim() : null;
                        }
                        
                        // If not found in details, try to extract from error.message
                        if (!drNumber && error.message) {
                            // Look for patterns like: "deliveries_dr_number_key" followed by constraint info
                            // or try to find DR number patterns in the message
                            const messageMatch = error.message.match(/dr_number[^"]*"([^"]+)"/);
                            if (messageMatch) {
                                drNumber = messageMatch[1].trim();
                            } else {
                                // Try alternative pattern matching for DR numbers
                                const drPattern = error.message.match(/DR\d+/i);
                                drNumber = drPattern ? drPattern[0] : null;
                            }
                        }
                        
                        console.log('Extracted DR number:', drNumber, 'from error:', { details: error.details, message: error.message });
                        
                        if (drNumber && drNumber !== 'undefined' && drNumber !== 'null') {
                            const client = window.supabaseClient();
                            const { data: existingRecord } = await client
                                .from('deliveries')
                                .select('*')
                                .eq('dr_number', drNumber)
                                .single();
                            
                            if (existingRecord) {
                                console.log('✅ Found existing DR record:', existingRecord.dr_number);
                                return existingRecord;
                            }
                        } else {
                            console.warn('Could not extract valid DR number from error. Details:', error.details, 'Message:', error.message);
                        }
                    } catch (fetchError) {
                        console.warn('Could not fetch existing record:', fetchError);
                    }
                }
            }
            
            console.error(`❌ SUPABASE-ONLY: ${tableName} operation failed:`, error);
            throw error;
        }
    }

    /**
     * DELIVERY OPERATIONS
     */

    async saveDelivery(delivery) {
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
            
            // Insert new record
            const { data, error } = await client
                .from('deliveries')
                .insert(supabaseData)
                .select();
            
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

        // REMOVED: All localStorage operations - Supabase-only mode
        return this.executeSupabaseOnly(supabaseOp, 'deliveries');
    }

    async getDeliveries(filters = {}) {
        const supabaseOp = async () => {
            const client = window.supabaseClient();
            let query = client.from('deliveries').select('*');
            
            if (filters.status) {
                if (Array.isArray(filters.status)) {
                    // Handle array of status values (e.g., ['Completed', 'Signed'])
                    query = query.in('status', filters.status);
                } else {
                    // Handle single status value (e.g., 'Active')
                    query = query.eq('status', filters.status);
                }
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        };

        // REMOVED: All localStorage operations - Supabase-only mode
        return this.executeSupabaseOnly(supabaseOp, 'deliveries');
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

        // REMOVED: All localStorage operations - Supabase-only mode
        return this.executeSupabaseOnly(supabaseOp, 'deliveries');
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

        // REMOVED: All localStorage operations - Supabase-only mode
        return this.executeSupabaseOnly(supabaseOp, 'deliveries');
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

        // REMOVED: All localStorage operations - Supabase-only mode
        return this.executeSupabaseOnly(supabaseOp, 'customers');
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

        // REMOVED: All localStorage operations - Supabase-only mode
        return this.executeSupabaseOnly(supabaseOp, 'customers');
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

        // REMOVED: All localStorage operations - Supabase-only mode
        return this.executeSupabaseOnly(supabaseOp, 'customers');
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

        // REMOVED: All localStorage operations - Supabase-only mode
        return this.executeSupabaseOnly(supabaseOp, 'epod_records');
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

        // REMOVED: All localStorage operations - Supabase-only mode
        return this.executeSupabaseOnly(supabaseOp, 'epod_records');
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

        // REMOVED: All localStorage operations - Supabase-only mode
        return this.executeSupabaseOnly(supabaseOp, 'additional_cost_items');
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

        // REMOVED: All localStorage operations - Supabase-only mode
        return this.executeSupabaseOnly(supabaseOp, 'additional_cost_items');
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

        // REMOVED: All localStorage operations - Supabase-only mode
        return this.executeSupabaseOnly(supabaseOp, 'user_profiles');
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

        // REMOVED: All localStorage operations - Supabase-only mode
        return this.executeSupabaseOnly(supabaseOp, 'user_profiles');
    }

    /**
     * MIGRATION OPERATIONS - DISABLED IN SUPABASE-ONLY MODE
     */

    async migrateLocalStorageToSupabase() {
        console.warn('🚫 Migration disabled - System is now Supabase-only mode');
        console.warn('📝 All data operations go directly to Supabase');
        return false;
    }

    /**
     * SYNC OPERATIONS - DISABLED IN SUPABASE-ONLY MODE
     */

    async syncData() {
        console.warn('🚫 Sync disabled - System is now Supabase-only mode');
        console.warn('📝 All data is fetched directly from Supabase in real-time');
        console.warn('💡 No localStorage sync needed - data is always fresh from database');
        return;
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