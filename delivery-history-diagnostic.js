/**
 * DELIVERY HISTORY DIAGNOSTIC
 * Add this to console to debug delivery history issues
 */

console.log('🔍 DELIVERY HISTORY DIAGNOSTIC STARTING...');

// Check current state
console.log('📊 CURRENT STATE:');
console.log('Active Deliveries:', window.activeDeliveries ? window.activeDeliveries.length : 'undefined');
console.log('Delivery History:', window.deliveryHistory ? window.deliveryHistory.length : 'undefined');

// Check localStorage
console.log('💾 LOCALSTORAGE:');
try {
    const savedActive = localStorage.getItem('mci-active-deliveries');
    const savedHistory = localStorage.getItem('mci-delivery-history');
    const savedEPod = localStorage.getItem('ePodRecords');
    
    console.log('mci-active-deliveries:', savedActive ? JSON.parse(savedActive).length : 'null');
    console.log('mci-delivery-history:', savedHistory ? JSON.parse(savedHistory).length : 'null');
    console.log('ePodRecords:', savedEPod ? JSON.parse(savedEPod).length : 'null');
    
    if (savedHistory) {
        const historyData = JSON.parse(savedHistory);
        console.log('📦 DELIVERY HISTORY ITEMS:');
        historyData.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.drNumber} - ${item.status} (${item.completedDate})`);
        });
    }
} catch (error) {
    console.error('❌ Error reading localStorage:', error);
}

// Check functions
console.log('🔧 FUNCTIONS:');
console.log('loadDeliveryHistory:', typeof window.loadDeliveryHistory);
console.log('enhancedSaveSignature:', typeof window.enhancedSaveSignature);
console.log('updateDeliveryStatus:', typeof window.updateDeliveryStatus);

// Check DOM elements
console.log('🎨 DOM ELEMENTS:');
const deliveryHistoryTableBody = document.getElementById('deliveryHistoryTableBody');
console.log('deliveryHistoryTableBody:', deliveryHistoryTableBody ? 'found' : 'not found');

if (deliveryHistoryTableBody) {
    console.log('Table body content length:', deliveryHistoryTableBody.innerHTML.length);
    console.log('Table rows:', deliveryHistoryTableBody.querySelectorAll('tr').length);
}

// Test loadDeliveryHistory function
console.log('🧪 TESTING loadDeliveryHistory...');
if (typeof window.loadDeliveryHistory === 'function') {
    try {
        window.loadDeliveryHistory();
        console.log('✅ loadDeliveryHistory executed without error');
    } catch (error) {
        console.error('❌ Error calling loadDeliveryHistory:', error);
    }
} else {
    console.error('❌ loadDeliveryHistory function not available');
}

console.log('🔍 DIAGNOSTIC COMPLETE');

// Add a test function to manually move a delivery to history
window.testMoveToHistory = function(drNumber) {
    console.log(`🧪 Testing manual move to history for: ${drNumber}`);
    
    if (!window.activeDeliveries || !window.deliveryHistory) {
        console.error('❌ Global arrays not initialized');
        return;
    }
    
    const deliveryIndex = window.activeDeliveries.findIndex(d => d.drNumber === drNumber);
    if (deliveryIndex === -1) {
        console.error(`❌ Delivery ${drNumber} not found in active deliveries`);
        return;
    }
    
    const delivery = window.activeDeliveries[deliveryIndex];
    delivery.status = 'Completed';
    delivery.completedDate = new Date().toLocaleDateString();
    
    // Move to history
    window.deliveryHistory.unshift(delivery);
    window.activeDeliveries.splice(deliveryIndex, 1);
    
    // Save to localStorage
    localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
    localStorage.setItem('mci-delivery-history', JSON.stringify(window.deliveryHistory));
    
    console.log(`✅ Moved ${drNumber} to history`);
    console.log(`📊 New state: Active=${window.activeDeliveries.length}, History=${window.deliveryHistory.length}`);
    
    // Test loadDeliveryHistory
    if (typeof window.loadDeliveryHistory === 'function') {
        window.loadDeliveryHistory();
    }
};

console.log('💡 Use testMoveToHistory("DR-NUMBER") to manually test moving a delivery to history');