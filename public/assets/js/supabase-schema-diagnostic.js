/**
 * SUPABASE SCHEMA DIAGNOSTIC
 * Helps identify missing tables/views and provides guidance for fixing schema issues
 */

console.log('🔧 Loading Supabase Schema Diagnostic...');

(function() {
    'use strict';
    
    /**
     * Check if required tables and views exist in Supabase
     */
    async function checkSupabaseSchema() {
        console.log('🔍 Checking Supabase schema...');
        
        const results = {
            timestamp: new Date().toISOString(),
            clientAvailable: false,
            tablesChecked: [],
            viewsChecked: [],
            missingTables: [],
            missingViews: [],
            recommendations: []
        };
        
        try {
            const client = window.supabaseClient && window.supabaseClient();
            results.clientAvailable = !!client;
            
            if (!client) {
                results.recommendations.push('Supabase client not available - check configuration');
                return results;
            }
            
            // Tables to check
            const requiredTables = [
                'deliveries',
                'customers', 
                'additional_cost_items',
                'epod_records',
                'user_profiles'
            ];
            
            // Views to check
            const requiredViews = [
                'cost_breakdown_analytics',
                'deliveries_with_cost_items'
            ];
            
            // Check tables
            for (const tableName of requiredTables) {
                try {
                    console.log(`🔍 Checking table: ${tableName}`);
                    const { data, error } = await client
                        .from(tableName)
                        .select('*')
                        .limit(1);
                    
                    if (error) {
                        console.warn(`❌ Table ${tableName} check failed:`, error.message);
                        results.missingTables.push({
                            name: tableName,
                            error: error.message,
                            code: error.code
                        });
                    } else {
                        console.log(`✅ Table ${tableName} exists`);
                        results.tablesChecked.push(tableName);
                    }
                } catch (tableError) {
                    console.error(`❌ Exception checking table ${tableName}:`, tableError);
                    results.missingTables.push({
                        name: tableName,
                        error: tableError.message,
                        code: 'EXCEPTION'
                    });
                }
            }
            
            // Check views
            for (const viewName of requiredViews) {
                try {
                    console.log(`🔍 Checking view: ${viewName}`);
                    const { data, error } = await client
                        .from(viewName)
                        .select('*')
                        .limit(1);
                    
                    if (error) {
                        console.warn(`❌ View ${viewName} check failed:`, error.message);
                        results.missingViews.push({
                            name: viewName,
                            error: error.message,
                            code: error.code
                        });
                    } else {
                        console.log(`✅ View ${viewName} exists`);
                        results.viewsChecked.push(viewName);
                    }
                } catch (viewError) {
                    console.error(`❌ Exception checking view ${viewName}:`, viewError);
                    results.missingViews.push({
                        name: viewName,
                        error: viewError.message,
                        code: 'EXCEPTION'
                    });
                }
            }
            
            // Generate recommendations
            if (results.missingTables.length > 0) {
                results.recommendations.push(`Missing ${results.missingTables.length} required tables`);
                
                if (results.missingTables.some(t => t.name === 'additional_cost_items')) {
                    results.recommendations.push('Apply schema-additional-costs.sql to create cost breakdown tables');
                }
                
                if (results.missingTables.some(t => t.name === 'deliveries')) {
                    results.recommendations.push('Apply main schema.sql to create core tables');
                }
            }
            
            if (results.missingViews.length > 0) {
                results.recommendations.push(`Missing ${results.missingViews.length} required views`);
                results.recommendations.push('Views are created by schema-additional-costs.sql');
            }
            
            if (results.missingTables.length === 0 && results.missingViews.length === 0) {
                results.recommendations.push('✅ All required tables and views are present');
            }
            
        } catch (error) {
            console.error('❌ Schema check failed:', error);
            results.recommendations.push(`Schema check failed: ${error.message}`);
        }
        
        return results;
    }
    
    /**
     * Display schema diagnostic results
     */
    function displaySchemaResults(results) {
        console.log('📋 SUPABASE SCHEMA DIAGNOSTIC RESULTS');
        console.log('='.repeat(50));
        console.log('Timestamp:', results.timestamp);
        console.log('Client Available:', results.clientAvailable);
        console.log('Tables Found:', results.tablesChecked.join(', ') || 'None');
        console.log('Views Found:', results.viewsChecked.join(', ') || 'None');
        
        if (results.missingTables.length > 0) {
            console.log('\n❌ MISSING TABLES:');
            results.missingTables.forEach(table => {
                console.log(`  - ${table.name}: ${table.error} (${table.code})`);
            });
        }
        
        if (results.missingViews.length > 0) {
            console.log('\n❌ MISSING VIEWS:');
            results.missingViews.forEach(view => {
                console.log(`  - ${view.name}: ${view.error} (${view.code})`);
            });
        }
        
        if (results.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            results.recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. ${rec}`);
            });
        }
        
        // Show specific guidance for common issues
        if (results.missingViews.some(v => v.name === 'cost_breakdown_analytics')) {
            console.log('\n🔧 TO FIX ANALYTICS ERRORS:');
            console.log('  1. Open Supabase Dashboard > SQL Editor');
            console.log('  2. Copy content from supabase/schema-additional-costs.sql');
            console.log('  3. Paste and run the SQL');
            console.log('  4. Refresh your application');
        }
        
        return results;
    }
    
    /**
     * Run comprehensive schema diagnostic
     */
    async function runSchemadiagnostic() {
        console.log('🚀 Running Supabase Schema Diagnostic...');
        
        try {
            const results = await checkSupabaseSchema();
            displaySchemaResults(results);
            
            // Store results globally for debugging
            window.schemadiagnosticResults = results;
            
            return results;
        } catch (error) {
            console.error('❌ Schema diagnostic failed:', error);
            return null;
        }
    }
    
    /**
     * Auto-run diagnostic and provide user-friendly feedback
     */
    function initializeSchemadiagnostic() {
        console.log('🚀 Initializing Schema Diagnostic...');
        
        // Wait for Supabase client to be ready
        setTimeout(async () => {
            if (window.supabaseClient) {
                const results = await runSchemadiagnostic();
                
                // Show user-friendly message if there are issues
                if (results && (results.missingTables.length > 0 || results.missingViews.length > 0)) {
                    console.warn('⚠️ SCHEMA ISSUES DETECTED');
                    console.warn('Some Supabase tables/views are missing. Check console for details.');
                    console.warn('See apply-additional-costs-schema.md for setup instructions.');
                }
            } else {
                console.warn('⚠️ Supabase client not available for schema diagnostic');
            }
        }, 3000);
    }
    
    // Export functions to global scope
    window.checkSupabaseSchema = checkSupabaseSchema;
    window.runSchemadiagnostic = runSchemadiagnostic;
    window.displaySchemaResults = displaySchemaResults;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSchemadiagnostic);
    } else {
        initializeSchemadiagnostic();
    }
    
    console.log('✅ Supabase Schema Diagnostic loaded successfully');
    
})();

// Export for external access
window.supabaseSchemadiagnostic = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};