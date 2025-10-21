// Duplicate DR Number Handler
console.log('=== DUPLICATE DR HANDLER LOADED ===');

/**
 * Handle duplicate DR numbers in Excel data
 * Options:
 * 1. Group items under same DR (recommended)
 * 2. Create separate entries with unique identifiers
 * 3. Skip duplicates after first occurrence
 * 4. Merge duplicate data
 */

window.DRDuplicateHandler = {
    
    // Strategy options
    STRATEGIES: {
        GROUP_ITEMS: 'group_items',           // Group all items under one DR
        SEPARATE_ENTRIES: 'separate_entries', // Create separate entries with suffixes
        SKIP_DUPLICATES: 'skip_duplicates',   // Only keep first occurrence
        MERGE_DATA: 'merge_data'              // Merge data from duplicate rows
    },
    
    // Current strategy (can be configured)
    // Changed to separate_entries to preserve individual items with unique serial numbers
    currentStrategy: 'separate_entries',
    
    /**
     * Process DR data and handle duplicates
     */
    processDRData: function(rawData, strategy = null) {
        const useStrategy = strategy || this.currentStrategy;
        console.log(`🔄 Processing DR data with strategy: ${useStrategy}`);
        console.log(`📊 Raw data rows: ${rawData.length}`);
        
        switch (useStrategy) {
            case this.STRATEGIES.GROUP_ITEMS:
                return this.groupItemsByDR(rawData);
            case this.STRATEGIES.SEPARATE_ENTRIES:
                return this.createSeparateEntries(rawData);
            case this.STRATEGIES.SKIP_DUPLICATES:
                return this.skipDuplicates(rawData);
            case this.STRATEGIES.MERGE_DATA:
                return this.mergeData(rawData);
            default:
                console.warn('Unknown strategy, using GROUP_ITEMS');
                return this.groupItemsByDR(rawData);
        }
    },
    
    /**
     * Strategy 1: Group all items under the same DR number
     * This creates one delivery record with multiple items
     */
    groupItemsByDR: function(rawData) {
        console.log('📦 Grouping items by DR number...');
        
        const drGroups = {};
        const results = [];
        
        rawData.forEach((row, index) => {
            const drNumber = this.extractDRNumber(row);
            
            if (!drNumber) {
                console.warn(`⚠️ Row ${index + 1}: No DR number found, skipping`);
                return;
            }
            
            if (!drGroups[drNumber]) {
                // First occurrence - create the main delivery record
                drGroups[drNumber] = {
                    drNumber: drNumber,
                    customerName: this.extractCustomerName(row),
                    vendorNumber: this.extractVendorNumber(row),
                    origin: 'SMEG Alabang warehouse',
                    destination: this.extractDestination(row),
                    deliveryDate: new Date().toISOString().split('T')[0],
                    status: 'Active',
                    items: [],
                    // Store first row's basic item info as primary
                    itemNumber: this.extractItemNumber(row),
                    mobileNumber: this.extractMobileNumber(row),
                    itemDescription: this.extractItemDescription(row),
                    serialNumber: this.extractSerialNumber(row),
                    // Additional fields
                    truckType: '',
                    truckPlateNumber: '',
                    additionalCosts: 0,
                    createdBy: 'Excel Upload'
                };
                
                console.log(`✅ Created new DR group: ${drNumber}`);
            }
            
            // Add item to the group
            const item = {
                itemNumber: this.extractItemNumber(row),
                mobileNumber: this.extractMobileNumber(row),
                itemDescription: this.extractItemDescription(row),
                serialNumber: this.extractSerialNumber(row),
                rowIndex: index + 1
            };
            
            drGroups[drNumber].items.push(item);
            console.log(`📦 Added item to DR ${drNumber}:`, item);
        });
        
        // Convert groups to array and add item summary
        Object.values(drGroups).forEach(group => {
            // Create summary of all items
            const itemSummary = group.items.map(item => {
                const parts = [];
                if (item.itemNumber) parts.push(`#${item.itemNumber}`);
                if (item.itemDescription) parts.push(item.itemDescription);
                if (item.serialNumber) parts.push(`SN:${item.serialNumber}`);
                return parts.join(' - ') || 'Item';
            }).join('; ');
            
            // Update the main record with summary
            if (group.items.length > 1) {
                group.itemDescription = `Multiple Items: ${itemSummary}`;
                group.itemCount = group.items.length;
            }
            
            results.push(group);
        });
        
        console.log(`✅ Grouped ${rawData.length} rows into ${results.length} DR deliveries`);
        return results;
    },
    
    /**
     * Strategy 2: Create separate entries with unique identifiers
     */
    createSeparateEntries: function(rawData) {
        console.log('🔢 Creating separate entries for duplicate DRs...');
        
        const drCounts = {};
        const results = [];
        
        rawData.forEach((row, index) => {
            const originalDR = this.extractDRNumber(row);
            
            if (!originalDR) {
                console.warn(`⚠️ Row ${index + 1}: No DR number found, skipping`);
                return;
            }
            
            // Track occurrences
            drCounts[originalDR] = (drCounts[originalDR] || 0) + 1;
            
            // Create unique DR number for duplicates
            const drNumber = drCounts[originalDR] === 1 
                ? originalDR 
                : `${originalDR}-${drCounts[originalDR]}`;
            
            const booking = {
                drNumber: drNumber,
                originalDR: originalDR,
                customerName: this.extractCustomerName(row),
                vendorNumber: this.extractVendorNumber(row),
                origin: 'SMEG Alabang warehouse',
                destination: this.extractDestination(row),
                deliveryDate: new Date().toISOString().split('T')[0],
                status: 'Active',
                itemNumber: this.extractItemNumber(row),
                mobileNumber: this.extractMobileNumber(row),
                itemDescription: this.extractItemDescription(row),
                serialNumber: this.extractSerialNumber(row),
                truckType: '',
                truckPlateNumber: '',
                additionalCosts: 0,
                createdBy: 'Excel Upload',
                isDuplicate: drCounts[originalDR] > 1,
                duplicateIndex: drCounts[originalDR]
            };
            
            results.push(booking);
            console.log(`✅ Created entry: ${drNumber} (${drCounts[originalDR] > 1 ? 'duplicate' : 'original'})`);
        });
        
        console.log(`✅ Created ${results.length} separate entries from ${rawData.length} rows`);
        return results;
    },
    
    /**
     * Strategy 3: Skip duplicates, keep only first occurrence
     */
    skipDuplicates: function(rawData) {
        console.log('⏭️ Skipping duplicate DRs, keeping first occurrence...');
        
        const seenDRs = new Set();
        const results = [];
        let skippedCount = 0;
        
        rawData.forEach((row, index) => {
            const drNumber = this.extractDRNumber(row);
            
            if (!drNumber) {
                console.warn(`⚠️ Row ${index + 1}: No DR number found, skipping`);
                return;
            }
            
            if (seenDRs.has(drNumber)) {
                console.log(`⏭️ Skipping duplicate DR: ${drNumber} (row ${index + 1})`);
                skippedCount++;
                return;
            }
            
            seenDRs.add(drNumber);
            
            const booking = {
                drNumber: drNumber,
                customerName: this.extractCustomerName(row),
                vendorNumber: this.extractVendorNumber(row),
                origin: 'SMEG Alabang warehouse',
                destination: this.extractDestination(row),
                deliveryDate: new Date().toISOString().split('T')[0],
                status: 'Active',
                itemNumber: this.extractItemNumber(row),
                mobileNumber: this.extractMobileNumber(row),
                itemDescription: this.extractItemDescription(row),
                serialNumber: this.extractSerialNumber(row),
                truckType: '',
                truckPlateNumber: '',
                additionalCosts: 0,
                createdBy: 'Excel Upload'
            };
            
            results.push(booking);
            console.log(`✅ Kept first occurrence: ${drNumber}`);
        });
        
        console.log(`✅ Kept ${results.length} unique DRs, skipped ${skippedCount} duplicates`);
        return results;
    },
    
    /**
     * Strategy 4: Merge data from duplicate rows
     */
    mergeData: function(rawData) {
        console.log('🔀 Merging data from duplicate DRs...');
        
        const drGroups = {};
        const results = [];
        
        rawData.forEach((row, index) => {
            const drNumber = this.extractDRNumber(row);
            
            if (!drNumber) {
                console.warn(`⚠️ Row ${index + 1}: No DR number found, skipping`);
                return;
            }
            
            if (!drGroups[drNumber]) {
                drGroups[drNumber] = {
                    drNumber: drNumber,
                    customerName: this.extractCustomerName(row),
                    vendorNumber: this.extractVendorNumber(row),
                    origin: 'SMEG Alabang warehouse',
                    destination: this.extractDestination(row),
                    deliveryDate: new Date().toISOString().split('T')[0],
                    status: 'Active',
                    itemNumbers: [],
                    mobileNumbers: [],
                    itemDescriptions: [],
                    serialNumbers: [],
                    truckType: '',
                    truckPlateNumber: '',
                    additionalCosts: 0,
                    createdBy: 'Excel Upload'
                };
            }
            
            // Merge item data
            const group = drGroups[drNumber];
            const itemNum = this.extractItemNumber(row);
            const mobile = this.extractMobileNumber(row);
            const desc = this.extractItemDescription(row);
            const serial = this.extractSerialNumber(row);
            
            if (itemNum && !group.itemNumbers.includes(itemNum)) group.itemNumbers.push(itemNum);
            if (mobile && !group.mobileNumbers.includes(mobile)) group.mobileNumbers.push(mobile);
            if (desc && !group.itemDescriptions.includes(desc)) group.itemDescriptions.push(desc);
            if (serial && !group.serialNumbers.includes(serial)) group.serialNumbers.push(serial);
        });
        
        // Convert merged data to final format
        Object.values(drGroups).forEach(group => {
            const booking = {
                drNumber: group.drNumber,
                customerName: group.customerName,
                vendorNumber: group.vendorNumber,
                origin: group.origin,
                destination: group.destination,
                deliveryDate: group.deliveryDate,
                status: group.status,
                itemNumber: group.itemNumbers.join(', '),
                mobileNumber: group.mobileNumbers.join(', '),
                itemDescription: group.itemDescriptions.join('; '),
                serialNumber: group.serialNumbers.join(', '),
                truckType: group.truckType,
                truckPlateNumber: group.truckPlateNumber,
                additionalCosts: group.additionalCosts,
                createdBy: group.createdBy,
                isMerged: group.itemNumbers.length > 1 || group.mobileNumbers.length > 1 || 
                          group.itemDescriptions.length > 1 || group.serialNumbers.length > 1
            };
            
            results.push(booking);
        });
        
        console.log(`✅ Merged ${rawData.length} rows into ${results.length} consolidated DRs`);
        return results;
    },
    
    // Data extraction helpers
    extractDRNumber: function(row) {
        if (Array.isArray(row)) {
            return row[3] !== undefined && row[3] !== null ? String(row[3]).trim() : '';
        }
        return row.drNumber || row.dr_number || row['DR Number'] || '';
    },
    
    extractCustomerName: function(row) {
        if (Array.isArray(row)) {
            return row[7] !== undefined && row[7] !== null ? String(row[7]).trim() : '';
        }
        return row.customerName || row.customer_name || row['Customer Name'] || '';
    },
    
    extractVendorNumber: function(row) {
        if (Array.isArray(row)) {
            return row[6] !== undefined && row[6] !== null ? String(row[6]).trim() : '';
        }
        return row.vendorNumber || row.vendor_number || row['Vendor Number'] || '';
    },
    
    extractDestination: function(row) {
        if (Array.isArray(row)) {
            return row[8] !== undefined && row[8] !== null ? String(row[8]).trim() : '';
        }
        return row.destination || row['Destination'] || '';
    },
    
    extractItemNumber: function(row) {
        if (Array.isArray(row)) {
            return row[9] !== undefined && row[9] !== null ? String(row[9]).trim() : '';
        }
        if (window.getEnhancedColumnValue) {
            return window.getEnhancedColumnValue(row, [
                'Item Number', 'Item number', 'item_number', 'Item #', 'Item#'
            ]);
        }
        return row.itemNumber || row.item_number || row['Item Number'] || '';
    },
    
    extractMobileNumber: function(row) {
        if (Array.isArray(row)) {
            return row[10] !== undefined && row[10] !== null ? String(row[10]).trim() : '';
        }
        if (window.getEnhancedColumnValue) {
            return window.getEnhancedColumnValue(row, [
                'Mobile#', 'Mobile Number', 'Mobile', 'mobile_number'
            ]);
        }
        return row.mobileNumber || row.mobile_number || row['Mobile Number'] || '';
    },
    
    extractItemDescription: function(row) {
        if (Array.isArray(row)) {
            return row[11] !== undefined && row[11] !== null ? String(row[11]).trim() : '';
        }
        if (window.getEnhancedColumnValue) {
            return window.getEnhancedColumnValue(row, [
                'Item Description', 'Item description', 'item_description', 'Description'
            ]);
        }
        return row.itemDescription || row.item_description || row['Item Description'] || '';
    },
    
    extractSerialNumber: function(row) {
        if (Array.isArray(row)) {
            return row[14] !== undefined && row[14] !== null ? String(row[14]).trim() : '';
        }
        if (window.getEnhancedColumnValue) {
            return window.getEnhancedColumnValue(row, [
                'Serial Number', 'Serial number', 'serial_number', 'Serial'
            ]);
        }
        return row.serialNumber || row.serial_number || row['Serial Number'] || '';
    },
    
    /**
     * Analyze duplicate patterns in data
     */
    analyzeDuplicates: function(rawData) {
        const analysis = {
            totalRows: rawData.length,
            uniqueDRs: new Set(),
            duplicates: {},
            duplicateCount: 0
        };
        
        rawData.forEach((row, index) => {
            const drNumber = this.extractDRNumber(row);
            if (drNumber) {
                if (analysis.uniqueDRs.has(drNumber)) {
                    if (!analysis.duplicates[drNumber]) {
                        analysis.duplicates[drNumber] = [];
                    }
                    analysis.duplicates[drNumber].push(index + 1);
                    analysis.duplicateCount++;
                } else {
                    analysis.uniqueDRs.add(drNumber);
                }
            }
        });
        
        analysis.uniqueCount = analysis.uniqueDRs.size;
        analysis.duplicateGroups = Object.keys(analysis.duplicates).length;
        
        console.log('📊 Duplicate Analysis:', analysis);
        return analysis;
    }
};

// Make available globally
window.processDRDuplicates = window.DRDuplicateHandler.processDRData.bind(window.DRDuplicateHandler);
window.analyzeDRDuplicates = window.DRDuplicateHandler.analyzeDuplicates.bind(window.DRDuplicateHandler);

console.log('✅ Duplicate DR Handler loaded successfully');