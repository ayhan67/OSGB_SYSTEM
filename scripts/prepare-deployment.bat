@echo off
REM Deployment Preparation Script for OSGB System

echo ====================================================
echo OSGB System Deployment Preparation
echo ====================================================

echo Checking system requirements...

REM Check if Docker is installed
echo.
echo Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    set docker_installed=0
) else (
    echo [OK] Docker is installed
    docker --version
    set docker_installed=1
)

REM Check if Docker Compose is installed
echo.
echo Checking Docker Compose installation...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Docker Compose is not installed or not in PATH
    if %docker_installed% equ 1 (
        echo Docker Compose should be included with Docker Desktop
        echo Please ensure Docker Desktop is properly installed and running
    ) else (
        echo Please install Docker Desktop which includes Docker Compose
    )
    set compose_installed=0
) else (
    echo [OK] Docker Compose is installed
    docker-compose --version
    set compose_installed=1
)

REM Check if OpenSSL is installed
echo.
echo Checking OpenSSL installation...
openssl version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] OpenSSL is not installed or not in PATH
    echo Please install OpenSSL from https://slproweb.com/products/Win32OpenSSL.html
    set openssl_installed=0
) else (
    echo [OK] OpenSSL is installed
    openssl version
    set openssl_installed=1
)

REM Summary
echo.
echo ====================================================
echo System Check Summary:
echo ====================================================
if %docker_installed% equ 1 (
    echo [OK] Docker: Installed
) else (
    echo [ERROR] Docker: Not installed
)

if %compose_installed% equ 1 (
    echo [OK] Docker Compose: Installed
) else (
    echo [ERROR] Docker Compose: Not installed
)

if %openssl_installed% equ 1 (
    echo [OK] OpenSSL: Installed
) else (
    echo [ERROR] OpenSSL: Not installed
)

REM Check environment file
echo.
echo Checking environment configuration...
if exist ".env.prod" (
    echo [OK] Production environment file found
) else (
    echo [WARNING] Production environment file not found
    echo Creating from template...
    if exist ".env.prod.example" (
        copy ".env.prod.example" ".env.prod" >nul
        echo [OK] Created .env.prod from template
        echo Please edit .env.prod with your production values
    ) else (
        echo [ERROR] Template file .env.prod.example not found
    )
)

REM Final instructions
echo.
echo ====================================================
echo Next Steps:
echo ====================================================

set requirements_met=1
if %docker_installed% neq 1 set requirements_met=0
if %compose_installed% neq 1 set requirements_met=0
if %openssl_installed% neq 1 set requirements_met=0

if %requirements_met% equ 1 (
    echo All requirements are met. You can now deploy the application:
    echo.
    echo 1. Edit .env.prod with your production values
    echo 2. Run the deployment script:
    echo    scripts\deploy-prod.bat
    echo.
    echo For production deployment, obtain SSL certificates from a CA
    echo and place them in the ssl directory.
) else (
    echo Some requirements are missing. Please install the missing components:
    echo.
    if %docker_installed% neq 1 echo - Install Docker Desktop
    if %openssl_installed% neq 1 echo - Install OpenSSL
    echo.
    echo After installing the required components, run this script again.
)

echo.
echo For detailed instructions, see docs\FINAL_DEPLOYMENT_PREPARATION.md
echo.
pause