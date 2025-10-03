// Quick EPOD Test Script
// This script tests the EPOD functionality by simulating the saving process

console.log('=== Quick EPOD Test Started ===');

// Test record
const testRecord = {
    drNumber: 'DR-TEST-' + Date.now(),
    customerName: 'Test Customer',
    customerContact: '09123456789',
    truckPlate: 'ABC123',
    origin: 'Test Origin',
    destination: 'Test Destination',
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    status: 'Completed',
    signedAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
};

console.log('Test record created:', testRecord.drNumber);

// Function to run the test
async function runTest() {
    console.log('=== Testing EPOD Save Functions ===');
    
    // Test 1: Check if functions are available
    console.log('Test 1: Checking function availability...');
    console.log('saveEPodRecordFixed available:', typeof window.saveEPodRecordFixed === 'function');
    console.log('dataService.saveEPodRecord available:', typeof window.dataService?.saveEPodRecord === 'function');
    console.log('saveSingleSignature available:', typeof window.saveSingleSignature === 'function');
    
    // Test 2: Try to save using saveEPodRecordFixed
    if (typeof window.saveEPodRecordFixed === 'function') {
        console.log('Test 2: Saving via saveEPodRecordFixed...');
        try {
            const result = await window.saveEPodRecordFixed(testRecord);
            console.log('✓ Record saved via saveEPodRecordFixed:', result.drNumber);
        } catch (error) {
            console.error('✗ Error saving via saveEPodRecordFixed:', error.message);
        }
    }
    
    // Test 3: Try to save using dataService
    if (typeof window.dataService !== 'undefined' && typeof window.dataService.saveEPodRecord === 'function') {
        console.log('Test 3: Saving via dataService.saveEPodRecord...');
        try {
            const result = await window.dataService.saveEPodRecord(testRecord);
            console.log('✓ Record saved via dataService:', result.drNumber);
        } catch (error) {
            console.error('✗ Error saving via dataService:', error.message);
        }
    }
    
    // Test 4: Try to save using saveSingleSignature
    if (typeof window.saveSingleSignature === 'function') {
        console.log('Test 4: Saving via saveSingleSignature...');
        try {
            window.saveSingleSignature({
                drNumber: testRecord.drNumber,
                customerName: testRecord.customerName,
                customerContact: testRecord.customerContact,
                truckPlate: testRecord.truckPlate,
                deliveryRoute: testRecord.origin + ' to ' + testRecord.destination,
                signatureData: testRecord.signature
            });
            console.log('✓ saveSingleSignature called');
        } catch (error) {
            console.error('✗ Error calling saveSingleSignature:', error.message);
        }
    }
    
    // Test 5: Check localStorage
    console.log('Test 5: Checking localStorage...');
    try {
        const ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
        console.log('✓ EPOD records in localStorage:', ePodRecords.length);
        
        // Check if our test record is there
        const foundRecord = ePodRecords.find(r => r.drNumber === testRecord.drNumber);
        if (foundRecord) {
            console.log('✓ Test record found in localStorage');
        } else {
            console.log('✗ Test record NOT found in localStorage');
        }
    } catch (error) {
        console.error('✗ Error accessing localStorage:', error.message);
    }
    
    console.log('=== Test Completed ===');
}

// Run the test when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTest);
} else {
    runTest();
}

// Export for manual testing
window.runEPodTest = runTest;
console.log('Test function available as window.runEPodTest()');