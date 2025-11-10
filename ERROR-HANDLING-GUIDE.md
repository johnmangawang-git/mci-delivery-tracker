# Error Handling Guide - Database-Centric Architecture

## Quick Reference for Developers

This guide provides quick reference patterns for implementing error handling in the database-centric architecture.

---

## Standard Error Handling Pattern

### Basic Database Operation

```javascript
async function myDatabaseOperation(data) {
    try {
        // 1. Log the operation start
        if (window.Logger) {
            window.Logger.info('Starting operation', { 
                operation: 'myDatabaseOperation',
                data 
            });
        }
        
        // 2. Perform the database operation
        const result = await window.dataService.someMethod(data);
        
        // 3. Show success message
        showToast('Operation completed successfully', 'success');
        
        // 4. Return result
        return result;
        
    } catch (error) {
        console.error('❌ Error in myDatabaseOperation:', error);
        
        // 5. Use ErrorHandler for consistent processing
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'myDatabaseOperation');
        }
        
        // 6. Log error with full context
        if (window.Logger) {
            window.Logger.error('Operation failed', {
                operation: 'myDatabaseOperation',
                data,
                error: error.message,
                code: error.code,
                stack: error.stack
            });
        }
        
        // 7. Show user-friendly error message
        showToast('Failed to complete operation. Please try again.', 'danger');
        
        // 8. Re-throw or handle as needed
        throw error;
    }
}
```

---

## Pattern Variations

### 1. Optimistic UI Update with Rollback

Use this pattern when you want immediate UI feedback:

```javascript
async function updateWithOptimisticUI(id, newValue) {
    // Store old value for rollback
    const oldValue = currentValue;
    
    // 1. Update UI immediately (optimistic)
    currentValue = newValue;
    updateUIDisplay();
    
    try {
        // 2. Log operation
        if (window.Logger) {
            window.Logger.info('Updating value', { id, oldValue, newValue });
        }
        
        // 3. Save to database
        await window.dataService.update('table', id, { value: newValue });
        
        // 4. Show success
        showToast('Updated successfully', 'success');
        
    } catch (error) {
        // 5. Rollback UI on error
        currentValue = oldValue;
        updateUIDisplay();
        
        // 6. Handle error
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'updateWithOptimisticUI');
        }
        
        if (window.Logger) {
            window.Logger.error('Update failed, rolled back', {
                id, oldValue, newValue,
                error: error.message,
                stack: error.stack
            });
        }
        
        showToast('Update failed. Changes reverted.', 'danger');
    }
}
```

### 2. Silent Error Handling (Non-Critical Operations)

Use this for operations that shouldn't interrupt the user:

```javascript
async function loadOptionalData() {
    try {
        if (window.Logger) {
            window.Logger.info('Loading optional data');
        }
        
        const data = await window.dataService.read('optional_table');
        return data;
        
    } catch (error) {
        // Log but don't show toast
        console.warn('⚠️ Optional data load failed:', error);
        
        if (window.Logger) {
            window.Logger.warn('Optional data unavailable', {
                error: error.message
            });
        }
        
        // Return empty array instead of throwing
        return [];
    }
}
```

### 3. Nested Try-Catch for Multiple Operations

Use this when you have multiple independent operations:

```javascript
async function complexOperation() {
    try {
        // Main operation
        const mainResult = await window.dataService.create('main_table', data);
        
        // Optional related operation
        try {
            await window.dataService.create('related_table', relatedData);
        } catch (relatedError) {
            // Log but don't fail main operation
            console.warn('Related operation failed:', relatedError);
            if (window.Logger) {
                window.Logger.warn('Related operation failed', {
                    error: relatedError.message
                });
            }
        }
        
        showToast('Operation completed', 'success');
        return mainResult;
        
    } catch (error) {
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'complexOperation');
        }
        
        if (window.Logger) {
            window.Logger.error('Complex operation failed', {
                error: error.message,
                stack: error.stack
            });
        }
        
        showToast('Operation failed', 'danger');
        throw error;
    }
}
```

---

## Error Types and Handling

### Network Errors

```javascript
// ErrorHandler automatically detects network errors
// Error codes: 'NETWORK_OFFLINE', or message contains 'network'

// User sees: "No internet connection. Please check your network."
// Type: 'network'
// Recoverable: true
```

### Validation Errors

```javascript
// Use DataValidator before database operations
const validation = window.DataValidator.validateDelivery(delivery);
if (!validation.isValid) {
    throw new Error(window.DataValidator.formatErrors(validation.errors));
}

// User sees: Specific validation message
// Type: 'validation'
// Recoverable: true
```

### Duplicate Errors

```javascript
// ErrorHandler detects PostgreSQL duplicate key errors
// Error code: '23505'

// User sees: "This record already exists in the database."
// Type: 'duplicate'
// Recoverable: true
```

### Generic Errors

```javascript
// All other errors

// User sees: "An unexpected error occurred. Please try again."
// Type: 'generic'
// Recoverable: false
```

---

## Logging Best Practices

### What to Log

#### Operation Start (Info Level)
```javascript
window.Logger.info('Operation description', {
    operation: 'functionName',
    input: relevantInputData,
    user: currentUser,
    timestamp: new Date().toISOString()
});
```

#### Operation Success (Info Level)
```javascript
window.Logger.info('Operation completed', {
    operation: 'functionName',
    result: resultSummary,
    duration: endTime - startTime
});
```

#### Operation Error (Error Level)
```javascript
window.Logger.error('Operation failed', {
    operation: 'functionName',
    input: relevantInputData,
    error: error.message,
    code: error.code,
    details: error.details,
    stack: error.stack
});
```

### What NOT to Log

- ❌ Sensitive user data (passwords, tokens)
- ❌ Complete large objects (use summaries)
- ❌ Redundant information already in error.stack

---

## Toast Notification Guidelines

### Success Messages
```javascript
showToast('Operation completed successfully', 'success');
showToast('Record saved', 'success');
showToast('Status updated', 'success');
```

### Error Messages
```javascript
showToast('Failed to save record. Please try again.', 'danger');
showToast('Unable to load data. Check your connection.', 'danger');
showToast('Operation failed. Please contact support.', 'danger');
```

### Warning Messages
```javascript
showToast('Some data could not be loaded', 'warning');
showToast('Operation completed with warnings', 'warning');
```

### Info Messages
```javascript
showToast('Data synced from another device', 'info');
showToast('Real-time update received', 'info');
```

---

## Common Scenarios

### Scenario 1: Create New Record

```javascript
async function createRecord(data) {
    try {
        // Validate first
        const validation = window.DataValidator.validateRecord(data);
        if (!validation.isValid) {
            throw new Error(window.DataValidator.formatErrors(validation.errors));
        }
        
        // Log operation
        if (window.Logger) {
            window.Logger.info('Creating record', { data });
        }
        
        // Create in database
        const result = await window.dataService.create('table', data);
        
        // Success
        showToast('Record created successfully', 'success');
        return result;
        
    } catch (error) {
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'createRecord');
        }
        
        if (window.Logger) {
            window.Logger.error('Failed to create record', {
                data,
                error: error.message,
                stack: error.stack
            });
        }
        
        showToast('Failed to create record', 'danger');
        throw error;
    }
}
```

### Scenario 2: Update Existing Record

```javascript
async function updateRecord(id, updates) {
    try {
        // Log operation
        if (window.Logger) {
            window.Logger.info('Updating record', { id, updates });
        }
        
        // Update in database
        const result = await window.dataService.update('table', id, updates);
        
        // Success
        showToast('Record updated successfully', 'success');
        return result;
        
    } catch (error) {
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'updateRecord');
        }
        
        if (window.Logger) {
            window.Logger.error('Failed to update record', {
                id,
                updates,
                error: error.message,
                stack: error.stack
            });
        }
        
        showToast('Failed to update record', 'danger');
        throw error;
    }
}
```

### Scenario 3: Delete Record with Confirmation

```javascript
async function deleteRecord(id) {
    // Confirm first
    if (!confirm('Are you sure you want to delete this record?')) {
        return;
    }
    
    try {
        // Log operation
        if (window.Logger) {
            window.Logger.info('Deleting record', { id });
        }
        
        // Delete from database
        await window.dataService.delete('table', id);
        
        // Success
        showToast('Record deleted successfully', 'success');
        
    } catch (error) {
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'deleteRecord');
        }
        
        if (window.Logger) {
            window.Logger.error('Failed to delete record', {
                id,
                error: error.message,
                stack: error.stack
            });
        }
        
        showToast('Failed to delete record', 'danger');
    }
}
```

### Scenario 4: Load Data with Pagination

```javascript
async function loadDataWithPagination(page = 1) {
    try {
        // Log operation
        if (window.Logger) {
            window.Logger.info('Loading paginated data', { page });
        }
        
        // Load from database
        const result = await window.dataService.getDeliveriesWithPagination({
            page,
            pageSize: 50,
            filters: { status: 'Active' }
        });
        
        // Update UI
        displayData(result.data);
        updatePaginationControls(result.pagination);
        
        return result;
        
    } catch (error) {
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'loadDataWithPagination');
        }
        
        if (window.Logger) {
            window.Logger.error('Failed to load paginated data', {
                page,
                error: error.message,
                stack: error.stack
            });
        }
        
        showToast('Failed to load data', 'danger');
    }
}
```

---

## Testing Your Error Handling

### Manual Testing Checklist

- [ ] Test with valid data - should succeed
- [ ] Test with invalid data - should show validation error
- [ ] Test with duplicate data - should show duplicate error
- [ ] Test with network disconnected - should show network error
- [ ] Test with slow network - should show loading state
- [ ] Verify toast notifications appear
- [ ] Verify console logs are detailed
- [ ] Verify UI rollback on error (if applicable)

### Automated Testing

Use the provided test file:
```bash
# Open in browser
test-comprehensive-error-handling.html

# Or run verification script
node verify-error-handling-implementation.js
```

---

## Troubleshooting

### ErrorHandler not working?
```javascript
// Check if ErrorHandler is loaded
console.log('ErrorHandler available:', typeof window.ErrorHandler !== 'undefined');

// Check if handle method exists
console.log('handle method:', typeof window.ErrorHandler?.handle === 'function');
```

### Logger not working?
```javascript
// Check if Logger is loaded
console.log('Logger available:', typeof window.Logger !== 'undefined');

// Check if methods exist
console.log('error method:', typeof window.Logger?.error === 'function');
console.log('info method:', typeof window.Logger?.info === 'function');
```

### Toast not showing?
```javascript
// Check if Bootstrap is loaded
console.log('Bootstrap available:', typeof bootstrap !== 'undefined');

// Check if toast container exists
console.log('Toast container:', document.getElementById('toastContainer'));
```

---

## Additional Resources

- **ErrorHandler Implementation:** `public/assets/js/errorHandler.js`
- **Logger Implementation:** `public/assets/js/logger.js`
- **DataValidator Implementation:** `public/assets/js/dataValidator.js`
- **Test File:** `test-comprehensive-error-handling.html`
- **Verification Script:** `verify-error-handling-implementation.js`

---

## Summary

**Key Principles:**
1. Always wrap database operations in try-catch
2. Use ErrorHandler for consistent error processing
3. Log operations with sufficient context
4. Show user-friendly error messages
5. Implement rollback for optimistic updates
6. Test error scenarios thoroughly

**Remember:** Good error handling improves user experience, simplifies debugging, and makes the application more reliable.

---

Last Updated: November 10, 2025
