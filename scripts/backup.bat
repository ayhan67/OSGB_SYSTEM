@echo off
REM Backup script for OSGB System

echo Starting OSGB System backup...

REM Create backup directory if it doesn't exist
if not exist "..\backup" mkdir "..\backup"

REM Generate timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set timestamp=%dt:~0,4%%dt:~4,2%%dt:~6,2%_%dt:~8,2%%dt:~10,2%%dt:~12,2%

REM Database backup
echo Creating database backup...
for /f "tokens=2 delims==" %%a in ('findstr DB_PASSWORD .env.prod') do set db_password=%%a
docker exec osgb_database_prod mysqldump -u osgb_user -p%db_password% osgb_db > ..\backup\osgb_backup_%timestamp%.sql

REM Compress backup (using PowerShell)
echo Compressing backup...
powershell -Command "Compress-Archive -Path '..\backup\osgb_backup_%timestamp%.sql' -DestinationPath '..\backup\osgb_backup_%timestamp%.zip' -Force"

REM Delete uncompressed file
del ..\backup\osgb_backup_%timestamp%.sql

REM Remove backups older than 30 days (using PowerShell)
echo Cleaning up old backups...
powershell -Command "Get-ChildItem -Path '..\backup' -Filter 'osgb_backup_*.zip' | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force"

echo Backup completed successfully!
echo Backup file: ..\backup\osgb_backup_%timestamp%.zip