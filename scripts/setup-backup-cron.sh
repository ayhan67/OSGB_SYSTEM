#!/bin/bash

# Script to set up automated backups using cron

echo "Setting up automated backups using cron..."

# Check if script is run as root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root (sudo)"
  exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p /var/backups/osgb

# Copy backup script to system location
cp backup.sh /usr/local/bin/osgb-backup.sh
chmod +x /usr/local/bin/osgb-backup.sh

# Add cron job to run daily at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/osgb-backup.sh") | crontab -

echo "Automated backup setup completed!"
echo "Backups will run daily at 2 AM"
echo "Backup files will be stored in /var/backups/osgb"