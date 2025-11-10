# Architecture Overview - Database-Centric Design

## Introduction

The MCI Delivery Tracker has been refactored to follow a **database-centric architecture** where Supabase serves as the single source of truth for all business data. This document explains the architectural principles, patterns, and implementation details.

## Architectural Principles

### 1. Single Source of Truth

**Principle:** Supabase database is the only persistent storage for business data.

**Implementation:**
- All CRUD operations interact directly with Supabase
- No localStorage, indexedDB, or sessionStorage for business data
- No data duplication or synchronization conflicts

**Benefits:**
- Eliminates data inconsistency issues
- Simplifies data flow and debugging
- Enables real-time synchronization across clients
- Reduces code complexity

### 2. Async-First Design

**Principle:** All data operations are asynchronous and non-blocking.

**Implementation:**
- All DataService methods return Promises
- Proper async/await patterns throughout
- Loading states during data operations
- Optimistic UI updates where appropriate

**Benefits:**
- Responsive user interface
- Better user experience
- Proper error handling
- Scalable architecture

### 3. Separation of Concerns

**Principle:** Clear separation between UI, business logic, and data access layers.

**Implementation:**
```
┌─────────────────────────────────────────┐
│           UI Layer (Views)              │
│  - index.html                           │
│  - Event handlers                       │
│  - DOM manipulation                     │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│      Business Logic Layer               │
│  - app.js (delivery management)         │
│  - booking.js (booking logic)           │
│  - customers.js (customer management)   │
│  - analytics.js (reporting)             │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│       Service Layer                     │
│  - dataService.js (data access)         │
│  - realtimeService.js (subscriptions)   │
│  - cacheService.js (in-memory cache)    │
│  - networkStatusService.js (connectivity)│
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│      Utility Layer                      │
│  - dataValidator.js (validation)        │
│  - errorHandler.js (error processing)   │
│  - logger.js (logging)                  │
└─────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Supabase Cloud                  │
│  - PostgreSQL Database                  │
│  - Real-time Subscriptions              │
│  - Authentication                       │
└─────────────────────────────────────────┘
```

## Core Components

### DataService

**Purpose:** Unified interface for all database operations.

**Responsibilities:**
- Initialize Supabase client
- Provide CRUD operations for all tables
- Handle errors and logging
- Check network status before operations

**Key Methods:**
- `initialize()` - Set up Supabase client
- `create(table, data)` - Create records
- `read(table, filters)` - Read records
- `update(table, id, data)` - Update records
- `delete(table, id)` - Delete records
- Domain-specific methods for deliveries, customers, EPODs

**Example:**
```javascript
// Initialize
await dataService.initialize();

// Create a delivery
const delivery = await dataService.saveDelivery({
    dr_number: 'DR-2024-001',
    customer_name: 'Acme Corp',
    status: 'Active'
});

// Read deliveries
const active = await dataService.getDeliveries({ status: 'Active' });

// Update status
await dataService.updateDeliveryStatus('DR-2024-001', 'Completed');

// Delete delivery
await dataService.deleteDelivery(delivery.id);
```

### RealtimeService

**Purpose:** Handle real-time data synchronization across clients.

**Responsibilities:**
- Subscribe to table changes
- Notify UI of data updates
- Manage subscription lifecycle
- Handle reconnection logic

**Key Methods:**
- `subscribeToTable(table, callback)` - Subscribe to changes
- `unsubscribeFromTable(table)` - Unsubscribe
- `cleanup()` - Clean up all subscriptions

**Example:**
```javascript
// Subscribe to delivery changes
realtimeService.subscribeToTable('deliveries', (payload) => {
    console.log('Delivery changed:', payload);
    
    if (payload.eventType === 'INSERT') {
        // Add new delivery to UI
        addDeliveryToTable(payload.new);
    } else if (payload.eventType === 'UPDATE') {
        // Update delivery in UI
        updateDeliveryInTable(payload.new);
    } else if (payload.eventType === 'DELETE') {
        // Remove delivery from UI
        removeDeliveryFromTable(payload.old);
    }
});
```

### CacheService

**Purpose:** Provide in-memory caching for frequently accessed data.

**Responsibilities:**
- Cache data with TTL (Time To Live)
- Invalidate cache on updates
- Reduce database queries
- Improve performance

**Key Methods:**
- `set(key, value)` - Cache data
- `get(key)` - Retrieve cached data
- `clear()` - Clear all cache

**Example:**
```javascript
// Check cache first
let customers = cacheService.get('customers');

if (!customers) {
    // Cache miss - fetch from database
    customers = await dataService.getCustomers();
    cacheService.set('customers', customers);
}

// Use cached data
displayCustomers(customers);
```

### NetworkStatusService

**Purpose:** Monitor network connectivity and provide offline detection.

**Responsibilities:**
- Monitor online/offline status
- Display offline indicator
- Prevent operations when offline
- Auto-reconnect when online

**Key Methods:**
- `getStatus()` - Get current network status
- `onStatusChange(callback)` - Subscribe to status changes

**Example:**
```javascript
// Check network status
if (!networkStatusService.getStatus()) {
    showToast('No internet connection', 'danger');
    return;
}

// Subscribe to status changes
networkStatusService.onStatusChange((isOnline) => {
    if (isOnline) {
        showToast('Connection restored', 'success');
        refreshData();
    } else {
        showToast('Connection lost', 'warning');
    }
});
```

### DataValidator

**Purpose:** Validate data before sending to database.

**Responsibilities:**
- Validate required fields
- Check data formats
- Provide validation error messages
- Prevent invalid data from reaching database

**Key Methods:**
- `validateDelivery(delivery)` - Validate delivery data
- `validateCustomer(customer)` - Validate customer data
- `validateEPodRecord(epod)` - Validate EPOD data

**Example:**
```javascript
// Validate before saving
const validation = DataValidator.validateDelivery(delivery);

if (!validation.isValid) {
    showToast(validation.errors.join(', '), 'warning');
    return;
}

// Validation passed - save to database
await dataService.saveDelivery(delivery);
```

### ErrorHandler

**Purpose:** Centralized error handling and user feedback.

**Responsibilities:**
- Categorize errors (network, validation, database)
- Provide user-friendly error messages
- Log errors for debugging
- Determine error recoverability

**Key Methods:**
- `handle(error, context)` - Handle any error
- `handleNetworkError(error)` - Handle network errors
- `handleValidationError(error)` - Handle validation errors
- `handleDuplicateError(error)` - Handle duplicate key errors

**Example:**
```javascript
try {
    await dataService.saveDelivery(delivery);
} catch (error) {
    // ErrorHandler provides consistent error processing
    const result = ErrorHandler.handle(error, 'saveDelivery');
    
    if (result.recoverable) {
        // User can retry
        showRetryButton();
    } else {
        // Fatal error
        showErrorPage();
    }
}
```

### Logger

**Purpose:** Centralized logging for monitoring and debugging.

**Responsibilities:**
- Log operations with timestamps
- Categorize logs by level (info, warn, error)
- Provide context for debugging
- Integration with monitoring services

**Key Methods:**
- `info(message, data)` - Log informational messages
- `warn(message, data)` - Log warnings
- `error(message, data)` - Log errors

**Example:**
```javascript
// Log operation start
Logger.info('Saving delivery', { dr_number: delivery.dr_number });

try {
    await dataService.saveDelivery(delivery);
    Logger.info('Delivery saved successfully', { id: delivery.id });
} catch (error) {
    Logger.error('Failed to save delivery', {
        dr_number: delivery.dr_number,
        error: error.message
    });
}
```

## Data Flow

### Create Operation Flow

```
User Action (Click "Save")
    ↓
UI Layer (app.js)
    ↓
Validate Data (DataValidator)
    ↓
Check Network (NetworkStatusService)
    ↓
DataService.saveDelivery()
    ↓
Supabase API
    ↓
PostgreSQL Database
    ↓
Response to DataService
    ↓
Update UI
    ↓
Show Success Message
    ↓
Real-time Update (RealtimeService)
    ↓
Update Other Connected Clients
```

### Read Operation Flow

```
User Action (Load Page)
    ↓
UI Layer (app.js)
    ↓
Check Cache (CacheService)
    ↓ (cache miss)
DataService.getDeliveries()
    ↓
Supabase API
    ↓
PostgreSQL Database
    ↓
Response to DataService
    ↓
Cache Result (CacheService)
    ↓
Update UI
    ↓
Display Data
```

### Update Operation Flow

```
User Action (Change Status)
    ↓
UI Layer (app.js)
    ↓
Optimistic UI Update
    ↓
DataService.updateDeliveryStatus()
    ↓
Supabase API
    ↓
PostgreSQL Database
    ↓
Response to DataService
    ↓
Invalidate Cache (CacheService)
    ↓
Confirm UI Update
    ↓
Real-time Update (RealtimeService)
    ↓
Update Other Connected Clients
```

## Database Schema

### Tables

#### deliveries
Primary table for delivery records.

**Key Fields:**
- `id` (UUID) - Primary key
- `dr_number` (TEXT) - Unique delivery reference
- `customer_name` (TEXT) - Customer name
- `status` (TEXT) - Delivery status
- `booked_date` (TIMESTAMP) - Booking date
- `completed_date` (TIMESTAMP) - Completion date
- `additional_cost_items` (JSONB) - Additional costs

#### customers
Customer information and management.

**Key Fields:**
- `id` (TEXT) - Primary key
- `name` (TEXT) - Customer name
- `phone` (TEXT) - Contact number
- `email` (TEXT) - Email address
- `account_type` (TEXT) - Account type
- `status` (TEXT) - Active/Inactive

#### epod_records
Electronic Proof of Delivery records.

**Key Fields:**
- `id` (UUID) - Primary key
- `dr_number` (TEXT) - Reference to delivery
- `signature_data` (TEXT) - Base64 signature image
- `signed_at` (TIMESTAMP) - Signature timestamp

#### additional_cost_items
Additional costs associated with deliveries.

**Key Fields:**
- `id` (UUID) - Primary key
- `delivery_id` (UUID) - Foreign key to deliveries
- `description` (TEXT) - Cost description
- `amount` (DECIMAL) - Cost amount
- `category` (TEXT) - Cost category

## Error Handling Strategy

### Error Categories

1. **Network Errors**
   - Connection failures
   - Timeouts
   - Offline status
   - **Recovery:** Retry when online

2. **Validation Errors**
   - Missing required fields
   - Invalid data formats
   - Business rule violations
   - **Recovery:** Fix data and retry

3. **Database Errors**
   - Duplicate key violations (23505)
   - Foreign key violations
   - Constraint violations
   - **Recovery:** Depends on error type

4. **Authentication Errors**
   - Invalid credentials
   - Expired sessions
   - Insufficient permissions
   - **Recovery:** Re-authenticate

### Error Handling Pattern

```javascript
async function performOperation() {
    try {
        // Show loading state
        showLoadingState('Processing...');
        
        // Validate data
        const validation = DataValidator.validate(data);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        // Check network
        if (!networkStatusService.getStatus()) {
            throw new Error('No internet connection');
        }
        
        // Perform operation
        const result = await dataService.operation(data);
        
        // Show success
        showToast('Operation successful', 'success');
        
        return result;
        
    } catch (error) {
        // Handle error
        ErrorHandler.handle(error, 'performOperation');
        
        // Log error
        Logger.error('Operation failed', {
            operation: 'performOperation',
            error: error.message
        });
        
        // Show user feedback
        showToast('Operation failed. Please try again.', 'danger');
        
        throw error;
        
    } finally {
        // Hide loading state
        hideLoadingState();
    }
}
```

## Performance Optimization

### 1. Caching Strategy

**In-Memory Cache:**
- Cache frequently accessed data
- TTL of 60 seconds by default
- Invalidate on updates

**Example:**
```javascript
// Cache customers for 60 seconds
const customers = cacheService.get('customers') || 
    await dataService.getCustomers();
cacheService.set('customers', customers);
```

### 2. Pagination

**Large Datasets:**
- Load data in chunks (50 records per page)
- Implement infinite scroll or pagination controls
- Reduce initial load time

**Example:**
```javascript
const { data, count } = await dataService.client
    .from('deliveries')
    .select('*', { count: 'exact' })
    .range(0, 49)
    .order('created_at', { ascending: false });
```

### 3. Optimistic UI Updates

**Immediate Feedback:**
- Update UI immediately
- Perform database operation in background
- Rollback on error

**Example:**
```javascript
// Update UI immediately
updateDeliveryInTable(delivery);

try {
    // Perform database operation
    await dataService.updateDeliveryStatus(delivery.dr_number, 'Completed');
} catch (error) {
    // Rollback UI on error
    revertDeliveryInTable(delivery);
    showToast('Update failed', 'danger');
}
```

### 4. Batch Operations

**Multiple Updates:**
- Group related operations
- Reduce round trips to database
- Improve performance

**Example:**
```javascript
// Batch update multiple deliveries
const { data, error } = await dataService.client
    .from('deliveries')
    .update({ status: 'Completed' })
    .in('dr_number', drNumbers);
```

### 5. Query Optimization

**Efficient Queries:**
- Filter at database level
- Use indexes for frequently queried fields
- Select only needed fields

**Example:**
```javascript
// ✅ Good - Filter at database
const active = await dataService.getDeliveries({ status: 'Active' });

// ❌ Bad - Filter in memory
const all = await dataService.getDeliveries();
const active = all.filter(d => d.status === 'Active');
```

## Security Considerations

### 1. Row Level Security (RLS)

Enable RLS policies in Supabase to control data access:

```sql
-- Enable RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own data
CREATE POLICY "Users can access own data"
ON deliveries FOR ALL
USING (auth.uid() = user_id);
```

### 2. Input Validation

Always validate user input before sending to database:

```javascript
const validation = DataValidator.validateDelivery(delivery);
if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
}
```

### 3. SQL Injection Prevention

Supabase client uses parameterized queries automatically:

```javascript
// Safe - parameterized query
const { data } = await dataService.client
    .from('deliveries')
    .select('*')
    .eq('dr_number', userInput);
```

### 4. Authentication

Verify user authentication before sensitive operations:

```javascript
if (!supabaseClient.auth.user()) {
    throw new Error('Authentication required');
}
```

## Testing Strategy

### Unit Tests

Test individual components in isolation:

```javascript
describe('DataService', () => {
    it('should save delivery to database', async () => {
        const delivery = { dr_number: 'DR-001', customer_name: 'Test' };
        const result = await dataService.saveDelivery(delivery);
        expect(result).toBeDefined();
    });
});
```

### Integration Tests

Test complete workflows:

```javascript
describe('Delivery Workflow', () => {
    it('should create, update, and complete delivery', async () => {
        const delivery = await createDelivery(testData);
        await updateDeliveryStatus(delivery.id, 'In Transit');
        await completeDelivery(delivery.id);
        
        const completed = await dataService.getDeliveries({ status: 'Completed' });
        expect(completed).toContainEqual(expect.objectContaining({ 
            dr_number: testData.dr_number 
        }));
    });
});
```

### Manual Testing

Test real-world scenarios:
- Create and manage deliveries
- Test with slow network
- Test offline behavior
- Test real-time updates across tabs
- Test error scenarios

## Migration from localStorage

### Before (localStorage-based)

```javascript
// Old architecture
const deliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
deliveries.push(newDelivery);
localStorage.setItem('mci-active-deliveries', JSON.stringify(deliveries));
```

### After (Database-centric)

```javascript
// New architecture
await dataService.saveDelivery(newDelivery);
const deliveries = await dataService.getDeliveries({ status: 'Active' });
```

### Migration Process

1. **Export localStorage data**
2. **Import to Supabase**
3. **Verify data integrity**
4. **Clear localStorage**
5. **Deploy new code**

See [Migration Guide](./MIGRATION-GUIDE.md) for detailed instructions.

## Best Practices

### 1. Always Initialize DataService

```javascript
// At app startup
await dataService.initialize();
```

### 2. Use Proper Error Handling

```javascript
try {
    await dataService.saveDelivery(delivery);
} catch (error) {
    ErrorHandler.handle(error, 'saveDelivery');
}
```

### 3. Validate Before Saving

```javascript
const validation = DataValidator.validateDelivery(delivery);
if (!validation.isValid) {
    showToast(validation.errors.join(', '), 'warning');
    return;
}
```

### 4. Provide User Feedback

```javascript
showLoadingState('Saving...');
try {
    await dataService.saveDelivery(delivery);
    showToast('Saved successfully', 'success');
} finally {
    hideLoadingState();
}
```

### 5. Use Real-time Updates

```javascript
realtimeService.subscribeToTable('deliveries', (payload) => {
    refreshDeliveriesTable();
});
```

## Troubleshooting

### Common Issues

1. **"DataService not initialized"**
   - Solution: Call `await dataService.initialize()` first

2. **"No internet connection"**
   - Solution: Check network status and inform user

3. **Slow queries**
   - Solution: Add filters and use pagination

4. **Duplicate key errors**
   - Solution: Handle gracefully with user feedback

See [Troubleshooting Guide](./TROUBLESHOOTING.md) for more details.

## Conclusion

The database-centric architecture provides:
- **Simplified data flow** - Single source of truth
- **Better performance** - Optimized queries and caching
- **Real-time sync** - Instant updates across clients
- **Improved reliability** - Proper error handling
- **Easier maintenance** - Clean separation of concerns

This architecture is designed to scale and evolve with the application's needs while maintaining code quality and user experience.
