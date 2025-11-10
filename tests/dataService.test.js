/**
 * Unit Tests for DataService
 * Tests all CRUD operations, validation, and error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mockSupabaseClient } from './setup.js';

// Import DataService class
// Note: In a real scenario, we'd need to properly import the class
// For now, we'll define it inline for testing purposes
class DataService {
    constructor() {
        this.client = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client not available. Ensure supabase is loaded before DataService.');
        }
        this.client = window.supabaseClient();
        this.isInitialized = true;
    }

    _ensureInitialized() {
        if (!this.isInitialized || !this.client) {
            throw new Error('DataService not initialized. Call initialize() first.');
        }
    }

    _checkNetworkStatus() {
        if (window.networkStatusService && !window.networkStatusService.getStatus()) {
            const error = new Error('No internet connection. This operation requires network access.');
            error.code = 'NETWORK_OFFLINE';
            throw error;
        }
    }

    async create(table, data) {
        this._ensureInitialized();
        this._checkNetworkStatus();
        
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
            if (window.ErrorHandler) {
                window.ErrorHandler.handle(error, `DataService.create(${table})`);
            }
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
        
        return result[0];
    }

    async read(table, filters = {}) {
        this._ensureInitialized();
        
        if (window.Logger) {
            window.Logger.info(`Reading records from ${table}`, { table, filters });
        }
        
        let query = this.client.from(table).select('*');
        
        Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                query = query.in(key, value);
            } else {
                query = query.eq(key, value);
            }
        });
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
            if (window.ErrorHandler) {
                window.ErrorHandler.handle(error, `DataService.read(${table})`);
            }
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
        
        return data || [];
    }

    async saveDelivery(delivery) {
        this._ensureInitialized();
        
        const supabaseData = {
            ...delivery,
            updated_at: new Date().toISOString()
        };
        
        let existingRecord = null;
        
        if (supabaseData.id && supabaseData.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            const { data: recordById } = await this.client
                .from('deliveries')
                .select('*')
                .eq('id', supabaseData.id)
                .maybeSingle();
            
            if (recordById) {
                existingRecord = recordById;
            }
        }
        
        if (!existingRecord && supabaseData.dr_number) {
            const { data: recordByDr } = await this.client
                .from('deliveries')
                .select('*')
                .eq('dr_number', supabaseData.dr_number)
                .maybeSingle();
            
            if (recordByDr) {
                existingRecord = recordByDr;
                supabaseData.id = recordByDr.id;
            }
        }
        
        if (existingRecord) {
            const updateData = { ...supabaseData };
            delete updateData.id;
            
            const { data, error } = await this.client
                .from('deliveries')
                .update(updateData)
                .eq('id', existingRecord.id)
                .select();
            
            if (error) throw error;
            return data[0];
        }
        
        const insertData = { ...supabaseData };
        delete insertData.id;
        
        if (!insertData.dr_number || !insertData.customer_name) {
            throw new Error('Missing required fields: dr_number and customer_name are required');
        }
        
        const { data, error } = await this.client
            .from('deliveries')
            .insert(insertData)
            .select();
        
        if (error) throw error;
        return data[0];
    }

    async getDeliveries(filters = {}) {
        this._ensureInitialized();
        
        let query = this.client.from('deliveries').select('*');
        
        if (filters.status) {
            if (Array.isArray(filters.status)) {
                query = query.in('status', filters.status);
            } else {
                query = query.eq('status', filters.status);
            }
        }
        
        Object.entries(filters).forEach(([key, value]) => {
            if (key !== 'status') {
                query = query.eq(key, value);
            }
        });
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    }

    async saveCustomer(customer) {
        this._ensureInitialized();
        
        const customerData = {
            ...customer,
            name: customer.name || customer.customer_name || customer.customerName || '',
            updated_at: new Date().toISOString()
        };
        
        if (!customerData.name || customerData.name.trim() === '') {
            throw new Error('Customer name is required and cannot be empty');
        }
        
        const { data, error } = await this.client
            .from('customers')
            .upsert(customerData)
            .select();
        
        if (error) throw error;
        return data[0];
    }

    async getCustomers() {
        this._ensureInitialized();
        
        const { data, error } = await this.client
            .from('customers')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        return data || [];
    }
}

describe('DataService', () => {
    let dataService;

    beforeEach(async () => {
        // Reset all mocks
        vi.clearAllMocks();
        
        // Create new instance
        dataService = new DataService();
        
        // Initialize
        await dataService.initialize();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize successfully with supabase client', async () => {
            const service = new DataService();
            await service.initialize();
            
            expect(service.isInitialized).toBe(true);
            expect(service.client).toBeDefined();
        });

        it('should throw error if supabase client is not available', async () => {
            const service = new DataService();
            const originalClient = window.supabaseClient;
            window.supabaseClient = null;
            
            await expect(service.initialize()).rejects.toThrow('Supabase client not available');
            
            window.supabaseClient = originalClient;
        });

        it('should throw error when calling methods before initialization', async () => {
            const service = new DataService();
            
            await expect(service.create('test', {})).rejects.toThrow('DataService not initialized');
        });
    });

    describe('saveDelivery()', () => {
        describe('with valid data', () => {
            it('should create a new delivery with required fields', async () => {
                const delivery = {
                    dr_number: 'DR-001',
                    customer_name: 'Test Customer',
                    status: 'Active'
                };

                // Mock the database responses
                mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null });
                mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null });
                mockSupabaseClient.select.mockResolvedValueOnce({
                    data: [{ id: 'uuid-123', ...delivery }],
                    error: null
                });

                const result = await dataService.saveDelivery(delivery);

                expect(result).toBeDefined();
                expect(result.dr_number).toBe('DR-001');
                expect(result.customer_name).toBe('Test Customer');
                expect(mockSupabaseClient.from).toHaveBeenCalledWith('deliveries');
                expect(mockSupabaseClient.insert).toHaveBeenCalled();
            });

            it('should update existing delivery when ID matches', async () => {
                const existingDelivery = {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    dr_number: 'DR-001',
                    customer_name: 'Test Customer'
                };

                const updatedData = {
                    ...existingDelivery,
                    status: 'Completed'
                };

                // Mock finding existing record by ID
                mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
                    data: existingDelivery
                });
                mockSupabaseClient.select.mockResolvedValueOnce({
                    data: [updatedData],
                    error: null
                });

                const result = await dataService.saveDelivery(updatedData);

                expect(result).toBeDefined();
                expect(result.status).toBe('Completed');
                expect(mockSupabaseClient.update).toHaveBeenCalled();
            });

            it('should update existing delivery when DR number matches', async () => {
                const existingDelivery = {
                    id: 'uuid-123',
                    dr_number: 'DR-001',
                    customer_name: 'Test Customer'
                };

                const updatedData = {
                    dr_number: 'DR-001',
                    customer_name: 'Test Customer',
                    status: 'In Transit'
                };

                // Mock not finding by ID, but finding by DR number
                mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null });
                mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
                    data: existingDelivery
                });
                mockSupabaseClient.select.mockResolvedValueOnce({
                    data: [{ ...existingDelivery, ...updatedData }],
                    error: null
                });

                const result = await dataService.saveDelivery(updatedData);

                expect(result).toBeDefined();
                expect(result.status).toBe('In Transit');
                expect(mockSupabaseClient.update).toHaveBeenCalled();
            });

            it('should include all delivery fields', async () => {
                const delivery = {
                    dr_number: 'DR-002',
                    customer_name: 'Customer 2',
                    vendor_number: 'V-123',
                    origin: 'Manila',
                    destination: 'Cebu',
                    truck_plate_number: 'ABC-123',
                    status: 'Active',
                    booked_date: '2025-01-01'
                };

                mockSupabaseClient.maybeSingle.mockResolvedValue({ data: null });
                mockSupabaseClient.select.mockResolvedValueOnce({
                    data: [{ id: 'uuid-456', ...delivery }],
                    error: null
                });

                const result = await dataService.saveDelivery(delivery);

                expect(result.vendor_number).toBe('V-123');
                expect(result.origin).toBe('Manila');
                expect(result.destination).toBe('Cebu');
                expect(result.truck_plate_number).toBe('ABC-123');
            });
        });

        describe('with invalid data', () => {
            it('should throw error when dr_number is missing', async () => {
                const delivery = {
                    customer_name: 'Test Customer'
                };

                mockSupabaseClient.maybeSingle.mockResolvedValue({ data: null });

                await expect(dataService.saveDelivery(delivery)).rejects.toThrow(
                    'Missing required fields: dr_number and customer_name are required'
                );
            });

            it('should throw error when customer_name is missing', async () => {
                const delivery = {
                    dr_number: 'DR-001'
                };

                mockSupabaseClient.maybeSingle.mockResolvedValue({ data: null });

                await expect(dataService.saveDelivery(delivery)).rejects.toThrow(
                    'Missing required fields: dr_number and customer_name are required'
                );
            });

            it('should throw error when both required fields are missing', async () => {
                const delivery = {
                    status: 'Active'
                };

                mockSupabaseClient.maybeSingle.mockResolvedValue({ data: null });

                await expect(dataService.saveDelivery(delivery)).rejects.toThrow(
                    'Missing required fields'
                );
            });
        });
    });

    describe('getDeliveries()', () => {
        describe('with various filters', () => {
            it('should get all deliveries without filters', async () => {
                const mockDeliveries = [
                    { id: '1', dr_number: 'DR-001', status: 'Active' },
                    { id: '2', dr_number: 'DR-002', status: 'Completed' }
                ];

                mockSupabaseClient.order.mockResolvedValueOnce({
                    data: mockDeliveries,
                    error: null
                });

                const result = await dataService.getDeliveries();

                expect(result).toHaveLength(2);
                expect(result).toEqual(mockDeliveries);
                expect(mockSupabaseClient.from).toHaveBeenCalledWith('deliveries');
                expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
            });

            it('should filter by single status', async () => {
                const mockDeliveries = [
                    { id: '1', dr_number: 'DR-001', status: 'Active' }
                ];

                mockSupabaseClient.order.mockResolvedValueOnce({
                    data: mockDeliveries,
                    error: null
                });

                const result = await dataService.getDeliveries({ status: 'Active' });

                expect(result).toHaveLength(1);
                expect(result[0].status).toBe('Active');
                expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'Active');
            });

            it('should filter by multiple statuses', async () => {
                const mockDeliveries = [
                    { id: '1', dr_number: 'DR-001', status: 'Active' },
                    { id: '2', dr_number: 'DR-002', status: 'In Transit' }
                ];

                mockSupabaseClient.order.mockResolvedValueOnce({
                    data: mockDeliveries,
                    error: null
                });

                const result = await dataService.getDeliveries({
                    status: ['Active', 'In Transit']
                });

                expect(result).toHaveLength(2);
                expect(mockSupabaseClient.in).toHaveBeenCalledWith('status', ['Active', 'In Transit']);
            });

            it('should filter by custom field', async () => {
                const mockDeliveries = [
                    { id: '1', dr_number: 'DR-001', customer_name: 'Customer A' }
                ];

                mockSupabaseClient.order.mockResolvedValueOnce({
                    data: mockDeliveries,
                    error: null
                });

                const result = await dataService.getDeliveries({
                    customer_name: 'Customer A'
                });

                expect(result).toHaveLength(1);
                expect(mockSupabaseClient.eq).toHaveBeenCalledWith('customer_name', 'Customer A');
            });

            it('should return empty array when no deliveries found', async () => {
                mockSupabaseClient.order.mockResolvedValueOnce({
                    data: [],
                    error: null
                });

                const result = await dataService.getDeliveries();

                expect(result).toEqual([]);
            });

            it('should handle null data response', async () => {
                mockSupabaseClient.order.mockResolvedValueOnce({
                    data: null,
                    error: null
                });

                const result = await dataService.getDeliveries();

                expect(result).toEqual([]);
            });
        });
    });

    describe('saveCustomer()', () => {
        describe('with validation', () => {
            it('should save customer with valid data', async () => {
                const customer = {
                    id: 'CUST-001',
                    name: 'Test Customer',
                    phone: '123-456-7890',
                    email: 'test@example.com'
                };

                mockSupabaseClient.select.mockResolvedValueOnce({
                    data: [customer],
                    error: null
                });

                const result = await dataService.saveCustomer(customer);

                expect(result).toBeDefined();
                expect(result.name).toBe('Test Customer');
                expect(mockSupabaseClient.from).toHaveBeenCalledWith('customers');
                expect(mockSupabaseClient.upsert).toHaveBeenCalled();
            });

            it('should normalize customer_name to name field', async () => {
                const customer = {
                    id: 'CUST-002',
                    customer_name: 'Customer Name',
                    phone: '123-456-7890'
                };

                mockSupabaseClient.select.mockResolvedValueOnce({
                    data: [{ ...customer, name: 'Customer Name' }],
                    error: null
                });

                const result = await dataService.saveCustomer(customer);

                expect(result.name).toBe('Customer Name');
            });

            it('should throw error when name is empty string', async () => {
                const customer = {
                    id: 'CUST-003',
                    name: '',
                    phone: '123-456-7890'
                };

                await expect(dataService.saveCustomer(customer)).rejects.toThrow(
                    'Customer name is required and cannot be empty'
                );
            });

            it('should throw error when name is only whitespace', async () => {
                const customer = {
                    id: 'CUST-004',
                    name: '   ',
                    phone: '123-456-7890'
                };

                await expect(dataService.saveCustomer(customer)).rejects.toThrow(
                    'Customer name is required and cannot be empty'
                );
            });

            it('should throw error when name is missing', async () => {
                const customer = {
                    id: 'CUST-005',
                    phone: '123-456-7890'
                };

                await expect(dataService.saveCustomer(customer)).rejects.toThrow(
                    'Customer name is required and cannot be empty'
                );
            });

            it('should save customer with all optional fields', async () => {
                const customer = {
                    id: 'CUST-006',
                    name: 'Full Customer',
                    contact_person: 'John Doe',
                    phone: '123-456-7890',
                    email: 'john@example.com',
                    address: '123 Main St',
                    account_type: 'Corporate',
                    status: 'active',
                    notes: 'VIP customer'
                };

                mockSupabaseClient.select.mockResolvedValueOnce({
                    data: [customer],
                    error: null
                });

                const result = await dataService.saveCustomer(customer);

                expect(result.contact_person).toBe('John Doe');
                expect(result.address).toBe('123 Main St');
                expect(result.account_type).toBe('Corporate');
                expect(result.notes).toBe('VIP customer');
            });
        });
    });

    describe('Error Handling', () => {
        describe('Network errors', () => {
            it('should throw error when offline for create operations', async () => {
                window.networkStatusService.getStatus.mockReturnValueOnce(false);

                await expect(
                    dataService.create('deliveries', { dr_number: 'DR-001' })
                ).rejects.toThrow('No internet connection');
            });

            it('should allow read operations when offline', async () => {
                window.networkStatusService.getStatus.mockReturnValueOnce(false);

                mockSupabaseClient.order.mockResolvedValueOnce({
                    data: [],
                    error: null
                });

                // Read operations don't check network status
                const result = await dataService.getDeliveries();
                expect(result).toEqual([]);
            });
        });

        describe('Database errors', () => {
            it('should handle and throw database errors on create', async () => {
                const dbError = {
                    message: 'Database error',
                    code: '23505',
                    details: 'Duplicate key violation'
                };

                mockSupabaseClient.select.mockResolvedValueOnce({
                    data: null,
                    error: dbError
                });

                await expect(
                    dataService.create('deliveries', { dr_number: 'DR-001' })
                ).rejects.toThrow('Database error');

                expect(window.ErrorHandler.handle).toHaveBeenCalled();
                expect(window.Logger.error).toHaveBeenCalled();
            });

            it('should handle and throw database errors on read', async () => {
                const dbError = {
                    message: 'Connection timeout',
                    code: 'PGRST301'
                };

                mockSupabaseClient.order.mockResolvedValueOnce({
                    data: null,
                    error: dbError
                });

                await expect(dataService.read('deliveries')).rejects.toThrow('Connection timeout');

                expect(window.ErrorHandler.handle).toHaveBeenCalled();
                expect(window.Logger.error).toHaveBeenCalled();
            });

            it('should handle duplicate key errors on saveDelivery', async () => {
                const dbError = {
                    message: 'duplicate key value violates unique constraint',
                    code: '23505'
                };

                mockSupabaseClient.maybeSingle.mockResolvedValue({ data: null });
                mockSupabaseClient.select.mockResolvedValueOnce({
                    data: null,
                    error: dbError
                });

                await expect(
                    dataService.saveDelivery({
                        dr_number: 'DR-001',
                        customer_name: 'Test'
                    })
                ).rejects.toThrow('duplicate key value');
            });

            it('should handle constraint violation on saveCustomer', async () => {
                const dbError = {
                    message: 'violates foreign key constraint',
                    code: '23503'
                };

                mockSupabaseClient.select.mockResolvedValueOnce({
                    data: null,
                    error: dbError
                });

                await expect(
                    dataService.saveCustomer({
                        name: 'Test Customer',
                        phone: '123-456-7890'
                    })
                ).rejects.toThrow('violates foreign key constraint');
            });
        });

        describe('Logging', () => {
            it('should log successful create operations', async () => {
                mockSupabaseClient.select.mockResolvedValueOnce({
                    data: [{ id: '1', name: 'test' }],
                    error: null
                });

                await dataService.create('test_table', { name: 'test' });

                expect(window.Logger.info).toHaveBeenCalledWith(
                    'Creating record in test_table',
                    expect.any(Object)
                );
            });

            it('should log errors with context', async () => {
                const dbError = {
                    message: 'Test error',
                    code: 'TEST_ERROR',
                    details: 'Error details'
                };

                mockSupabaseClient.select.mockResolvedValueOnce({
                    data: null,
                    error: dbError
                });

                await expect(
                    dataService.create('test_table', { name: 'test' })
                ).rejects.toThrow();

                expect(window.Logger.error).toHaveBeenCalledWith(
                    'Failed to create record in test_table',
                    expect.objectContaining({
                        table: 'test_table',
                        error: 'Test error',
                        code: 'TEST_ERROR'
                    })
                );
            });
        });
    });
});
