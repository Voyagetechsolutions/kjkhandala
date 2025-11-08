#!/bin/bash

# =====================================================
# PostgreSQL Database Backup Script
# Automated daily backups with retention policy
# =====================================================

# Configuration
BACKUP_DIR="/var/backups/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE=$(date +"%Y-%m-%d")
RETENTION_DAYS=30

# Load environment variables
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
fi

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Log file
LOG_FILE="$BACKUP_DIR/backup.log"

# Function to log messages
log_message() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log_message "========================================="
log_message "Starting database backup"
log_message "========================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log_message "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Perform backup
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"
log_message "Creating backup: $BACKUP_FILE"

pg_dump $DATABASE_URL > "$BACKUP_FILE" 2>> $LOG_FILE

if [ $? -eq 0 ]; then
    log_message "✅ Backup created successfully"
    
    # Get file size
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_message "Backup size: $FILE_SIZE"
    
    # Compress backup
    log_message "Compressing backup..."
    gzip "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        COMPRESSED_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
        log_message "✅ Backup compressed: $COMPRESSED_SIZE"
    else
        log_message "⚠️  Compression failed"
    fi
else
    log_message "❌ Backup failed"
    exit 1
fi

# Remove old backups
log_message "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
DELETED_COUNT=$(find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS | wc -l)
log_message "Removed $DELETED_COUNT old backup(s)"

# Upload to cloud storage (optional - uncomment if using AWS S3)
# if [ -n "$AWS_S3_BUCKET" ]; then
#     log_message "Uploading to S3..."
#     aws s3 cp "$BACKUP_FILE.gz" "s3://$AWS_S3_BUCKET/backups/$DATE/"
#     if [ $? -eq 0 ]; then
#         log_message "✅ Backup uploaded to S3"
#     else
#         log_message "⚠️  S3 upload failed"
#     fi
# fi

# List recent backups
log_message "Recent backups:"
ls -lh $BACKUP_DIR/backup_*.sql.gz | tail -5 | tee -a $LOG_FILE

log_message "========================================="
log_message "Backup completed successfully"
log_message "========================================="

exit 0
