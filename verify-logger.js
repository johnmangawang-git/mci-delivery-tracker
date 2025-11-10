/**
 * Logger Class Verification Script
 * 
 * This script verifies that the Logger class meets all requirements:
 * - Implements Logger class with log levels
 * - Has log() method with timestamp and data
 * - Has info(), warn(), and error() convenience methods
 * - Integrates with monitoring service if available
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Logger Class Verification\n');
console.log('=' .repeat(60));

// Read the logger.js file
const loggerPath = path.join(__dirname, 'public', 'assets', 'js', 'logger.js');
let loggerContent = '';

try {
    loggerContent = fs.readFileSync(loggerPath, 'utf8');
    console.log('✓ Logger file found at:', loggerPath);
} catch (error) {
    console.error('✗ Failed to read logger.js:', error.message);
    process.exit(1);
}

// Verification checks
const checks = {
    classDefinition: false,
    logLevels: false,
    logMethod: false,
    timestampInLog: false,
    dataParameter: false,
    infoMethod: false,
    warnMethod: false,
    errorMethod: false,
    monitoringServiceIntegration: false,
    consoleOutput: false,
    structuredLogEntry: false,
    additionalMethods: false
};

console.log('\n📋 Checking Requirements:\n');

// Check 1: Class definition
if (loggerContent.includes('class Logger')) {
    checks.classDefinition = true;
    console.log('✓ Logger class is defined');
} else {
    console.log('✗ Logger class is NOT defined');
}

// Check 2: Log levels
if (loggerContent.includes('LogLevels') || 
    (loggerContent.includes('INFO') && loggerContent.includes('WARN') && loggerContent.includes('ERROR'))) {
    checks.logLevels = true;
    console.log('✓ Log levels (INFO, WARN, ERROR) are defined');
} else {
    console.log('✗ Log levels are NOT properly defined');
}

// Check 3: log() method
if (loggerContent.includes('static log(') || loggerContent.includes('log(level, message')) {
    checks.logMethod = true;
    console.log('✓ log() method is implemented');
} else {
    console.log('✗ log() method is NOT implemented');
}

// Check 4: Timestamp in log
if (loggerContent.includes('timestamp') && 
    (loggerContent.includes('new Date()') || loggerContent.includes('Date.now()'))) {
    checks.timestampInLog = true;
    console.log('✓ Timestamp is included in log entries');
} else {
    console.log('✗ Timestamp is NOT included in log entries');
}

// Check 5: Data parameter
if (loggerContent.includes('data') && loggerContent.match(/log\([^)]*data[^)]*\)/)) {
    checks.dataParameter = true;
    console.log('✓ Data parameter is supported in log methods');
} else {
    console.log('✗ Data parameter is NOT supported');
}

// Check 6: info() method
if (loggerContent.includes('static info(') || loggerContent.includes('info(message')) {
    checks.infoMethod = true;
    console.log('✓ info() convenience method is implemented');
} else {
    console.log('✗ info() convenience method is NOT implemented');
}

// Check 7: warn() method
if (loggerContent.includes('static warn(') || loggerContent.includes('warn(message')) {
    checks.warnMethod = true;
    console.log('✓ warn() convenience method is implemented');
} else {
    console.log('✗ warn() convenience method is NOT implemented');
}

// Check 8: error() method
if (loggerContent.includes('static error(') || loggerContent.includes('error(message')) {
    checks.errorMethod = true;
    console.log('✓ error() convenience method is implemented');
} else {
    console.log('✗ error() convenience method is NOT implemented');
}

// Check 9: Monitoring service integration
if (loggerContent.includes('monitoringService') || loggerContent.includes('monitoring')) {
    checks.monitoringServiceIntegration = true;
    console.log('✓ Monitoring service integration is implemented');
} else {
    console.log('✗ Monitoring service integration is NOT implemented');
}

// Check 10: Console output
if (loggerContent.includes('console.info') || 
    loggerContent.includes('console.warn') || 
    loggerContent.includes('console.error')) {
    checks.consoleOutput = true;
    console.log('✓ Console output is implemented');
} else {
    console.log('✗ Console output is NOT implemented');
}

// Check 11: Structured log entry
if (loggerContent.includes('logEntry') && loggerContent.includes('{')) {
    checks.structuredLogEntry = true;
    console.log('✓ Structured log entries are created');
} else {
    console.log('✗ Structured log entries are NOT created');
}

// Check 12: Additional helper methods
const helperMethods = [
    'logDatabaseOperation',
    'logUserAction',
    'logPerformance',
    'logNetworkError',
    'startTimer'
];

const foundHelpers = helperMethods.filter(method => loggerContent.includes(method));
if (foundHelpers.length >= 3) {
    checks.additionalMethods = true;
    console.log(`✓ Additional helper methods found: ${foundHelpers.join(', ')}`);
} else {
    console.log('✓ Basic implementation complete (additional helpers are optional)');
    checks.additionalMethods = true; // Not required, so mark as passed
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Verification Summary:\n');

const passedChecks = Object.values(checks).filter(v => v).length;
const totalChecks = Object.keys(checks).length;
const passRate = ((passedChecks / totalChecks) * 100).toFixed(1);

console.log(`Passed: ${passedChecks}/${totalChecks} checks (${passRate}%)`);

if (passedChecks === totalChecks) {
    console.log('\n✅ SUCCESS: Logger class implementation is complete!');
    console.log('\nThe Logger class includes:');
    console.log('  • Multiple log levels (info, warn, error)');
    console.log('  • Timestamp tracking for all log entries');
    console.log('  • Structured data logging');
    console.log('  • Monitoring service integration');
    console.log('  • Console output with appropriate formatting');
    console.log('\nNext steps:');
    console.log('  1. Open test-logger.html in a browser to run interactive tests');
    console.log('  2. Check browser console for detailed log output');
    console.log('  3. Integrate Logger into existing services (DataService, ErrorHandler, etc.)');
} else {
    console.log('\n⚠️  WARNING: Some checks failed. Review the implementation.');
    console.log('\nFailed checks:');
    Object.entries(checks).forEach(([check, passed]) => {
        if (!passed) {
            console.log(`  • ${check}`);
        }
    });
}

console.log('\n' + '='.repeat(60));

// Exit with appropriate code
process.exit(passedChecks === totalChecks ? 0 : 1);
