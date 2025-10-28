@echo off
REM Script to generate self-signed SSL certificates for testing

echo Generating self-signed SSL certificates...

REM Create ssl directory if it doesn't exist
if not exist "..\ssl" mkdir "..\ssl"

REM Check if OpenSSL is installed
openssl version >nul 2>&1
if %errorlevel% neq 0 (
    echo OpenSSL could not be found. Please install OpenSSL first.
    echo Download from: https://slproweb.com/products/Win32OpenSSL.html
    exit /b 1
)

REM Generate private key
echo Generating private key...
openssl genrsa -out ..\ssl\private.key 2048

REM Generate certificate signing request
echo Generating certificate signing request...
openssl req -new -key ..\ssl\private.key -out ..\ssl\certificate.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

REM Generate self-signed certificate
echo Generating self-signed certificate...
openssl x509 -req -days 365 -in ..\ssl\certificate.csr -signkey ..\ssl\private.key -out ..\ssl\certificate.crt

REM Clean up CSR file
del ..\ssl\certificate.csr

REM Set proper permissions (Windows equivalent)
icacls ..\ssl\private.key /inheritance:r /grant:r "%USERNAME%:R" >nul
icacls ..\ssl\certificate.crt /inheritance:r /grant:r "%USERNAME%:R" >nul

echo SSL certificates generated successfully!
echo Files created:
echo   - ..\ssl\private.key (Private key)
echo   - ..\ssl\certificate.crt (Certificate)
echo.
echo IMPORTANT: These are self-signed certificates for testing only.
echo For production, obtain certificates from a trusted Certificate Authority.

pause