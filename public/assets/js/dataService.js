/**
 * Data Service Layer - Database-Centric Architecture
 * Provides unified interface for all data operations with Supabase as single source of truth
 * All localStorage dependencies have been removed - Supabase is the only persistent storage
 */

console.log('🔧 Loading Data Service...');

class DataService {
    constructor() {
        this.client = null;
        this.isInitialized = false;
    }

    /**
     * Initialize Supabase client
     * Must be called before any data operations
     * Includes comprehensive retry logic for race conditions
     */
    async initialize() {
        // If already initialized, return immediately
        if (this.isInitialized && this.client) {
            console.log('✅ DataService already initialized');
            return;
        }
        
        console.log('🔧 Initializing DataService...');
        
        try {
            // Method 1: Check if supabase-init.js has already initialized the client
            if (window.supabase && typeof window.supabase.from === 'function') {
                console.log('✅ Using existing Supabase client from global initialization');
                this.client = window.supabase;
                this.isInitialized = true;
                console.log('✅ DataService initialized with existing Supabase client');
                return;
            }
            
            // Method 2: Wait for supabase-init.js to complete initialization
            if (typeof window.waitForSupabase === 'function') {
                console.log('⏳ Waiting for global Supabase initialization...');
                this.client = await window.waitForSupabase(10000);
                this.isInitialized = true;
                console.log('✅ DataService initialized after waiting for Supabase');
                return;
            }
            
            // Method 3: Try to get client from supabaseClient function
            if (typeof window.supabaseClient === 'function') {
                console.log('⏳ Attempting to get client from window.supabaseClient()...');
                this.client = window.supabaseClient();
                
                if (this.client && typeof this.client.from === 'function') {
                    this.isInitialized = true;
                    console.log('✅ DataService initialized with supabaseClient()');
                    return;
                }
            }
            
            // Method 4: Try to initialize using ensureSupabaseClientReady
            if (typeof window.ensureSupabaseClientReady === 'function') {
                console.log('⏳ Using ensureSupabaseClientReady...');
                this.client = await window.ensureSupabaseClientReady();
                this.isInitialized = true;
                console.log('✅ DataService initialized with ensureSupabaseClientReady');
                return;
            }
            
            // Method 5: Manual wait and retry
            console.log('⏳ Waiting for Supabase library to load from CDN...');
            let attempts = 0;
            const maxAttempts = 20;
            
            while (attempts < maxAttempts) {
                // Check if Supabase is available
                if (window.supabase && typeof window.supabase.from === 'function') {
                    console.log('✅ Supabase client found after waiting');
                    this.client = window.supabase;
                    this.isInitialized = true;
                    console.log('✅ DataService initialized after manual wait');
                    return;
                }
                
                // Check if createClient is available
                if (window.supabase && typeof window.supabase.createClient === 'function') {
                    console.log('🔧 Creating Supabase client manually...');
                    const url = window.SUPABASE_URL || 'https://ntyvrezyhrmflswxefbk.supabase.co';
                    const key = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eXZyZXp5aHJtZmxzd3hlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjUzNTgsImV4cCI6MjA3MDY0MTM1OH0.JX0YP42_40lKQ1ghUmIA_Lu0YVZB_Ytl0EdQinU0Nm4';
                    
                    this.client = window.supabase.createClient(url, key, {
                        auth: {
                            persistSession: true,
                            autoRefreshToken: true,
                            detectSessionInUrl: false
                        }
                    });
                    
                    if (this.client && typeof this.client.from === 'function') {
                        // Store globally for other components
                        window.supabase = this.client;
                        window.supabaseClient = () => this.client;
                        
                        this.isInitialized = true;
                        console.log('✅ DataService initialized with manually created client');
                        return;
                    }
                }
                
                attempts++;
                console.log(`⏳ Waiting for Supabase... (attempt ${attempts}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // If we get here, all methods failed
            throw new Error('Supabase client initialization failed after all attempts. Check your internet connection and Supabase configuration.');
            
        } catch (error) {
            console.error('❌ DataService initialization failed:', error);
            this.isInitialized = false;
            this.client = null;
            throw error;
        }
    }

    /**
     * Ensure client is initialized before operations
     * @private
     */
    _ensureInitialized() {
        if (!this.isInitialized || !this.client) {
            throw new Error('DataService not initialized. Call initialize() first.');
        }
    }

    /**
     * Check network status before operations
     * @private
     * @throws {Error} If offline
     */
    _checkNetworkStatus() {
        if (window.networkStatusService && !window.networkStatusService.getStatus()) {
            const error = new Error('No internet connection. This operation requires network access.');
            error.code = 'NETWORK_OFFLINE';
            throw error;
        }
    }

    /**
     * GENERIC CRUD OPERATIONS
     */

    /**
     * Create a new record in the specified table
     * @param {string} table - Table name
     * @param {object} data - Data to insert
     * @returns {Promise<object>} Created record
     */
    async create(table, data) {
        this._ensureInitialized();
        this._checkNetworkStatus();
        
        try {
            // Log the operation
            if (window.Logger) {
                window.Logger.info(`Creating record in ${table}`, { table, data });
            }
            
            const { data: result, error } = await this.client
                .from(table)
                .insert({
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select();
            
            if (error) {
                console.error(`❌ Error creating record in ${table}:`, error);
                
                // Use ErrorHandler for consistent error processing
                if (window.ErrorHandler) {
                    window.ErrorHandler.handle(error, `DataService.create(${table})`);
                }
                
                // Log the error
                if (window.Logger) {
                    window.Logger.error(`Failed to create record in ${table}`, {
                        table,
                        error: error.message,
                        code: error.code,
                        details: error.details
                    });
                }
                
                throw error;
            }
            
            console.log(`✅ Created record in ${table}:`, result[0]);
            return result[0];
        } catch (error) {
            // Re-throw after logging
            throw error;
        }
    }

    /**
     * Read records from the specified table
     * @param {string} table - Table name
     * @param {object} filters - Filter conditions
     * @returns {Promise<Array>} Array of records
     */
    async read(table, filters = {}) {
        this._ensureInitialized();
        
        try {
            // Log the operation
            if (window.Logger) {
                window.Logger.info(`Reading records from ${table}`, { table, filters });
            }
            
            let query = this.client.from(table).select('*');
            
            // Apply filters
            Object.entries(filters).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    query = query.in(key, value);
                } else {
                    query = query.eq(key, value);
                }
            });
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) {
                console.error(`❌ Error reading from ${table}:`, error);
                
                // Use ErrorHandler for consistent error processing
                if (window.ErrorHandler) {
                    window.ErrorHandler.handle(error, `DataService.read(${table})`);
                }
                
                // Log the error
                if (window.Logger) {
                    window.Logger.error(`Failed to read records from ${table}`, {
                        table,
                        filters,
                        error: error.message,
                        code: error.code,
                        details: error.details
                    });
                }
                
                throw error;
            }
            
            console.log(`✅ Read ${data?.length || 0} records from ${table}`);
            return data || [];
        } catch (error) {
            // Re-throw after logging
            throw error;
        }
    }

    /**
     * Update a record in the specified table
     * @param {string} table - Table name
     * @param {string} id - Record ID
     * @param {object} data - Data to update
     * @returns {Promise<object>} Updated record
     */
    async update(table, id, data) {
        this._ensureInitialized();
        this._checkNetworkStatus();
        
        try {
            // Log the operation
            if (window.Logger) {
                window.Logger.info(`Updating record in ${table}`, { table, id, data });
            }
            
            const { data: result, error } = await this.client
                .from(table)
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();
            
            if (error) {
                console.error(`❌ Error updating record in ${table}:`, error);
                
                // Use ErrorHandler for consistent error processing
                if (window.ErrorHandler) {
                    window.ErrorHandler.handle(error, `DataService.update(${table})`);
                }
                
                // Log the error
                if (window.Logger) {
                    window.Logger.error(`Failed to update record in ${table}`, {
                        table,
                        id,
                        error: error.message,
                        code: error.code,
                        details: error.details
                    });
                }
                
                throw error;
            }
            
            console.log(`✅ Updated record in ${table}:`, result[0]);
            return result[0];
        } catch (error) {
            // Re-throw after logging
            throw error;
        }
    }

    /**
     * Delete a record from the specified table
     * @param {string} table - Table name
     * @param {string} id - Record ID
     * @returns {Promise<boolean>} Success status
     */
    async delete(table, id) {
        this._ensureInitialized();
        this._checkNetworkStatus();
        
        try {
            // Log the operation
            if (window.Logger) {
                window.Logger.info(`Deleting record from ${table}`, { table, id });
            }
            
            const { error } = await this.client
                .from(table)
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error(`❌ Error deleting record from ${table}:`, error);
                
                // Use ErrorHandler for consistent error processing
                if (window.ErrorHandler) {
                    window.ErrorHandler.handle(error, `DataService.delete(${table})`);
                }
                
                // Log the error
                if (window.Logger) {
                    window.Logger.error(`Failed to delete record from ${table}`, {
                        table,
                        id,
                        error: error.message,
                        code: error.code,
                        details: error.details
                    });
                }
                
                throw error;
            }
            
            console.log(`✅ Deleted record from ${table} with id: ${id}`);
            return true;
        } catch (error) {
            // Re-throw after logging
            throw error;
        }
    }

    /**
     * DELIVERY OPERATIONS
     */

    /**
     * Save a delivery (create or update)
     * @param {object} delivery - Delivery data
     * @returns {Promise<object>} Saved delivery
     */
    async saveDelivery(delivery) {
        this._ensureInitialized();
        
        try {
            // Prepare data for Supabase
            const supabaseData = {
                ...delivery,
                updated_at: new Date().toISOString()
            };
            
            // Check if record already exists (by ID or DR number)
            let existingRecord = null;
            
            // First, check by UUID if it's valid
            if (supabaseData.id && supabaseData.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                const { data: recordById } = await this.client
                    .from('deliveries')
                    .select('*')
                    .eq('id', supabaseData.id)
                    .maybeSingle();
                
                if (recordById) {
                    existingRecord = recordById;
                    console.log('✅ Found existing record by ID:', supabaseData.id);
                }
            }
            
            // If not found by ID, check by DR number
            if (!existingRecord && supabaseData.dr_number) {
                const { data: recordByDr } = await this.client
                    .from('deliveries')
                    .select('*')
                    .eq('dr_number', supabaseData.dr_number)
                    .maybeSingle();
                
                if (recordByDr) {
                    existingRecord = recordByDr;
                    console.log('✅ Found existing record by DR number:', supabaseData.dr_number);
                    // Use the existing record's ID to avoid conflicts
                    supabaseData.id = recordByDr.id;
                }
            }
            
            // If record exists, UPDATE it
            if (existingRecord) {
                console.log('🔄 Updating existing delivery:', supabaseData.dr_number || supabaseData.id);
                
                // Remove id from update data to avoid conflicts
                const updateData = { ...supabaseData };
                delete updateData.id;
                
                const { data, error } = await this.client
                    .from('deliveries')
                    .update(updateData)
                    .eq('id', existingRecord.id)
                    .select();
                
                if (error) throw error;
                
                const updatedDelivery = data[0];
                
                // Update individual cost items in additional_cost_items table
                if (updatedDelivery && supabaseData.additional_cost_items && Array.isArray(supabaseData.additional_cost_items)) {
                    await this._updateAdditionalCostItems(updatedDelivery.id, supabaseData.additional_cost_items);
                }
                
                // Invalidate deliveries cache after update
                this.invalidateCache('deliveries');
                
                return updatedDelivery;
            }
            
            // INSERT new record (no existing record found)
            console.log('➕ Inserting new delivery:', supabaseData.dr_number);
            
            // Remove ID to let Supabase generate a new UUID
            const insertData = { ...supabaseData };
            delete insertData.id;
            
            // Basic validation
            if (!insertData.dr_number || !insertData.customer_name) {
                throw new Error('Missing required fields: dr_number and customer_name are required');
            }
            
            let data, error;
            
            // Use schema-aware functions if available
            if (window.completeDeliverySave) {
                console.log('🔄 Using complete delivery save with schema validation');
                const result = await window.completeDeliverySave(insertData);
                data = result.data;
                error = result.error;
            } else if (window.safeInsertDelivery) {
                console.log('🔄 Using validated safe insert for delivery');
                const result = await window.safeInsertDelivery(insertData);
                data = result.data;
                error = result.error;
            } else {
                // Fallback: direct insert
                console.log('⚠️ Using direct insert (no schema validation available)');
                const result = await this.client
                    .from('deliveries')
                    .insert(insertData)
                    .select();
                data = result.data;
                error = result.error;
            }
            
            if (error) throw error;
            
            const savedDelivery = data[0];
            
            // Save individual cost items to additional_cost_items table
            if (savedDelivery && supabaseData.additional_cost_items && Array.isArray(supabaseData.additional_cost_items) && supabaseData.additional_cost_items.length > 0) {
                await this._updateAdditionalCostItems(savedDelivery.id, supabaseData.additional_cost_items);
            }
            
            // Invalidate deliveries cache after insert
            this.invalidateCache('deliveries');
            
            return savedDelivery;
            
        } catch (error) {
            console.error('❌ Error saving delivery:', error);
            throw error;
        }
    }

    /**
     * Update additional cost items for a delivery
     * @private
     * @param {string} deliveryId - Delivery ID
     * @param {Array} costItems - Array of cost items
     */
    async _updateAdditionalCostItems(deliveryId, costItems) {
        try {
            console.log('💾 Updating individual cost items in additional_cost_items table...');
            
            // First, delete existing cost items for this delivery
            const { error: deleteError } = await this.client
                .from('additional_cost_items')
                .delete()
                .eq('delivery_id', deliveryId);
            
            if (deleteError) {
                console.warn('⚠️ Could not delete existing cost items:', deleteError);
            } else {
                console.log('🗑️ Deleted existing cost items for delivery:', deliveryId);
            }
            
            // Then, insert new cost items if any
            if (costItems.length > 0) {
                const costItemsToInsert = costItems.map(item => ({
                    delivery_id: deliveryId,
                    description: item.description || 'Unknown Cost',
                    amount: parseFloat(item.amount) || 0,
                    category: item.category || 'Other',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));
                
                const { data: costItemsData, error: costItemsError } = await this.client
                    .from('additional_cost_items')
                    .insert(costItemsToInsert)
                    .select();
                
                if (costItemsError) {
                    console.warn('⚠️ Could not insert updated cost items:', costItemsError);
                } else {
                    console.log('✅ Successfully updated cost items in additional_cost_items table:', costItemsData?.length || 0);
                }
            }
        } catch (error) {
            console.warn('⚠️ Exception updating cost items:', error.message);
        }
    }

    /**
     * Get deliveries with optional filters
     * @param {object} filters - Filter conditions
     * @returns {Promise<Array>} Array of deliveries
     */
    async getDeliveries(filters = {}) {
        this._ensureInitialized();
        
        try {
            let query = this.client.from('deliveries').select('*');
            
            // Apply status filter
            if (filters.status) {
                if (Array.isArray(filters.status)) {
                    query = query.in('status', filters.status);
                } else {
                    query = query.eq('status', filters.status);
                }
            }
            
            // Apply other filters
            Object.entries(filters).forEach(([key, value]) => {
                if (key !== 'status') {
                    query = query.eq(key, value);
                }
            });
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            
            console.log(`✅ Retrieved ${data?.length || 0} deliveries`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Error getting deliveries:', error);
            throw error;
        }
    }

    /**
     * Get deliveries with pagination support
     * @param {object} options - Pagination and filter options
     * @param {number} options.page - Page number (1-based)
     * @param {number} options.pageSize - Number of items per page
     * @param {object} options.filters - Filter conditions
     * @returns {Promise<object>} Paginated result with data and metadata
     */
    async getDeliveriesWithPagination(options = {}) {
        this._ensureInitialized();
        
        const {
            page = 1,
            pageSize = 50,
            filters = {}
        } = options;
        
        try {
            // Calculate range for pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            
            // Build query with count
            let query = this.client
                .from('deliveries')
                .select('*', { count: 'exact' });
            
            // Apply status filter
            if (filters.status) {
                if (Array.isArray(filters.status)) {
                    query = query.in('status', filters.status);
                } else {
                    query = query.eq('status', filters.status);
                }
            }
            
            // Apply other filters
            Object.entries(filters).forEach(([key, value]) => {
                if (key !== 'status') {
                    query = query.eq(key, value);
                }
            });
            
            // Apply pagination and ordering
            query = query
                .order('created_at', { ascending: false })
                .range(from, to);
            
            const { data, error, count } = await query;
            
            if (error) throw error;
            
            const totalPages = Math.ceil(count / pageSize);
            
            console.log(`✅ Retrieved page ${page}/${totalPages} (${data?.length || 0} of ${count} deliveries)`);
            
            return {
                data: data || [],
                pagination: {
                    page,
                    pageSize,
                    totalCount: count,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            };
            
        } catch (error) {
            console.error('❌ Error getting deliveries with pagination:', error);
            throw error;
        }
    }

    /**
     * Get delivery history (completed deliveries)
     * @param {object} filters - Optional filters
     * @returns {Promise<Array>} Array of historical deliveries
     */
    async getDeliveryHistory(filters = {}) {
        this._ensureInitialized();
        
        try {
            let query = this.client.from('delivery_history').select('*');
            
            // Apply filters
            Object.entries(filters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
            
            const { data, error } = await query.order('completed_at', { ascending: false });
            
            if (error) throw error;
            
            console.log(`✅ Retrieved ${data?.length || 0} delivery history records`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Error getting delivery history:', error);
            throw error;
        }
    }

    /**
     * Get delivery history with pagination support
     * @param {object} options - Pagination and filter options
     * @returns {Promise<object>} Paginated result with data and metadata
     */
    async getDeliveryHistoryWithPagination(options = {}) {
        this._ensureInitialized();
        
        const {
            page = 1,
            pageSize = 50,
            filters = {}
        } = options;
        
        try {
            // Calculate range for pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            
            // Build query
            let query = this.client
                .from('delivery_history')
                .select('*', { count: 'exact' });
            
            // Apply filters
            Object.entries(filters).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    query = query.in(key, value);
                } else {
                    query = query.eq(key, value);
                }
            });
            
            // Apply pagination and ordering
            query = query
                .order('completed_at', { ascending: false })
                .range(from, to);
            
            const { data, error, count } = await query;
            
            if (error) throw error;
            
            const totalPages = Math.ceil(count / pageSize);
            
            console.log(`✅ Retrieved page ${page}/${totalPages} (${data?.length || 0} of ${count} history records)`);
            
            return {
                data: data || [],
                pagination: {
                    page,
                    pageSize,
                    totalCount: count,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            };
            
        } catch (error) {
            console.error('❌ Error getting delivery history with pagination:', error);
            throw error;
        }
    }

    /**
     * Update delivery status
     * @param {string} drNumber - DR number
     * @param {string} newStatus - New status
     * @returns {Promise<object>} Updated delivery
     */
    async updateDeliveryStatus(drNumber, newStatus) {
        this._ensureInitialized();
        
        try {
            const { data, error } = await this.client
                .from('deliveries')
                .update({ 
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('dr_number', drNumber)
                .select();

            if (error) {
                console.error(`❌ Error updating status for DR ${drNumber}:`, error);
                throw error;
            }
            
            console.log(`✅ Successfully updated status to ${newStatus} for DR ${drNumber}`);
            
            // If status is Archived, automatically move to history
            if (newStatus === 'Archived' && data && data[0]) {
                console.log(`🔄 Auto-moving DR ${drNumber} to history...`);
                try {
                    await this.moveDeliveryToHistory(drNumber);
                } catch (historyError) {
                    console.error(`⚠️ Failed to move to history, but status was updated:`, historyError);
                    // Don't throw - status update succeeded
                }
            }
            
            return data[0];
            
        } catch (error) {
            console.error('❌ Error updating delivery status:', error);
            throw error;
        }
    }

    /**
     * Move a delivery to history table (PERMANENT)
     * This physically moves the record from 'deliveries' to 'delivery_history' table
     * Once moved, the delivery will NEVER appear in active deliveries again
     * @param {string} drNumber - DR number to move
     * @returns {Promise<object>} The history record created
     */
    async moveDeliveryToHistory(drNumber) {
        this._ensureInitialized();
        
        try {
            console.log(`📦 Moving DR ${drNumber} to permanent history...`);
            
            // Step 1: Get the delivery from active deliveries
            const { data: delivery, error: fetchError } = await this.client
                .from('deliveries')
                .select('*')
                .eq('dr_number', drNumber)
                .single();
            
            if (fetchError) {
                console.error(`❌ Error fetching delivery ${drNumber}:`, fetchError);
                throw fetchError;
            }
            
            if (!delivery) {
                console.warn(`⚠️ Delivery ${drNumber} not found in active deliveries`);
                return null;
            }
            
            // Step 2: Insert into delivery_history table
            // Build history record with only fields that exist in the table
            const historyRecord = {
                ...delivery,
                status: 'Archived' // Ensure status is Archived
            };
            
            // Add optional fields if they might exist in the table
            // These will be ignored if the columns don't exist
            try {
                historyRecord.original_delivery_id = delivery.id;
                historyRecord.completed_at = new Date().toISOString();
                historyRecord.moved_to_history_at = new Date().toISOString();
                historyRecord.moved_by_user_id = delivery.user_id;
            } catch (e) {
                console.warn('⚠️ Some optional history fields may not be set:', e);
            }
            
            // Remove the id so a new one is generated for history
            delete historyRecord.id;
            
            const { data: historyData, error: insertError } = await this.client
                .from('delivery_history')
                .insert(historyRecord)
                .select()
                .single();
            
            if (insertError) {
                console.error(`❌ Error inserting into delivery_history:`, insertError);
                console.error(`❌ Error details:`, insertError.message);
                
                // If error is about missing columns, provide helpful message
                if (insertError.message && insertError.message.includes('does not exist')) {
                    console.error(`❌ Missing columns in delivery_history table!`);
                    console.error(`❌ Please run: supabase/add-missing-history-columns.sql`);
                }
                
                throw insertError;
            }
            
            console.log(`✅ Inserted DR ${drNumber} into delivery_history`);
            console.log(`📊 History record details:`, {
                id: historyData.id,
                dr_number: historyData.dr_number,
                status: historyData.status,
                completed_at: historyData.completed_at,
                moved_to_history_at: historyData.moved_to_history_at
            });
            
            // Step 3: Delete from active deliveries table
            const { error: deleteError } = await this.client
                .from('deliveries')
                .delete()
                .eq('dr_number', drNumber);
            
            if (deleteError) {
                console.error(`❌ Error deleting from deliveries:`, deleteError);
                // This is critical - we don't want duplicates
                throw deleteError;
            }
            
            console.log(`✅ Deleted DR ${drNumber} from active deliveries`);
            console.log(`🎉 DR ${drNumber} permanently moved to history!`);
            
            // Invalidate caches
            this.invalidateCache('deliveries');
            this.invalidateCache('delivery_history');
            
            return historyData;
            
        } catch (error) {
            console.error(`❌ Error moving delivery to history:`, error);
            throw error;
        }
    }

    /**
     * Delete a delivery
     * @param {string} deliveryId - Delivery ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteDelivery(deliveryId) {
        this._ensureInitialized();
        
        try {
            const { error } = await this.client
                .from('deliveries')
                .delete()
                .eq('id', deliveryId);
            
            if (error) throw error;
            
            // Invalidate deliveries cache after delete
            this.invalidateCache('deliveries');
            
            console.log(`✅ Deleted delivery with id: ${deliveryId}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting delivery:', error);
            throw error;
        }
    }

    /**
     * CUSTOMER OPERATIONS
     */

    /**
     * Save a customer (create or update)
     * @param {object} customer - Customer data
     * @returns {Promise<object>} Saved customer
     */
    async saveCustomer(customer) {
        this._ensureInitialized();
        
        try {
            // Use validated safe insert for customers if available
            if (window.safeInsertCustomer) {
                console.log('🔄 Using validated safe insert for customer:', customer.name || customer.customer_name);
                const result = await window.safeInsertCustomer({
                    ...customer,
                    updated_at: new Date().toISOString()
                });
                
                if (result.error) throw result.error;
                return result.data[0];
            }
            
            // Fallback with validation
            const customerData = {
                ...customer,
                name: customer.name || customer.customer_name || customer.customerName || '',
                updated_at: new Date().toISOString()
            };
            
            // Validate required fields
            if (!customerData.name || customerData.name.trim() === '') {
                throw new Error('Customer name is required and cannot be empty');
            }
            
            const { data, error } = await this.client
                .from('customers')
                .upsert(customerData)
                .select();
            
            if (error) {
                console.error('❌ Customer save error:', error);
                throw error;
            }
            
            // Invalidate customers cache after save
            this.invalidateCache('customers');
            
            console.log('✅ Saved customer:', data[0]);
            return data[0];
            
        } catch (error) {
            console.error('❌ Error saving customer:', error);
            throw error;
        }
    }

    /**
     * Get all customers
     * @returns {Promise<Array>} Array of customers
     */
    async getCustomers() {
        this._ensureInitialized();
        
        try {
            const { data, error } = await this.client
                .from('customers')
                .select('*')
                .order('name', { ascending: true });
            
            if (error) throw error;
            
            console.log(`✅ Retrieved ${data?.length || 0} customers`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Error getting customers:', error);
            throw error;
        }
    }

    /**
     * Delete a customer
     * @param {string} customerId - Customer ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteCustomer(customerId) {
        this._ensureInitialized();
        
        try {
            const { error } = await this.client
                .from('customers')
                .delete()
                .eq('id', customerId);
            
            if (error) throw error;
            
            // Invalidate customers cache after delete
            this.invalidateCache('customers');
            
            console.log(`✅ Deleted customer with id: ${customerId}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting customer:', error);
            throw error;
        }
    }

    /**
     * E-POD OPERATIONS
     */

    /**
     * Save an E-POD record
     * @param {object} epodRecord - E-POD record data
     * @returns {Promise<object>} Saved E-POD record
     */
    async saveEPodRecord(epodRecord) {
        this._ensureInitialized();
        
        try {
            console.log('📝 Saving EPOD record to Supabase:', epodRecord);
            
            // Validate required fields
            if (!epodRecord.dr_number) {
                throw new Error('Missing required field: dr_number');
            }
            
            const { data, error } = await this.client
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
                throw error;
            }
            
            console.log('✅ Saved EPOD record:', data[0]);
            return data[0];
            
        } catch (error) {
            console.error('❌ Error saving EPOD record:', error);
            throw error;
        }
    }

    /**
     * Get all E-POD records
     * @returns {Promise<Array>} Array of E-POD records
     */
    async getEPodRecords() {
        this._ensureInitialized();
        
        try {
            const { data, error } = await this.client
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
            
            console.log(`✅ Retrieved ${data?.length || 0} EPOD records`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Error getting EPOD records:', error);
            throw error;
        }
    }

    /**
     * ADDITIONAL COST ITEMS OPERATIONS
     */

    /**
     * Get additional cost items with optional filters
     * @param {object} filters - Filter conditions
     * @returns {Promise<Array>} Array of cost items
     */
    async getAdditionalCostItems(filters = {}) {
        this._ensureInitialized();
        
        try {
            let query = this.client.from('additional_cost_items').select('*');
            
            if (filters.delivery_id) {
                query = query.eq('delivery_id', filters.delivery_id);
            }
            
            if (filters.category) {
                query = query.eq('category', filters.category);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            
            console.log(`✅ Retrieved ${data?.length || 0} cost items`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Error getting cost items:', error);
            throw error;
        }
    }

    /**
     * Save an additional cost item
     * @param {object} costItem - Cost item data
     * @returns {Promise<object>} Saved cost item
     */
    async saveAdditionalCostItem(costItem) {
        this._ensureInitialized();
        
        try {
            const { data, error } = await this.client
                .from('additional_cost_items')
                .insert({
                    ...costItem,
                    updated_at: new Date().toISOString()
                })
                .select();
            
            if (error) throw error;
            
            console.log('✅ Saved cost item:', data[0]);
            return data[0];
            
        } catch (error) {
            console.error('❌ Error saving cost item:', error);
            throw error;
        }
    }

    /**
     * USER PROFILE OPERATIONS
     */

    /**
     * Save a user profile
     * @param {object} profile - User profile data
     * @returns {Promise<object>} Saved profile
     */
    async saveUserProfile(profile) {
        this._ensureInitialized();
        
        try {
            const { data, error } = await this.client
                .from('user_profiles')
                .upsert({
                    ...profile,
                    updated_at: new Date().toISOString()
                })
                .select();
            
            if (error) throw error;
            
            console.log('✅ Saved user profile:', data[0]);
            return data[0];
            
        } catch (error) {
            console.error('❌ Error saving user profile:', error);
            throw error;
        }
    }

    /**
     * Get a user profile
     * @param {string} userId - User ID
     * @returns {Promise<object|null>} User profile or null
     */
    async getUserProfile(userId) {
        this._ensureInitialized();
        
        try {
            const { data, error } = await this.client
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            
            console.log('✅ Retrieved user profile:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Error getting user profile:', error);
            throw error;
        }
    }

    /**
     * QUERY OPTIMIZATION METHODS
     * Task 19: Optimize database queries and add indexes
     * Requirements: 5.2, 5.5, 8.1
     */

    /**
     * Get deliveries with optimized query and caching
     * Uses composite indexes and query result caching
     * @param {object} options - Query options
     * @param {string|string[]} options.status - Status filter
     * @param {string} options.userId - User ID filter
     * @param {number} options.limit - Limit results
     * @param {boolean} options.useCache - Whether to use cache (default: true)
     * @param {number} options.cacheTTL - Cache TTL in ms (default: 30000)
     * @returns {Promise<Array>} Array of deliveries
     */
    async getDeliveriesOptimized(options = {}) {
        this._ensureInitialized();
        
        const {
            status = null,
            userId = null,
            limit = null,
            useCache = true,
            cacheTTL = 30000 // 30 seconds default
        } = options;

        try {
            // Generate cache key
            const cacheKey = `deliveries:${JSON.stringify({ status, userId, limit })}`;
            
            // Check cache if enabled
            if (useCache && window.cacheService) {
                const cached = window.cacheService.get(cacheKey);
                if (cached) {
                    console.log('✅ Retrieved deliveries from cache');
                    return cached;
                }
            }

            // Build optimized query
            // Uses idx_deliveries_status_user_created composite index
            let query = this.client
                .from('deliveries')
                .select('*');
            
            // Apply filters in optimal order (matches composite index)
            if (status) {
                if (Array.isArray(status)) {
                    query = query.in('status', status);
                } else {
                    query = query.eq('status', status);
                }
            }
            
            if (userId) {
                query = query.eq('user_id', userId);
            }
            
            // Order by created_at DESC (matches index)
            query = query.order('created_at', { ascending: false });
            
            // Apply limit if specified
            if (limit) {
                query = query.limit(limit);
            }

            const startTime = performance.now();
            const { data, error } = await query;
            const queryTime = performance.now() - startTime;

            if (error) throw error;

            // Log query performance
            if (window.Logger) {
                window.Logger.info('Query executed', {
                    table: 'deliveries',
                    filters: { status, userId, limit },
                    resultCount: data?.length || 0,
                    queryTime: `${queryTime.toFixed(2)}ms`
                });
            }

            // Cache results if enabled
            if (useCache && window.cacheService && data) {
                window.cacheService.set(cacheKey, data, cacheTTL);
            }

            console.log(`✅ Retrieved ${data?.length || 0} deliveries (${queryTime.toFixed(2)}ms)`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Error getting optimized deliveries:', error);
            throw error;
        }
    }

    /**
     * Search customers by name with optimized case-insensitive search
     * Uses idx_customers_name_lower index
     * @param {string} searchTerm - Search term
     * @param {object} options - Search options
     * @param {number} options.limit - Limit results (default: 50)
     * @param {boolean} options.useCache - Whether to use cache (default: true)
     * @returns {Promise<Array>} Array of matching customers
     */
    async searchCustomersByName(searchTerm, options = {}) {
        this._ensureInitialized();
        
        const {
            limit = 50,
            useCache = true
        } = options;

        try {
            if (!searchTerm || searchTerm.trim() === '') {
                return [];
            }

            const normalizedSearch = searchTerm.toLowerCase().trim();
            const cacheKey = `customers:search:${normalizedSearch}:${limit}`;

            // Check cache
            if (useCache && window.cacheService) {
                const cached = window.cacheService.get(cacheKey);
                if (cached) {
                    console.log('✅ Retrieved customer search from cache');
                    return cached;
                }
            }

            const startTime = performance.now();
            
            // Use case-insensitive search with index
            const { data, error } = await this.client
                .from('customers')
                .select('*')
                .ilike('name', `%${normalizedSearch}%`)
                .order('name', { ascending: true })
                .limit(limit);

            const queryTime = performance.now() - startTime;

            if (error) throw error;

            // Log performance
            if (window.Logger) {
                window.Logger.info('Customer search executed', {
                    searchTerm: normalizedSearch,
                    resultCount: data?.length || 0,
                    queryTime: `${queryTime.toFixed(2)}ms`
                });
            }

            // Cache results
            if (useCache && window.cacheService && data) {
                window.cacheService.set(cacheKey, data, 60000); // 1 minute cache
            }

            console.log(`✅ Found ${data?.length || 0} customers (${queryTime.toFixed(2)}ms)`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Error searching customers:', error);
            throw error;
        }
    }

    /**
     * Get deliveries with cost summary using optimized view
     * @param {string} status - 'active' or 'completed'
     * @param {object} options - Query options
     * @returns {Promise<Array>} Array of deliveries with cost summary
     */
    async getDeliveriesWithCostSummary(status = 'active', options = {}) {
        this._ensureInitialized();
        
        const {
            useCache = true,
            cacheTTL = 30000
        } = options;

        try {
            const viewName = status === 'active' 
                ? 'active_deliveries_summary' 
                : 'completed_deliveries_summary';
            
            const cacheKey = `deliveries:summary:${status}`;

            // Check cache
            if (useCache && window.cacheService) {
                const cached = window.cacheService.get(cacheKey);
                if (cached) {
                    console.log(`✅ Retrieved ${status} deliveries summary from cache`);
                    return cached;
                }
            }

            const startTime = performance.now();
            
            const { data, error } = await this.client
                .from(viewName)
                .select('*')
                .order('created_at', { ascending: false });

            const queryTime = performance.now() - startTime;

            if (error) throw error;

            // Log performance
            if (window.Logger) {
                window.Logger.info('Delivery summary query executed', {
                    status,
                    resultCount: data?.length || 0,
                    queryTime: `${queryTime.toFixed(2)}ms`
                });
            }

            // Cache results
            if (useCache && window.cacheService && data) {
                window.cacheService.set(cacheKey, data, cacheTTL);
            }

            console.log(`✅ Retrieved ${data?.length || 0} ${status} deliveries with costs (${queryTime.toFixed(2)}ms)`);
            return data || [];
            
        } catch (error) {
            console.error(`❌ Error getting ${status} deliveries summary:`, error);
            throw error;
        }
    }

    /**
     * Batch get deliveries by DR numbers (optimized for multiple lookups)
     * Uses idx_deliveries_dr_number index
     * @param {string[]} drNumbers - Array of DR numbers
     * @returns {Promise<Array>} Array of deliveries
     */
    async getDeliveriesByDrNumbers(drNumbers) {
        this._ensureInitialized();
        
        try {
            if (!drNumbers || drNumbers.length === 0) {
                return [];
            }

            const startTime = performance.now();
            
            // Use IN query with index
            const { data, error } = await this.client
                .from('deliveries')
                .select('*')
                .in('dr_number', drNumbers);

            const queryTime = performance.now() - startTime;

            if (error) throw error;

            // Log performance
            if (window.Logger) {
                window.Logger.info('Batch DR lookup executed', {
                    requestedCount: drNumbers.length,
                    foundCount: data?.length || 0,
                    queryTime: `${queryTime.toFixed(2)}ms`
                });
            }

            console.log(`✅ Retrieved ${data?.length || 0} deliveries by DR numbers (${queryTime.toFixed(2)}ms)`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Error getting deliveries by DR numbers:', error);
            throw error;
        }
    }

    /**
     * Get recent deliveries with limit (optimized for dashboard)
     * Uses idx_deliveries_created_at index
     * @param {number} limit - Number of recent deliveries to fetch
     * @param {object} options - Query options
     * @returns {Promise<Array>} Array of recent deliveries
     */
    async getRecentDeliveries(limit = 10, options = {}) {
        this._ensureInitialized();
        
        const {
            useCache = true,
            cacheTTL = 15000 // 15 seconds for recent data
        } = options;

        try {
            const cacheKey = `deliveries:recent:${limit}`;

            // Check cache
            if (useCache && window.cacheService) {
                const cached = window.cacheService.get(cacheKey);
                if (cached) {
                    console.log('✅ Retrieved recent deliveries from cache');
                    return cached;
                }
            }

            const startTime = performance.now();
            
            // Optimized query using created_at index
            const { data, error } = await this.client
                .from('deliveries')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            const queryTime = performance.now() - startTime;

            if (error) throw error;

            // Log performance
            if (window.Logger) {
                window.Logger.info('Recent deliveries query executed', {
                    limit,
                    resultCount: data?.length || 0,
                    queryTime: `${queryTime.toFixed(2)}ms`
                });
            }

            // Cache results
            if (useCache && window.cacheService && data) {
                window.cacheService.set(cacheKey, data, cacheTTL);
            }

            console.log(`✅ Retrieved ${data?.length || 0} recent deliveries (${queryTime.toFixed(2)}ms)`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Error getting recent deliveries:', error);
            throw error;
        }
    }

    /**
     * Invalidate cache for specific data types
     * Call this after data modifications to ensure cache consistency
     * @param {string} dataType - Type of data to invalidate ('deliveries', 'customers', 'all')
     */
    invalidateCache(dataType = 'all') {
        if (!window.cacheService) {
            return;
        }

        try {
            switch (dataType) {
                case 'deliveries':
                    window.cacheService.invalidate(/^deliveries:/);
                    console.log('✅ Invalidated deliveries cache');
                    break;
                case 'customers':
                    window.cacheService.invalidate(/^customers:/);
                    console.log('✅ Invalidated customers cache');
                    break;
                case 'all':
                    window.cacheService.clear();
                    console.log('✅ Cleared all cache');
                    break;
                default:
                    window.cacheService.invalidate(new RegExp(`^${dataType}:`));
                    console.log(`✅ Invalidated ${dataType} cache`);
            }
        } catch (error) {
            console.warn('⚠️ Error invalidating cache:', error);
        }
    }

    /**
     * Get query performance statistics
     * @returns {object} Performance statistics
     */
    getPerformanceStats() {
        const stats = {
            cacheEnabled: !!window.cacheService,
            cacheStats: window.cacheService ? window.cacheService.getStats() : null,
            optimizationsActive: true
        };

        console.log('📊 Performance Statistics:', stats);
        return stats;
    }
}

// Create global instance
const dataService = new DataService();

// Export to global scope
window.dataService = dataService;

console.log('✅ Data Service loaded successfully');
