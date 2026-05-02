#!/usr/bin/env bash
#
# Barry — Daily PostgreSQL backup script
# ----------------------------------------------------------
# Run via cron daily. Encrypts the dump with GPG and uploads to S3.
#
# Required env vars (set in .env or your deployment platform):
#   DATABASE_URL         postgres://user:pass@host:5432/dbname
#   BACKUP_S3_BUCKET     s3://my-bucket-name/path
#   BACKUP_GPG_RECIPIENT email or fingerprint of GPG public key to encrypt to
#   AWS_ACCESS_KEY_ID    AWS credentials (or use IAM role)
#   AWS_SECRET_ACCESS_KEY
#
# Cron entry (run at 03:15 daily):
#   15 3 * * * /opt/barry/scripts/backup-db.sh >> /var/log/barry-backup.log 2>&1
#
# Local dev usage (no upload, dumps to /tmp):
#   ./scripts/backup-db.sh --local

set -euo pipefail

LOCAL=false
if [[ "${1:-}" == "--local" ]]; then
  LOCAL=true
fi

TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

DUMP_FILE="$TMPDIR/barry-$TIMESTAMP.sql"
ENCRYPTED_FILE="$DUMP_FILE.gpg"

echo "[$(date -u +%FT%TZ)] Starting backup to $DUMP_FILE"

# === Dump ===
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL not set" >&2
  exit 1
fi

# pg_dump with custom format for parallel restore + better compression
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --compress=9 \
  --file="$DUMP_FILE"

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo "[$(date -u +%FT%TZ)] Dump complete ($DUMP_SIZE)"

# === Encrypt ===
if [[ -z "${BACKUP_GPG_RECIPIENT:-}" ]]; then
  echo "WARN: BACKUP_GPG_RECIPIENT not set, skipping encryption (NOT for production)" >&2
  ENCRYPTED_FILE="$DUMP_FILE"
else
  gpg --batch --yes \
      --trust-model always \
      --recipient "$BACKUP_GPG_RECIPIENT" \
      --output "$ENCRYPTED_FILE" \
      --encrypt "$DUMP_FILE"
  echo "[$(date -u +%FT%TZ)] Encrypted to $ENCRYPTED_FILE"
fi

# === Upload to S3 ===
if [[ "$LOCAL" == "true" ]]; then
  cp "$ENCRYPTED_FILE" "/tmp/$(basename "$ENCRYPTED_FILE")"
  echo "[$(date -u +%FT%TZ)] Local mode: copied to /tmp/"
elif [[ -z "${BACKUP_S3_BUCKET:-}" ]]; then
  echo "ERROR: BACKUP_S3_BUCKET not set" >&2
  exit 1
else
  aws s3 cp "$ENCRYPTED_FILE" "$BACKUP_S3_BUCKET/$(basename "$ENCRYPTED_FILE")" \
    --storage-class STANDARD_IA
  echo "[$(date -u +%FT%TZ)] Uploaded to $BACKUP_S3_BUCKET/$(basename "$ENCRYPTED_FILE")"
fi

# === Retention: delete S3 backups older than 30 days ===
# (only if S3 lifecycle rule isn't already configured)
# Uncomment if you want script-level retention:
#
# if [[ "$LOCAL" != "true" ]]; then
#   aws s3 ls "$BACKUP_S3_BUCKET/" | while read -r line; do
#     fileDate=$(echo "$line" | awk '{print $1}')
#     fileName=$(echo "$line" | awk '{print $4}')
#     if [[ -n "$fileDate" && -n "$fileName" ]]; then
#       fileEpoch=$(date -d "$fileDate" +%s)
#       cutoffEpoch=$(date -d '30 days ago' +%s)
#       if (( fileEpoch < cutoffEpoch )); then
#         aws s3 rm "$BACKUP_S3_BUCKET/$fileName"
#         echo "Deleted old: $fileName"
#       fi
#     fi
#   done
# fi

echo "[$(date -u +%FT%TZ)] Backup complete"
