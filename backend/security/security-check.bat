@echo off
REM Security check script for OSGB System
REM This script performs automated security checks

echo Starting OSGB System Security Check...

REM Create results directory
if not exist "security-results" mkdir "security-results"

REM 1. Dependency vulnerability scan
echo 1. Scanning for dependency vulnerabilities...
npm audit --audit-level=moderate > "security-results/dependency-vulnerabilities.txt" 2>&1

REM 2. Check for hardcoded secrets
echo 2. Checking for hardcoded secrets...
findstr /s /i "password secret key" "*.js" "*.ts" "*.json" > "security-results/hardcoded-secrets.txt" 2>&1

REM 3. Check file permissions
echo 3. Checking file permissions...
REM Note: Windows file permission checking is more complex and would require PowerShell

REM 4. Check for debug endpoints
echo 4. Checking for debug endpoints...
findstr /s /i "debug test dev" "*.js" "*.ts" > "security-results/debug-endpoints.txt" 2>&1

REM 5. SSL/TLS configuration check
echo 5. Checking SSL/TLS configuration...
REM This would typically use tools like testssl.sh or SSL Labs API
echo Manual check required: Verify SSL/TLS configuration > "security-results/ssl-config.txt"

REM 6. Security headers check
echo 6. Checking security headers...
echo Manual check required: Verify security headers (X-Frame-Options, CSP, etc.) > "security-results/security-headers.txt"

REM 7. CORS configuration check
echo 7. Checking CORS configuration...
findstr /s /i "cors CORS" "*.js" "*.ts" > "security-results/cors-config.txt" 2>&1

REM 8. Rate limiting check
echo 8. Checking rate limiting implementation...
findstr /s /i "rate.limit rateLimit throttle" "*.js" "*.ts" > "security-results/rate-limiting.txt" 2>&1

REM 9. Authentication check
echo 9. Checking authentication implementation...
findstr /s /i "passport auth jwt" "*.js" "*.ts" > "security-results/authentication.txt" 2>&1

REM 10. Input validation check
echo 10. Checking input validation...
findstr /s /i "validation sanitize validate" "*.js" "*.ts" > "security-results/input-validation.txt" 2>&1

echo Security check completed. Results saved in security-results/ directory.

echo.
echo === SECURITY CHECK SUMMARY ===
echo Dependency vulnerabilities: Check security-results/dependency-vulnerabilities.txt
echo Hardcoded secrets: Check security-results/hardcoded-secrets.txt
echo File permissions: Check security-results/file-permissions.txt
echo Debug endpoints: Check security-results/debug-endpoints.txt
echo SSL/TLS config: Check security-results/ssl-config.txt
echo Security headers: Check security-results/security-headers.txt
echo CORS config: Check security-results/cors-config.txt
echo Rate limiting: Check security-results/rate-limiting.txt
echo Authentication: Check security-results/authentication.txt
echo Input validation: Check security-results/input-validation.txt
echo.