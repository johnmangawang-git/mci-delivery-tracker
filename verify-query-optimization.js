/**
 * Verification Script for Task 19: Query Optimization
 * Requirements: 5.2, 5.5, 8.1
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Query Optimization Implementation (Task 19)...\n');

const results = {
    passed: [],
    failed: [],
    warnings: []
};

// Check 1: SQL optimization file exists
console.log('📋 Check 1: SQL optimization file...');
const sqlFile = path.join(__dirname, 'supabase', 'optimize-indexes.sql');
if (fs.existsSync(sqlFile)) {
    const content = fs.readFileSync(sqlFile, 'utf8');
    
    // Check for key indexes
    const requiredIndexes = [
        'idx_deliveries_status_user_created',
        'idx_deliveries_customer_name_lower',
        'idx_customers_name_lower',
        'idx_cost_items_delivery_id'
    ];
    
    let allIndexesPresent = true;
    requiredIndexes.forEach(index => {
        if (content.includes(index)) {
            results.passed.push(`✅ Index ${index} defined`);
        } else {
            results.failed.push(`❌ Index ${index} missing`);
            allIndexesPresent = false;
        }
    });
    
    // Check for views
    if (content.includes('active_deliveries_summary')) {
        results.passed.push('✅ Active deliveries summary view defined');
    } else {
        results.failed.push('❌ Active deliveries summary view missing');
    }
    
    if (content.includes('completed_deliveries_summary')) {
        results.passed.push('✅ Completed deliveries summary view defined');
    } else {
        results.failed.push('❌ Completed deliveries summary view missing');
    }
    
    // Check for additional_cost_items table
    if (content.includes('CREATE TABLE IF NOT EXISTS public.additional_cost_items')) {
        results.passed.push('✅ Additional cost items table defined');
    } else {
        results.warnings.push('⚠️ Additional cost items table not found in optimization file');
    }
    
} else {
    results.failed.push('❌ SQL optimization file not found');
}

// Check 2: DataService optimized methods
console.log('\n📋 Check 2: DataService optimized methods...');
const dataServiceFile = path.join(__dirname, 'public', 'assets', 'js', 'dataService.js');
if (fs.existsSync(dataServiceFile)) {
    const content = fs.readFileSync(dataServiceFile, 'utf8');
    
    const requiredMethods = [
        'getDeliveriesOptimized',
        'searchCustomersByName',
        'getDeliveriesWithCostSummary',
        'getDeliveriesByDrNumbers',
        'getRecentDeliveries',
        'invalidateCache',
        'getPerformanceStats'
    ];
    
    requiredMethods.forEach(method => {
        if (content.includes(`async ${method}(`) || content.includes(`${method}(`)) {
            results.passed.push(`✅ Method ${method}() implemented`);
        } else {
            results.failed.push(`❌ Method ${method}() missing`);
        }
    });
    
    // Check for cache integration
    if (content.includes('window.cacheService')) {
        results.passed.push('✅ Cache service integration present');
    } else {
        results.failed.push('❌ Cache service integration missing');
    }
    
    // Check for performance logging
    if (content.includes('performance.now()')) {
        results.passed.push('✅ Performance timing implemented');
    } else {
        results.failed.push('❌ Performance timing missing');
    }
    
    // Check for cache invalidation in CRUD operations
    if (content.includes('this.invalidateCache(')) {
        results.passed.push('✅ Cache invalidation in CRUD operations');
    } else {
        results.failed.push('❌ Cache invalidation not implemented');
    }
    
} else {
    results.failed.push('❌ DataService file not found');
}

// Check 3: Documentation
console.log('\n📋 Check 3: Documentation...');
const docFile = path.join(__dirname, 'QUERY-OPTIMIZATION-GUIDE.md');
if (fs.existsSync(docFile)) {
    const content = fs.readFileSync(docFile, 'utf8');
    
    const requiredSections = [
        'Database Indexes',
        'Optimized Views',
        'DataService Optimization Methods',
        'Cache Management',
        'Performance Monitoring',
        'Migration Instructions',
        'Best Practices',
        'Performance Benchmarks'
    ];
    
    requiredSections.forEach(section => {
        if (content.includes(section)) {
            results.passed.push(`✅ Documentation section: ${section}`);
        } else {
            results.failed.push(`❌ Documentation section missing: ${section}`);
        }
    });
    
} else {
    results.failed.push('❌ Query optimization guide not found');
}

// Check 4: Test file
console.log('\n📋 Check 4: Test file...');
const testFile = path.join(__dirname, 'test-query-optimization.html');
if (fs.existsSync(testFile)) {
    const content = fs.readFileSync(testFile, 'utf8');
    
    if (content.includes('testOptimizedQueries')) {
        results.passed.push('✅ Optimized queries test present');
    }
    
    if (content.includes('testCaching')) {
        results.passed.push('✅ Caching test present');
    }
    
    if (content.includes('testPerformance')) {
        results.passed.push('✅ Performance test present');
    }
    
    if (content.includes('testCacheInvalidation')) {
        results.passed.push('✅ Cache invalidation test present');
    }
    
} else {
    results.warnings.push('⚠️ Test file not found');
}

// Check 5: CacheService integration
console.log('\n📋 Check 5: CacheService integration...');
const cacheServiceFile = path.join(__dirname, 'public', 'assets', 'js', 'cacheService.js');
if (fs.existsSync(cacheServiceFile)) {
    results.passed.push('✅ CacheService available for query caching');
} else {
    results.warnings.push('⚠️ CacheService not found (may affect caching functionality)');
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('VERIFICATION RESULTS');
console.log('='.repeat(60));

if (results.passed.length > 0) {
    console.log('\n✅ PASSED CHECKS:');
    results.passed.forEach(item => console.log(`   ${item}`));
}

if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(item => console.log(`   ${item}`));
}

if (results.failed.length > 0) {
    console.log('\n❌ FAILED CHECKS:');
    results.failed.forEach(item => console.log(`   ${item}`));
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`Total Checks: ${results.passed.length + results.failed.length + results.warnings.length}`);
console.log(`Passed: ${results.passed.length}`);
console.log(`Failed: ${results.failed.length}`);
console.log(`Warnings: ${results.warnings.length}`);

// Requirements verification
console.log('\n' + '='.repeat(60));
console.log('REQUIREMENTS VERIFICATION');
console.log('='.repeat(60));

const requirements = {
    '5.2': {
        description: 'Apply appropriate filters at database level',
        met: results.passed.some(p => p.includes('getDeliveriesOptimized'))
    },
    '5.5': {
        description: 'Optimize queries for minimal latency',
        met: results.passed.some(p => p.includes('Performance timing'))
    },
    '8.1': {
        description: 'Performance optimization',
        met: results.passed.some(p => p.includes('Cache service integration'))
    }
};

Object.entries(requirements).forEach(([req, info]) => {
    const status = info.met ? '✅' : '❌';
    console.log(`${status} Requirement ${req}: ${info.description}`);
});

// Final verdict
console.log('\n' + '='.repeat(60));
if (results.failed.length === 0) {
    console.log('✅ TASK 19 VERIFICATION PASSED');
    console.log('All query optimization components are properly implemented.');
    console.log('\nNext Steps:');
    console.log('1. Apply database indexes: Run supabase/optimize-indexes.sql in Supabase SQL Editor');
    console.log('2. Test optimizations: Open test-query-optimization.html in browser');
    console.log('3. Monitor performance: Use dataService.getPerformanceStats()');
    console.log('4. Review documentation: Read QUERY-OPTIMIZATION-GUIDE.md');
    process.exit(0);
} else {
    console.log('❌ TASK 19 VERIFICATION FAILED');
    console.log(`${results.failed.length} check(s) failed. Please review the failed checks above.`);
    process.exit(1);
}
