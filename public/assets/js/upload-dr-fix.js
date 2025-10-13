/**
 * COMPLETE FIX: Upload DR File Workflow
 * This ensures the entire upload process works on the live site
 */

console.log('🔧 Complete Upload DR File workflow fix loading...');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCompleteUploadWorkflow);
} else {
    initCompleteUploadWorkflow();
}

function initCompleteUploadWorkflow() {
    console.log('🔧 Initializing complete Upload DR File workflow...');
    
    // Fix the main Upload DR File button
    fixMainUploadButton();
    
    // Fix the Select Excel File button inside modal
    fixSelectFileButton();
    
    // Fix the file input handler
    fixFileInputHandler();
    
    // Fix other modal buttons
    fixModalButtons();
}

function fixMainUploadButton() {
    const uploadBtn = document.getElementById('uploadDrFileBtn');
    
    if (uploadBtn) {
        console.log('✅ Found main Upload DR File button');
        
        uploadBtn.onclick = function(e) {
            console.log('🚀 Main Upload DR File button clicked!');
            e.preventDefault();
            e.stopPropagation();
            
            try {
                const modalElement = document.getElementById('drUploadModal');
                if (modalElement) {
                    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                        const modal = new bootstrap.Modal(modalElement);
                        modal.show();
                        console.log('✅ Modal opened successfully');
                        
                        // Initialize modal content after it's shown
                        setTimeout(fixModalButtons, 500);
                    } else {
                        modalElement.style.display = 'block';
                        modalElement.classList.add('show');
                        document.body.classList.add('modal-open');
                        console.log('✅ Manual modal opened');
                        setTimeout(fixModalButtons, 500);
                    }
                } else {
                    console.error('❌ Modal element not found');
                    alert('Upload dialog not available. Please refresh the page.');
                }
            } catch (error) {
                console.error('❌ Error opening modal:', error);
                alert('Error opening upload dialog: ' + error.message);
            }
        };
        
        console.log('✅ Main upload button fixed');
    } else {
        console.error('❌ Main Upload DR File button not found!');
    }
}

function fixSelectFileButton() {
    const selectBtn = document.getElementById('selectDrFileBtn');
    const fileInput = document.getElementById('drFileInput');
    
    if (selectBtn) {
        console.log('✅ Found Select Excel File button');
        
        selectBtn.onclick = function(e) {
            console.log('🚀 Select Excel File button clicked!');
            e.preventDefault();
            e.stopPropagation();
            
            if (fileInput) {
                fileInput.click();
                console.log('✅ File input triggered');
            } else {
                console.error('❌ File input not found');
                // Create a temporary file input
                const tempInput = document.createElement('input');
                tempInput.type = 'file';
                tempInput.accept = '.xlsx,.xls';
                tempInput.onchange = function(e) {
                    if (e.target.files.length > 0) {
                        processSelectedFile(e.target.files[0]);
                    }
                };
                tempInput.click();
            }
        };
        
        console.log('✅ Select file button fixed');
    } else {
        console.warn('⚠️ Select Excel File button not found yet');
    }
}

function fixFileInputHandler() {
    const fileInput = document.getElementById('drFileInput');
    
    if (fileInput) {
        console.log('✅ Found file input');
        
        fileInput.onchange = function(e) {
            console.log('🚀 File selected!');
            
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                console.log('Selected file:', file.name, file.type, file.size);
                processSelectedFile(file);
            }
        };
        
        console.log('✅ File input handler fixed');
    } else {
        console.warn('⚠️ File input not found yet');
    }
}

function processSelectedFile(file) {
    console.log('🔄 Processing selected file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Show processing indicator
    const selectBtn = document.getElementById('selectDrFileBtn');
    if (selectBtn) {
        selectBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Processing...';
        selectBtn.disabled = true;
    }
    
    try {
        // Enhanced XLSX library check
        console.log('🔍 Checking XLSX library availability...');
        console.log('XLSX available:', typeof XLSX !== 'undefined');
        console.log('XLSX object:', XLSX);
        
        if (typeof XLSX === 'undefined') {
            console.error('❌ XLSX library not loaded');
            
            // Try to load XLSX library dynamically
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
            script.onload = function() {
                console.log('✅ XLSX library loaded dynamically');
                processSelectedFile(file); // Retry
            };
            script.onerror = function() {
                alert('Excel processing library failed to load. Please refresh the page and try again.');
                resetSelectButton();
            };
            document.head.appendChild(script);
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                console.log('📖 Reading Excel file... Buffer size:', e.target.result.byteLength);
                
                // Try multiple reading methods
                let workbook;
                let jsonData;
                
                try {
                    // Method 1: ArrayBuffer
                    const data = new Uint8Array(e.target.result);
                    workbook = XLSX.read(data, { type: 'array' });
                    console.log('✅ Method 1 (ArrayBuffer) successful');
                } catch (error1) {
                    console.warn('⚠️ Method 1 failed:', error1.message);
                    
                    try {
                        // Method 2: Binary string
                        workbook = XLSX.read(e.target.result, { type: 'binary' });
                        console.log('✅ Method 2 (Binary) successful');
                    } catch (error2) {
                        console.warn('⚠️ Method 2 failed:', error2.message);
                        
                        try {
                            // Method 3: Base64
                            const base64 = btoa(String.fromCharCode(...new Uint8Array(e.target.result)));
                            workbook = XLSX.read(base64, { type: 'base64' });
                            console.log('✅ Method 3 (Base64) successful');
                        } catch (error3) {
                            throw new Error('All reading methods failed: ' + error3.message);
                        }
                    }
                }
                
                console.log('📊 Workbook info:', {
                    sheetNames: workbook.SheetNames,
                    sheetCount: workbook.SheetNames.length
                });
                
                if (workbook.SheetNames.length === 0) {
                    throw new Error('No sheets found in the Excel file');
                }
                
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                console.log('📋 Processing sheet:', firstSheetName);
                console.log('📋 Worksheet range:', worksheet['!ref']);
                
                // Try different JSON conversion options
                try {
                    jsonData = XLSX.utils.sheet_to_json(worksheet);
                    console.log('✅ Standard JSON conversion successful');
                } catch (jsonError) {
                    console.warn('⚠️ Standard conversion failed, trying with headers:', jsonError.message);
                    jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    // Convert array format to object format
                    if (jsonData.length > 1) {
                        const headers = jsonData[0];
                        const rows = jsonData.slice(1);
                        jsonData = rows.map(row => {
                            const obj = {};
                            headers.forEach((header, index) => {
                                obj[header] = row[index];
                            });
                            return obj;
                        });
                    }
                    console.log('✅ Header-based conversion successful');
                }
                
                console.log('📊 Processed data:', {
                    rows: jsonData.length,
                    firstRow: jsonData[0],
                    columns: jsonData.length > 0 ? Object.keys(jsonData[0]) : []
                });
                
                if (jsonData.length === 0) {
                    alert('No data found in the Excel file. Please check that the file contains data and try again.');
                    resetSelectButton();
                    return;
                }
                
                // Show success and process data
                console.log('✅ Excel file processed successfully:', jsonData.length, 'rows');
                showDataPreview(jsonData);
                
            } catch (error) {
                console.error('❌ Error processing Excel file:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    fileSize: file.size,
                    fileType: file.type
                });
                alert('Error processing Excel file: ' + error.message + '\n\nPlease check that the file is a valid Excel file (.xlsx or .xls) and try again.');
                resetSelectButton();
            }
        };
        
        reader.onerror = function(error) {
            console.error('❌ Error reading file:', error);
            alert('Error reading file. Please try again.');
            resetSelectButton();
        };
        
        // Read as ArrayBuffer for better compatibility
        console.log('📖 Starting file read...');
        reader.readAsArrayBuffer(file);
        
    } catch (error) {
        console.error('❌ Error in processSelectedFile:', error);
        alert('Error processing file: ' + error.message);
        resetSelectButton();
    }
}

function resetSelectButton() {
    const selectBtn = document.getElementById('selectDrFileBtn');
    if (selectBtn) {
        selectBtn.innerHTML = '<i class="bi bi-file-earmark-plus"></i> Select Excel File';
        selectBtn.disabled = false;
    }
}

function showDataPreview(data) {
    console.log('👁️ Showing data preview for', data.length, 'records...');
    console.log('📊 Sample data:', data[0]);
    console.log('📊 Available columns:', data.length > 0 ? Object.keys(data[0]) : []);
    
    // EMERGENCY DEBUG: Show raw data in alert
    if (data.length === 0) {
        alert('DEBUG: No data found in Excel file. The file might be empty or in an unsupported format.');
        return;
    }
    
    // Show first row data for debugging
    const firstRow = data[0];
    const debugInfo = `
DEBUG INFO:
- Total rows: ${data.length}
- First row keys: ${Object.keys(firstRow).join(', ')}
- First row values: ${Object.values(firstRow).join(', ')}
- Sample data: ${JSON.stringify(firstRow, null, 2)}
    `;
    console.log(debugInfo);
    
    // Show debug alert
    if (confirm('DEBUG: Data was read successfully. Click OK to see debug info, Cancel to continue.')) {
        alert(debugInfo);
    }
    
    // Hide upload content and show preview
    const uploadContent = document.getElementById('drUploadContent');
    const previewContent = document.getElementById('drPreviewContent');
    
    if (uploadContent) {
        uploadContent.style.display = 'none';
        console.log('✅ Upload content hidden');
    }
    if (previewContent) {
        previewContent.style.display = 'block';
        console.log('✅ Preview content shown');
    }
    
    // Populate preview table
    const previewTable = document.getElementById('drPreviewTable');
    console.log('🔍 Preview table element:', previewTable);
    
    if (previewTable) {
        console.log('📋 Populating preview table...');
        previewTable.innerHTML = '';
        
        // Add a test row first
        const testRow = document.createElement('tr');
        testRow.innerHTML = '<td colspan="5" style="background: yellow; color: black;">TEST: If you see this, the table is working</td>';
        previewTable.appendChild(testRow);
        console.log('✅ Test row added');
        
        // Show first 5 rows as preview
        const previewData = data.slice(0, 5);
        
        // Try different column name variations
        const getColumnValue = (row, possibleNames) => {
            for (const name of possibleNames) {
                if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
                    return row[name];
                }
            }
            return 'N/A';
        };
        
        previewData.forEach((row, index) => {
            console.log(`📋 Processing preview row ${index}:`, row);
            
            const tr = document.createElement('tr');
            
            const drNumber = getColumnValue(row, [
                'DR Number', 'dr_number', 'DR_Number', 'drNumber', 'DR', 'dr',
                'Delivery Receipt', 'Receipt Number', 'Document Number'
            ]);
            
            const customer = getColumnValue(row, [
                'Customer', 'customer_name', 'Customer Name', 'Client', 'client_name',
                'Company', 'Customer Company', 'Consignee'
            ]);
            
            const origin = getColumnValue(row, [
                'Origin', 'origin', 'From', 'Source', 'Pickup', 'Start',
                'Origin Address', 'Pickup Location'
            ]);
            
            const destination = getColumnValue(row, [
                'Destination', 'destination', 'To', 'Delivery', 'End', 'Drop',
                'Destination Address', 'Delivery Location', 'Drop Location'
            ]);
            
            tr.innerHTML = `
                <td>${drNumber}</td>
                <td>${customer}</td>
                <td>${origin}</td>
                <td>${destination}</td>
                <td>Active</td>
            `;
            previewTable.appendChild(tr);
            
            console.log(`✅ Added preview row: DR=${drNumber}, Customer=${customer}`);
        });
        
        console.log('✅ Preview table populated with', previewData.length, 'rows');
        
        // Show data summary
        const totalRows = data.length;
        const validRows = data.filter(row => {
            const hasData = Object.values(row).some(value => 
                value !== undefined && value !== null && value !== ''
            );
            return hasData;
        }).length;
        
        console.log(`📊 Data summary: ${totalRows} total rows, ${validRows} valid rows`);
        
        // Add summary info to the preview
        const summaryElement = document.createElement('div');
        summaryElement.className = 'alert alert-info mt-3';
        summaryElement.innerHTML = `
            <strong>Data Summary:</strong><br>
            • Total rows: ${totalRows}<br>
            • Valid rows: ${validRows}<br>
            • Available columns: ${Object.keys(data[0] || {}).join(', ')}
        `;
        
        const previewContainer = previewTable.parentElement;
        if (previewContainer) {
            // Remove existing summary
            const existingSummary = previewContainer.querySelector('.alert-info');
            if (existingSummary) existingSummary.remove();
            
            previewContainer.appendChild(summaryElement);
        }
        
    } else {
        console.error('❌ Preview table element not found');
    }
    
    // Store data for confirmation
    window.pendingDRData = data;
    console.log('💾 Data stored for confirmation:', data.length, 'records');
    
    // Fix confirm button
    fixConfirmButton();
    
    // Reset the select button
    resetSelectButton();
}

function fixConfirmButton() {
    const confirmBtn = document.getElementById('confirmDrUploadBtn');
    
    if (confirmBtn) {
        console.log('✅ Found confirm upload button');
        
        confirmBtn.onclick = function(e) {
            console.log('🚀 Confirm upload button clicked!');
            e.preventDefault();
            e.stopPropagation();
            
            if (window.pendingDRData) {
                processUploadData(window.pendingDRData);
            } else {
                alert('No data to upload. Please select a file first.');
            }
        };
        
        console.log('✅ Confirm button fixed');
    }
}

function processUploadData(data) {
    console.log('⚡ Processing upload data:', data.length, 'records');
    
    try {
        // Convert data to delivery format
        const deliveries = data.map((row, index) => {
            return {
                id: 'DEL-' + Date.now() + '-' + index,
                dr_number: row['DR Number'] || row['dr_number'] || 'DR-' + Date.now() + '-' + index,
                customer_name: row['Customer'] || row['customer_name'] || 'Unknown Customer',
                vendor_number: row['Vendor'] || row['vendor_number'] || '',
                origin: row['Origin'] || row['origin'] || '',
                destination: row['Destination'] || row['destination'] || '',
                truck_type: row['Truck Type'] || row['truck_type'] || '',
                truck_plate_number: row['Truck Plate'] || row['truck_plate'] || '',
                status: 'Active',
                created_date: new Date().toLocaleDateString(),
                created_by: 'Excel Upload',
                created_at: new Date().toISOString()
            };
        });
        
        console.log('✅ Data converted to delivery format');
        
        // Save to Supabase or localStorage
        saveDeliveries(deliveries);
        
    } catch (error) {
        console.error('❌ Error processing upload data:', error);
        alert('Error processing data: ' + error.message);
    }
}

async function saveDeliveries(deliveries) {
    console.log('💾 Saving deliveries:', deliveries.length);
    
    try {
        let savedCount = 0;
        
        for (const delivery of deliveries) {
            try {
                if (window.dataService) {
                    await window.dataService.saveDelivery(delivery);
                    console.log('✅ Saved to Supabase:', delivery.dr_number);
                } else {
                    // Fallback to localStorage
                    window.activeDeliveries = window.activeDeliveries || [];
                    window.activeDeliveries.push(delivery);
                    localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                    console.log('✅ Saved to localStorage:', delivery.dr_number);
                }
                savedCount++;
            } catch (error) {
                console.error('❌ Error saving delivery:', delivery.dr_number, error);
            }
        }
        
        console.log(`🎉 Upload complete: ${savedCount}/${deliveries.length} deliveries saved`);
        
        // Close modal and show success
        const modal = document.getElementById('drUploadModal');
        if (modal) {
            if (typeof bootstrap !== 'undefined') {
                bootstrap.Modal.getInstance(modal)?.hide();
            } else {
                modal.style.display = 'none';
                modal.classList.remove('show');
                document.body.classList.remove('modal-open');
            }
        }
        
        alert(`Successfully uploaded ${savedCount} deliveries!`);
        
        // Refresh the page to show new data
        if (typeof window.loadActiveDeliveries === 'function') {
            window.loadActiveDeliveries();
        }
        
    } catch (error) {
        console.error('❌ Error saving deliveries:', error);
        alert('Error saving deliveries: ' + error.message);
    }
}

function fixModalButtons() {
    console.log('🔧 Fixing all modal buttons...');
    
    // Fix all buttons with a delay to ensure modal is fully loaded
    setTimeout(() => {
        fixSelectFileButton();
        fixFileInputHandler();
        
        // Fix back button
        const backBtn = document.getElementById('backToDrUploadBtn');
        if (backBtn) {
            backBtn.onclick = function() {
                const uploadContent = document.getElementById('drUploadContent');
                const previewContent = document.getElementById('drPreviewContent');
                if (uploadContent) uploadContent.style.display = 'block';
                if (previewContent) previewContent.style.display = 'none';
            };
        }
        
        console.log('✅ All modal buttons fixed');
    }, 100);
}

// Initialize with retries
setTimeout(initCompleteUploadWorkflow, 1000);
setTimeout(initCompleteUploadWorkflow, 3000);
setTimeout(initCompleteUploadWorkflow, 5000);
// EMERGE
NCY TEST FUNCTION - Call this from console to test preview
window.testPreview = function() {
    console.log('🧪 Testing preview with sample data...');
    
    const sampleData = [
        {
            'DR Number': 'DR-001',
            'Customer': 'Test Customer 1',
            'Origin': 'Manila',
            'Destination': 'Cebu'
        },
        {
            'DR Number': 'DR-002', 
            'Customer': 'Test Customer 2',
            'Origin': 'Quezon City',
            'Destination': 'Davao'
        }
    ];
    
    showDataPreview(sampleData);
};

// Auto-run test after 3 seconds
setTimeout(() => {
    console.log('🧪 Auto-test available. Type "testPreview()" in console to test preview functionality.');
}, 3000);