/**
 * Task 18 Readiness Verification Script
 * Checks if the application is ready for manual testing
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Task 18: Manual Testing Readiness Check\n');
console.log('='.repeat(60));

const checks = {
    passed: [],
    failed: [],
    warnings: []
};

// Check 1: DataService exists and has no localStorage
console.log('\n📋 Check 1: DataService Implementation');
try {
    const dataServicePath = path.join(__dirname, 'public/assets/js/dataService.js');
    const dataServiceContent = fs.readFileSync(dataServicePath, 'utf8');
    
    if (dataServiceContent.includes('localStorage.getItem') || 
        dataServiceContent.includes('localStorage.setItem')) {
        checks.failed.push('DataService still contains localStorage references');
    } else {
        checks.passed.push('DataService has no localStorage dependencies');
    }
    
    if (dataServiceContent.includes('executeWithFallback')) {
        checks.failed.push('DataService still has executeWithFallback method');
    } else {
        checks.passed.push('DataService executeWithFallback removed');
    }
} catch (error) {
    checks.failed.push('DataService file not found or unreadable');
}

// Check 2: App.js has no localStorage
console.log('\n📋 Check 2: App.js Implementation');
try {
    const appPath = path.join(__dirname, 'public/assets/js/app.js');
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    const localStorageMatches = appContent.match(/localStorage\.(get|set|remove|clear)/g);
    if (localStorageMatches && localStorageMatches.length > 0) {
        checks.warnings.push(`App.js contains ${localStorageMatches.length} localStorage references`);
    } else {
        checks.passed.push('App.js has no localStorage usage');
    }
} catch (error) {
    checks.failed.push('App.js file not found or unreadable');
}

// Check 3: RealtimeService exists
console.log('\n📋 Check 3: RealtimeService Implementation');
try {
    const realtimePath = path.join(__dirname, 'public/assets/js/realtimeService.js');
    const realtimeContent = fs.readFileSync(realtimePath, 'utf8');
    
    if (realtimeContent.includes('class RealtimeService')) {
        checks.passed.push('RealtimeService class exists');
    } else {
        checks.failed.push('RealtimeService class not found');
    }
    
    if (realtimeContent.includes('subscribeToTable')) {
        checks.passed.push('RealtimeService has subscribeToTable method');
    } else {
        checks.failed.push('RealtimeService missing subscribeToTable method');
    }
} catch (error) {
    checks.failed.push('RealtimeService file not found');
}

// Check 4: Error handling components exist
console.log('\n📋 Check 4: Error Handling Components');
try {
    const errorHandlerPath = path.join(__dirname, 'public/assets/js/errorHandler.js');
    fs.accessSync(errorHandlerPath);
    checks.passed.push('ErrorHandler exists');
} catch (error) {
    checks.failed.push('ErrorHandler file not found');
}

try {
    const dataValidatorPath = path.join(__dirname, 'public/assets/js/dataValidator.js');
    fs.accessSync(dataValidatorPath);
    checks.passed.push('DataValidator exists');
} catch (error) {
    checks.failed.push('DataValidator file not found');
}

// Check 5: Network status service exists
console.log('\n📋 Check 5: Network Status Service');
try {
    const networkPath = path.join(__dirname, 'public/assets/js/networkStatusService.js');
    fs.accessSync(networkPath);
    checks.passed.push('NetworkStatusService exists');
} catch (error) {
    checks.warnings.push('NetworkStatusService not found (optional)');
}

// Check 6: Logger exists
console.log('\n📋 Check 6: Logger Implementation');
try {
    const loggerPath = path.join(__dirname, 'public/assets/js/logger.js');
    fs.accessSync(loggerPath);
    checks.passed.push('Logger exists');
} catch (error) {
    checks.warnings.push('Logger not found (optional)');
}

// Check 7: Cache service exists
console.log('\n📋 Check 7: Cache Service');
try {
    const cachePath = path.join(__dirname, 'public/assets/js/cacheService.js');
    fs.accessSync(cachePath);
    checks.passed.push('CacheService exists');
} catch (error) {
    checks.warnings.push('CacheService not found (optional)');
}

// Check 8: Index.html includes all necessary scripts
console.log('\n📋 Check 8: Index.html Script Includes');
try {
    const indexPath = path.join(__dirname, 'public/index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    const requiredScripts = [
        'dataService.js',
        'errorHandler.js',
        'dataValidator.js',
        'app.js'
    ];
    
    requiredScripts.forEach(script => {
        if (indexContent.includes(script)) {
            checks.passed.push(`Index.html includes ${script}`);
        } else {
            checks.failed.push(`Index.html missing ${script}`);
        }
    });
} catch (error) {
    checks.failed.push('Index.html file not found or unreadable');
}

// Check 9: Test files exist
console.log('\n📋 Check 9: Test Infrastructure');
try {
    const testPath = path.join(__dirname, 'tests/dataService.test.js');
    fs.accessSync(testPath);
    checks.passed.push('Unit tests exist');
} catch (error) {
    checks.warnings.push('Unit tests not found');
}

try {
    const integrationPath = path.join(__dirname, 'tests/integration-workflows.test.js');
    fs.accessSync(integrationPath);
    checks.passed.push('Integration tests exist');
} catch (error) {
    checks.warnings.push('Integration tests not found');
}

// Print Results
console.log('\n' + '='.repeat(60));
console.log('\n📊 READINESS CHECK RESULTS\n');

console.log(`✅ Passed: ${checks.passed.length}`);
checks.passed.forEach(item => console.log(`   ✓ ${item}`));

if (checks.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${checks.warnings.length}`);
    checks.warnings.forEach(item => console.log(`   ⚠ ${item}`));
}

if (checks.failed.length > 0) {
    console.log(`\n❌ Failed: ${checks.failed.length}`);
    checks.failed.forEach(item => console.log(`   ✗ ${item}`));
}

console.log('\n' + '='.repeat(60));

// Final verdict
if (checks.failed.length === 0) {
    console.log('\n✅ APPLICATION IS READY FOR MANUAL TESTING');
    console.log('\nNext Steps:');
    console.log('1. Open test-manual-verification-tool.html in your browser');
    console.log('2. Follow the testing guide in TASK-18-MANUAL-TESTING-GUIDE.md');
    console.log('3. Systematically test each scenario');
    console.log('4. Document results in the verification tool');
    console.log('5. Export results when complete');
} else {
    console.log('\n⚠️  APPLICATION HAS ISSUES - FIX BEFORE TESTING');
    console.log('\nPlease address the failed checks above before proceeding with manual testing.');
}

console.log('\n');
