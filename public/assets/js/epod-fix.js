// EPOD Fix - Ensures proper initialization and saving of EPOD records
console.log('EPOD Fix script loaded');

// Function to ensure dataService is ready
function ensureDataServiceReady() {
    return new Promise((resolve) => {
        console.log('Checking if dataService is ready...');
        
        // If dataService is already available and initialized
        if (typeof window.dataService !== 'undefined' && window.dataService.initialized) {
            console.log('dataService is already ready');
            resolve(window.dataService);
            return;
        }
        
        // If dataService exists but not initialized, try to initialize it
        if (typeof window.dataService !== 'undefined') {
            console.log('dataService exists but may not be initialized, attempting to initialize...');
            window.dataService.init().then(() => {
                console.log('dataService initialized successfully');
                resolve(window.dataService);
            }).catch((error) => {
                console.error('Error initializing dataService:', error);
                resolve(window.dataService); // Still resolve with dataService for localStorage fallback
            });
            return;
        }
        
        // If no dataService, resolve with null
        console.log('No dataService available');
        resolve(null);
    });
}

// Enhanced saveEPodRecord function that ensures dataService is ready
async function saveEPodRecordFixed(record) {
    console.log('Attempting to save EPOD record:', record.drNumber);
    
    try {
        // Ensure dataService is ready
        const dataService = await ensureDataServiceReady();
        
        // Always save to localStorage first as backup
        try {
            let ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
            console.log('Current EPOD records in localStorage:', ePodRecords.length);
            
            // Check if record already exists
            const existingIndex = ePodRecords.findIndex(r => r.drNumber === record.drNumber);
            if (existingIndex >= 0) {
                ePodRecords[existingIndex] = record;
                console.log('Updated existing EPOD record in localStorage');
            } else {
                ePodRecords.push(record);
                console.log('Added new EPOD record to localStorage');
            }
            
            localStorage.setItem('ePodRecords', JSON.stringify(ePodRecords));
            console.log('EPOD records saved to localStorage. Total records now:', ePodRecords.length);
        } catch (storageError) {
            console.error('Error saving to localStorage:', storageError);
        }
        
        if (dataService && typeof dataService.saveEPodRecord === 'function') {
            console.log('Using dataService to save EPOD record');
            const result = await dataService.saveEPodRecord(record);
            console.log('EPOD record saved via dataService:', result.drNumber);
            return result;
        } else {
            console.log('dataService not available or saveEPodRecord function not found, using localStorage only');
            // Return the record we saved to localStorage
            return record;
        }
    } catch (error) {
        console.error('Error saving EPOD record:', error);
        // Even on error, return the record (should be in localStorage)
        return record;
    }
}

// Enhanced getEPodRecords function
async function getEPodRecordsFixed() {
    console.log('Attempting to get EPOD records');
    
    try {
        // Ensure dataService is ready
        const dataService = await ensureDataServiceReady();
        
        if (dataService && typeof dataService.getEPodRecords === 'function') {
            console.log('Using dataService to get EPOD records');
            const records = await dataService.getEPodRecords();
            console.log('EPOD records retrieved via dataService:', records.length);
            return records;
        } else {
            console.log('dataService not available, falling back to localStorage');
            // Fallback to localStorage
            const ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
            console.log('EPOD records retrieved from localStorage:', ePodRecords.length);
            return ePodRecords;
        }
    } catch (error) {
        console.error('Error getting EPOD records:', error);
        // Fallback to localStorage on error
        const ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
        console.log('EPOD records retrieved from localStorage (fallback):', ePodRecords.length);
        return ePodRecords;
    }
}

// Make functions globally available
window.saveEPodRecordFixed = saveEPodRecordFixed;
window.getEPodRecordsFixed = getEPodRecordsFixed;

console.log('EPOD Fix functions registered');