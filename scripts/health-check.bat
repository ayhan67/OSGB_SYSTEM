@echo off
REM Health check script for OSGB System

echo Checking OSGB System health...

REM Check if docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    exit /b 1
)

REM Check if docker-compose is running
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: docker-compose is not installed or not in PATH
    exit /b 1
)

REM Check container status
echo Checking container status...
docker-compose -f docker-compose.prod.yml ps

REM Check backend health
echo Checking backend health...
docker inspect --format="{{.State.Status}}" osgb_backend_prod >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend container is running
    
    REM Check backend API health endpoint
    curl -s -o nul -w "%%{http_code}" http://localhost:5002/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ Backend API is healthy
    ) else (
        echo ✗ Backend API is not responding
    )
) else (
    echo ✗ Backend container is not running
)

REM Check frontend health
echo Checking frontend health...
docker inspect --format="{{.State.Status}}" osgb_frontend_prod >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend container is running
    
    REM Check frontend health
    curl -s -o nul -w "%%{http_code}" http://localhost >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ Frontend is healthy
    ) else (
        echo ✗ Frontend is not responding
    )
) else (
    echo ✗ Frontend container is not running
)

REM Check database health
echo Checking database health...
docker inspect --format="{{.State.Status}}" osgb_database_prod >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Database container is running
    
    REM Check database connectivity
    docker exec osgb_database_prod mysqladmin ping -h localhost | findstr "mysqld is alive" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ Database is healthy
    ) else (
        echo ✗ Database is not responding
    )
) else (
    echo ✗ Database container is not running
)

echo Health check completed.
pause