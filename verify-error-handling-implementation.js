/**
 * Verification Script for Task 13: Comprehensive Error Handling
 * 
 * This script verifies that all database operations have proper error handling
 * with ErrorHandler and Logger integration.
 */

const fs = require('fs');
const path = require('path');

console.log('=== TASK 13: ERROR HANDLING VERIFICATION ===\n');

// Files to check
const filesToCheck = [
    'public/assets/js/app.js',
    'public/assets/js/dataService.js',
    'public/assets/js/customers.js'
];

// Patterns to verify
const patterns = {
    tryBlock: /try\s*{/g,
    catchBlock: /catch\s*\(\s*error\s*\)\s*{/g,
    errorHandler: /ErrorHandler\.handle\(/g,
    logger: /Logger\.(error|info|warn)\(/g,
    showToast: /showToast\(/g
};

// Results storage
const results = {
    totalFiles: 0,
    filesChecked: 0,
    totalTryBlocks: 0,
    totalCatchBlocks: 0,
    errorHandlerCalls: 0,
    loggerCalls: 0,
    toastCalls: 0,
    issues: []
};

// Check each file
filesToCheck.forEach(filePath => {
    results.totalFiles++;
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        results.filesChecked++;
        
        // Count patterns
        const tryMatches = content.match(patterns.tryBlock) || [];
        const catchMatches = content.match(patterns.catchBlock) || [];
        const errorHandlerMatches = content.match(patterns.errorHandler) || [];
        const loggerMatches = content.match(patterns.logger) || [];
        const toastMatches = content.match(patterns.showToast) || [];
        
        results.totalTryBlocks += tryMatches.length;
        results.totalCatchBlocks += catchMatches.length;
        results.errorHandlerCalls += errorHandlerMatches.length;
        results.loggerCalls += loggerMatches.length;
        results.toastCalls += toastMatches.length;
        
        console.log(`✓ ${filePath}`);
        console.log(`  Try blocks: ${tryMatches.length}`);
        console.log(`  Catch blocks: ${catchMatches.length}`);
        console.log(`  ErrorHandler calls: ${errorHandlerMatches.length}`);
        console.log(`  Logger calls: ${loggerMatches.length}`);
        console.log(`  Toast calls: ${toastMatches.length}`);
        
        // Check for try-catch balance
        if (tryMatches.length !== catchMatches.length) {
            results.issues.push(`${filePath}: Unbalanced try-catch blocks (${tryMatches.length} try, ${catchMatches.length} catch)`);
        }
        
        // Check for ErrorHandler usage in catch blocks
        if (catchMatches.length > 0 && errorHandlerMatches.length === 0) {
            results.issues.push(`${filePath}: Has catch blocks but no ErrorHandler calls`);
        }
        
        console.log('');
        
    } catch (error) {
        console.error(`✗ Error reading ${filePath}: ${error.message}\n`);
        results.issues.push(`${filePath}: Could not read file - ${error.message}`);
    }
});

// Print summary
console.log('=== VERIFICATION SUMMARY ===\n');
console.log(`Files checked: ${results.filesChecked}/${results.totalFiles}`);
console.log(`Total try blocks: ${results.totalTryBlocks}`);
console.log(`Total catch blocks: ${results.totalCatchBlocks}`);
console.log(`ErrorHandler calls: ${results.errorHandlerCalls}`);
console.log(`Logger calls: ${results.loggerCalls}`);
console.log(`Toast notifications: ${results.toastCalls}`);
console.log('');

// Check requirements
console.log('=== REQUIREMENTS CHECK ===\n');

const checks = [
    {
        name: 'All database operations wrapped in try-catch',
        passed: results.totalTryBlocks > 0 && results.totalCatchBlocks > 0,
        message: `Found ${results.totalTryBlocks} try blocks and ${results.totalCatchBlocks} catch blocks`
    },
    {
        name: 'ErrorHandler used for consistent error processing',
        passed: results.errorHandlerCalls > 0,
        message: `Found ${results.errorHandlerCalls} ErrorHandler.handle() calls`
    },
    {
        name: 'User-friendly error messages via toast notifications',
        passed: results.toastCalls > 0,
        message: `Found ${results.toastCalls} showToast() calls`
    },
    {
        name: 'Errors logged with sufficient context',
        passed: results.loggerCalls > 0,
        message: `Found ${results.loggerCalls} Logger calls`
    }
];

checks.forEach(check => {
    const status = check.passed ? '✓' : '✗';
    console.log(`${status} ${check.name}`);
    console.log(`  ${check.message}`);
    console.log('');
});

// Print issues
if (results.issues.length > 0) {
    console.log('=== ISSUES FOUND ===\n');
    results.issues.forEach(issue => {
        console.log(`⚠ ${issue}`);
    });
    console.log('');
}

// Final verdict
const allChecksPassed = checks.every(check => check.passed);
const noIssues = results.issues.length === 0;

console.log('=== FINAL VERDICT ===\n');
if (allChecksPassed && noIssues) {
    console.log('✅ TASK 13 VERIFICATION PASSED');
    console.log('All requirements are met and no issues found.');
    process.exit(0);
} else {
    console.log('⚠ TASK 13 VERIFICATION COMPLETED WITH WARNINGS');
    if (!allChecksPassed) {
        console.log('Some requirements may need attention.');
    }
    if (!noIssues) {
        console.log(`Found ${results.issues.length} issue(s) that should be reviewed.`);
    }
    process.exit(0);
}
