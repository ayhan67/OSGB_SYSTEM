@echo off
REM Production deployment script for OSGB System

echo Starting OSGB System production deployment...

REM Check if docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker could not be found. Please install Docker first.
    exit /b 1
)

REM Check if docker-compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo docker-compose could not be found. Please install docker-compose first.
    exit /b 1
)

REM Check if OpenSSL is installed
openssl version >nul 2>&1
if %errorlevel% neq 0 (
    echo OpenSSL could not be found. Please install OpenSSL first.
    echo Download from: https://slproweb.com/products/Win32OpenSSL.html
    exit /b 1
)

REM Create necessary directories
echo Creating necessary directories...
mkdir backend\logs 2>nul
mkdir ssl 2>nul

REM Check if SSL certificates exist, generate if not
if not exist "ssl\certificate.crt" if not exist "ssl\private.key" (
    echo SSL certificates not found. Generating self-signed certificates for testing...
    call scripts\generate-certificates.bat
) else (
    echo SSL certificates found.
)

REM Build and deploy services
echo Building and deploying services...
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

REM Wait for services to be ready
echo Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check service status
echo Checking service status...
docker-compose -f docker-compose.prod.yml ps

REM Run database initialization if needed
echo Initializing database...
docker exec osgb_backend_prod node init-db.js

echo OSGB System production deployment completed successfully!

echo Access the application at:
echo   Frontend: https://localhost (HTTPS)
echo   Backend API: https://localhost:5002
echo   Database: mysql://localhost:3306

echo To view logs:
echo   docker-compose -f docker-compose.prod.yml logs -f

pause