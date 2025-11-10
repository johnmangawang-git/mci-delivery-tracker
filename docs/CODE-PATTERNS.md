# Database-Centric Code Patterns

## Overview

This document explains the code patterns used throughout the MCI Delivery Tracker application following the database-centric architecture. These patterns ensure consistency, maintainability, and proper separation of concerns.

## Core Patterns

### 1. Data Loading Pattern

**Pattern:** Always load data from Supabase via DataService

```javascript
/**
 * PATTERN: Data Loading
 * 
 * Always load data from database, never from localStorage
 * Provide loading states and error handling
 * Update UI after successful load
 */
async function loadActiveDeliveries() {
    try {
        // Show loading state
        showLoadingState('Loading deliveries...');
        
        // Load from database via DataService
        const deliveries = await dataService.getDeliveries({ 
            status: ['Active', 'In Transit', 'On Schedule'] 
        });
        
        // Update UI state
        activeDeliveries = deliveries;
        
        // Render UI
        populateActiveDeliveriesTable();
        
        // Log success
        if (window.Logger) {
            Logger.info('Deliveries loaded successfully', { 
                count: deliveries.length 
            });
        }
        
    } catch (error) {
        // Handle error
        if (window.ErrorHandler) {
            ErrorHandler.handle(error, 'loadActiveDeliveries');
        }
        
        // Show user feedback
        showToast('Failed to load deliveries. Please try again.', 'danger');
        
        // Log error
        if (window.Logger) {
            Logger.error('Failed to load deliveries', { 
                error: error.message 
            });
        }
        
    } finally {
        // Always hide loading state
        hideLoadingState();
    }
}
```

### 2. Data Saving Pattern

**Pattern:** Validate, save to database, update UI

```javascript
/**
 * PATTERN: Data Saving
 * 
 * 1. Validate data before saving
 * 2. Save to database via DataService
 * 3. Update UI on success
 * 4. Handle errors gracefully
 */
async function saveDelivery(delivery) {
    try {
        // Show loading state
        showLoadingState('Saving delivery...');
        
        // Validate data
        const validation = DataValidator.validateDelivery(delivery);
        if (!validation.isValid) {
            showToast(validation.errors.join(', '), 'warning');
            return;
        }
        
        // Save to database via DataService
        const saved = await dataService.saveDelivery(delivery);
        
        // Refresh data from database
        await loadActiveDeliveries();
        
        // Show success message
        showToast('Delivery saved successfully', 'success');
        
        // Log success
        if (window.Logger) {
            Logger.info('Delivery saved', { 
                dr_number: saved.dr_number 
            });
        }
        
        // Close modal or reset form
        hideModal('bookingModal');
        
    } catch (error) {
        // Handle error
        if (window.ErrorHandler) {
            ErrorHandler.handle(error, 'saveDelivery');
        }
        
        // Show user feedback
        showToast('Failed to save delivery. Please try again.', 'danger');
        
        // Log error
        if (window.Logger) {
            Logger.error('Failed to save delivery', { 
                dr_number: delivery.dr_number,
                error: error.message 
            });
        }
        
    } finally {
        // Always hide loading state
        hideLoadingState();
    }
}
```

### 3. Data Update Pattern

**Pattern:** Optimistic UI update with rollback on error

```javascript
/**
 * PATTERN: Data Update (Optimistic)
 * 
 * 1. Update UI immediately (optimistic)
 * 2. Perform database update
 * 3. Rollback UI on error
 * 4. Provide user feedback
 */
async function updateDeliveryStatus(drNumber, newStatus) {
    // Store original state for rollback
    const originalDelivery = activeDeliveries.find(d => d.dr_number === drNumber);
    const originalStatus = originalDelivery?.status;
    
    try {
        // Optimistic UI update
        const delivery = activeDeliveries.find(d => d.dr_number === drNumber);
        if (delivery) {
            delivery.status = newStatus;
            updateDeliveryInTable(delivery);
        }
        
        // Update in database
        await dataService.updateDeliveryStatus(drNumber, newStatus, {
            completed_date: newStatus === 'Completed' ? new Date().toISOString() : null
        });
        
        // Show success message
        showToast(`Status updated to ${newStatus}`, 'success');
        
        // Log success
        if (window.Logger) {
            Logger.info('Status updated', { 
                dr_number: drNumber, 
                status: newStatus 
            });
        }
        
    } catch (error) {
        // Rollback UI on error
        if (originalDelivery && originalStatus) {
            originalDelivery.status = originalStatus;
            updateDeliveryInTable(originalDelivery);
        }
        
        // Handle error
        if (window.ErrorHandler) {
            ErrorHandler.handle(error, 'updateDeliveryStatus');
        }
        
        // Show user feedback
        showToast('Failed to update status. Please try again.', 'danger');
        
        // Log error
        if (window.Logger) {
            Logger.error('Failed to update status', { 
                dr_number: drNumber,
                error: error.message 
            });
        }
    }
}
```

### 4. Data Deletion Pattern

**Pattern:** Confirm, delete from database, update UI

```javascript
/**
 * PATTERN: Data Deletion
 * 
 * 1. Confirm with user
 * 2. Delete from database
 * 3. Update UI on success
 * 4. Handle errors gracefully
 */
async function deleteDelivery(deliveryId, drNumber) {
    try {
        // Confirm with user
        const confirmed = await showConfirmDialog(
            'Delete Delivery',
            `Are you sure you want to delete delivery ${drNumber}?`
        );
        
        if (!confirmed) {
            return;
        }
        
        // Show loading state
        showLoadingState('Deleting delivery...');
        
        // Delete from database
        await dataService.deleteDelivery(deliveryId);
        
        // Refresh data from database
        await loadActiveDeliveries();
        
        // Show success message
        showToast('Delivery deleted successfully', 'success');
        
        // Log success
        if (window.Logger) {
            Logger.info('Delivery deleted', { 
                id: deliveryId,
                dr_number: drNumber 
            });
        }
        
    } catch (error) {
        // Handle error
        if (window.ErrorHandler) {
            ErrorHandler.handle(error, 'deleteDelivery');
        }
        
        // Show user feedback
        showToast('Failed to delete delivery. Please try again.', 'danger');
        
        // Log error
        if (window.Logger) {
            Logger.error('Failed to delete delivery', { 
                id: deliveryId,
                error: error.message 
            });
        }
        
    } finally {
        // Always hide loading state
        hideLoadingState();
    }
}
```

### 5. Real-time Subscription Pattern

**Pattern:** Subscribe to table changes and update UI

```javascript
/**
 * PATTERN: Real-time Subscription
 * 
 * 1. Subscribe to table changes
 * 2. Handle INSERT, UPDATE, DELETE events
 * 3. Update UI accordingly
 * 4. Clean up subscriptions on page unload
 */
function initializeRealtimeSync() {
    if (!window.realtimeService) {
        console.warn('RealtimeService not available');
        return;
    }
    
    // Subscribe to deliveries table
    window.realtimeService.subscribeToTable('deliveries', (payload) => {
        console.log('Real-time update received:', payload);
        
        switch (payload.eventType) {
            case 'INSERT':
                // New delivery created
                handleNewDelivery(payload.new);
                break;
                
            case 'UPDATE':
                // Delivery updated
                handleUpdatedDelivery(payload.new);
                break;
                
            case 'DELETE':
                // Delivery deleted
                handleDeletedDelivery(payload.old);
                break;
        }
    });
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        window.realtimeService.cleanup();
    });
}

function handleNewDelivery(delivery) {
    // Add to appropriate array
    if (delivery.status === 'Completed') {
        deliveryHistory.push(delivery);
        populateDeliveryHistoryTable();
    } else {
        activeDeliveries.push(delivery);
        populateActiveDeliveriesTable();
    }
    
    // Show notification
    showToast(`New delivery added: ${delivery.dr_number}`, 'info');
}

function handleUpdatedDelivery(delivery) {
    // Update in active deliveries
    const activeIndex = activeDeliveries.findIndex(d => d.id === delivery.id);
    if (activeIndex !== -1) {
        activeDeliveries[activeIndex] = delivery;
        populateActiveDeliveriesTable();
    }
    
    // Update in delivery history
    const historyIndex = deliveryHistory.findIndex(d => d.id === delivery.id);
    if (historyIndex !== -1) {
        deliveryHistory[historyIndex] = delivery;
        populateDeliveryHistoryTable();
    }
    
    // Show notification
    showToast(`Delivery updated: ${delivery.dr_number}`, 'info');
}

function handleDeletedDelivery(delivery) {
    // Remove from active deliveries
    const activeIndex = activeDeliveries.findIndex(d => d.id === delivery.id);
    if (activeIndex !== -1) {
        activeDeliveries.splice(activeIndex, 1);
        populateActiveDeliveriesTable();
    }
    
    // Remove from delivery history
    const historyIndex = deliveryHistory.findIndex(d => d.id === delivery.id);
    if (historyIndex !== -1) {
        deliveryHistory.splice(historyIndex, 1);
        populateDeliveryHistoryTable();
    }
    
    // Show notification
    showToast(`Delivery deleted: ${delivery.dr_number}`, 'info');
}
```

### 6. Caching Pattern

**Pattern:** Check cache first, then load from database

```javascript
/**
 * PATTERN: Caching
 * 
 * 1. Check cache first
 * 2. Return cached data if valid
 * 3. Load from database on cache miss
 * 4. Cache the result
 * 5. Invalidate cache on updates
 */
async function loadCustomers() {
    try {
        // Check cache first
        const cacheKey = 'customers';
        let customers = window.cacheService?.get(cacheKey);
        
        if (customers) {
            // Cache hit
            console.log('Loaded customers from cache');
            window.customers = customers;
            displayCustomers();
            return;
        }
        
        // Cache miss - load from database
        showLoadingState('Loading customers...');
        
        customers = await dataService.getCustomers();
        
        // Cache the result
        if (window.cacheService) {
            window.cacheService.set(cacheKey, customers);
        }
        
        // Update UI
        window.customers = customers;
        displayCustomers();
        
    } catch (error) {
        ErrorHandler.handle(error, 'loadCustomers');
        showToast('Failed to load customers', 'danger');
    } finally {
        hideLoadingState();
    }
}

async function saveCustomer(customer) {
    try {
        showLoadingState('Saving customer...');
        
        await dataService.saveCustomer(customer);
        
        // Invalidate cache
        if (window.cacheService) {
            window.cacheService.clear('customers');
        }
        
        // Reload from database
        await loadCustomers();
        
        showToast('Customer saved successfully', 'success');
        
    } catch (error) {
        ErrorHandler.handle(error, 'saveCustomer');
        showToast('Failed to save customer', 'danger');
    } finally {
        hideLoadingState();
    }
}
```

### 7. Pagination Pattern

**Pattern:** Load data in chunks for large datasets

```javascript
/**
 * PATTERN: Pagination
 * 
 * 1. Track pagination state
 * 2. Load data in chunks
 * 3. Provide navigation controls
 * 4. Update UI with page info
 */
const paginationState = {
    currentPage: 1,
    pageSize: 50,
    totalPages: 1,
    totalCount: 0
};

async function loadDeliveriesPage(page = 1) {
    try {
        showLoadingState('Loading deliveries...');
        
        // Calculate range
        const from = (page - 1) * paginationState.pageSize;
        const to = from + paginationState.pageSize - 1;
        
        // Load page from database
        const { data, error, count } = await dataService.client
            .from('deliveries')
            .select('*', { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Update pagination state
        paginationState.currentPage = page;
        paginationState.totalCount = count;
        paginationState.totalPages = Math.ceil(count / paginationState.pageSize);
        
        // Update UI
        activeDeliveries = data;
        populateActiveDeliveriesTable();
        updatePaginationControls();
        
    } catch (error) {
        ErrorHandler.handle(error, 'loadDeliveriesPage');
        showToast('Failed to load deliveries', 'danger');
    } finally {
        hideLoadingState();
    }
}

function updatePaginationControls() {
    const paginationInfo = document.getElementById('paginationInfo');
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    
    // Update info text
    const start = (paginationState.currentPage - 1) * paginationState.pageSize + 1;
    const end = Math.min(start + paginationState.pageSize - 1, paginationState.totalCount);
    paginationInfo.textContent = `Showing ${start}-${end} of ${paginationState.totalCount}`;
    
    // Update button states
    prevButton.disabled = paginationState.currentPage === 1;
    nextButton.disabled = paginationState.currentPage === paginationState.totalPages;
}

// Navigation handlers
document.getElementById('prevPage')?.addEventListener('click', () => {
    if (paginationState.currentPage > 1) {
        loadDeliveriesPage(paginationState.currentPage - 1);
    }
});

document.getElementById('nextPage')?.addEventListener('click', () => {
    if (paginationState.currentPage < paginationState.totalPages) {
        loadDeliveriesPage(paginationState.currentPage + 1);
    }
});
```

### 8. Error Handling Pattern

**Pattern:** Consistent error handling across the application

```javascript
/**
 * PATTERN: Error Handling
 * 
 * 1. Catch all errors
 * 2. Use ErrorHandler for consistent processing
 * 3. Provide user-friendly feedback
 * 4. Log errors for debugging
 */
async function performOperation() {
    try {
        // Show loading state
        showLoadingState('Processing...');
        
        // Perform operation
        const result = await dataService.someOperation();
        
        // Show success
        showToast('Operation completed successfully', 'success');
        
        return result;
        
    } catch (error) {
        // Categorize and handle error
        if (window.ErrorHandler) {
            const errorInfo = ErrorHandler.handle(error, 'performOperation');
            
            // Provide specific feedback based on error type
            if (errorInfo.type === 'network') {
                showToast('No internet connection. Please check your network.', 'danger');
            } else if (errorInfo.type === 'validation') {
                showToast(`Validation error: ${error.message}`, 'warning');
            } else if (errorInfo.type === 'duplicate') {
                showToast('This record already exists.', 'warning');
            } else {
                showToast('An error occurred. Please try again.', 'danger');
            }
        } else {
            // Fallback error handling
            showToast('An error occurred. Please try again.', 'danger');
        }
        
        // Log error
        if (window.Logger) {
            Logger.error('Operation failed', {
                operation: 'performOperation',
                error: error.message,
                code: error.code,
                stack: error.stack
            });
        }
        
        // Re-throw if needed
        throw error;
        
    } finally {
        // Always hide loading state
        hideLoadingState();
    }
}
```

### 9. Network Status Pattern

**Pattern:** Check network status before operations

```javascript
/**
 * PATTERN: Network Status Check
 * 
 * 1. Check network status before operations
 * 2. Provide offline feedback
 * 3. Auto-reconnect when online
 */
async function performNetworkOperation() {
    // Check network status
    if (window.networkStatusService && !window.networkStatusService.getStatus()) {
        showToast('No internet connection. This operation requires network access.', 'danger');
        return;
    }
    
    try {
        // Perform operation
        await dataService.someOperation();
        
    } catch (error) {
        // Check if it's a network error
        if (error.code === 'NETWORK_OFFLINE') {
            showToast('Connection lost. Please check your network.', 'danger');
        } else {
            ErrorHandler.handle(error, 'performNetworkOperation');
        }
    }
}

// Subscribe to network status changes
if (window.networkStatusService) {
    window.networkStatusService.onStatusChange((isOnline) => {
        if (isOnline) {
            showToast('Connection restored', 'success');
            // Refresh data
            loadActiveDeliveries();
        } else {
            showToast('Connection lost', 'warning');
        }
    });
}
```

### 10. Initialization Pattern

**Pattern:** Proper service initialization on app startup

```javascript
/**
 * PATTERN: Application Initialization
 * 
 * 1. Initialize services in correct order
 * 2. Handle initialization errors
 * 3. Load initial data
 * 4. Set up real-time subscriptions
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing application...');
        
        // 1. Initialize DataService
        if (window.dataService) {
            await window.dataService.initialize();
            console.log('✅ DataService initialized');
        }
        
        // 2. Initialize RealtimeService
        if (window.realtimeService && window.dataService) {
            window.realtimeService = new RealtimeService(window.dataService);
            console.log('✅ RealtimeService initialized');
        }
        
        // 3. Initialize NetworkStatusService
        if (window.networkStatusService) {
            window.networkStatusService.initialize();
            console.log('✅ NetworkStatusService initialized');
        }
        
        // 4. Load initial data
        await loadActiveDeliveries();
        await loadDeliveryHistory();
        await loadCustomers();
        console.log('✅ Initial data loaded');
        
        // 5. Set up real-time subscriptions
        initializeRealtimeSync();
        console.log('✅ Real-time sync initialized');
        
        // 6. Set up UI event listeners
        setupEventListeners();
        console.log('✅ Event listeners set up');
        
        console.log('✅ Application initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        showToast('Failed to initialize application. Please refresh the page.', 'danger');
        
        if (window.Logger) {
            Logger.error('Application initialization failed', {
                error: error.message,
                stack: error.stack
            });
        }
    }
});
```

## Anti-Patterns to Avoid

### ❌ Don't Use localStorage for Business Data

```javascript
// ❌ BAD - Don't do this
localStorage.setItem('mci-active-deliveries', JSON.stringify(deliveries));
const deliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');

// ✅ GOOD - Use DataService instead
await dataService.saveDelivery(delivery);
const deliveries = await dataService.getDeliveries();
```

### ❌ Don't Mix localStorage and Database

```javascript
// ❌ BAD - Don't do this
await dataService.saveDelivery(delivery);
localStorage.setItem('mci-active-deliveries', JSON.stringify(deliveries));

// ✅ GOOD - Use database only
await dataService.saveDelivery(delivery);
await loadActiveDeliveries(); // Refresh from database
```

### ❌ Don't Forget Error Handling

```javascript
// ❌ BAD - No error handling
const deliveries = await dataService.getDeliveries();

// ✅ GOOD - Proper error handling
try {
    const deliveries = await dataService.getDeliveries();
} catch (error) {
    ErrorHandler.handle(error, 'getDeliveries');
    showToast('Failed to load deliveries', 'danger');
}
```

### ❌ Don't Block UI with Synchronous Operations

```javascript
// ❌ BAD - Blocking operation
function loadDeliveries() {
    const deliveries = dataService.getDeliveries(); // Missing await
    populateTable(deliveries);
}

// ✅ GOOD - Async operation
async function loadDeliveries() {
    showLoadingState();
    try {
        const deliveries = await dataService.getDeliveries();
        populateTable(deliveries);
    } finally {
        hideLoadingState();
    }
}
```

### ❌ Don't Forget to Validate Data

```javascript
// ❌ BAD - No validation
await dataService.saveDelivery(delivery);

// ✅ GOOD - Validate first
const validation = DataValidator.validateDelivery(delivery);
if (!validation.isValid) {
    showToast(validation.errors.join(', '), 'warning');
    return;
}
await dataService.saveDelivery(delivery);
```

## Summary

Following these patterns ensures:
- **Consistency** - All code follows the same patterns
- **Maintainability** - Easy to understand and modify
- **Reliability** - Proper error handling and validation
- **Performance** - Optimized data loading and caching
- **User Experience** - Loading states and feedback

Always refer to these patterns when writing new code or refactoring existing code.
