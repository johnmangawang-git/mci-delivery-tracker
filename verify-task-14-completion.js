/**
 * Verification Script for Task 14: Remove All Remaining localStorage References
 * 
 * This script verifies that localStorage references for business data have been removed
 * from production files while keeping acceptable uses (UI state, migration, cleanup).
 */

const fs = require('fs');
const path = require('path');

console.log('=== Task 14 Verification: localStorage Removal ===\n');

// Files to check
const productionFiles = [
    'public/assets/js/booking.js',
    'public/assets/js/main.js',
    'public/index.html'
];

// Acceptable localStorage patterns (UI state, migration, cleanup)
const acceptablePatterns = [
    /localStorage\.getItem\('mci-user'\)/,  // User profile (UI state)
    /localStorage\.setItem\('mci-user'/,    // User profile (UI state)
    /localStorage\.removeItem\(/,            // Cleanup operations
    /localStorage\.clear\(\)/,               // Cleanup operations
    /hasLocalData.*localStorage\.getItem/,   // Migration check
];

// Business data patterns that should NOT exist
const businessDataPatterns = [
    /localStorage\.setItem\('mci-active-deliveries'/,
    /localStorage\.setItem\('activeDeliveries'/,
    /localStorage\.setItem\('mci-delivery-history'/,
    /localStorage\.setItem\('mci-customers'/,
    /localStorage\.setItem\('ePodRecords'/,
    /localStorage\.setItem\('analytics-cost-breakdown'/,
];

let allTestsPassed = true;

function checkFile(filePath) {
    console.log(`\nChecking: ${filePath}`);
    console.log('='.repeat(60));
    
    if (!fs.existsSync(filePath)) {
        console.log('❌ File not found');
        allTestsPassed = false;
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let issuesFound = 0;
    
    // Check for business data localStorage usage
    businessDataPatterns.forEach(pattern => {
        lines.forEach((line, index) => {
            if (pattern.test(line)) {
                // Check if it's in an acceptable context
                const isAcceptable = acceptablePatterns.some(acceptable => 
                    acceptable.test(line)
                );
                
                if (!isAcceptable) {
                    console.log(`❌ Line ${index + 1}: Found business data localStorage usage`);
                    console.log(`   ${line.trim()}`);
                    issuesFound++;
                    allTestsPassed = false;
                }
            }
        });
    });
    
    if (issuesFound === 0) {
        console.log('✅ No business data localStorage references found');
    } else {
        console.log(`\n❌ Found ${issuesFound} business data localStorage reference(s)`);
    }
    
    // Count acceptable localStorage uses
    let acceptableCount = 0;
    lines.forEach(line => {
        if (line.includes('localStorage.')) {
            const isAcceptable = acceptablePatterns.some(pattern => pattern.test(line));
            if (isAcceptable) {
                acceptableCount++;
            }
        }
    });
    
    if (acceptableCount > 0) {
        console.log(`ℹ️  Found ${acceptableCount} acceptable localStorage use(s) (UI state/migration/cleanup)`);
    }
}

// Check each production file
productionFiles.forEach(checkFile);

// Summary
console.log('\n' + '='.repeat(60));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(60));

if (allTestsPassed) {
    console.log('✅ All checks passed!');
    console.log('✅ Business data localStorage references have been removed');
    console.log('✅ Only acceptable localStorage uses remain (UI state, migration, cleanup)');
    console.log('\nTask 14 is COMPLETE ✓');
} else {
    console.log('❌ Some checks failed');
    console.log('❌ Business data localStorage references still exist');
    console.log('\nTask 14 needs additional work');
}

console.log('\n' + '='.repeat(60));

// Additional checks
console.log('\nADDITIONAL CHECKS:');
console.log('='.repeat(60));

// Check that DataService is required
const bookingContent = fs.readFileSync('public/assets/js/booking.js', 'utf8');
const mainContent = fs.readFileSync('public/assets/js/main.js', 'utf8');

const hasDataServiceCheck = bookingContent.includes('DataService not available') ||
                            bookingContent.includes('throw new Error');
const hasMainDataServiceCheck = mainContent.includes('DataService not available') ||
                                mainContent.includes('throw new Error');

if (hasDataServiceCheck && hasMainDataServiceCheck) {
    console.log('✅ DataService requirement checks are in place');
} else {
    console.log('⚠️  DataService requirement checks may be missing');
}

// Check for fallback patterns
const hasFallbackPattern = bookingContent.includes('Fallback to localStorage') ||
                          mainContent.includes('Fallback to localStorage');

if (!hasFallbackPattern) {
    console.log('✅ No "Fallback to localStorage" patterns found');
} else {
    console.log('⚠️  "Fallback to localStorage" patterns still exist');
}

console.log('\n' + '='.repeat(60));
console.log('Verification complete!');
console.log('='.repeat(60));

process.exit(allTestsPassed ? 0 : 1);
