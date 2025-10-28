#!/bin/bash

# Restore script for OSGB System

set -e  # Exit on any error

BACKUP_DIR="./backups"

echo "OSGB System Restore Script"
echo "========================"

# List available backups
echo "Available backups:"
ls -t $BACKUP_DIR/osgb_backup_* 2>/dev/null || echo "No backups found"

if [ $# -eq 0 ]; then
    echo "Usage: ./restore.sh <backup_name>"
    echo "Example: ./restore.sh osgb_backup_20231201_120000"
    exit 1
fi

BACKUP_NAME=$1
echo "Restoring from backup: $BACKUP_NAME"

# Check if backup exists
if [ ! -f "$BACKUP_DIR/${BACKUP_NAME}_database.sql" ]; then
    echo "Error: Database backup file not found: $BACKUP_DIR/${BACKUP_NAME}_database.sql"
    exit 1
fi

# Confirm restore operation
echo "WARNING: This will overwrite current data!"
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Stop services
echo "Stopping services..."
docker-compose -f docker-compose.prod.yml down

# Restore database
echo "Restoring database..."
docker-compose -f docker-compose.prod.yml up -d database
sleep 30  # Wait for database to be ready

# Drop and recreate database
docker exec osgb_database_prod mysql -u root -p$DB_ROOT_PASSWORD -e "DROP DATABASE IF EXISTS osgb_db; CREATE DATABASE osgb_db;"

# Restore database from backup
docker exec -i osgb_database_prod mysql -u osgb_user -p$DB_PASSWORD osgb_db < "$BACKUP_DIR/${BACKUP_NAME}_database.sql"

# Restore logs (optional)
if [ -f "$BACKUP_DIR/${BACKUP_NAME}_logs.tar.gz" ]; then
    echo "Restoring logs..."
    tar -xzf "$BACKUP_DIR/${BACKUP_NAME}_logs.tar.gz" -C .
fi

# Restore configuration (optional)
if [ -f "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" ]; then
    echo "Restoring configuration..."
    tar -xzf "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" -C .
fi

# Restart services
echo "Restarting services..."
docker-compose -f docker-compose.prod.yml up -d

echo "Restore completed successfully!"