#!/bin/bash

# =====================================================
# PostgreSQL Database Restore Script
# Restore from backup file
# =====================================================

BACKUP_FILE=$1

# Load environment variables
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
fi

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore-database.sh <backup_file>"
    echo "Example: ./restore-database.sh /var/backups/postgres/backup_20250107_140000.sql.gz"
    exit 1
fi

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "========================================="
echo "Database Restore"
echo "========================================="
echo "Backup file: $BACKUP_FILE"
echo "Database: $DATABASE_URL"
echo ""
read -p "⚠️  WARNING: This will OVERWRITE the current database. Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo ""
echo "Starting restore..."

# Extract if gzipped
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "Extracting compressed backup..."
    gunzip -c $BACKUP_FILE | psql $DATABASE_URL
else
    echo "Restoring from uncompressed backup..."
    psql $DATABASE_URL < $BACKUP_FILE
fi

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully"
    echo ""
    echo "Next steps:"
    echo "1. Verify data integrity"
    echo "2. Run migrations if needed: npx prisma migrate deploy"
    echo "3. Restart application"
else
    echo "❌ Restore failed"
    exit 1
fi

echo "========================================="
exit 0
