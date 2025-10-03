# EPOD Workflow and Troubleshooting Guide

## Ideal EPOD Workflow

When a user signs a delivery receipt (DR), the system should perform the following steps:

### 1. Signature Capture and Saving
- User opens E-Signature modal for a delivery
- User draws their signature on the signature pad
- User clicks "Save Signature" button

### 2. EPOD Record Creation
- System creates an EPOD record containing:
  - DR Number
  - Customer information (name, contact)
  - Truck information (plate number)
  - Route information (origin, destination)
  - Signature data (base64 encoded image)
  - Status ("Completed")
  - Timestamps (signedAt, timestamp)

### 3. Data Persistence
- EPOD record is saved to either:
  - Supabase database (via dataService) if available
  - localStorage as fallback

### 4. Delivery Status Update
- Delivery status is updated to "Completed" in active deliveries
- Delivery is moved from Active Deliveries to Delivery History

### 5. UI Refresh
- Active Deliveries view is refreshed (delivery should no longer appear)
- Delivery History view is refreshed (delivery should now appear with "Completed" status)
- EPOD view is refreshed (signed delivery should now appear)

## Current Implementation Flow

### Single Signature Flow:
1. `saveRobustSignature()` → `saveSingleSignature()`
2. `saveSingleSignature()` creates EPOD record and saves it
3. Updates delivery status via `updateDeliveryStatus()`
4. Shows success message and refreshes views
5. Closes modal

### Multiple Signature Flow:
1. `saveRobustSignature()` → `saveMultipleSignatures()`
2. `saveMultipleSignatures()` creates EPOD records for each DR and saves them
3. Updates delivery status for each DR via `updateDeliveryStatus()`
4. Shows success message and refreshes views
5. Closes modal

## Troubleshooting Common Issues

### Issue: EPOD Records Not Appearing in EPOD View
**Possible Causes:**
1. Data not being saved correctly
2. Timing issues with refresh
3. dataService not properly initialized
4. localStorage fallback not working

**Solutions:**
1. Check browser console for errors during saving
2. Verify that `saveEPodRecord` function is being called
3. Ensure `loadEPodDeliveries` is properly refreshing the view
4. Check if records exist in localStorage: `JSON.parse(localStorage.getItem('ePodRecords') || '[]')`

### Issue: Delivery Not Moving to History
**Possible Causes:**
1. `updateDeliveryStatus` function not working correctly
2. `window.activeDeliveries` or `window.deliveryHistory` not properly initialized
3. `saveToLocalStorage` function not being called

**Solutions:**
1. Check that `updateDeliveryStatus` finds the delivery in activeDeliveries
2. Verify that `window.activeDeliveries` and `window.deliveryHistory` are arrays
3. Ensure `saveToLocalStorage` is available and working

### Issue: Signature Not Being Saved
**Possible Causes:**
1. Signature pad not properly initialized
2. Signature data not being captured
3. EPOD record creation failing

**Solutions:**
1. Check that `robustSignaturePad` is initialized
2. Verify `getRobustSignatureData()` returns valid data
3. Check for errors in EPOD record creation and saving

## Testing EPOD Functionality

### Manual Testing Steps:
1. Create a new delivery booking with a DR number
2. Go to Active Deliveries view
3. Select the delivery and click "E-Signature" button
4. Draw a signature and click "Save Signature"
5. Verify:
   - Success message appears
   - Delivery disappears from Active Deliveries
   - Delivery appears in Delivery History with "Completed" status
   - Delivery appears in EPOD view with signature

### Console Debugging:
```javascript
// Check if EPOD records exist in localStorage
console.log('EPOD Records:', JSON.parse(localStorage.getItem('ePodRecords') || '[]'));

// Check if dataService is available
console.log('dataService available:', typeof window.dataService !== 'undefined');

// Check if dataService functions are available
console.log('saveEPodRecord available:', typeof window.dataService?.saveEPodRecord === 'function');
console.log('getEPodRecords available:', typeof window.dataService?.getEPodRecords === 'function');

// Check global delivery arrays
console.log('activeDeliveries:', window.activeDeliveries);
console.log('deliveryHistory:', window.deliveryHistory);
```

## Data Structure

### EPOD Record Format:
```javascript
{
    drNumber: "DR-20231002-1234",
    customerName: "John Smith",
    customerContact: "09123456789",
    truckPlate: "ABC123",
    origin: "Makati City",
    destination: "Taguig City",
    signature: "data:image/png;base64,...", // Base64 encoded signature image
    status: "Completed",
    signedAt: "2023-10-02T10:30:00.000Z",
    timestamp: "2023-10-02T10:30:00.000Z"
}
```

## Common Error Messages and Solutions

### "dataService is undefined"
**Cause:** dataService not properly initialized or exposed to window object
**Solution:** Check that dataService.js is loaded and `window.dataService` is set

### "saveEPodRecord is not a function"
**Cause:** dataService methods not properly bound to window object
**Solution:** Verify that `saveEPodRecord` is exported from dataService.js

### "Failed to save E-POD record"
**Cause:** Error during saving process (network, database, etc.)
**Solution:** Check console for specific error details and implement proper error handling

## Best Practices

1. **Always provide fallbacks:** Use localStorage when dataService is unavailable
2. **Implement proper error handling:** Catch and handle errors gracefully
3. **Add comprehensive logging:** Log key operations for debugging
4. **Ensure proper timing:** Wait for async operations to complete before refreshing UI
5. **Test both online and offline scenarios:** Verify functionality works with and without Supabase