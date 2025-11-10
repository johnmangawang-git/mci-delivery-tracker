/**
 * Verification Script for Task 6: Refactor customers.js
 * 
 * This script verifies that all localStorage dependencies have been removed
 * and that the code follows the database-centric architecture.
 */

const fs = require('fs');
const path = require('path');

console.log('=== Task 6 Verification Script ===\n');

// Read the customers.js file
const customersJsPath = path.join(__dirname, 'public', 'assets', 'js', 'customers.js');
const customersJsContent = fs.readFileSync(customersJsPath, 'utf8');

// Test results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function addTest(name, passed, message) {
    results.tests.push({ name, passed, message });
    if (passed) {
        results.passed++;
        console.log(`✅ PASS: ${name}`);
    } else {
        results.failed++;
        console.log(`❌ FAIL: ${name}`);
    }
    if (message) {
        console.log(`   ${message}`);
    }
}

// Test 1: No localStorage.getItem references
const hasGetItem = customersJsContent.includes('localStorage.getItem');
addTest(
    'No localStorage.getItem() calls',
    !hasGetItem,
    hasGetItem ? 'Found localStorage.getItem() references' : 'No localStorage.getItem() found'
);

// Test 2: No localStorage.setItem references
const hasSetItem = customersJsContent.includes('localStorage.setItem');
addTest(
    'No localStorage.setItem() calls',
    !hasSetItem,
    hasSetItem ? 'Found localStorage.setItem() references' : 'No localStorage.setItem() found'
);

// Test 3: No localStorage.removeItem references
const hasRemoveItem = customersJsContent.includes('localStorage.removeItem');
addTest(
    'No localStorage.removeItem() calls',
    !hasRemoveItem,
    hasRemoveItem ? 'Found localStorage.removeItem() references' : 'No localStorage.removeItem() found'
);

// Test 4: No localStorage.clear references
const hasClear = customersJsContent.includes('localStorage.clear');
addTest(
    'No localStorage.clear() calls',
    !hasClear,
    hasClear ? 'Found localStorage.clear() references' : 'No localStorage.clear() found'
);

// Test 5: loadCustomers uses dataService.getCustomers
const loadCustomersMatch = customersJsContent.match(/async function loadCustomers\(\)[^}]*dataService\.getCustomers/s);
addTest(
    'loadCustomers() uses dataService.getCustomers()',
    !!loadCustomersMatch,
    loadCustomersMatch ? 'Found dataService.getCustomers() call' : 'Missing dataService.getCustomers() call'
);

// Test 6: autoCreateCustomer uses dataService.saveCustomer
const autoCreateMatch = customersJsContent.match(/async function autoCreateCustomer\([^)]*\)[^}]*dataService\.saveCustomer/s);
addTest(
    'autoCreateCustomer() uses dataService.saveCustomer()',
    !!autoCreateMatch,
    autoCreateMatch ? 'Found dataService.saveCustomer() call' : 'Missing dataService.saveCustomer() call'
);

// Test 7: deleteCustomer uses dataService.deleteCustomer
const deleteMatch = customersJsContent.match(/async function deleteCustomer\([^)]*\)[^}]*dataService\.deleteCustomer/s);
addTest(
    'deleteCustomer() uses dataService.deleteCustomer()',
    !!deleteMatch,
    deleteMatch ? 'Found dataService.deleteCustomer() call' : 'Missing dataService.deleteCustomer() call'
);

// Test 8: saveEditedCustomer is async
const saveEditedMatch = customersJsContent.match(/async function saveEditedCustomer\(\)/);
addTest(
    'saveEditedCustomer() is async',
    !!saveEditedMatch,
    saveEditedMatch ? 'Function is async' : 'Function is not async'
);

// Test 9: ErrorHandler is used
const hasErrorHandler = customersJsContent.includes('ErrorHandler.handle');
addTest(
    'Uses ErrorHandler for error handling',
    hasErrorHandler,
    hasErrorHandler ? 'Found ErrorHandler.handle() calls' : 'Missing ErrorHandler usage'
);

// Test 10: DataValidator is used
const hasDataValidator = customersJsContent.includes('DataValidator.validateCustomer');
addTest(
    'Uses DataValidator for validation',
    hasDataValidator,
    hasDataValidator ? 'Found DataValidator.validateCustomer() calls' : 'Missing DataValidator usage'
);

// Test 11: mergeDuplicateCustomers function removed
const hasMergeFunction = customersJsContent.includes('function mergeDuplicateCustomers');
addTest(
    'mergeDuplicateCustomers() function removed',
    !hasMergeFunction,
    hasMergeFunction ? 'Function still exists' : 'Function successfully removed'
);

// Test 12: Database schema field names used
const hasNewFieldNames = customersJsContent.includes('contact_person') && 
                         customersJsContent.includes('account_type') &&
                         customersJsContent.includes('bookings_count') &&
                         customersJsContent.includes('last_delivery');
addTest(
    'Uses database schema field names',
    hasNewFieldNames,
    hasNewFieldNames ? 'Found database schema field names' : 'Missing database schema field names'
);

// Test 13: Confirmation dialog in deleteCustomer
const hasConfirmation = customersJsContent.match(/async function deleteCustomer\([^)]*\)[^}]*confirm\(/s);
addTest(
    'deleteCustomer() has confirmation dialog',
    !!hasConfirmation,
    hasConfirmation ? 'Found confirmation dialog' : 'Missing confirmation dialog'
);

// Test 14: loadCustomers has error handling
const loadCustomersErrorHandling = customersJsContent.match(/async function loadCustomers\(\)[^}]*try[^}]*catch/s);
addTest(
    'loadCustomers() has try-catch error handling',
    !!loadCustomersErrorHandling,
    loadCustomersErrorHandling ? 'Found try-catch block' : 'Missing try-catch block'
);

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total Tests: ${results.tests.length}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);

if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Task 6 implementation is complete.');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
    process.exit(1);
}
