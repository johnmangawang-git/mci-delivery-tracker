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
    console.log('🔄 Processing selected file:', file.name);
    
    try {
        // Check if XLSX library is available
        if (typeof XLSX === 'undefined') {
            console.error('❌ XLSX library not loaded');
            alert('Excel processing library not available. Please refresh the page and try again.');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                console.log('📖 Reading Excel file...');
                
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                console.log('✅ Excel file processed:', jsonData.length, 'rows');
                
                if (jsonData.length === 0) {
                    alert('No data found in the Excel file. Please check the file and try again.');
                    return;
                }
                
                // Process the data and show preview
                showDataPreview(jsonData);
                
            } catch (error) {
                console.error('❌ Error processing Excel file:', error);
                alert('Error processing Excel file: ' + error.message);
            }
        };
        
        reader.onerror = function(error) {
            console.error('❌ Error reading file:', error);
            alert('Error reading file. Please try again.');
        };
        
        reader.readAsArrayBuffer(file);
        
    } catch (error) {
        console.error('❌ Error in processSelectedFile:', error);
        alert('Error processing file: ' + error.message);
    }
}

function showDataPreview(data) {
    console.log('👁️ Showing data preview...');
    
    // Hide upload content and show preview
    const uploadContent = document.getElementById('drUploadContent');
    const previewContent = document.getElementById('drPreviewContent');
    
    if (uploadContent) uploadContent.style.display = 'none';
    if (previewContent) previewContent.style.display = 'block';
    
    // Populate preview table
    const previewTable = document.getElementById('drPreviewTable');
    if (previewTable) {
        previewTable.innerHTML = '';
        
        // Show first 5 rows as preview
        const previewData = data.slice(0, 5);
        
        previewData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row['DR Number'] || row['dr_number'] || 'N/A'}</td>
                <td>${row['Customer'] || row['customer_name'] || 'N/A'}</td>
                <td>${row['Origin'] || row['origin'] || 'N/A'}</td>
                <td>${row['Destination'] || row['destination'] || 'N/A'}</td>
                <td>Active</td>
            `;
            previewTable.appendChild(tr);
        });
        
        console.log('✅ Preview table populated');
    }
    
    // Store data for confirmation
    window.pendingDRData = data;
    
    // Fix confirm button
    fixConfirmButton();
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