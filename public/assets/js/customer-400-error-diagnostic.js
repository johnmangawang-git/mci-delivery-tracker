/**
 * CUSTOMER 400 ERROR DIAGNOSTIC
 * Helps identify the exact cause of 400 errors when fetching customers
 * Provides detailed logging and error analysis
 */

console.log('🔧 Loading Customer 400 Error Diagnostic...');

(function() {
    'use strict';
    
    /**
     * Detailed Supabase connection and query diagnostic
     */
    async function diagnoseSupabaseConnection() {
        console.log('🔍 Starting Supabase connection diagnostic...');
        
        const diagnosticResults = {
            timestamp: new Date().toISOString(),
            clientAvailable: false,
            configurationValid: false,
            connectionTest: false,
            authStatus: null,
            customerTableAccess: false,
            errorDetails: []
        };
        
        try {
            // Check if Supabase client is available
            const client = window.supabaseClient && window.supabaseClient();
            diagnosticResults.clientAvailable = !!client;
            console.log('📊 Supabase client available:', diagnosticResults.clientAvailable);
            
            if (!client) {
                diagnosticResults.errorDetails.push('Supabase client not available');
                return diagnosticResults;
            }
            
            // Check configuration
            const hasUrl = !!window.SUPABASE_URL;
            const hasKey = !!window.SUPABASE_ANON_KEY;
            diagnosticResults.configurationValid = hasUrl && hasKey;
            console.log('📊 Configuration valid:', diagnosticResults.configurationValid, { hasUrl, hasKey });
            
            if (!diagnosticResults.configurationValid) {
                diagnosticResults.errorDetails.push('Supabase configuration missing');
                return diagnosticResults;
            }
            
            // Test basic connection
            try {
                console.log('🔗 Testing basic connection...');
                const { data: connectionTest, error: connectionError } = await client
                    .from('customers')
                    .select('count', { count: 'exact', head: true });
                
                if (connectionError) {
                    console.error('❌ Connection test error:', connectionError);
                    diagnosticResults.errorDetails.push(`Connection error: ${connectionError.message}`);
                } else {
                    diagnosticResults.connectionTest = true;
                    console.log('✅ Basic connection test passed');
                }
            } catch (connError) {
                console.error('❌ Connection test exception:', connError);
                diagnosticResults.errorDetails.push(`Connection exception: ${connError.message}`);
            }
            
            // Check auth status
            try {
                console.log('🔐 Checking auth status...');
                const { data: { user }, error: authError } = await client.auth.getUser();
                
                if (authError) {
                    console.warn('⚠️ Auth check error:', authError);
                    diagnosticResults.authStatus = 'error';
                    diagnosticResults.errorDetails.push(`Auth error: ${authError.message}`);
                } else if (user) {
                    diagnosticResults.authStatus = 'authenticated';
                    console.log('✅ User authenticated:', user.email);
                } else {
                    diagnosticResults.authStatus = 'anonymous';
                    console.log('📊 User not authenticated (anonymous access)');
                }
            } catch (authError) {
                console.error('❌ Auth check exception:', authError);
                diagnosticResults.authStatus = 'exception';
                diagnosticResults.errorDetails.push(`Auth exception: ${authError.message}`);
            }
            
            // Test customer table access with detailed error logging
            try {
                console.log('📋 Testing customer table access...');
                console.log('📤 Sending request to:', `${window.SUPABASE_URL}/rest/v1/customers?select=*`);
                
                const { data: customers, error: tableError } = await client
                    .from('customers')
                    .select('*')
                    .limit(1);
                
                if (tableError) {
                    console.error('❌ Customer table access error:', {
                        message: tableError.message,
                        code: tableError.code,
                        details: tableError.details,
                        hint: tableError.hint,
                        status: tableError.status
                    });
                    diagnosticResults.errorDetails.push(`Table access error: ${tableError.message} (Code: ${tableError.code})`);
                    
                    // Analyze specific error codes
                    if (tableError.code === '42P01') {
                        diagnosticResults.errorDetails.push('Table does not exist - check if customers table is created');
                    } else if (tableError.code === '42501') {
                        diagnosticResults.errorDetails.push('Permission denied - check RLS policies');
                    } else if (tableError.status === 400) {
                        diagnosticResults.errorDetails.push('Bad request - likely field/schema mismatch');
                    }
                } else {
                    diagnosticResults.customerTableAccess = true;
                    console.log('✅ Customer table access successful:', customers?.length || 0, 'records');
                }
            } catch (tableError) {
                console.error('❌ Customer table access exception:', tableError);
                diagnosticResults.errorDetails.push(`Table access exception: ${tableError.message}`);
            }
            
        } catch (error) {
            console.error('❌ Diagnostic error:', error);
            diagnosticResults.errorDetails.push(`Diagnostic error: ${error.message}`);
        }
        
        console.log('📊 Diagnostic results:', diagnosticResults);
        return diagnosticResults;
    }
    
    /**
     * Test different query variations to identify the problematic field
     */
    async function testQueryVariations() {
        console.log('🧪 Testing query variations...');
        
        const client = window.supabaseClient && window.supabaseClient();
        if (!client) {
            console.error('❌ No Supabase client available for query tests');
            return;
        }
        
        const testQueries = [
            { name: 'Basic select all', query: () => client.from('customers').select('*') },
            { name: 'Select specific fields', query: () => client.from('customers').select('id, name, email, phone') },
            { name: 'Select with limit', query: () => client.from('customers').select('*').limit(1) },
            { name: 'Count only', query: () => client.from('customers').select('*', { count: 'exact', head: true }) },
            { name: 'Select name only', query: () => client.from('customers').select('name') },
            { name: 'Select with order', query: () => client.from('customers').select('*').order('created_at', { ascending: false }) }
        ];
        
        for (const test of testQueries) {
            try {
                console.log(`🧪 Testing: ${test.name}`);
                const { data, error } = await test.query();
                
                if (error) {
                    console.error(`❌ ${test.name} failed:`, error);
                } else {
                    console.log(`✅ ${test.name} succeeded:`, data?.length || 0, 'records');
                }
            } catch (exception) {
                console.error(`❌ ${test.name} exception:`, exception);
            }
        }
    }
    
    /**
     * Analyze the current customer data structure
     */
    function analyzeCustomerDataStructure() {
        console.log('📊 Analyzing customer data structure...');
        
        // Check localStorage customers
        const localCustomers = localStorage.getItem('mci-customers');
        if (localCustomers) {
            try {
                const parsed = JSON.parse(localCustomers);
                if (parsed && parsed.length > 0) {
                    console.log('📊 LocalStorage customer structure:', Object.keys(parsed[0]));
                    console.log('📊 Sample localStorage customer:', parsed[0]);
                }
            } catch (error) {
                console.error('❌ Error parsing localStorage customers:', error);
            }
        }
        
        // Check global customers array
        if (window.customers && window.customers.length > 0) {
            console.log('📊 Global customers array structure:', Object.keys(window.customers[0]));
            console.log('📊 Sample global customer:', window.customers[0]);
        }
    }
    
    /**
     * Run comprehensive diagnostic
     */
    async function runComprehensiveDiagnostic() {
        console.log('🚀 Running comprehensive customer 400 error diagnostic...');
        
        // Analyze data structures
        analyzeCustomerDataStructure();
        
        // Test Supabase connection
        const diagnosticResults = await diagnoseSupabaseConnection();
        
        // Test query variations if connection works
        if (diagnosticResults.connectionTest) {
            await testQueryVariations();
        }
        
        // Summary
        console.log('📋 DIAGNOSTIC SUMMARY:');
        console.log('='.repeat(50));
        console.log('Client Available:', diagnosticResults.clientAvailable);
        console.log('Configuration Valid:', diagnosticResults.configurationValid);
        console.log('Connection Test:', diagnosticResults.connectionTest);
        console.log('Auth Status:', diagnosticResults.authStatus);
        console.log('Customer Table Access:', diagnosticResults.customerTableAccess);
        
        if (diagnosticResults.errorDetails.length > 0) {
            console.log('Errors Found:');
            diagnosticResults.errorDetails.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        if (!diagnosticResults.clientAvailable) {
            console.log('- Check if Supabase client is properly initialized');
        }
        if (!diagnosticResults.configurationValid) {
            console.log('- Verify SUPABASE_URL and SUPABASE_ANON_KEY are set');
        }
        if (!diagnosticResults.connectionTest) {
            console.log('- Check network connectivity and Supabase service status');
        }
        if (diagnosticResults.authStatus === 'error') {
            console.log('- Review authentication configuration');
        }
        if (!diagnosticResults.customerTableAccess) {
            console.log('- Check if customers table exists and RLS policies are correct');
            console.log('- Verify field names match between JavaScript and database schema');
        }
        
        return diagnosticResults;
    }
    
    // Export functions
    window.diagnoseSupabaseConnection = diagnoseSupabaseConnection;
    window.testQueryVariations = testQueryVariations;
    window.analyzeCustomerDataStructure = analyzeCustomerDataStructure;
    window.runComprehensiveDiagnostic = runComprehensiveDiagnostic;
    
    // Auto-run diagnostic when loaded
    setTimeout(() => {
        if (window.dataService) {
            runComprehensiveDiagnostic();
        } else {
            console.log('⏳ DataService not ready, diagnostic will run when available');
        }
    }, 1000);
    
    console.log('✅ Customer 400 Error Diagnostic loaded successfully');
    
})();

// Export for external access
window.customer400ErrorDiagnostic = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};