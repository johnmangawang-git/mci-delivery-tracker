/**
 * SUPABASE 400 (BAD REQUEST) ERROR FIX
 * Fixes schema field mismatches causing 400 errors on deliveries table
 * Ensures all Supabase calls use exact schema field names
 */

console.log('🔧 Loading Supabase 400 Error Fix...');

(function() {
    'use strict';
    
    /**
     * DELIVERIES TABLE SCHEMA (from supabase/schema.sql)
     * These are the ONLY fields that exist in the deliveries table
     */
    const DELIVERIES_SCHEMA_FIELDS = [
        'id',
        'dr_number',
        'customer_name',
        'vendor_number',
        'origin',
        'destination',
        'truck_type',
        'truck_plate_number',
        'status',
        'distance',
        'additional_costs', // DECIMAL field for total cost
        'created_date',
        'created_at',
        'updated_at',
        'created_by',
        'user_id'
    ];
    
    /**
     * FIELDS THAT DON'T EXIST IN DELIVERIES TABLE
     * These cause 400 errors and must be removed or handled separately
     */
    const INVALID_FIELDS = [
        'additional_cost_items', // This should go to separate table
        'reference_no',          // Not in schema
        'item_sequence',         // Not in schema
        'drNumber',              // camelCase version
        'customerName',          // camelCase version
        'vendorNumber',          // camelCase version
        'truckType',             // camelCase version
        'truckPlateNumber',      // camelCase version
        'deliveryDate'           // Different name
    ];
    
    /**
     * Validate and clean delivery data for Supabase
     */
    function validateDeliveryData(delivery) {
        console.log('🔍 Validating delivery data for Supabase:', delivery);
        
        if (!delivery) {
            throw new Error('Delivery