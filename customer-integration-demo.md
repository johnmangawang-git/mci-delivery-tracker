# Customer Integration Demo

## How It Works

When you create a delivery booking, the system automatically handles customer management:

### Scenario 1: New Customer
1. **Fill booking form:**
   - Customer Name: "Maria Santos"
   - Customer Phone: "+63 917 123 4567"
   - Destination: "456 Quezon Avenue, QC"

2. **System automatically:**
   - Checks if "Maria Santos" or "+63 917 123 4567" exists
   - Creates new customer record:
     ```
     Contact Person: Maria Santos  
     Phone: +63 917 123 4567
     Address: 456 Quezon Avenue, QC
     Account Type: Individual
     Status: Active
     Bookings Count: 1
     ```

3. **Result:** Customer appears in "Customers" section immediately

### Scenario 2: Existing Customer
1. **Fill booking form:**
   - Customer Name: "Maria Santos" (same as before)
   - Customer Phone: "+63 917 123 4567"

2. **System automatically:**
   - Finds existing customer
   - Updates booking count: 1 → 2
   - Updates last delivery date

3. **Result:** No duplicate created, existing customer updated

## Key Features

✅ **Simple**: Only requires name and phone number  
✅ **No Duplicates**: Checks by name AND phone  
✅ **Auto-Updates**: Existing customers get updated counts  
✅ **Immediate**: Appears in Customers section right away  
✅ **No Company Field**: Just customer name and phone  

## Test Steps

1. Open the booking modal
2. Fill in customer details:
   - Name: "John Doe"
   - Phone: "+63 912 345 6789"
3. Complete the booking
4. Check the "Customers" section
5. You'll see "John Doe" listed as a customer

## Customer Data Structure

```javascript
{
  id: "CUST-XXX",
  contactPerson: "John Doe",      // Customer name from booking
  phone: "+63 912 345 6789",      // From booking form
  address: "Destination address", // From booking destination
  accountType: "Individual",      // Default for auto-created
  email: "",                      // Empty, can be filled later
  status: "active",
  notes: "Auto-created from delivery booking",
  bookingsCount: 1,               // Increments with each booking
  lastDelivery: "Dec 9, 2025"    // Updates with each booking
}
```

This integration makes customer management seamless - no extra steps needed!