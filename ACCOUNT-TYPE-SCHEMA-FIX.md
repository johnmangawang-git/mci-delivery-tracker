# Account Type Schema Fix

## Date: 2025-11-13

## Problem
After fixing upsert issues, DR upload was working but throwing console errors:
```
❌ Error saving customer: {code: 'PGRST204', message: "Could not find the 'accountType' column of 'customers' in the schema cache"}
```

## Root Cause
Multiple JavaScript files were trying to save `accountType` and `account_type` fields to the customers table, but these columns don't exist in the Supabase schema.

## Files Fixed

### 1. dataService.js
Added sanitization to remove non-existent fields before saving:
```javascript
// Remove fields that don't exist in Supabase schema
delete customerData.accountType;
delete customerData.account_type;
```

### 2. customer-field-mapping-fix.js
Removed accountType fields from:
- `normalizeCustomerData()` function
- `enhancedAutoCreateCustomer()` function

### 3. direct-excel-customer-integration.js
Removed accountType fields from customer creation

### 4. customers.js
Removed account_type from:
- Auto-created customers (line ~301)
- Edit customer form (line ~396)
- Add customer form (line ~768)

### 5. dataValidator.js
Removed account_type validation since field doesn't exist in schema

## Changes Summary

**Before:**
```javascript
const customer = {
    name: 'John Doe',
    phone: '123456',
    accountType: 'Individual',
    account_type: 'Individual',  // ❌ Field doesn't exist in DB
    status: 'active'
};
```

**After:**
```javascript
const customer = {
    name: 'John Doe',
    phone: '123456',
    // accountType removed - not in Supabase schema
    status: 'active'
};
```

## Result
✅ Customer creation now works without schema errors
✅ DR upload completes successfully
✅ No more PGRST204 errors in console

## Testing
1. Upload DR file via Excel
2. Verify customers are created without errors
3. Check console - should be clean
4. Verify deliveries are saved correctly

## Notes
- If you need account type functionality in the future, you'll need to:
  1. Add the column to Supabase customers table
  2. Re-enable these fields in the code
- For now, the field is simply not stored (no impact on core functionality)
