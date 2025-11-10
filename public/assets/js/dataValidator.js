/**
 * DataValidator Class
 * 
 * Provides input validation for all data models before database operations.
 * Ensures data integrity and provides clear error messages for validation failures.
 * 
 * Requirements: 6.4, 6.5
 */

class DataValidator {
    /**
     * Validates a delivery object
     * @param {Object} delivery - The delivery object to validate
     * @returns {Object} - { isValid: boolean, errors: string[] }
     */
    static validateDelivery(delivery) {
        const errors = [];

        // Required field: DR Number
        if (!delivery.dr_number || typeof delivery.dr_number !== 'string' || delivery.dr_number.trim() === '') {
            errors.push('DR number is required and must be a non-empty string');
        }

        // Required field: Customer Name
        if (!delivery.customer_name || typeof delivery.customer_name !== 'string' || delivery.customer_name.trim() === '') {
            errors.push('Customer name is required and must be a non-empty string');
        }

        // Optional but validated fields
        if (delivery.vendor_number !== undefined && delivery.vendor_number !== null && delivery.vendor_number !== '') {
            if (typeof delivery.vendor_number !== 'string') {
                errors.push('Vendor number must be a string');
            }
        }

        if (delivery.origin !== undefined && delivery.origin !== null && delivery.origin !== '') {
            if (typeof delivery.origin !== 'string') {
                errors.push('Origin must be a string');
            }
        }

        if (delivery.destination !== undefined && delivery.destination !== null && delivery.destination !== '') {
            if (typeof delivery.destination !== 'string') {
                errors.push('Destination must be a string');
            }
        }

        if (delivery.truck_plate_number !== undefined && delivery.truck_plate_number !== null && delivery.truck_plate_number !== '') {
            if (typeof delivery.truck_plate_number !== 'string') {
                errors.push('Truck plate number must be a string');
            }
        }

        // Status validation
        const validStatuses = ['Active', 'In Transit', 'On Schedule', 'Sold Undelivered', 'Completed', 'Cancelled'];
        if (delivery.status !== undefined && delivery.status !== null) {
            if (!validStatuses.includes(delivery.status)) {
                errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
            }
        }

        // Date field validation
        if (delivery.booked_date !== undefined && delivery.booked_date !== null && delivery.booked_date !== '') {
            if (!this._isValidDate(delivery.booked_date)) {
                errors.push('Booked date must be a valid date');
            }
        }

        if (delivery.completed_date !== undefined && delivery.completed_date !== null && delivery.completed_date !== '') {
            if (!this._isValidDate(delivery.completed_date)) {
                errors.push('Completed date must be a valid date');
            }
        }

        if (delivery.completed_date_time !== undefined && delivery.completed_date_time !== null && delivery.completed_date_time !== '') {
            if (!this._isValidDate(delivery.completed_date_time)) {
                errors.push('Completed date time must be a valid date');
            }
        }

        if (delivery.signed_at !== undefined && delivery.signed_at !== null && delivery.signed_at !== '') {
            if (!this._isValidDate(delivery.signed_at)) {
                errors.push('Signed at must be a valid date');
            }
        }

        // Additional cost items validation (should be array or null)
        if (delivery.additional_cost_items !== undefined && delivery.additional_cost_items !== null) {
            if (!Array.isArray(delivery.additional_cost_items)) {
                errors.push('Additional cost items must be an array');
            } else {
                // Validate each cost item
                delivery.additional_cost_items.forEach((item, index) => {
                    if (!item.description || typeof item.description !== 'string') {
                        errors.push(`Additional cost item ${index + 1}: description is required`);
                    }
                    if (item.amount === undefined || item.amount === null || isNaN(parseFloat(item.amount))) {
                        errors.push(`Additional cost item ${index + 1}: amount must be a valid number`);
                    }
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validates a customer object
     * @param {Object} customer - The customer object to validate
     * @returns {Object} - { isValid: boolean, errors: string[] }
     */
    static validateCustomer(customer) {
        const errors = [];

        // Required field: Customer Name
        if (!customer.name || typeof customer.name !== 'string' || customer.name.trim() === '') {
            errors.push('Customer name is required and must be a non-empty string');
        }

        // Required field: Phone Number
        if (!customer.phone || typeof customer.phone !== 'string' || customer.phone.trim() === '') {
            errors.push('Phone number is required and must be a non-empty string');
        } else {
            // Basic phone number format validation (allows various formats)
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(customer.phone)) {
                errors.push('Phone number contains invalid characters');
            }
        }

        // Optional but validated fields
        if (customer.contact_person !== undefined && customer.contact_person !== null && customer.contact_person !== '') {
            if (typeof customer.contact_person !== 'string') {
                errors.push('Contact person must be a string');
            }
        }

        if (customer.email !== undefined && customer.email !== null && customer.email !== '') {
            if (typeof customer.email !== 'string') {
                errors.push('Email must be a string');
            } else {
                // Basic email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(customer.email)) {
                    errors.push('Email must be a valid email address');
                }
            }
        }

        if (customer.address !== undefined && customer.address !== null && customer.address !== '') {
            if (typeof customer.address !== 'string') {
                errors.push('Address must be a string');
            }
        }

        // Account type validation
        const validAccountTypes = ['Individual', 'Corporate', 'Government'];
        if (customer.account_type !== undefined && customer.account_type !== null) {
            if (!validAccountTypes.includes(customer.account_type)) {
                errors.push(`Account type must be one of: ${validAccountTypes.join(', ')}`);
            }
        }

        // Status validation
        const validStatuses = ['active', 'inactive', 'suspended'];
        if (customer.status !== undefined && customer.status !== null) {
            if (!validStatuses.includes(customer.status)) {
                errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
            }
        }

        if (customer.notes !== undefined && customer.notes !== null && customer.notes !== '') {
            if (typeof customer.notes !== 'string') {
                errors.push('Notes must be a string');
            }
        }

        // Numeric field validation
        if (customer.bookings_count !== undefined && customer.bookings_count !== null) {
            if (!Number.isInteger(customer.bookings_count) || customer.bookings_count < 0) {
                errors.push('Bookings count must be a non-negative integer');
            }
        }

        if (customer.last_delivery !== undefined && customer.last_delivery !== null && customer.last_delivery !== '') {
            if (typeof customer.last_delivery !== 'string') {
                errors.push('Last delivery must be a string');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validates an EPOD record object
     * @param {Object} epodRecord - The EPOD record object to validate
     * @returns {Object} - { isValid: boolean, errors: string[] }
     */
    static validateEPodRecord(epodRecord) {
        const errors = [];

        // Required field: DR Number
        if (!epodRecord.dr_number || typeof epodRecord.dr_number !== 'string' || epodRecord.dr_number.trim() === '') {
            errors.push('DR number is required and must be a non-empty string');
        }

        // Optional but validated fields
        if (epodRecord.customer_name !== undefined && epodRecord.customer_name !== null && epodRecord.customer_name !== '') {
            if (typeof epodRecord.customer_name !== 'string') {
                errors.push('Customer name must be a string');
            }
        }

        if (epodRecord.customer_contact !== undefined && epodRecord.customer_contact !== null && epodRecord.customer_contact !== '') {
            if (typeof epodRecord.customer_contact !== 'string') {
                errors.push('Customer contact must be a string');
            }
        }

        if (epodRecord.truck_plate !== undefined && epodRecord.truck_plate !== null && epodRecord.truck_plate !== '') {
            if (typeof epodRecord.truck_plate !== 'string') {
                errors.push('Truck plate must be a string');
            }
        }

        if (epodRecord.delivery_route !== undefined && epodRecord.delivery_route !== null && epodRecord.delivery_route !== '') {
            if (typeof epodRecord.delivery_route !== 'string') {
                errors.push('Delivery route must be a string');
            }
        }

        // Signature data validation (should be a base64 string or data URL)
        if (epodRecord.signature_data !== undefined && epodRecord.signature_data !== null && epodRecord.signature_data !== '') {
            if (typeof epodRecord.signature_data !== 'string') {
                errors.push('Signature data must be a string');
            } else {
                // Check if it's a valid data URL or base64 string
                const isDataUrl = epodRecord.signature_data.startsWith('data:image/');
                const isBase64 = /^[A-Za-z0-9+/=]+$/.test(epodRecord.signature_data);
                
                if (!isDataUrl && !isBase64) {
                    errors.push('Signature data must be a valid data URL or base64 string');
                }
            }
        }

        // Signed at validation
        if (epodRecord.signed_at !== undefined && epodRecord.signed_at !== null && epodRecord.signed_at !== '') {
            if (!this._isValidDate(epodRecord.signed_at)) {
                errors.push('Signed at must be a valid date');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Formats validation errors into a user-friendly message
     * @param {string[]} errors - Array of error messages
     * @returns {string} - Formatted error message
     */
    static formatErrors(errors) {
        if (!errors || errors.length === 0) {
            return '';
        }

        if (errors.length === 1) {
            return errors[0];
        }

        return 'Validation errors:\n• ' + errors.join('\n• ');
    }

    /**
     * Helper method to validate date values
     * @private
     * @param {*} date - The date value to validate
     * @returns {boolean} - True if valid date
     */
    static _isValidDate(date) {
        if (!date) return false;

        // If it's already a Date object
        if (date instanceof Date) {
            return !isNaN(date.getTime());
        }

        // If it's a string or number, try to parse it
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime());
    }

    /**
     * Validates multiple deliveries at once
     * @param {Array} deliveries - Array of delivery objects
     * @returns {Object} - { isValid: boolean, results: Array, summary: Object }
     */
    static validateDeliveries(deliveries) {
        if (!Array.isArray(deliveries)) {
            return {
                isValid: false,
                results: [],
                summary: { total: 0, valid: 0, invalid: 0 }
            };
        }

        const results = deliveries.map((delivery, index) => ({
            index,
            delivery,
            validation: this.validateDelivery(delivery)
        }));

        const valid = results.filter(r => r.validation.isValid).length;
        const invalid = results.filter(r => !r.validation.isValid).length;

        return {
            isValid: invalid === 0,
            results,
            summary: {
                total: deliveries.length,
                valid,
                invalid
            }
        };
    }

    /**
     * Validates multiple customers at once
     * @param {Array} customers - Array of customer objects
     * @returns {Object} - { isValid: boolean, results: Array, summary: Object }
     */
    static validateCustomers(customers) {
        if (!Array.isArray(customers)) {
            return {
                isValid: false,
                results: [],
                summary: { total: 0, valid: 0, invalid: 0 }
            };
        }

        const results = customers.map((customer, index) => ({
            index,
            customer,
            validation: this.validateCustomer(customer)
        }));

        const valid = results.filter(r => r.validation.isValid).length;
        const invalid = results.filter(r => !r.validation.isValid).length;

        return {
            isValid: invalid === 0,
            results,
            summary: {
                total: customers.length,
                valid,
                invalid
            }
        };
    }

    /**
     * Validates multiple EPOD records at once
     * @param {Array} epodRecords - Array of EPOD record objects
     * @returns {Object} - { isValid: boolean, results: Array, summary: Object }
     */
    static validateEPodRecords(epodRecords) {
        if (!Array.isArray(epodRecords)) {
            return {
                isValid: false,
                results: [],
                summary: { total: 0, valid: 0, invalid: 0 }
            };
        }

        const results = epodRecords.map((epodRecord, index) => ({
            index,
            epodRecord,
            validation: this.validateEPodRecord(epodRecord)
        }));

        const valid = results.filter(r => r.validation.isValid).length;
        const invalid = results.filter(r => !r.validation.isValid).length;

        return {
            isValid: invalid === 0,
            results,
            summary: {
                total: epodRecords.length,
                valid,
                invalid
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataValidator;
}
