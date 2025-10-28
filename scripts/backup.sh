#!/bin/bash

# Backup script for OSGB System

echo "Starting OSGB System backup..."

# Create backup directory if it doesn't exist
mkdir -p ../backup

# Generate timestamp
timestamp=$(date +"%Y%m%d_%H%M%S")

# Database backup
echo "Creating database backup..."
docker exec osgb_database_prod mysqldump -u osgb_user -p$(grep DB_PASSWORD .env.prod | cut -d '=' -f2) osgb_db > ../backup/osgb_backup_${timestamp}.sql

# Compress backup
echo "Compressing backup..."
gzip ../backup/osgb_backup_${timestamp}.sql

# Remove backups older than 30 days
echo "Cleaning up old backups..."
find ../backup -name "osgb_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed successfully!"
echo "Backup file: ../backup/osgb_backup_${timestamp}.sql.gz"