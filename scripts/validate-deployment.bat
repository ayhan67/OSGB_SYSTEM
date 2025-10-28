@echo off
REM Production deployment validation script for OSGB System

echo Validating OSGB System production deployment environment...

REM Initialize error counter
set errors=0

REM Function to check requirement
REM Check Docker installation
echo Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   FAILED
    echo   Error: Docker is not installed. Please install Docker.
    set /a errors+=1
) else (
    echo   OK
)

REM Check Docker Compose installation
echo Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   FAILED
    echo   Error: Docker Compose is not installed. Please install Docker Compose.
    set /a errors+=1
) else (
    echo   OK
)

REM Check OpenSSL installation
echo Checking OpenSSL...
openssl version >nul 2>&1
if %errorlevel% neq 0 (
    echo   FAILED
    echo   Error: OpenSSL is not installed. Please install OpenSSL.
    echo   Download from: https://slproweb.com/products/Win32OpenSSL.html
    set /a errors+=1
) else (
    echo   OK
)

REM Check if .env.prod exists
echo Checking .env.prod file...
if not exist ".env.prod" (
    echo   FAILED
    echo   Error: .env.prod file not found. Please create it from .env.prod.example.
    set /a errors+=1
) else (
    echo   OK
)

REM Check if required environment variables are set
echo Checking environment variables...
set missing_vars=0
for %%v in (DB_ROOT_PASSWORD DB_USER DB_PASSWORD DB_NAME JWT_SECRET CORS_ORIGIN REACT_APP_API_URL) do (
    findstr /C:"%%v=" .env.prod >nul 2>&1
    if errorlevel 1 (
        echo   Missing environment variable: %%v
        set /a missing_vars+=1
    )
)

if %missing_vars% equ 0 (
    echo   OK
) else (
    echo   FAILED
    echo   Missing %missing_vars% environment variables.
    set /a errors+=1
)

REM Check if SSL certificates exist
echo Checking SSL certificates...
if exist "ssl\certificate.crt" if exist "ssl\private.key" (
    echo   OK
) else (
    echo   WARNING - SSL certificates not found. Self-signed certificates will be generated during deployment.
)

REM Check disk space (approximate)
echo Checking disk space...
dir | findstr "bytes free" >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%a in ('dir ^| findstr "bytes free"') do set free_space=%%a
    echo   OK (%free_space% bytes free)
) else (
    echo   Unable to determine disk space
)

REM Summary
echo.
echo Validation complete.
if %errors% equ 0 (
    echo ^✓ All critical requirements met. Ready for deployment.
    exit /b 0
) else (
    echo ^✗ %errors% critical issues found. Please resolve before deployment.
    exit /b 1
)

pause