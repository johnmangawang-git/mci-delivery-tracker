/**
 * Quick verification script for DataValidator
 * Run with: node verify-data-validator.js
 */

// Load the DataValidator class
const DataValidator = require('./public/assets/js/dataValidator.js');

console.log('=== DataValidator Verification Script ===\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        const result = fn();
        if (result) {
            console.log(`✓ ${name}`);
            passed++;
        } else {
            console.log(`✗ ${name}`);
            failed++;
        }
    } catch (error) {
        console.log(`✗ ${name} - Error: ${error.message}`);
        failed++;
    }
}

// Test 1: Valid delivery
test('Valid delivery with required fields', () => {
    const delivery = { dr_number: 'DR-001', customer_name: 'Test Customer' };
    const result = DataValidator.validateDelivery(delivery);
    return result.isValid && result.errors.length === 0;
});

// Test 2: Invalid delivery - missing DR number
test('Invalid delivery - missing DR number', () => {
    const delivery = { customer_name: 'Test Customer' };
    const result = DataValidator.validateDelivery(delivery);
    return !result.isValid && result.errors.length > 0;
});

// Test 3: Valid customer
test('Valid customer with required fields', () => {
    const customer = { name: 'Test Customer', phone: '09123456789' };
    const result = DataValidator.validateCustomer(customer);
    return result.isValid && result.errors.length === 0;
});

// Test 4: Invalid customer - missing phone
test('Invalid customer - missing phone', () => {
    const customer = { name: 'Test Customer' };
    const result = DataValidator.validateCustomer(customer);
    return !result.isValid && result.errors.some(e => e.includes('Phone'));
});

// Test 5: Valid EPOD
test('Valid EPOD with required fields', () => {
    const epod = { dr_number: 'DR-001' };
    const result = DataValidator.validateEPodRecord(epod);
    return result.isValid && result.errors.length === 0;
});

// Test 6: Invalid EPOD - missing DR number
test('Invalid EPOD - missing DR number', () => {
    const epod = { customer_name: 'Test' };
    const result = DataValidator.validateEPodRecord(epod);
    return !result.isValid && result.errors.some(e => e.includes('DR number'));
});

// Test 7: Error formatting - single error
test('Format single error', () => {
    const errors = ['Test error'];
    const formatted = DataValidator.formatErrors(errors);
    return formatted === 'Test error';
});

// Test 8: Error formatting - multiple errors
test('Format multiple errors', () => {
    const errors = ['Error 1', 'Error 2'];
    const formatted = DataValidator.formatErrors(errors);
    return formatted.includes('Validation errors:') && formatted.includes('• Error 1');
});

// Test 9: Batch validation
test('Batch validate deliveries', () => {
    const deliveries = [
        { dr_number: 'DR-001', customer_name: 'Customer 1' },
        { dr_number: 'DR-002' } // Invalid
    ];
    const result = DataValidator.validateDeliveries(deliveries);
    return result.summary.valid === 1 && result.summary.invalid === 1;
});

// Test 10: Date validation
test('Validate date fields', () => {
    const delivery = {
        dr_number: 'DR-001',
        customer_name: 'Test',
        booked_date: '2025-01-01'
    };
    const result = DataValidator.validateDelivery(delivery);
    return result.isValid;
});

console.log('\n=== Summary ===');
console.log(`Total: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
    console.log('\n✓ All tests passed! DataValidator is working correctly.');
    process.exit(0);
} else {
    console.log('\n✗ Some tests failed. Please review the implementation.');
    process.exit(1);
}
