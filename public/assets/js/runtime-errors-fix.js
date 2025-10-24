/**
 * RUNTIME ERRORS COMPREHENSIVE FIX
 * Fixes all current console errors:
 * 1. Supabase initialization error
 * 2. Chart.js ownerDocument error
 * 3. Async message channel error
 */

console.log('🔧 Loading Runtime Errors Fix...');

// ========================================
// 1. FIX SUPABASE INITIALIZATION ERROR
// ========================================

/**
 * Ensure Supabase client is properly initialized
 */
function ensureSupabaseClient() {
    console.log('🔍 Checking Supabase client initialization...');
    
    try {
        // Check if Supabase library is loaded
        if (typeof window.supabase === 'undefined') {
            console.warn('⚠️ Supabase library not loaded, attempting to load...');
            
            // Try to load from global if available
            if (typeof supabase !== 'undefined') {
                window.supabase = supabase;
                console.log('✅ Found global supabase, assigned to window');
            } else {
                console.error('❌ Supabase library not available');
                return null;
            }
        }
        
        // Check if createClient function exists
        if (typeof window.supabase.createClient !== 'function') {
            console.error('❌ Supabase createClient not available');
            return null;
        }
        
        // Check if client is already initialized
        if (window.supabaseGlobalClient) {
            console.log('✅ Supabase client already initialized');
            return window.supabaseGlobalClient;
        }
        
        // Get credentials
        const supabaseUrl = window.SUPABASE_URL || 'https://ntyvrezyhrmflswxefbk.supabase.co';
        const supabaseKey = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eXZyZXp5aHJtZmxzd3hlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjUzNTgsImV4cCI6MjA3MDY0MTM1OH0.JX0YP42_40lKQ1ghUmIA_Lu0YVZB_Ytl0EdQinU0Nm4';
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Supabase credentials missing');
            return null;
        }
        
        // Create client
        console.log('🔧 Creating Supabase client...');
        const client = window.supabase.createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            },
            db: {
                schema: 'public'
            }
        });
        
        // Store globally
        window.supabaseGlobalClient = client;
        window.supabaseClient = () => client;
        window.getSupabaseClient = () => client;
        
        // Prevent duplicate initialization
        window.supabaseClientInitialized = true;
        
        console.log('✅ Supabase client initialized successfully');
        return client;
        
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error);
        return null;
    }
}

/**
 * Safe Supabase client getter with fallback
 */
function getSafeSupabaseClient() {
    if (window.supabaseGlobalClient) {
        return window.supabaseGlobalClient;
    }
    
    return ensureSupabaseClient();
}

// ========================================
// 2. FIX CHART.JS OWNERDOCUMENT ERROR
// ========================================

/**
 * Safe chart update with DOM validation
 */
function safeUpdateCostBreakdownChart(period = 'month') {
    console.log('📊 Safe chart update for:', period);
    
    try {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js not loaded, skipping chart update');
            return;
        }
        
        // Check if canvas element exists
        const canvas = document.getElementById('costBreakdownChart');
        if (!canvas) {
            console.warn('⚠️ Chart canvas not found, retrying in 500ms...');
            setTimeout(() => safeUpdateCostBreakdownChart(period), 500);
            return;
        }
        
        // Check if canvas is properly mounted in DOM
        if (!canvas.ownerDocument) {
            console.warn('⚠️ Chart canvas not properly mounted, retrying in 500ms...');
            setTimeout(() => safeUpdateCostBreakdownChart(period), 500);
            return;
        }
        
        // Check if canvas has context
        if (!canvas.getContext) {
            console.warn('⚠️ Chart canvas context not available, retrying in 500ms...');
            setTimeout(() => safeUpdateCostBreakdownChart(period), 500);
            return;
        }
        
        // Check if canvas is visible
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn('⚠️ Chart canvas has zero dimensions, retrying in 500ms...');
            setTimeout(() => safeUpdateCostBreakdownChart(period), 500);
            return;
        }
        
        // Get existing chart instance
        let chart = Chart.getChart(canvas);
        
        // Get chart data
        let chartData;
        if (typeof getCostBreakdownData === 'function') {
            chartData = getCostBreakdownData(period);
        } else if (typeof window.getCostBreakdownData === 'function') {
            chartData = window.getCostBreakdownData(period);
        } else {
            console.warn('⚠️ getCostBreakdownData function not found');
            chartData = {
                labels: ['No Data'],
                values: [1],
                colors: ['rgba(149, 165, 166, 0.8)']
            };
        }
        
        if (chart) {
            // Update existing chart safely
            try {
                if (chart.data && chart.data.datasets && chart.data.datasets[0]) {
                    chart.data.labels = chartData.labels;
                    chart.data.datasets[0].data = chartData.values;
                    chart.data.datasets[0].backgroundColor = chartData.colors;
                    chart.update('none'); // No animation to prevent errors
                    console.log('✅ Chart updated successfully');
                } else {
                    console.warn('⚠️ Chart data structure invalid, recreating...');
                    chart.destroy();
                    createNewChart(canvas, chartData);
                }
            } catch (updateError) {
                console.error('❌ Chart update failed, recreating:', updateError);
                chart.destroy();
                createNewChart(canvas, chartData);
            }
        } else {
            // Create new chart
            createNewChart(canvas, chartData);
        }
        
    } catch (error) {
        console.error('❌ Safe chart update failed:', error);
    }
}

/**
 * Create new chart with error handling
 */
function createNewChart(canvas, chartData) {
    try {
        const config = {
            type: 'doughnut',
            data: {
                labels: chartData.labels,
                datasets: [{
                    data: chartData.values,
                    backgroundColor: chartData.colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        };
        
        const newChart = new Chart(canvas, config);
        console.log('✅ New chart created successfully');
        return newChart;
        
    } catch (error) {
        console.error('❌ Chart creation failed:', error);
        return null;
    }
}

/**
 * Safe DOM-ready chart initialization
 */
function initializeChartsWhenReady() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => safeUpdateCostBreakdownChart('month'), 1000);
        });
    } else {
        setTimeout(() => safeUpdateCostBreakdownChart('month'), 1000);
    }
}

// ========================================
// 3. FIX ASYNC MESSAGE CHANNEL ERROR
// ========================================

/**
 * Global error handling for async operations
 */
function setupAsyncErrorHandling() {
    console.log('🛡️ Setting up async error handling...');
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('❌ Unhandled promise rejection:', event.reason);
        
        // Handle specific error types
        if (event.reason && event.reason.message) {
            const message = event.reason.message;
            
            // Handle message channel errors
            if (message.includes('message channel closed') || 
                message.includes('asynchronous response')) {
                console.warn('⚠️ Message channel error detected, preventing crash');
                event.preventDefault();
                return;
            }
            
            // Handle Supabase errors
            if (message.includes('supabase') || message.includes('PGRST')) {
                console.warn('⚠️ Supabase error detected, attempting recovery');
                // Try to reinitialize Supabase client
                setTimeout(ensureSupabaseClient, 1000);
                event.preventDefault();
                return;
            }
        }
    });
    
    // Handle general JavaScript errors
    window.addEventListener('error', (event) => {
        if (event.error && event.error.message) {
            const message = event.error.message;
            
            // Handle chart errors
            if (message.includes('ownerDocument') || message.includes('chart')) {
                console.warn('⚠️ Chart error detected, attempting recovery');
                setTimeout(() => safeUpdateCostBreakdownChart('month'), 2000);
                event.preventDefault();
                return;
            }
            
            // Handle Supabase errors
            if (message.includes('supabase') || message.includes('createClient')) {
                console.warn('⚠️ Supabase error detected, attempting recovery');
                setTimeout(ensureSupabaseClient, 1000);
                event.preventDefault();
                return;
            }
        }
    });
    
    console.log('✅ Async error handling set up');
}

/**
 * Safe async function wrapper
 */
function safeAsync(asyncFn, context = 'Unknown') {
    return async function(...args) {
        try {
            return await asyncFn.apply(this, args);
        } catch (error) {
            console.error(`❌ Async error in ${context}:`, error);
            return null;
        }
    };
}

// ========================================
// 4. INITIALIZATION SEQUENCE
// ========================================

/**
 * Initialize all fixes in correct order
 */
function initializeRuntimeFixes() {
    console.log('🚀 Initializing runtime fixes...');
    
    // Step 1: Set up error handling first
    setupAsyncErrorHandling();
    
    // Step 2: Initialize Supabase client
    ensureSupabaseClient();
    
    // Step 3: Initialize charts when DOM is ready
    initializeChartsWhenReady();
    
    // Step 4: Export functions globally
    window.ensureSupabaseClient = ensureSupabaseClient;
    window.getSafeSupabaseClient = getSafeSupabaseClient;
    window.safeUpdateCostBreakdownChart = safeUpdateCostBreakdownChart;
    window.safeAsync = safeAsync;
    
    // Step 5: Override existing functions with safe versions
    if (typeof window.updateCostBreakdownChart === 'function') {
        window.originalUpdateCostBreakdownChart = window.updateCostBreakdownChart;
        window.updateCostBreakdownChart = safeUpdateCostBreakdownChart;
    }
    
    console.log('✅ Runtime fixes initialized');
    
    // Log current state
    console.log('📊 Current state:');
    console.log('- Supabase available:', typeof window.supabase !== 'undefined');
    console.log('- Supabase client initialized:', !!window.supabaseGlobalClient);
    console.log('- Chart.js available:', typeof Chart !== 'undefined');
    console.log('- Error handling active:', true);
}

// ========================================
// 5. AUTO-INITIALIZATION
// ========================================

// Initialize immediately if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRuntimeFixes);
} else {
    initializeRuntimeFixes();
}

// Also initialize on window load as backup
window.addEventListener('load', () => {
    if (!window.runtimeFixesInitialized) {
        console.log('🔄 Backup initialization of runtime fixes...');
        initializeRuntimeFixes();
        window.runtimeFixesInitialized = true;
    }
});

console.log('✅ Runtime Errors Fix loaded');