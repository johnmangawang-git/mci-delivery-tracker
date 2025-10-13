# DR File Upload Guide

## 📋 **Feature Overview**
The "Upload DR File" button allows you to bulk import delivery requests from Excel files directly into the booking system.

## 📁 **Excel File Format Requirements**

### **Column Mapping:**
| Excel Column | Data Field | Description | Required |
|--------------|------------|-------------|----------|
| **Column D** | DR Number | Delivery Request Number | ✅ Yes |
| **Column G** | Vendor Number | Vendor Identification Number | ❌ Optional |
| **Column H** | Customer Name | Customer Full Name | ✅ Yes |
| **Column I** | Destination Area | Delivery Destination | ✅ Yes |

### **Fixed Values:**
- **Origin Warehouse:** Automatically set to "SMEG Alabang warehouse"
- **Delivery Date:** Defaults to current date
- **Status:** Set to "Pending"

## 🔄 **Processing Flow**

1. **File Upload:** Click "Upload DR File" button
2. **Data Extraction:** System reads Excel file and maps columns
3. **Validation:** Checks for required fields (DR Number, Customer Name, Destination)
4. **Enhanced Preview:** Shows detailed preview with all DR items and configuration options
5. **Truck Reference:** Configure truck type (L300/Canter/3PL) and plate number for all DR items
6. **Additional Costs:** Add cost items with descriptions and amounts for analytics integration
7. **Preview Summary:** Review all configuration before confirmation
8. **Booking Creation:** Creates individual booking entries with enhanced data
9. **Analytics Integration:** Updates cost breakdown charts and additional costs analysis
10. **Storage:** Saves to active deliveries list

## ✅ **Sample Excel Structure**

```
| A | B | C | D (DR#) | E | F | G (Vendor#) | H (Customer) | I (Destination) |
|---|---|---|---------|---|---|-------------|--------------|-----------------|
|   |   |   | DR001   |   |   | VND001      | John Doe     | Makati City     |
|   |   |   | DR002   |   |   | VND002      | Jane Smith   | Quezon City     |
|   |   |   | DR003   |   |   | VND003      | Bob Johnson  | Pasig City      |
```

## 🚨 **Important Notes**

- **File Format:** Supports .xlsx and .xls files
- **Header Row:** First row is treated as header and skipped
- **Empty Rows:** Automatically skipped during processing
- **Error Handling:** Invalid rows are logged but don't stop processing
- **Bulk Processing:** All valid entries are processed in sequence

## 🧪 **Testing**

Use `test-dr-upload.html` to test the functionality:
1. Open the test file in browser
2. Upload a sample Excel file
3. Check console for processing logs
4. View results in the results panel

## 🔧 **Technical Details**

- **Library:** Uses SheetJS (XLSX) for Excel file parsing
- **Storage:** Data saved to localStorage and global arrays
- **Distance:** Distance calculation removed for simplified processing
- **Truck Reference:** Applied to all DR items in the upload batch
- **Additional Costs:** Integrated with analytics dashboard cost breakdown
- **Analytics Integration:** Real-time updates to cost analysis charts
- **UI Feedback:** Enhanced preview with configuration options and toast notifications

## 📝 **Error Handling**

Common issues and solutions:
- **Missing required fields:** Row skipped with warning
- **Invalid file format:** Error message displayed
- **Distance field:** No longer calculated or stored
- **File read error:** User notified with error toast

## 🎯 **Expected Results**

After successful upload:
- ✅ Bookings appear in active deliveries with truck reference details
- ✅ Success notification displayed with total additional costs
- ✅ Calendar updated with new bookings
- ✅ Data persisted in localStorage with enhanced details
- ✅ Analytics dashboard updated with cost breakdown data
- ✅ Additional costs integrated into "Additional Cost Breakdown" chart
- ✅ Cost amounts reflected in "Additional Costs Analysis" metrics
- ✅ Distance calculations removed for simplified processing

## 📊 **Analytics Integration**

The enhanced DR upload functionality integrates with the analytics dashboard:

### **Additional Cost Breakdown Chart**
- Cost descriptions from DR uploads appear as chart segments
- Multiple uploads with same cost descriptions are aggregated
- Real-time updates when new DR files are processed

### **Additional Costs Analysis**
- Total additional costs from DR uploads included in metrics
- Cost amounts contribute to overall additional costs calculations
- Historical data maintained for trend analysis

### **Data Storage**
- Cost breakdown data stored in `analytics-cost-breakdown` localStorage key
- Individual booking data includes `additionalCostBreakdown` array
- Truck reference data stored with each booking for reporting