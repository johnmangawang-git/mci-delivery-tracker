// Enhanced DR Preview with Improved Column Mapping
console.log('=== ENHANCED DR PREVIEW LOADED ===');

// Enhanced column mapping function
window.getEnhancedColumnValue = function(row, possibleNames, fallbackIndex = null) {
    // First try to find by column name (case-insensitive)
    for (const name of possibleNames) {
        // Check exact match
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
            return String(row[name]).trim();
        }
        
        // Check case-insensitive match
        const keys = Object.keys(row);
        const matchingKey = keys.find(key => 
            key.toLowerCase() === name.toLowerCase() ||
            key.toLowerCase().replace(/[^a-z0-9]/g, '') === name.toLowerCase().replace(/[^a-z0-9]/g, '')
        );
        
        if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null && row[matchingKey] !== '') {
            return String(row[matchingKey]).trim();
        }
    }
    
    // Fallback to column index if provided
    if (fallbackIndex !== null && row[fallbackIndex] !== undefined && row[fallbackIndex] !== null) {
        const value = String(row[fallbackIndex]).trim();
        return value !== '' ? value : '';
    }
    
    return '';
};

// Enhanced showInlinePreview function with improved column mapping
window.showEnhancedInlinePreview = function(data, filename) {
    console.log('📋 ENHANCED PREVIEW: Creating preview for', data.length, 'records');
    
    // Hide upload content and show preview
    const uploadContent = document.getElementById('drUploadContent');
    const previewContent = document.getElementById('drPreviewContent');
    
    if (uploadContent) {
        uploadContent.style.display = 'none';
        console.log('✅ ENHANCED PREVIEW: Upload content hidden');
    }
    
    if (previewContent) {
        previewContent.style.display = 'block';
        console.log('✅ ENHANCED PREVIEW: Preview content shown');
        
        // Populate preview table
        const previewTable = document.getElementById('drPreviewTableBody');
        if (previewTable) {
            console.log('📋 ENHANCED PREVIEW: Populating table...');
            previewTable.innerHTML = '';
            
            // Show first 10 rows as preview
            const previewData = data.slice(0, 10);
            
            previewData.forEach((row, index) => {
                const tr = document.createElement('tr');
                
                // Basic delivery information with enhanced mapping
                const drNumber = window.getEnhancedColumnValue(row, [
                    'DR Number', 'dr_number', 'DR_Number', 'drNumber', 'DR', 'dr',
                    'Delivery Receipt', 'Receipt Number', 'Document Number'
                ]);
                
                const customer = window.getEnhancedColumnValue(row, [
                    'Customer', 'customer_name', 'Customer Name', 'Client', 'client_name',
                    'Company', 'Customer Company', 'Consignee'
                ]);
                
                const vendorNumber = window.getEnhancedColumnValue(row, [
                    'Vendor', 'vendor_number', 'Vendor Number', 'Vendor#', 'VendorNumber'
                ]);
                
                const origin = window.getEnhancedColumnValue(row, [
                    'Origin', 'origin', 'From', 'Source', 'Pickup', 'Start',
                    'Origin Address', 'Pickup Location'
                ]);
                
                const destination = window.getEnhancedColumnValue(row, [
                    'Destination', 'destination', 'To', 'Delivery', 'End', 'Drop',
                    'Destination Address', 'Delivery Location', 'Drop Location'
                ]);
                
                // Enhanced mapping for new item-related fields
                const itemNumber = window.getEnhancedColumnValue(row, [
                    'Item Number', 'Item number', 'item_number', 'Item #', 'Item#',
                    'ItemNumber', 'Item_Number', 'ITEM_NUMBER', 'ItemNo', 'Item No'
                ], 9); // Fallback to Column J (index 9)
                
                const mobileNumber = window.getEnhancedColumnValue(row, [
                    'Mobile#', 'Mobile Number', 'Mobile', 'mobile_number', 'MobileNumber',
                    'Mobile_Number', 'MOBILE_NUMBER', 'Phone', 'Contact', 'Cell'
                ], 10); // Fallback to Column K (index 10)
                
                const itemDescription = window.getEnhancedColumnValue(row, [
                    'Item Description', 'Item description', 'item_description', 'Description',
                    'ItemDescription', 'Item_Description', 'ITEM_DESCRIPTION', 'Desc',
                    'Product Description', 'Product'
                ], 11); // Fallback to Column L (index 11)
                
                const serialNumber = window.getEnhancedColumnValue(row, [
                    'Serial Number', 'Serial number', 'serial_number', 'Serial',
                    'SerialNumber', 'Serial_Number', 'SERIAL_NUMBER', 'SN', 'S/N'
                ], 14); // Fallback to Column O (index 14)
                
                tr.innerHTML = `
                    <td>${drNumber}</td>
                    <td>${customer}</td>
                    <td>${vendorNumber}</td>
                    <td>${origin}</td>
                    <td>${destination}</td>
                    <td>${new Date().toLocaleDateString()}</td>
                    <td>Active</td>
                    <td>${itemNumber}</td>
                    <td>${mobileNumber}</td>
                    <td>${itemDescription}</td>
                    <td>${serialNumber}</td>
                `;
                previewTable.appendChild(tr);
                
                console.log(`✅ ENHANCED PREVIEW: Added row ${index + 1}:`, {
                    drNumber,
                    customer,
                    vendorNumber,
                    itemNumber,
                    mobileNumber,
                    itemDescription,
                    serialNumber
                });
            });
            
            console.log('✅ ENHANCED PREVIEW: Table populated with', previewData.length, 'rows');
            
            // Add enhanced summary info
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'alert alert-success mt-3';
            
            // Analyze available columns
            const availableColumns = Object.keys(data[0] || {});
            const detectedMappings = [];
            
            // Check what mappings were detected
            if (data.length > 0) {
                const sampleRow = data[0];
                
                // Check item number detection
                const itemNumValue = window.getEnhancedColumnValue(sampleRow, [
                    'Item Number', 'Item number', 'item_number', 'Item #', 'Item#'
                ], 9);
                if (itemNumValue !== '' && itemNumValue) detectedMappings.push('Item Number');
                
                // Check mobile number detection
                const mobileValue = window.getEnhancedColumnValue(sampleRow, [
                    'Mobile#', 'Mobile Number', 'Mobile', 'mobile_number'
                ], 10);
                if (mobileValue !== '' && mobileValue) detectedMappings.push('Mobile Number');
                
                // Check item description detection
                const descValue = window.getEnhancedColumnValue(sampleRow, [
                    'Item Description', 'Item description', 'item_description', 'Description'
                ], 11);
                if (descValue !== '' && descValue) detectedMappings.push('Item Description');
                
                // Check serial number detection
                const serialValue = window.getEnhancedColumnValue(sampleRow, [
                    'Serial Number', 'Serial number', 'serial_number', 'Serial'
                ], 14);
                if (serialValue !== '' && serialValue) detectedMappings.push('Serial Number');
            }
            
            summaryDiv.innerHTML = `
                <h6><i class="bi bi-check-circle"></i> File Processed Successfully!</h6>
                <strong>File:</strong> ${filename}<br>
                <strong>Total Records:</strong> ${data.length}<br>
                <strong>Preview:</strong> Showing first ${Math.min(10, data.length)} records<br>
                <strong>Detected Mappings:</strong> ${detectedMappings.length > 0 ? detectedMappings.join(', ') : 'Using column index fallback'}<br>
                <strong>Available Columns:</strong> ${availableColumns.join(', ')}
            `;
            
            // Insert summary before the table
            const tableContainer = previewTable.closest('.table-responsive');
            if (tableContainer && tableContainer.parentNode) {
                tableContainer.parentNode.insertBefore(summaryDiv, tableContainer);
            }
            
            console.log('✅ ENHANCED PREVIEW: Summary added with detected mappings:', detectedMappings);
        }
    }
    
    // Store the processed data for later use
    window.processedDRData = data;
    console.log('✅ ENHANCED PREVIEW: Data stored for processing');
};

// Replace the original showInlinePreview function
window.showInlinePreview = window.showEnhancedInlinePreview;

console.log('✅ Enhanced DR Preview functionality loaded successfully');