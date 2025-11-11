# Signature to History Fix

## Issue
When completing and signing a DR item from Active deliveries, it wasn't moving to the history view. The system should move the entire DR entry to history and save it there permanently.

## Root Cause
1. **Wrong method name**: The code was calling `window.dataService.updateDeliveryStatusInSupabase()` which doesn't exist. The correct method is `window.dataService.updateDeliveryStatus()`.

2. **Missing database update in multiple signatures**: When saving multiple signatures, the code was only calling a local UI update function `updateDeliveryStatus()` instead of updating the database.

3. **Cache not invalidated**: After updating the delivery status, the cache wasn't being invalidated, so the views were showing stale data.

4. **No propagation delay**: The views were being refreshed immediately without giving the database time to propagate the changes.

## Solution

### 1. Fixed Single Signature Flow (`saveSingleSignature`)
```javascript
// Step 1: Save EPOD record
await window.dataService.saveEPodRecord(ePodRecord);

// Step 2: Update delivery status to Completed
await window.dataService.updateDeliveryStatus(signatureInfo.drNumber, 'Completed');

// Step 3: Invalidate cache
window.dataService.invalidateCache('deliveries');

// Step 4: Show success and refresh views with delay
showToast('E-POD saved and status updated successfully!', 'success');
await new Promise(resolve => setTimeout(resolve, 300));
refreshDeliveryViews();
```

### 2. Fixed Multiple Signatures Flow (`saveMultipleSignatures`)
```javascript
// For each DR number, chain both EPOD save and status update
const savePromise = window.dataService.saveEPodRecord(ePodRecord)
    .then(() => {
        return window.dataService.updateDeliveryStatus(drNum, 'Completed');
    });
promises.push(savePromise);

// After all promises complete
Promise.all(promises).then(async (results) => {
    // Invalidate cache
    window.dataService.invalidateCache('deliveries');
    
    showToast(`Saved signatures for ${drNumbers.length} deliveries`, 'success');
    
    // Small delay for database propagation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Refresh views
    refreshDeliveryViews();
});
```

## How It Works Now

1. **User signs a DR** → Opens signature modal and provides signature
2. **Save EPOD** → Signature data is saved to `epod_records` table
3. **Update Status** → Delivery status is updated to "Completed" in `deliveries` table
4. **Invalidate Cache** → Cache is cleared to force fresh data load
5. **Propagation Delay** → 300ms delay ensures database changes propagate
6. **Refresh Views** → Both active and history views are refreshed from database
7. **History Query** → `loadDeliveryHistory()` queries for status `['Completed', 'Signed']`
8. **DR Appears in History** → The completed DR now appears in the history view

## Database Flow

```
deliveries table:
- dr_number: "DR-001"
- status: "Active" → "Completed"  ✅ Updated
- updated_at: timestamp

epod_records table:
- dr_number: "DR-001"
- signature_data: base64 image
- status: "Completed"
- signed_at: timestamp  ✅ Created
```

## Testing

1. Open Active Deliveries view
2. Click "Sign" on any DR
3. Provide signature and save
4. Verify:
   - DR disappears from Active Deliveries
   - DR appears in Delivery History
   - Status shows as "Completed"
   - Signature is saved in E-POD records

## Files Modified
- `public/assets/js/e-signature.js`
  - Fixed `saveSingleSignature()` to use correct method and add cache invalidation
  - Fixed `saveMultipleSignatures()` to update database status for each DR
  - Added 300ms propagation delay before refreshing views
