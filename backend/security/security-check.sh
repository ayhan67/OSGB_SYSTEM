#!/bin/bash

# Security check script for OSGB System
# This script performs automated security checks

echo "Starting OSGB System Security Check..."

# Create results directory
mkdir -p security-results

# 1. Dependency vulnerability scan
echo "1. Scanning for dependency vulnerabilities..."
npm audit --audit-level=moderate > security-results/dependency-vulnerabilities.txt 2>&1

# 2. Check for hardcoded secrets
echo "2. Checking for hardcoded secrets..."
grep -r "password\|secret\|key" --include="*.js" --include="*.ts" --include="*.json" src/ backend/ > security-results/hardcoded-secrets.txt 2>&1

# 3. Check file permissions
echo "3. Checking file permissions..."
find . -name "*.key" -o -name "*.pem" -o -name "*.env" | while read file; do
  perm=$(stat -c %a "$file")
  if [ "$perm" -gt 600 ]; then
    echo "File $file has insecure permissions: $perm" >> security-results/file-permissions.txt
  fi
done

# 4. Check for debug endpoints
echo "4. Checking for debug endpoints..."
grep -r "debug\|test\|dev" --include="*.js" --include="*.ts" src/ backend/ > security-results/debug-endpoints.txt 2>&1

# 5. SSL/TLS configuration check
echo "5. Checking SSL/TLS configuration..."
# This would typically use tools like testssl.sh or SSL Labs API
# For now, we'll just check if HTTPS is enforced
if grep -q "https" backend/config/*.js 2>/dev/null; then
  echo "HTTPS configuration detected" > security-results/ssl-config.txt
else
  echo "WARNING: No HTTPS configuration detected" > security-results/ssl-config.txt
fi

# 6. Security headers check
echo "6. Checking security headers..."
# This would typically make HTTP requests to check headers
echo "Manual check required: Verify security headers (X-Frame-Options, CSP, etc.)" > security-results/security-headers.txt

# 7. CORS configuration check
echo "7. Checking CORS configuration..."
if grep -q "cors\|CORS" backend/config/*.js 2>/dev/null; then
  echo "CORS configuration detected" > security-results/cors-config.txt
else
  echo "WARNING: No CORS configuration detected" > security-results/cors-config.txt
fi

# 8. Rate limiting check
echo "8. Checking rate limiting implementation..."
if grep -q "rate.limit\|rateLimit\|throttle" backend/middleware/ 2>/dev/null; then
  echo "Rate limiting implementation detected" > security-results/rate-limiting.txt
else
  echo "WARNING: No rate limiting implementation detected" > security-results/rate-limiting.txt
fi

# 9. Authentication check
echo "9. Checking authentication implementation..."
if grep -q "passport\|auth\|jwt" backend/middleware/ 2>/dev/null; then
  echo "Authentication implementation detected" > security-results/authentication.txt
else
  echo "WARNING: No authentication implementation detected" > security-results/authentication.txt
fi

# 10. Input validation check
echo "10. Checking input validation..."
if grep -q "validation\|sanitize\|validate" backend/middleware/ 2>/dev/null; then
  echo "Input validation implementation detected" > security-results/input-validation.txt
else
  echo "WARNING: No input validation implementation detected" > security-results/input-validation.txt
fi

echo "Security check completed. Results saved in security-results/ directory."

# Summary
echo "
=== SECURITY CHECK SUMMARY ===
Dependency vulnerabilities: Check security-results/dependency-vulnerabilities.txt
Hardcoded secrets: Check security-results/hardcoded-secrets.txt
File permissions: Check security-results/file-permissions.txt
Debug endpoints: Check security-results/debug-endpoints.txt
SSL/TLS config: Check security-results/ssl-config.txt
Security headers: Check security-results/security-headers.txt
CORS config: Check security-results/cors-config.txt
Rate limiting: Check security-results/rate-limiting.txt
Authentication: Check security-results/authentication.txt
Input validation: Check security-results/input-validation.txt
"