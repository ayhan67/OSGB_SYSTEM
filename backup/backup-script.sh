#!/bin/bash

# OSGB System Backup Script

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="osgb_backup_$DATE"
MYSQL_CONTAINER="osgb_database"
MYSQL_USER="root"
MYSQL_PASSWORD="rootpassword"
MYSQL_DATABASE="osgb_db"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup MySQL database
echo "Starting database backup..."
docker exec $MYSQL_CONTAINER mysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > $BACKUP_DIR/${BACKUP_NAME}_database.sql

# Compress the database backup
gzip $BACKUP_DIR/${BACKUP_NAME}_database.sql

# Backup application files (if needed)
# tar -czf $BACKUP_DIR/${BACKUP_NAME}_app.tar.gz /path/to/app/files

# Remove backups older than 30 days
find $BACKUP_DIR -name "osgb_backup_*" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/${BACKUP_NAME}_database.sql.gz"