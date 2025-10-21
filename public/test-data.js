// Test data script to verify new field mapping
(function() {
    console.log('=== Test Data Script Loaded ===');
    
    // Test data with both naming conventions
    const testData = {
        id: 'TEST-' + Date.now(),
        drNumber: 'TEST-DR-001',
        dr_number: 'TEST-DR-001', // snake_case version
        customerName: 'Test Customer',
        customer_name: 'Test Customer', // snake_case version
        vendorNumber: 'VEND-001',
        vendor_number: 'VEND-001', // snake_case version
        origin: 'Test Origin',
        destination: 'Test Destination',
        truckType: 'L300',
        truck_type: 'L300', // snake_case version
        truckPlateNumber: 'TEST-123',
        truck_plate_number: 'TEST-123', // snake_case version
        status: 'Active',
        deliveryDate: new Date().toISOString().split('T')[0],
        created_date: new Date().toISOString().split('T')[0], // snake_case version
        additionalCosts: 0,
        additional_costs: 0, // snake_case version
        // NEW FIELDS - both naming conventions
        itemNumber: 'ITEM-001',
        item_number: 'ITEM-001', // snake_case version
        mobileNumber: '09123456789',
        mobile_number: '09123456789', // snake_case version
        itemDescription: 'Test Item Description',
        item_description: 'Test Item Description', // snake_case version
        serialNumber: 'SER-001',
        serial_number: 'SER-001' // snake_case version
    };
    
    // Function to test field mapping
    function testFieldMapping() {
        console.log('=== Testing Field Mapping ===');
        
        // Test with field mapper if available
        if (window.getFieldValue) {
            console.log('Testing with field mapper:');
            console.log('itemNumber:', window.getFieldValue(testData, 'itemNumber'));
            console.log('mobileNumber:', window.getFieldValue(testData, 'mobileNumber'));
            console.log('itemDescription:', window.getFieldValue(testData, 'itemDescription'));
            console.log('serialNumber:', window.getFieldValue(testData, 'serialNumber'));
        } else {
            console.log('Field mapper not available, using direct access:');
            console.log('itemNumber:', testData.itemNumber);
            console.log('mobileNumber:', testData.mobileNumber);
            console.log('itemDescription:', testData.itemDescription);
            console.log('serialNumber:', testData.serialNumber);
        }
    }
    
    // Function to add test data to active deliveries
    function addTestData() {
        console.log('=== Adding Test Data ===');
        
        // Ensure activeDeliveries array exists
        if (!window.activeDeliveries) {
            window.activeDeliveries = [];
        }
        
        // Add test data
        window.activeDeliveries.push(testData);
        
        // Save to localStorage
        try {
            localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
            console.log('✅ Test data saved to localStorage');
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
        }
        
        // Refresh the active deliveries table if function exists
        if (typeof window.loadActiveDeliveries === 'function') {
            window.loadActiveDeliveries();
            console.log('🔄 Active deliveries table refreshed');
        }
        
        console.log('✅ Test data added successfully');
    }
    
    // Function to verify data in localStorage
    function verifyLocalStorage() {
        console.log('=== Verifying LocalStorage Data ===');
        
        try {
            const savedData = localStorage.getItem('mci-active-deliveries');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                console.log('LocalStorage data count:', parsedData.length);
                
                if (parsedData.length > 0) {
                    const lastItem = parsedData[parsedData.length - 1];
                    console.log('Last item in localStorage:', lastItem);
                    
                    // Check if new fields exist
                    console.log('itemNumber field exists:', 'itemNumber' in lastItem);
                    console.log('mobileNumber field exists:', 'mobileNumber' in lastItem);
                    console.log('itemDescription field exists:', 'itemDescription' in lastItem);
                    console.log('serialNumber field exists:', 'serialNumber' in lastItem);
                    
                    // Check snake_case versions
                    console.log('item_number field exists:', 'item_number' in lastItem);
                    console.log('mobile_number field exists:', 'mobile_number' in lastItem);
                    console.log('item_description field exists:', 'item_description' in lastItem);
                    console.log('serial_number field exists:', 'serial_number' in lastItem);
                }
            } else {
                console.log('No data found in localStorage');
            }
        } catch (error) {
            console.error('Error reading localStorage:', error);
        }
    }
    
    // Expose functions globally
    window.testFieldMapping = testFieldMapping;
    window.addTestData = addTestData;
    window.verifyLocalStorage = verifyLocalStorage;
    
    // Run tests
    testFieldMapping();
    
    console.log('=== Test Data Script Ready ===');
    console.log('Available functions:');
    console.log('- testFieldMapping()');
    console.log('- addTestData()');
    console.log('- verifyLocalStorage()');
})();