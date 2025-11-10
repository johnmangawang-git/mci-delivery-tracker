# DataService API Documentation

## Overview

The `DataService` class is the core data access layer for the MCI Delivery Tracker application. It provides a unified interface for all database operations using Supabase as the single source of truth. This service follows a **database-centric architecture** where all data operations interact directly with the cloud database.

## Architecture Principles

### Single Source of Truth
- **Supabase is the only persistent storage** - No localStorage, indexedDB, or sessionStorage for business data
- All CRUD operations go directly to the cloud database
- No data duplication or synchronization conflicts

### Async-First Design
- All methods are asynchronous and return Promises
- Proper error handling with try-catch blocks
- Loading states and user feedback for all operations

### Error Handling
- Integrated with `ErrorHandler` for consistent error processing
- Network status checking before operations
- Detailed error logging with `Logger` service

## Initialization

### `initialize()`

Initializes the DataService with the Supabase client. **Must be called before any data operations.**

```javascript
const dataService = new DataService();
await dataService.initialize();
```

**Throws:**
- `Error` if Supabase client is not available

**Example:**
```javascript
// In your app initialization
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await dataService.initialize();
        console.log('DataService ready');
    } catch (error) {
        console.error('Failed to initialize DataService:', error);
    }
});
```

## Generic CRUD Operations

### `create(table, data)`

Creates a new record in the specified table.

**Parameters:**
- `table` (string) - Name of the table
- `data` (object) - Data to insert

**Returns:** `Promise<object>` - The created record

**Example:**
```javascript
const newDelivery = await dataService.create('deliveries', {
    dr_number: 'DR-2024-001',
    customer_name: 'Acme Corp',
    status: 'Active'
});
```

### `read(table, filters)`

Reads records from the specified table with optional filters.

**Parameters:**
- `table` (string) - Name of the table
- `filters` (object) - Optional filters to apply

**Returns:** `Promise<Array>` - Array of matching records

**Example:**
```javascript
// Get all active deliveries
const activeDeliveries = await dataService.read('deliveries', {
    status: 'Active'
});

// Get all deliveries (no filters)
const allDeliveries = await dataService.read('deliveries');
```

### `update(table, id, data)`

Updates an existing record in the specified table.

**Parameters:**
- `table` (string) - Name of the table
- `id` (string|number) - ID of the record to update
- `data` (object) - Data to update

**Returns:** `Promise<object>` - The updated record

**Example:**
```javascript
const updated = await dataService.update('deliveries', deliveryId, {
    status: 'Completed',
    completed_date: new Date().toISOString()
});
```

### `delete(table, id)`

Deletes a record from the specified table.

**Parameters:**
- `table` (string) - Name of the table
- `id` (string|number) - ID of the record to delete

**Returns:** `Promise<void>`

**Example:**
```javascript
await dataService.delete('deliveries', deliveryId);
```

## Delivery Operations

### `saveDelivery(delivery)`

Saves a delivery record (create or update).

**Parameters:**
- `delivery` (object) - Delivery data

**Returns:** `Promise<object>` - The saved delivery

**Validation:**
- Validates delivery data using `DataValidator`
- Checks for required fields (dr_number, customer_name)

**Example:**
```javascript
const delivery = {
    dr_number: 'DR-2024-001',
    customer_name: 'Acme Corp',
    vendor_number: 'V-123',
    origin: 'Manila',
    destination: 'Cebu',
    truck_plate_number: 'ABC-1234',
    status: 'Active',
    booked_date: new Date().toISOString()
};

const saved = await dataService.saveDelivery(delivery);
```

### `getDeliveries(filters)`

Retrieves deliveries with optional filters.

**Parameters:**
- `filters` (object) - Optional filters
  - `status` (string|Array) - Filter by status
  - `customer_name` (string) - Filter by customer name
  - `dr_number` (string) - Filter by DR number
  - `startDate` (string) - Filter by start date
  - `endDate` (string) - Filter by end date

**Returns:** `Promise<Array>` - Array of deliveries

**Example:**
```javascript
// Get active deliveries
const active = await dataService.getDeliveries({
    status: ['Active', 'In Transit']
});

// Get completed deliveries for a date range
const completed = await dataService.getDeliveries({
    status: 'Completed',
    startDate: '2024-01-01',
    endDate: '2024-01-31'
});

// Get deliveries by customer
const customerDeliveries = await dataService.getDeliveries({
    customer_name: 'Acme Corp'
});
```

### `updateDeliveryStatus(drNumber, newStatus, additionalData)`

Updates the status of a delivery.

**Parameters:**
- `drNumber` (string) - DR number of the delivery
- `newStatus` (string) - New status value
- `additionalData` (object) - Optional additional data to update

**Returns:** `Promise<object>` - The updated delivery

**Example:**
```javascript
// Complete a delivery
await dataService.updateDeliveryStatus('DR-2024-001', 'Completed', {
    completed_date: new Date().toISOString(),
    completed_date_time: new Date().toISOString()
});

// Update to In Transit
await dataService.updateDeliveryStatus('DR-2024-001', 'In Transit');
```

### `deleteDelivery(deliveryId)`

Deletes a delivery record.

**Parameters:**
- `deliveryId` (string) - ID of the delivery to delete

**Returns:** `Promise<void>`

**Example:**
```javascript
await dataService.deleteDelivery(delivery.id);
```

## Customer Operations

### `saveCustomer(customer)`

Saves a customer record (create or update).

**Parameters:**
- `customer` (object) - Customer data

**Returns:** `Promise<object>` - The saved customer

**Validation:**
- Validates customer data using `DataValidator`
- Checks for required fields (name, phone)

**Example:**
```javascript
const customer = {
    id: 'CUST-001',
    name: 'Acme Corporation',
    contact_person: 'John Doe',
    phone: '+63-912-345-6789',
    email: 'john@acme.com',
    address: '123 Main St, Manila',
    account_type: 'Corporate',
    status: 'active'
};

const saved = await dataService.saveCustomer(customer);
```

### `getCustomers(filters)`

Retrieves customers with optional filters.

**Parameters:**
- `filters` (object) - Optional filters
  - `status` (string) - Filter by status
  - `account_type` (string) - Filter by account type
  - `name` (string) - Search by name

**Returns:** `Promise<Array>` - Array of customers

**Example:**
```javascript
// Get all active customers
const active = await dataService.getCustomers({
    status: 'active'
});

// Get corporate customers
const corporate = await dataService.getCustomers({
    account_type: 'Corporate'
});

// Search by name
const results = await dataService.getCustomers({
    name: 'Acme'
});
```

### `deleteCustomer(customerId)`

Deletes a customer record.

**Parameters:**
- `customerId` (string) - ID of the customer to delete

**Returns:** `Promise<void>`

**Example:**
```javascript
await dataService.deleteCustomer('CUST-001');
```

## E-POD Operations

### `saveEPodRecord(epodRecord)`

Saves an E-POD (Electronic Proof of Delivery) record.

**Parameters:**
- `epodRecord` (object) - E-POD data

**Returns:** `Promise<object>` - The saved E-POD record

**Example:**
```javascript
const epod = {
    dr_number: 'DR-2024-001',
    customer_name: 'Acme Corp',
    customer_contact: '+63-912-345-6789',
    truck_plate: 'ABC-1234',
    delivery_route: 'Manila to Cebu',
    signature_data: 'data:image/png;base64,...',
    signed_at: new Date().toISOString()
};

const saved = await dataService.saveEPodRecord(epod);
```

### `getEPodRecords(filters)`

Retrieves E-POD records with optional filters.

**Parameters:**
- `filters` (object) - Optional filters
  - `dr_number` (string) - Filter by DR number
  - `customer_name` (string) - Filter by customer name

**Returns:** `Promise<Array>` - Array of E-POD records

**Example:**
```javascript
// Get E-POD for specific DR
const epod = await dataService.getEPodRecords({
    dr_number: 'DR-2024-001'
});

// Get all E-PODs for a customer
const customerEpods = await dataService.getEPodRecords({
    customer_name: 'Acme Corp'
});
```

## Additional Cost Items

### `getAdditionalCostItems(filters)`

Retrieves additional cost items with optional filters.

**Parameters:**
- `filters` (object) - Optional filters
  - `delivery_id` (string) - Filter by delivery ID
  - `category` (string) - Filter by category

**Returns:** `Promise<Array>` - Array of cost items

**Example:**
```javascript
// Get cost items for a delivery
const costs = await dataService.getAdditionalCostItems({
    delivery_id: deliveryId
});

// Get cost items by category
const fuelCosts = await dataService.getAdditionalCostItems({
    category: 'Fuel'
});
```

## Error Handling

All DataService methods throw errors that should be caught and handled appropriately:

```javascript
try {
    const delivery = await dataService.saveDelivery(deliveryData);
    console.log('Delivery saved:', delivery);
} catch (error) {
    if (error.code === 'NETWORK_OFFLINE') {
        showToast('No internet connection. Please try again when online.', 'danger');
    } else if (error.code === '23505') {
        showToast('This delivery already exists.', 'warning');
    } else {
        showToast('Failed to save delivery. Please try again.', 'danger');
    }
    console.error('Error:', error);
}
```

## Integration with Other Services

### ErrorHandler Integration
DataService automatically uses `ErrorHandler` for consistent error processing:

```javascript
if (window.ErrorHandler) {
    window.ErrorHandler.handle(error, 'DataService.saveDelivery');
}
```

### Logger Integration
All operations are logged for debugging and monitoring:

```javascript
if (window.Logger) {
    window.Logger.info('Saving delivery', { dr_number: delivery.dr_number });
}
```

### NetworkStatusService Integration
Network status is checked before operations:

```javascript
if (window.networkStatusService && !window.networkStatusService.getStatus()) {
    throw new Error('No internet connection');
}
```

### CacheService Integration
Frequently accessed data can be cached:

```javascript
// Check cache first
const cached = window.cacheService?.get(`deliveries-${status}`);
if (cached) return cached;

// Fetch from database
const deliveries = await dataService.getDeliveries({ status });

// Cache the result
window.cacheService?.set(`deliveries-${status}`, deliveries);
```

## Best Practices

### 1. Always Initialize First
```javascript
// ✅ Good
await dataService.initialize();
const deliveries = await dataService.getDeliveries();

// ❌ Bad
const deliveries = await dataService.getDeliveries(); // Will throw error
```

### 2. Use Proper Error Handling
```javascript
// ✅ Good
try {
    await dataService.saveDelivery(delivery);
    showToast('Delivery saved successfully', 'success');
} catch (error) {
    showToast('Failed to save delivery', 'danger');
    console.error(error);
}

// ❌ Bad
await dataService.saveDelivery(delivery); // Unhandled promise rejection
```

### 3. Validate Before Saving
```javascript
// ✅ Good
const validation = DataValidator.validateDelivery(delivery);
if (!validation.isValid) {
    showToast(validation.errors.join(', '), 'warning');
    return;
}
await dataService.saveDelivery(delivery);

// ❌ Bad
await dataService.saveDelivery(delivery); // May fail validation
```

### 4. Provide User Feedback
```javascript
// ✅ Good
showLoadingState('Saving delivery...');
try {
    await dataService.saveDelivery(delivery);
    showToast('Delivery saved successfully', 'success');
} finally {
    hideLoadingState();
}

// ❌ Bad
await dataService.saveDelivery(delivery); // No user feedback
```

### 5. Use Filters Efficiently
```javascript
// ✅ Good - Filter at database level
const active = await dataService.getDeliveries({ status: 'Active' });

// ❌ Bad - Filter in memory
const all = await dataService.getDeliveries();
const active = all.filter(d => d.status === 'Active');
```

## Migration from localStorage

If you're migrating from localStorage-based code, here's how to update:

### Before (localStorage)
```javascript
// Old way - localStorage
const deliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
deliveries.push(newDelivery);
localStorage.setItem('mci-active-deliveries', JSON.stringify(deliveries));
```

### After (DataService)
```javascript
// New way - DataService
await dataService.saveDelivery(newDelivery);
const deliveries = await dataService.getDeliveries({ status: 'Active' });
```

## Performance Considerations

### Pagination
For large datasets, use pagination:

```javascript
const { data, count } = await dataService.client
    .from('deliveries')
    .select('*', { count: 'exact' })
    .range(0, 49) // First 50 records
    .order('created_at', { ascending: false });
```

### Caching
Cache frequently accessed data:

```javascript
// Check cache first
let customers = cacheService.get('customers');
if (!customers) {
    customers = await dataService.getCustomers();
    cacheService.set('customers', customers);
}
```

### Batch Operations
For multiple updates, consider batch operations:

```javascript
// Instead of multiple individual updates
for (const delivery of deliveries) {
    await dataService.updateDeliveryStatus(delivery.dr_number, 'Completed');
}

// Use batch update
const { data, error } = await dataService.client
    .from('deliveries')
    .update({ status: 'Completed' })
    .in('dr_number', deliveries.map(d => d.dr_number));
```

## Troubleshooting

### "DataService not initialized" Error
**Solution:** Call `initialize()` before any operations:
```javascript
await dataService.initialize();
```

### "No internet connection" Error
**Solution:** Check network status and inform user:
```javascript
if (!navigator.onLine) {
    showToast('No internet connection. Please check your network.', 'danger');
}
```

### Duplicate Key Errors (23505)
**Solution:** Handle duplicate records gracefully:
```javascript
catch (error) {
    if (error.code === '23505') {
        showToast('This record already exists.', 'warning');
    }
}
```

### Slow Queries
**Solution:** Add appropriate filters and use indexes:
```javascript
// Add filters to reduce data
const deliveries = await dataService.getDeliveries({
    status: 'Active',
    startDate: '2024-01-01'
});
```

## See Also

- [Architecture Overview](./ARCHITECTURE.md)
- [Migration Guide](./MIGRATION-GUIDE.md)
- [Error Handling Guide](../ERROR-HANDLING-GUIDE.md)
- [Testing Guide](../tests/README.md)
