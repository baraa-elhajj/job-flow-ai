#!/bin/bash

# ===== CONFIG =====
MONGO_URI="mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/linkedin_jobs"
BACKUP_DIR="$HOME/mongo_backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
DEST="$BACKUP_DIR/backup_$DATE"

# ===== CREATE BACKUP =====
mkdir -p "$DEST"

mongodump \
  --uri="$MONGO_URI" \
  --out="$DEST"

# ===== OPTIONAL: COMPRESS =====
tar -czf "$DEST.tar.gz" "$DEST"
rm -rf "$DEST"

# ===== OPTIONAL: CLEAN OLD BACKUPS (keep last 7 days) =====
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DEST.tar.gz"

# crontab -e
# 0 2 * * * /home/YOUR_USER/backup_mongo.sh >> /home/YOUR_USER/mongo_backup.log 2>&1