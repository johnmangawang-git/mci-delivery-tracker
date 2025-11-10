/**
 * Verification Script for Pagination Implementation
 * Task 10: Add pagination support for large datasets
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Verifying Pagination Implementation...\n');

let passed = 0;
let failed = 0;

function test(description, condition) {
    if (condition) {
        console.log(`✅ PASS: ${description}`);
        passed++;
    } else {
        console.log(`❌ FAIL: ${description}`);
        failed++;
    }
}

function testFileContains(filePath, searchString, description) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        test(description, content.includes(searchString));
        return content.includes(searchString);
    } catch (error) {
        console.log(`❌ FAIL: ${description} - File not found or error reading: ${error.message}`);
        failed++;
        return false;
    }
}

// Test 1: DataService has getDeliveriesWithPagination method
console.log('\n📋 Test 1: DataService Pagination Method');
testFileContains(
    'public/assets/js/dataService.js',
    'async getDeliveriesWithPagination(options = {})',
    'DataService has getDeliveriesWithPagination method'
);
testFileContains(
    'public/assets/js/dataService.js',
    'pagination: {',
    'Method returns pagination metadata'
);
testFileContains(
    'public/assets/js/dataService.js',
    'totalPages',
    'Pagination includes totalPages'
);
testFileContains(
    'public/assets/js/dataService.js',
    'hasNextPage',
    'Pagination includes hasNextPage'
);

// Test 2: App.js has pagination functions
console.log('\n📋 Test 2: App.js Pagination Functions');
testFileContains(
    'public/assets/js/app.js',
    'async function loadActiveDeliveriesWithPagination',
    'loadActiveDeliveriesWithPagination function exists'
);
testFileContains(
    'public/assets/js/app.js',
    'async function loadDeliveryHistoryWithPagination',
    'loadDeliveryHistoryWithPagination function exists'
);
testFileContains(
    'public/assets/js/app.js',
    'function updatePaginationControls',
    'updatePaginationControls function exists'
);

// Test 3: Pagination state structure
console.log('\n📋 Test 3: Pagination State Structure');
testFileContains(
    'public/assets/js/app.js',
    'paginationState = {',
    'Pagination state object exists'
);
testFileContains(
    'public/assets/js/app.js',
    'active: {',
    'Active deliveries pagination state exists'
);
testFileContains(
    'public/assets/js/app.js',
    'history: {',
    'Delivery history pagination state exists'
);
testFileContains(
    'public/assets/js/app.js',
    'currentPage:',
    'Pagination state includes currentPage'
);
testFileContains(
    'public/assets/js/app.js',
    'pageSize:',
    'Pagination state includes pageSize'
);
testFileContains(
    'public/assets/js/app.js',
    'totalPages:',
    'Pagination state includes totalPages'
);

// Test 4: Page navigation functions
console.log('\n📋 Test 4: Page Navigation Functions');
testFileContains(
    'public/assets/js/app.js',
    'window.changePage = async function',
    'changePage function exists'
);
testFileContains(
    'public/assets/js/app.js',
    'window.changePageSize = async function',
    'changePageSize function exists'
);

// Test 5: Loading indicators
console.log('\n📋 Test 5: Loading Indicators');
testFileContains(
    'public/assets/js/app.js',
    'Loading deliveries (Page',
    'Active deliveries loading indicator exists'
);
testFileContains(
    'public/assets/js/app.js',
    'Loading delivery history (Page',
    'Delivery history loading indicator exists'
);
testFileContains(
    'public/assets/js/app.js',
    'spinner-border',
    'Spinner element for loading state exists'
);

// Test 6: Pagination controls HTML
console.log('\n📋 Test 6: Pagination Controls in HTML');
testFileContains(
    'public/index.html',
    'id="activePaginationControls"',
    'Active deliveries pagination container exists'
);
testFileContains(
    'public/index.html',
    'id="historyPaginationControls"',
    'Delivery history pagination container exists'
);

// Test 7: Page size selection
console.log('\n📋 Test 7: Page Size Selection');
const appContent = fs.readFileSync('public/assets/js/app.js', 'utf8');
test(
    'Page size options include 25, 50, 100, 200',
    appContent.includes('value="25"') && 
    appContent.includes('value="50"') && 
    appContent.includes('value="100"') && 
    appContent.includes('value="200"')
);
testFileContains(
    'public/assets/js/app.js',
    'per page',
    'Page size selector has labels'
);

// Test 8: Pagination controls generation
console.log('\n📋 Test 8: Pagination Controls Generation');
testFileContains(
    'public/assets/js/app.js',
    'Previous',
    'Previous button exists'
);
testFileContains(
    'public/assets/js/app.js',
    'Next',
    'Next button exists'
);
testFileContains(
    'public/assets/js/app.js',
    'Showing',
    'Shows item count'
);

// Test 9: Global function exports
console.log('\n📋 Test 9: Global Function Exports');
testFileContains(
    'public/assets/js/app.js',
    'window.loadActiveDeliveriesWithPagination = loadActiveDeliveriesWithPagination',
    'loadActiveDeliveriesWithPagination exported to window'
);
testFileContains(
    'public/assets/js/app.js',
    'window.loadDeliveryHistoryWithPagination = loadDeliveryHistoryWithPagination',
    'loadDeliveryHistoryWithPagination exported to window'
);
testFileContains(
    'public/assets/js/app.js',
    'window.updatePaginationControls = updatePaginationControls',
    'updatePaginationControls exported to window'
);

// Test 10: Integration with existing code
console.log('\n📋 Test 10: Integration with Existing Code');
testFileContains(
    'public/assets/js/app.js',
    'await loadActiveDeliveriesWithPagination(1)',
    'loadActiveDeliveries calls pagination function'
);
testFileContains(
    'public/assets/js/app.js',
    'await loadDeliveryHistoryWithPagination(1)',
    'loadDeliveryHistory calls pagination function'
);

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Total Tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('='.repeat(50));

if (failed === 0) {
    console.log('\n🎉 All tests passed! Pagination implementation is complete.');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
    process.exit(1);
}
