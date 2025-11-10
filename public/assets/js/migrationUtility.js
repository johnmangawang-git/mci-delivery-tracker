/**
 * MigrationUtility - Handles data migration from localStorage to Supabase
 * 
 * This utility provides functions to:
 * - Export localStorage data to JSON file
 * - Import data to Supabase with error handling
 * - Verify data integrity after migration
 * - Clear localStorage after successful migration
 */

class MigrationUtility {
    constructor(dataService) {
        this.dataService = dataService;
        this.migrationLog = [];
    }

    /**
     * Export all localStorage data to a JSON file
     * @returns {Object} Exported data object
     */
    exportLocalStorageData() {
        try {
            console.log('Starting localStorage data export...');
            
            const data = {
                activeDeliveries: this._parseLocalStorageItem('mci-active-deliveries', []),
                deliveryHistory: this._parseLocalStorageItem('mci-delivery-history', []),
                customers: this._parseLocalStorageItem('mci-customers', []),
                epodRecords: this._parseLocalStorageItem('ePodRecords', []),
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            // Calculate statistics
            const stats = {
                totalDeliveries: data.activeDeliveries.length + data.deliveryHistory.length,
                activeDeliveries: data.activeDeliveries.length,
                deliveryHistory: data.deliveryHistory.length,
                customers: data.customers.length,
                epodRecords: data.epodRecords.length
            };

            console.log('Export statistics:', stats);
            this._logMigration('export', 'success', 'Data exported successfully', stats);

            // Download as JSON file
            this._downloadAsJSON(data, `localStorage-backup-${Date.now()}.json`);

            return { data, stats };
        } catch (error) {
            console.error('Error exporting localStorage data:', error);
            this._logMigration('export', 'error', error.message);
            throw new Error(`Failed to export localStorage data: ${error.message}`);
        }
    }

    /**
     * Parse localStorage item with error handling
     * @private
     */
    _parseLocalStorageItem(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Failed to parse localStorage item "${key}":`, error);
            return defaultValue;
        }
    }

    /**
     * Download data as JSON file
     * @private
     */
    _downloadAsJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Import data to Supabase with comprehensive error handling
     * @param {Object} data - Data object to import
     * @param {Function} progressCallback - Optional callback for progress updates
     * @returns {Object} Import results with success/failure counts
     */
    async importToSupabase(data, progressCallback = null) {
        console.log('Starting Supabase import...');
        
        const results = {
            deliveries: { success: 0, failed: 0, errors: [] },
            customers: { success: 0, failed: 0, errors: [] },
            epodRecords: { success: 0, failed: 0, errors: [] },
            startTime: new Date().toISOString()
        };

        try {
            // Ensure dataService is initialized
            if (!this.dataService || !this.dataService.isInitialized) {
                throw new Error('DataService not initialized');
            }

            // Import customers first (deliveries may reference them)
            if (data.customers && data.customers.length > 0) {
                console.log(`Importing ${data.customers.length} customers...`);
                await this._importCustomers(data.customers, results.customers, progressCallback);
            }

            // Import deliveries (combine active and history)
            const allDeliveries = [
                ...(data.activeDeliveries || []),
                ...(data.deliveryHistory || [])
            ];
            
            if (allDeliveries.length > 0) {
                console.log(`Importing ${allDeliveries.length} deliveries...`);
                await this._importDeliveries(allDeliveries, results.deliveries, progressCallback);
            }

            // Import EPOD records
            if (data.epodRecords && data.epodRecords.length > 0) {
                console.log(`Importing ${data.epodRecords.length} EPOD records...`);
                await this._importEPodRecords(data.epodRecords, results.epodRecords, progressCallback);
            }

            results.endTime = new Date().toISOString();
            results.totalSuccess = results.deliveries.success + results.customers.success + results.epodRecords.success;
            results.totalFailed = results.deliveries.failed + results.customers.failed + results.epodRecords.failed;

            console.log('Import completed:', results);
            this._logMigration('import', 'success', 'Data imported to Supabase', results);

            return results;
        } catch (error) {
            console.error('Error during Supabase import:', error);
            this._logMigration('import', 'error', error.message);
            throw new Error(`Failed to import data to Supabase: ${error.message}`);
        }
    }

    /**
     * Import customers with error handling
     * @private
     */
    async _importCustomers(customers, results, progressCallback) {
        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            try {
                // Validate customer data
                if (!customer.name || !customer.phone) {
                    throw new Error('Missing required fields: name or phone');
                }

                await this.dataService.saveCustomer(customer);
                results.success++;
                
                if (progressCallback) {
                    progressCallback('customers', i + 1, customers.length, customer.name);
                }
            } catch (error) {
                console.error(`Failed to import customer "${customer.name || customer.id}":`, error);
                results.failed++;
                results.errors.push({
                    item: customer.id || customer.name,
                    error: error.message
                });
            }
        }
    }

    /**
     * Import deliveries with error handling
     * @private
     */
    async _importDeliveries(deliveries, results, progressCallback) {
        // Remove duplicates based on dr_number
        const uniqueDeliveries = this._removeDuplicateDeliveries(deliveries);
        console.log(`Processing ${uniqueDeliveries.length} unique deliveries (${deliveries.length - uniqueDeliveries.length} duplicates removed)`);

        for (let i = 0; i < uniqueDeliveries.length; i++) {
            const delivery = uniqueDeliveries[i];
            try {
                // Validate delivery data
                if (!delivery.dr_number) {
                    throw new Error('Missing required field: dr_number');
                }

                await this.dataService.saveDelivery(delivery);
                results.success++;
                
                if (progressCallback) {
                    progressCallback('deliveries', i + 1, uniqueDeliveries.length, delivery.dr_number);
                }
            } catch (error) {
                console.error(`Failed to import delivery "${delivery.dr_number}":`, error);
                results.failed++;
                results.errors.push({
                    item: delivery.dr_number,
                    error: error.message
                });
            }
        }
    }

    /**
     * Import EPOD records with error handling
     * @private
     */
    async _importEPodRecords(epodRecords, results, progressCallback) {
        for (let i = 0; i < epodRecords.length; i++) {
            const epod = epodRecords[i];
            try {
                // Validate EPOD data
                if (!epod.dr_number) {
                    throw new Error('Missing required field: dr_number');
                }

                await this.dataService.saveEPodRecord(epod);
                results.success++;
                
                if (progressCallback) {
                    progressCallback('epodRecords', i + 1, epodRecords.length, epod.dr_number);
                }
            } catch (error) {
                console.error(`Failed to import EPOD record "${epod.dr_number}":`, error);
                results.failed++;
                results.errors.push({
                    item: epod.dr_number,
                    error: error.message
                });
            }
        }
    }

    /**
     * Remove duplicate deliveries based on dr_number
     * @private
     */
    _removeDuplicateDeliveries(deliveries) {
        const seen = new Map();
        const unique = [];

        for (const delivery of deliveries) {
            if (!delivery.dr_number) continue;
            
            if (!seen.has(delivery.dr_number)) {
                seen.set(delivery.dr_number, true);
                unique.push(delivery);
            }
        }

        return unique;
    }

    /**
     * Verify data integrity after migration
     * @param {Object} exportedData - Original exported data
     * @returns {Object} Verification results
     */
    async verifyDataIntegrity(exportedData) {
        console.log('Starting data integrity verification...');
        
        const verification = {
            deliveries: { expected: 0, actual: 0, match: false },
            customers: { expected: 0, actual: 0, match: false },
            epodRecords: { expected: 0, actual: 0, match: false },
            overallSuccess: false
        };

        try {
            // Count expected records (remove duplicates for deliveries)
            const uniqueDeliveries = this._removeDuplicateDeliveries([
                ...(exportedData.activeDeliveries || []),
                ...(exportedData.deliveryHistory || [])
            ]);
            verification.deliveries.expected = uniqueDeliveries.length;
            verification.customers.expected = (exportedData.customers || []).length;
            verification.epodRecords.expected = (exportedData.epodRecords || []).length;

            // Query Supabase for actual counts
            const deliveries = await this.dataService.getDeliveries({});
            verification.deliveries.actual = deliveries.length;

            const customers = await this.dataService.getCustomers();
            verification.customers.actual = customers.length;

            const epodRecords = await this.dataService.getEPodRecords();
            verification.epodRecords.actual = epodRecords.length;

            // Check if counts match (allow for some failures during import)
            verification.deliveries.match = verification.deliveries.actual >= verification.deliveries.expected * 0.95;
            verification.customers.match = verification.customers.actual >= verification.customers.expected * 0.95;
            verification.epodRecords.match = verification.epodRecords.actual >= verification.epodRecords.expected * 0.95;

            verification.overallSuccess = 
                verification.deliveries.match && 
                verification.customers.match && 
                verification.epodRecords.match;

            console.log('Verification results:', verification);
            this._logMigration('verify', verification.overallSuccess ? 'success' : 'warning', 
                'Data integrity verification completed', verification);

            return verification;
        } catch (error) {
            console.error('Error during data verification:', error);
            this._logMigration('verify', 'error', error.message);
            throw new Error(`Failed to verify data integrity: ${error.message}`);
        }
    }

    /**
     * Clear localStorage after successful migration
     * @param {boolean} force - Force clear even without verification
     */
    clearLocalStorage(force = false) {
        if (!force) {
            const confirmation = confirm(
                'Are you sure you want to clear localStorage? ' +
                'This action cannot be undone. Make sure you have verified the migration first.'
            );
            if (!confirmation) {
                console.log('localStorage clear cancelled by user');
                return false;
            }
        }

        try {
            const keysToRemove = [
                'mci-active-deliveries',
                'mci-delivery-history',
                'mci-customers',
                'ePodRecords'
            ];

            console.log('Clearing localStorage keys:', keysToRemove);
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`Removed: ${key}`);
            });

            this._logMigration('clear', 'success', 'localStorage cleared successfully');
            console.log('localStorage cleared successfully');
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            this._logMigration('clear', 'error', error.message);
            throw new Error(`Failed to clear localStorage: ${error.message}`);
        }
    }

    /**
     * Log migration activity
     * @private
     */
    _logMigration(action, status, message, data = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            status,
            message,
            data
        };
        this.migrationLog.push(logEntry);
    }

    /**
     * Get migration log
     * @returns {Array} Migration log entries
     */
    getMigrationLog() {
        return this.migrationLog;
    }

    /**
     * Download migration log as JSON file
     */
    downloadMigrationLog() {
        this._downloadAsJSON(this.migrationLog, `migration-log-${Date.now()}.json`);
    }

    /**
     * Complete migration workflow with all steps
     * @param {Function} progressCallback - Optional callback for progress updates
     * @returns {Object} Complete migration results
     */
    async performCompleteMigration(progressCallback = null) {
        console.log('=== Starting Complete Migration Workflow ===');
        
        const migrationResults = {
            export: null,
            import: null,
            verification: null,
            cleared: false,
            success: false
        };

        try {
            // Step 1: Export localStorage data
            if (progressCallback) progressCallback('export', 0, 4, 'Exporting localStorage data...');
            migrationResults.export = this.exportLocalStorageData();
            console.log('✓ Export completed');

            // Step 2: Import to Supabase
            if (progressCallback) progressCallback('import', 1, 4, 'Importing to Supabase...');
            migrationResults.import = await this.importToSupabase(
                migrationResults.export.data,
                progressCallback
            );
            console.log('✓ Import completed');

            // Step 3: Verify data integrity
            if (progressCallback) progressCallback('verify', 2, 4, 'Verifying data integrity...');
            migrationResults.verification = await this.verifyDataIntegrity(
                migrationResults.export.data
            );
            console.log('✓ Verification completed');

            // Step 4: Clear localStorage (only if verification passed)
            if (migrationResults.verification.overallSuccess) {
                if (progressCallback) progressCallback('clear', 3, 4, 'Clearing localStorage...');
                migrationResults.cleared = this.clearLocalStorage(true);
                console.log('✓ localStorage cleared');
                migrationResults.success = true;
            } else {
                console.warn('⚠ Verification failed - localStorage NOT cleared');
                migrationResults.success = false;
            }

            console.log('=== Migration Workflow Completed ===');
            console.log('Results:', migrationResults);

            return migrationResults;
        } catch (error) {
            console.error('Migration workflow failed:', error);
            migrationResults.success = false;
            migrationResults.error = error.message;
            throw error;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MigrationUtility;
}
