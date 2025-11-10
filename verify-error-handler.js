/**
 * Comprehensive verification script for ErrorHandler class
 * Tests all requirements: 3.3, 6.5
 */

const fs = require('fs');
const vm = require('vm');

// Load ErrorHandler
const errorHandlerCode = fs.readFileSync('public/assets/js/errorHandler.js', 'utf8');

// Create context with necessary globals
const toastMessages = [];
const context = {
    window: {},
    console,
    navigator: { onLine: true },
    module: { exports: {} },
    showToast: (message, type) => {
        toastMessages.push({ message, type });
        console.log(`[TOAST ${type}] ${message}`);
    }
};

vm.createContext(context);
vm.runInContext(errorHandlerCode, context);

const ErrorHandler = context.window.ErrorHandler;

// Test tracking
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`✓ ${testName}`);
        testsPassed++;
    } else {
        console.error(`✗ ${testName}`);
        testsFailed++;
    }
}

console.log('\n=== ErrorHandler Verification Suite ===\n');

// Test 1: handle() method exists and categorizes errors
console.log('Test Group 1: handle() method categorization');
{
    const networkError = new Error('network connection failed');
    const result = ErrorHandler.handle(networkError, 'testContext');
    assert(result.type === 'network', 'handle() categorizes network errors');
    
    const dupError = new Error('duplicate key value');
    dupError.code = '23505';
    const dupResult = ErrorHandler.handle(dupError, 'testContext');
    assert(dupResult.type === 'duplicate', 'handle() categorizes duplicate errors');
    
    const valError = new Error('validation failed');
    const valResult = ErrorHandler.handle(valError, 'testContext');
    assert(valResult.type === 'validation', 'handle() categorizes validation errors');
    
    const genericError = new Error('unknown error');
    const genResult = ErrorHandler.handle(genericError, 'testContext');
    assert(genResult.type === 'generic', 'handle() categorizes generic errors');
}

// Test 2: handleNetworkError() for connection issues
console.log('\nTest Group 2: handleNetworkError() implementation');
{
    toastMessages.length = 0;
    const networkError = new Error('Connection timeout');
    const result = ErrorHandler.handleNetworkError(networkError);
    
    assert(result.type === 'network', 'Returns type "network"');
    assert(result.recoverable === true, 'Marks network errors as recoverable');
    assert(result.message.includes('Network connection'), 'Provides user-friendly message');
    assert(result.originalError === networkError, 'Includes original error');
    assert(toastMessages.length > 0, 'Shows toast notification');
    assert(toastMessages[0].type === 'danger', 'Uses danger toast type');
}

// Test 3: handleDuplicateError() for constraint violations
console.log('\nTest Group 3: handleDuplicateError() implementation');
{
    toastMessages.length = 0;
    const dupError = new Error('duplicate key value violates unique constraint "dr_number"');
    dupError.code = '23505';
    const result = ErrorHandler.handleDuplicateError(dupError);
    
    assert(result.type === 'duplicate', 'Returns type "duplicate"');
    assert(result.recoverable === true, 'Marks duplicate errors as recoverable');
    assert(result.message.includes('already exists'), 'Provides user-friendly message');
    assert(result.originalError === dupError, 'Includes original error');
    assert(toastMessages.length > 0, 'Shows toast notification');
    assert(toastMessages[0].type === 'warning', 'Uses warning toast type');
}

// Test 4: handleValidationError() for invalid data
console.log('\nTest Group 4: handleValidationError() implementation');
{
    toastMessages.length = 0;
    const valError = new Error('Field is required');
    const result = ErrorHandler.handleValidationError(valError);
    
    assert(result.type === 'validation', 'Returns type "validation"');
    assert(result.recoverable === true, 'Marks validation errors as recoverable');
    assert(result.message.includes('Validation error'), 'Provides user-friendly message');
    assert(result.originalError === valError, 'Includes original error');
    assert(toastMessages.length > 0, 'Shows toast notification');
    assert(toastMessages[0].type === 'warning', 'Uses warning toast type');
}

// Test 5: handleGenericError() for unexpected errors
console.log('\nTest Group 5: handleGenericError() implementation');
{
    toastMessages.length = 0;
    const genericError = new Error('Something unexpected happened');
    const result = ErrorHandler.handleGenericError(genericError);
    
    assert(result.type === 'generic', 'Returns type "generic"');
    assert(result.recoverable === false, 'Marks generic errors as non-recoverable');
    assert(result.message.includes('unexpected error'), 'Provides user-friendly message');
    assert(result.originalError === genericError, 'Includes original error');
    assert(toastMessages.length > 0, 'Shows toast notification');
    assert(toastMessages[0].type === 'danger', 'Uses danger toast type');
}

// Test 6: Error detection methods
console.log('\nTest Group 6: Error detection methods');
{
    // Network error detection
    assert(ErrorHandler.isNetworkError(new Error('network failed')), 'Detects "network" keyword');
    assert(ErrorHandler.isNetworkError(new Error('fetch error')), 'Detects "fetch" keyword');
    assert(ErrorHandler.isNetworkError(new Error('timeout occurred')), 'Detects "timeout" keyword');
    assert(ErrorHandler.isNetworkError(new Error('connection refused')), 'Detects "connection" keyword');
    assert(!ErrorHandler.isNetworkError(new Error('other error')), 'Does not false-positive on non-network errors');
    
    // Duplicate error detection
    const dupError1 = new Error('test');
    dupError1.code = '23505';
    assert(ErrorHandler.isDuplicateError(dupError1), 'Detects PostgreSQL error code 23505');
    assert(ErrorHandler.isDuplicateError(new Error('duplicate key value')), 'Detects "duplicate" keyword');
    assert(ErrorHandler.isDuplicateError(new Error('already exists')), 'Detects "already exists" phrase');
    assert(ErrorHandler.isDuplicateError(new Error('unique constraint violated')), 'Detects "unique constraint" phrase');
    assert(!ErrorHandler.isDuplicateError(new Error('other error')), 'Does not false-positive on non-duplicate errors');
    
    // Validation error detection
    assert(ErrorHandler.isValidationError(new Error('validation failed')), 'Detects "validation" keyword');
    assert(ErrorHandler.isValidationError(new Error('invalid input')), 'Detects "invalid" keyword');
    assert(ErrorHandler.isValidationError(new Error('field is required')), 'Detects "required" keyword');
    assert(ErrorHandler.isValidationError(new Error('missing data')), 'Detects "missing" keyword');
    assert(!ErrorHandler.isValidationError(new Error('other error')), 'Does not false-positive on non-validation errors');
}

// Test 7: Error metadata structure
console.log('\nTest Group 7: Error metadata structure');
{
    const testError = new Error('test error');
    const result = ErrorHandler.handle(testError, 'testContext');
    
    assert(result.hasOwnProperty('type'), 'Metadata includes type');
    assert(result.hasOwnProperty('recoverable'), 'Metadata includes recoverable flag');
    assert(result.hasOwnProperty('message'), 'Metadata includes user-friendly message');
    assert(result.hasOwnProperty('originalError'), 'Metadata includes original error');
    assert(typeof result.type === 'string', 'Type is a string');
    assert(typeof result.recoverable === 'boolean', 'Recoverable is a boolean');
    assert(typeof result.message === 'string', 'Message is a string');
}

// Test 8: Additional error handlers
console.log('\nTest Group 8: Additional error handlers');
{
    toastMessages.length = 0;
    const authResult = ErrorHandler.handleAuthError(new Error('auth failed'));
    assert(authResult.type === 'authentication', 'handleAuthError returns correct type');
    assert(authResult.recoverable === true, 'Auth errors are recoverable');
    
    toastMessages.length = 0;
    const authzResult = ErrorHandler.handleAuthorizationError(new Error('permission denied'));
    assert(authzResult.type === 'authorization', 'handleAuthorizationError returns correct type');
    assert(authzResult.recoverable === false, 'Authorization errors are not recoverable');
}

// Test 9: logError method
console.log('\nTest Group 9: logError method');
{
    const testError = new Error('test error');
    const logEntry = ErrorHandler.logError('testContext', testError, { extra: 'data' });
    
    assert(logEntry.hasOwnProperty('timestamp'), 'Log entry includes timestamp');
    assert(logEntry.hasOwnProperty('context'), 'Log entry includes context');
    assert(logEntry.hasOwnProperty('error'), 'Log entry includes error details');
    assert(logEntry.hasOwnProperty('additionalData'), 'Log entry includes additional data');
    assert(logEntry.context === 'testContext', 'Context is preserved');
    assert(logEntry.additionalData.extra === 'data', 'Additional data is preserved');
}

// Test 10: Requirement 3.3 - Graceful error handling with user feedback
console.log('\nTest Group 10: Requirement 3.3 - Graceful error handling');
{
    toastMessages.length = 0;
    const error = new Error('database operation failed');
    ErrorHandler.handle(error, 'saveDelivery');
    
    assert(toastMessages.length > 0, 'Provides user feedback via toast');
    assert(toastMessages[0].message.length > 0, 'Feedback message is not empty');
    assert(['success', 'warning', 'danger'].includes(toastMessages[0].type), 'Uses appropriate toast type');
}

// Test 11: Requirement 6.5 - Clear error messages
console.log('\nTest Group 11: Requirement 6.5 - Clear error messages');
{
    const validationError = new Error('Customer name is required');
    toastMessages.length = 0;
    const result = ErrorHandler.handleValidationError(validationError);
    
    assert(result.message.includes('Customer name is required'), 'Preserves specific validation message');
    assert(toastMessages[0].message.includes('Customer name is required'), 'Toast shows specific error');
    
    const dupError = new Error('duplicate key');
    toastMessages.length = 0;
    const dupResult = ErrorHandler.handleDuplicateError(dupError);
    assert(dupResult.message.includes('already exists'), 'Provides clear duplicate error message');
}

// Test 12: Context logging
console.log('\nTest Group 12: Context logging');
{
    const originalConsoleError = console.error;
    let errorLogged = false;
    console.error = (...args) => {
        if (args[0].includes('Error in testContext')) {
            errorLogged = true;
        }
    };
    
    ErrorHandler.handle(new Error('test'), 'testContext');
    console.error = originalConsoleError;
    
    assert(errorLogged, 'Logs error with context to console');
}

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed === 0) {
    console.log('\n✓ All tests passed! ErrorHandler implementation is complete.');
    console.log('\nRequirements verified:');
    console.log('  ✓ 3.3 - Graceful error handling with user feedback');
    console.log('  ✓ 6.5 - Clear error messages for validation failures');
    console.log('\nImplemented methods:');
    console.log('  ✓ handle() - Categorizes and processes errors');
    console.log('  ✓ handleNetworkError() - Handles connection issues');
    console.log('  ✓ handleDuplicateError() - Handles constraint violations');
    console.log('  ✓ handleValidationError() - Handles invalid data');
    console.log('  ✓ handleGenericError() - Handles unexpected errors');
    process.exit(0);
} else {
    console.error('\n✗ Some tests failed. Please review the implementation.');
    process.exit(1);
}
