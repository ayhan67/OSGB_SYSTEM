const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting OSGB System Security Check...');

// Create results directory
const resultsDir = path.join(__dirname, 'security-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Function to run command and save output
function runCommand(command, outputFile) {
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    fs.writeFileSync(path.join(resultsDir, outputFile), output);
  } catch (error) {
    // Even if command fails, save the error output
    const errorOutput = error.stdout || error.stderr || error.message;
    fs.writeFileSync(path.join(resultsDir, outputFile), errorOutput);
  }
}

// 1. Dependency vulnerability scan
console.log('1. Scanning for dependency vulnerabilities...');
runCommand('npm audit --audit-level=moderate', 'dependency-vulnerabilities.txt');

// 2. Check for hardcoded secrets
console.log('2. Checking for hardcoded secrets...');
runCommand('find . -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.json" \\) -exec grep -l "password\\|secret\\|key" {} \\;', 'hardcoded-secrets.txt');

// 3. Check for debug endpoints
console.log('3. Checking for debug endpoints...');
runCommand('find . -type f \\( -name "*.js" -o -name "*.ts" \\) -exec grep -l "debug\\|test\\|dev" {} \\;', 'debug-endpoints.txt');

// 4. SSL/TLS configuration check
console.log('4. Checking SSL/TLS configuration...');
// This would typically use tools like testssl.sh or SSL Labs API
fs.writeFileSync(path.join(resultsDir, 'ssl-config.txt'), 'Manual check required: Verify SSL/TLS configuration\n');

// 5. Security headers check
console.log('5. Checking security headers...');
fs.writeFileSync(path.join(resultsDir, 'security-headers.txt'), 'Manual check required: Verify security headers (X-Frame-Options, CSP, etc.)\n');

// 6. CORS configuration check
console.log('6. Checking CORS configuration...');
runCommand('find . -type f \\( -name "*.js" -o -name "*.ts" \\) -exec grep -l "cors\\|CORS" {} \\;', 'cors-config.txt');

// 7. Rate limiting check
console.log('7. Checking rate limiting implementation...');
runCommand('find . -type f \\( -name "*.js" -o -name "*.ts" \\) -exec grep -l "rate.limit\\|rateLimit\\|throttle" {} \\;', 'rate-limiting.txt');

// 8. Authentication check
console.log('8. Checking authentication implementation...');
runCommand('find . -type f \\( -name "*.js" -o -name "*.ts" \\) -exec grep -l "passport\\|auth\\|jwt" {} \\;', 'authentication.txt');

// 9. Input validation check
console.log('9. Checking input validation...');
runCommand('find . -type f \\( -name "*.js" -o -name "*.ts" \\) -exec grep -l "validation\\|sanitize\\|validate" {} \\;', 'input-validation.txt');

console.log('Security check completed. Results saved in security-results/ directory.');

// Summary
console.log(`
=== SECURITY CHECK SUMMARY ===
Dependency vulnerabilities: Check security-results/dependency-vulnerabilities.txt
Hardcoded secrets: Check security-results/hardcoded-secrets.txt
Debug endpoints: Check security-results/debug-endpoints.txt
SSL/TLS config: Check security-results/ssl-config.txt
Security headers: Check security-results/security-headers.txt
CORS config: Check security-results/cors-config.txt
Rate limiting: Check security-results/rate-limiting.txt
Authentication: Check security-results/authentication.txt
Input validation: Check security-results/input-validation.txt
`);