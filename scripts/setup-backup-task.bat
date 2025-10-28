@echo off
REM Script to set up automated backups using Windows Task Scheduler

echo Setting up automated backups using Windows Task Scheduler...

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Please run as Administrator
    pause
    exit /b 1
)

REM Create backup directory if it doesn't exist
if not exist "C:\Backups\OSGB" mkdir "C:\Backups\OSGB"

REM Create scheduled task to run daily at 2 AM
schtasks /create /tn "OSGB Daily Backup" /tr "%cd%\backup.bat" /sc daily /st 02:00 /f

echo Automated backup setup completed!
echo Backups will run daily at 2 AM
echo Backup files will be stored in C:\Backups\OSGB

pause