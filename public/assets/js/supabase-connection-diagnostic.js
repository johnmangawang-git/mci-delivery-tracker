/**
 * SUPABASE CONNECTION DIAGNOSTIC
 * Comprehensive diagnostic tool to check Supabase connection and schema
 */

console.log('🔍 Loading Supabase Connection Diagnostic...');

/**
 * Test Supabase connection and schema
 */
async function runSupabaseConnectionDiagnostic() {
    console.log('🚀 Starting Supabase Connection Diagnostic...');
    
    const results = {
        libraryLoad: false,
        clientCreation: false,
        authentication: false,
        schemaAccess: false,
        tableAccess: {},
        errors: []
    };
    
    try {
        // Test 1: Check if Supabase library is loaded
        console.log('📋 Test 1: Checking Supabase library...');
        if (typeof window.supabase !== 'undefined') {
            console.log('✅ Supabase library loaded');
            console.log('📊 Available methods:', Object.keys(window.supabase));
            results.libraryLoad = true;
            
            // Check if it has createClient
            if (typeof window.supabase.createClient === 'function') {
                console.log('✅ createClient method available');
            } else {
                console.log('❌ createClient method NOT available');
                console.log('🔍 Checking alternative locations...');
                
                // Check global createClient
                if (typeof createClient !== 'undefined') {
                    console.log('✅ Found global createClient function');
                } else if (typeof window.createClient !== 'undefined') {
                    console.log('✅ Found window.createClient function');
                } else {
                    console.log('❌ No createClient function found anywhere');
                    results.errors.push('createClient function not available');
                }
            }
        } else {
            console.log('❌ Supabase library not loaded');
            results.errors.push('Supabase library not loaded');
        }
        
        // Test 2: Try to create client
        console.log('📋 Test 2: Creating Supabase client...');
        let client = null;
        
        const SUPABASE_URL = 'https://ntyvrezyhrmflswxefbk.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eXZyZXp5aHJtZmxzd3hlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjUzNTgsImV4cCI6MjA3MDY0MTM1OH0.JX0YP42_40lKQ1ghUmIA_Lu0YVZB_Ytl0EdQinU0Nm4';
        
        try {
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            } else if (typeof createClient !== 'undefined') {
                client = createClient(SUPABASE_URL, SUPABASE_KEY);
            } else if (typeof window.createClient !== 'undefined') {
                client = window.createClient(SUPABASE_URL, SUPABASE_KEY);
            }
            
            if (client) {
                console.log('✅ Client created successfully');
                console.log('📊 Client methods:', Object.keys(client));
                results.clientCreation = true;
                
                // Check if client has required methods
                const requiredMethods = ['from', 'auth', 'storage', 'functions'];
                requiredMethods.forEach(method => {
                    if (typeof client[method] !== 'undefined') {
                        console.log(`✅ ${method} method available`);
                    } else {
                        console.log(`❌ ${method} method NOT available`);
                        results.errors.push(`${method} method not available on client`);
                    }
                });
            } else {
                console.log('❌ Failed to create client');
                results.errors.push('Failed to create Supabase client');
            }
        } catch (clientError) {
            console.log('❌ Client creation error:', clientError);
            results.errors.push(`Client creation error: ${clientError.message}`);
        }
        
        // Test 3: Test authentication
        if (client && client.auth) {
            console.log('📋 Test 3: Testing authentication...');
            try {
                const { data: { session }, error } = await client.auth.getSession();
                if (error) {
                    console.log('⚠️ Auth session error:', error.message);
                } else {
                    console.log('✅ Auth system accessible');
                    results.authentication = true;
                }
            } catch (authError) {
                console.log('❌ Auth test error:', authError);
                results.errors.push(`Auth error: ${authError.message}`);
            }
        }
        
        // Test 4: Test schema access
        if (client && client.from) {
            console.log('📋 Test 4: Testing schema access...');
            
            const tablesToTest = ['deliveries', 'customers', 'epod_records', 'additional_cost_items'];
            
            for (const tableName of tablesToTest) {
                try {
                    console.log(`🔍 Testing table: ${tableName}`);
                    
                    // Test basic select with count
                    const { data, error, count } = await client
                        .from(tableName)
                        .select('*', { count: 'exact', head: true });
                    
                    if (error) {
                        console.log(`❌ ${tableName} error:`, error.message);
                        results.tableAccess[tableName] = { 
                            accessible: false, 
                            error: error.message,
                            code: error.code 
                        };
                        
                        // Check specific error types
                        if (error.code === '42P01') {
                            console.log(`📝 ${tableName} table does not exist`);
                        } else if (error.code === '42501') {
                            console.log(`🔒 ${tableName} access denied (permissions issue)`);
                        }
                    } else {
                        console.log(`✅ ${tableName} accessible (${count || 0} records)`);
                        results.tableAccess[tableName] = { 
                            accessible: true, 
                            count: count || 0 
                        };
                        results.schemaAccess = true;
                    }
                } catch (tableError) {
                    console.log(`❌ ${tableName} test error:`, tableError);
                    results.tableAccess[tableName] = { 
                        accessible: false, 
                        error: tableError.message 
                    };
                }
            }
        }
        
        // Test 5: Test specific query that's failing
        if (client && client.from) {
            console.log('📋 Test 5: Testing specific failing query...');
            try {
                const { data, error } = await client
                    .from('deliveries')
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log('❌ Deliveries query error:', error);
                    results.errors.push(`Deliveries query error: ${error.message}`);
                } else {
                    console.log('✅ Deliveries query successful');
                    console.log('📊 Sample data:', data);
                }
            } catch (queryError) {
                console.log('❌ Query test error:', queryError);
                results.errors.push(`Query test error: ${queryError.message}`);
            }
        }
        
    } catch (overallError) {
        console.log('💥 Overall diagnostic error:', overallError);
        results.errors.push(`Overall error: ${overallError.message}`);
    }
    
    // Summary
    console.log('📊 DIAGNOSTIC SUMMARY:');
    console.log('='.repeat(50));
    console.log('Library Load:', results.libraryLoad ? '✅' : '❌');
    console.log('Client Creation:', results.clientCreation ? '✅' : '❌');
    console.log('Authentication:', results.authentication ? '✅' : '❌');
    console.log('Schema Access:', results.schemaAccess ? '✅' : '❌');
    console.log('Table Access:');
    Object.entries(results.tableAccess).forEach(([table, result]) => {
        console.log(`  ${table}: ${result.accessible ? '✅' : '❌'} ${result.error || ''}`);
    });
    
    if (results.errors.length > 0) {
        console.log('❌ ERRORS FOUND:');
        results.errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
        });
    }
    
    return results;
}

/**
 * Check Supabase project status
 */
async function checkSupabaseProjectStatus() {
    console.log('🔍 Checking Supabase project status...');
    
    const SUPABASE_URL = 'https://ntyvrezyhrmflswxefbk.supabase.co';
    
    try {
        // Test basic connectivity
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'GET',
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eXZyZXp5aHJtZmxzd3hlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjUzNTgsImV4cCI6MjA3MDY0MTM1OH0.JX0YP42_40lKQ1ghUmIA_Lu0YVZB_Ytl0EdQinU0Nm4',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eXZyZXp5aHJtZmxzd3hlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjUzNTgsImV4cCI6MjA3MDY0MTM1OH0.JX0YP42_40lKQ1ghUmIA_Lu0YVZB_Ytl0EdQinU0Nm4'
            }
        });
        
        console.log('📡 Project connectivity:', response.status);
        
        if (response.ok) {
            console.log('✅ Supabase project is accessible');
            const data = await response.text();
            console.log('📊 Response:', data.substring(0, 200) + '...');
        } else {
            console.log('❌ Supabase project connectivity issue:', response.statusText);
        }
        
    } catch (connectError) {
        console.log('❌ Project connectivity error:', connectError);
    }
}

/**
 * Initialize diagnostic
 */
async function initializeSupabaseDiagnostic() {
    console.log('🚀 Initializing Supabase Connection Diagnostic...');
    
    // Wait a bit for other scripts to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        await checkSupabaseProjectStatus();
        const results = await runSupabaseConnectionDiagnostic();
        
        // Store results globally for inspection
        window.supabaseDiagnosticResults = results;
        
        console.log('✅ Diagnostic complete. Results stored in window.supabaseDiagnosticResults');
        
    } catch (error) {
        console.error('❌ Diagnostic initialization failed:', error);
    }
}

// Export functions
window.runSupabaseConnectionDiagnostic = runSupabaseConnectionDiagnostic;
window.checkSupabaseProjectStatus = checkSupabaseProjectStatus;

// Auto-run diagnostic
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabaseDiagnostic);
} else {
    initializeSupabaseDiagnostic();
}

console.log('✅ Supabase Connection Diagnostic loaded');