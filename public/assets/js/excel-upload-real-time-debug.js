/**
 * EXCEL UPLOAD REAL-TIME DEBUG
 * Real-time debugging of the Excel upload process to identify exactly where it's failing
 */

console.log('🔧 Loading Excel Upload Real-Time Debug...');

(function() {
    'use strict';
    
    let debugActive = false;
    let uploadSteps = [];
    
    /**
     * Log debug step
     */
    function logStep(step, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        const stepInfo = {
            timestamp,
            step,
            data
        };
        
        uploadSteps.push(stepInfo);
        console.log(`🔍 EXCEL DEBUG [${timestamp}] ${step}`, data || '');
        
        // Also log to a global array for external access
        if (!window.excelDebugSteps) {
            window.excelDebugSteps = [];
        }
        window.excelDebugSteps.push(stepInfo);
    }
    
    /**
     * Monitor Excel upload process
     */
    function monitorExcelUpload() {
        logStep('MONITORING STARTED', 'Monitoring Excel upload process...');
        
        // Monitor file input changes
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input, index) => {
            logStep('FILE_INPUT_FOUND', `File input ${index + 1} found: ${input.id || 'no-id'}`);
            
            input.addEventListener('change', function(e) {
                if (e.target.files && e.target.files.length > 0) {
                    const file = e.target.files[0];
                    logStep('FILE_SELECTED', `File selected: ${file.name} (${file.size} bytes)`);
                    
                    // Check if it's an Excel file
                    if (file.name.includes('.xlsx') || file.name.includes('.xls')) {
                        logStep('EXCEL_FILE_DETECTED', `Excel file detected: ${file.name}`);
                        
                        // Monitor for data processing
                        setTimeout(() => {
                            checkForProcessedData();
                        }, 2000);
                    }
                }
            });
        });
        
        // Monitor button clicks
        const uploadButtons = document.querySelectorAll('[id*="upload"], [id*="Upload"], [onclick*="upload"]');
        uploadButtons.forEach((button, index) => {
            logStep('UPLOAD_BUTTON_FOUND', `Upload button ${index + 1}: ${button.id || button.textContent.trim()}`);
            
            button.addEventListener('click', function(e) {
                logStep('UPLOAD_BUTTON_CLICKED', `Button clicked: ${button.id || button.textContent.trim()}`);
            });
        });
        
        // Monitor confirm buttons
        const confirmButtons = document.querySelectorAll('[id*="confirm"], [id*="Confirm"]');
        confirmButtons.forEach((button, index) => {
            logStep('CONFIRM_BUTTON_FOUND', `Confirm button ${index + 1}: ${button.id || button.textContent.trim()}`);
            
            button.addEventListener('click', function(e) {
                logStep('CONFIRM_BUTTON_CLICKED', `Confirm button clicked: ${button.id || button.textContent.trim()}`);
                
                // Check for pending data
                setTimeout(() => {
                    checkForProcessedData();
                    checkForCustomerCreation();
                }, 1000);
            });
        });
        
        // Monitor global variables
        setInterval(() => {
            if (debugActive) {
                checkGlobalVariables();
            }
        }, 3000);
    }
    
    /**
     * Check for processed Excel data
     */
    function checkForProcessedData() {
        logStep('CHECKING_PROCESSED_DATA', 'Checking for processed Excel data...');
        
        // Check various global variables that might contain Excel data
        const dataVariables = [
            'pendingDRBookings',
            'excelData',
            'uploadedData',
            'drData',
            'bookingData'
        ];
        
        dataVariables.forEach(varName => {
            if (window[varName]) {
                if (Array.isArray(window[varName])) {
                    logStep('DATA_FOUND', `${varName}: ${window[varName].length} items`);
                    
                    // Log sample data
                    if (window[varName].length > 0) {
                        const sample = window[varName][0];
                        logStep('SAMPLE_DATA', `Sample from ${varName}: ${JSON.stringify(sample, null, 2)}`);
                        
                        // Check for customer data in the sample
                        const customerFields = ['customerName', 'customer_name', 'Customer Name', 'vendorNumber', 'vendor_number'];
                        const foundCustomerFields = customerFields.filter(field => sample[field]);
                        
                        if (foundCustomerFields.length > 0) {
                            logStep('CUSTOMER_DATA_FOUND', `Customer fields found: ${foundCustomerFields.join(', ')}`);
                            
                            // Try to create customers from this data
                            tryCreateCustomersFromData(window[varName]);
                        } else {
                            logStep('NO_CUSTOMER_DATA', `No customer fields found in ${varName}`);
                        }
                    }
                } else {
                    logStep('DATA_FOUND', `${varName}: ${typeof window[varName]} - ${JSON.stringify(window[varName])}`);
                }
            }
        });
    }
    
    /**
     * Check global variables periodically
     */
    function checkGlobalVariables() {
        const vars = ['pendingDRBookings', 'activeDeliveries', 'customers'];
        vars.forEach(varName => {
            if (window[varName] && Array.isArray(window[varName])) {
                const currentLength = window[varName].length;
                const lastLength = window[`${varName}_lastLength`] || 0;
                
                if (currentLength !== lastLength) {
                    logStep('VARIABLE_CHANGED', `${varName} changed: ${lastLength} -> ${currentLength}`);
                    window[`${varName}_lastLength`] = currentLength;
                }
            }
        });
    }
    
    /**
     * Try to create customers from data
     */
    async function tryCreateCustomersFromData(data) {
        logStep('TRYING_CUSTOMER_CREATION', `Attempting to create customers from ${data.length} records`);
        
        try {
            // Extract unique customers
            const customers = new Map();
            
            data.forEach((record, index) => {
                const customerName = record.customerName || record.customer_name || record['Customer Name'] || '';
                const vendorNumber = record.vendorNumber || record.vendor_number || record.phone || '';
                const destination = record.destination || record.address || record.location || '';
                
                if (customerName && vendorNumber) {
                    const key = `${customerName}_${vendorNumber}`;
                    if (!customers.has(key)) {
                        customers.set(key, { customerName, vendorNumber, destination });
                        logStep('CUSTOMER_EXTRACTED', `Customer ${customers.size}: ${customerName} (${vendorNumber})`);
                    }
                }
            });
            
            logStep('CUSTOMERS_EXTRACTED', `Found ${customers.size} unique customers`);
            
            // Try to create each customer
            for (const [key, customerData] of customers) {
                try {
                    logStep('CREATING_CUSTOMER', `Creating: ${customerData.customerName}`);
                    
                    let success = false;
                    
                    // Try different creation methods
                    if (typeof window.enhancedAutoCreateCustomer === 'function') {
                        const result = await window.enhancedAutoCreateCustomer(
                            customerData.customerName,
                            customerData.vendorNumber,
                            customerData.destination
                        );
                        if (result) {
                            logStep('CUSTOMER_CREATED', `✅ Enhanced method: ${result.contactPerson || result.name}`);
                            success = true;
                        }
                    }
                    
                    if (!success && typeof window.autoCreateCustomer === 'function') {
                        const result = await window.autoCreateCustomer(
                            customerData.customerName,
                            customerData.vendorNumber,
                            customerData.destination
                        );
                        if (result) {
                            logStep('CUSTOMER_CREATED', `✅ Standard method: ${result.contactPerson || result.name}`);
                            success = true;
                        }
                    }
                    
                    if (!success) {
                        logStep('CUSTOMER_CREATION_FAILED', `❌ Failed to create: ${customerData.customerName}`);
                    }
                    
                } catch (error) {
                    logStep('CUSTOMER_CREATION_ERROR', `❌ Error creating ${customerData.customerName}: ${error.message}`);
                }
            }
            
            // Force refresh customers display
            if (typeof window.supabaseOnlyLoadCustomers === 'function') {
                logStep('REFRESHING_CUSTOMERS', 'Refreshing customer display...');
                await window.supabaseOnlyLoadCustomers();
                logStep('CUSTOMERS_REFRESHED', 'Customer display refreshed');
            }
            
        } catch (error) {
            logStep('CUSTOMER_CREATION_PROCESS_ERROR', `❌ Error in customer creation process: ${error.message}`);
        }
    }
    
    /**
     * Check for customer creation
     */
    function checkForCustomerCreation() {
        logStep('CHECKING_CUSTOMER_CREATION', 'Checking if customers were created...');
        
        // Check window.customers
        if (window.customers && Array.isArray(window.customers)) {
            logStep('WINDOW_CUSTOMERS', `window.customers: ${window.customers.length} items`);
        }
        
        // Check localStorage
        try {
            const localCustomers = localStorage.getItem('mci-customers');
            if (localCustomers) {
                const customers = JSON.parse(localCustomers);
                logStep('LOCALSTORAGE_CUSTOMERS', `localStorage customers: ${customers.length} items`);
            } else {
                logStep('LOCALSTORAGE_CUSTOMERS', 'No customers in localStorage');
            }
        } catch (error) {
            logStep('LOCALSTORAGE_ERROR', `Error reading localStorage: ${error.message}`);
        }
        
        // Check Supabase
        if (window.dataService && typeof window.dataService.getCustomers === 'function') {
            window.dataService.getCustomers().then(customers => {
                logStep('SUPABASE_CUSTOMERS', `Supabase customers: ${customers.length} items`);
            }).catch(error => {
                logStep('SUPABASE_ERROR', `Error reading Supabase: ${error.message}`);
            });
        }
    }
    
    /**
     * Start debug monitoring
     */
    function startDebugMonitoring() {
        debugActive = true;
        uploadSteps = [];
        logStep('DEBUG_STARTED', 'Real-time Excel upload debugging started');
        monitorExcelUpload();
    }
    
    /**
     * Stop debug monitoring
     */
    function stopDebugMonitoring() {
        debugActive = false;
        logStep('DEBUG_STOPPED', 'Real-time Excel upload debugging stopped');
    }
    
    /**
     * Get debug report
     */
    function getDebugReport() {
        return {
            steps: uploadSteps,
            totalSteps: uploadSteps.length,
            startTime: uploadSteps[0]?.timestamp,
            endTime: uploadSteps[uploadSteps.length - 1]?.timestamp
        };
    }
    
    // Add functions to window for external access
    window.startExcelDebugMonitoring = startDebugMonitoring;
    window.stopExcelDebugMonitoring = stopDebugMonitoring;
    window.getExcelDebugReport = getDebugReport;
    window.checkForProcessedData = checkForProcessedData;
    window.checkForCustomerCreation = checkForCustomerCreation;
    
    // Auto-start monitoring
    setTimeout(() => {
        startDebugMonitoring();
    }, 1000);
    
    console.log('✅ Excel Upload Real-Time Debug loaded successfully');
    
})();

// Export for external access
window.excelUploadRealTimeDebug = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};