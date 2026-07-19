#!/usr/bin/env bash
# =============================================================================
# scripts/backup_sqlite.sh
# =============================================================================
# Backup the PitchPilot AI SQLite database from the running Docker container.
#
# Usage:
#   ./scripts/backup_sqlite.sh
#
# The backup is written to ./backups/ with a timestamped filename.
# Backups older than 7 days are automatically cleaned up.
#
# Prerequisites:
#   - Docker and Docker Compose must be installed
#   - The API container must be running (default name: pitchpilot-api)
#   - Run from the project root directory
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
CONTAINER_NAME="${PITCHPILOT_CONTAINER:-pitchpilot-api}"
DB_PATH_INSIDE="${PITCHPILOT_DB_PATH:-/app/data/pitchpilot.db}"
BACKUP_DIR="${PITCHPILOT_BACKUP_DIR:-./backups}"
RETENTION_DAYS="${PITCHPILOT_BACKUP_RETENTION:-7}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="pitchpilot-db-${TIMESTAMP}.db"

# ---------------------------------------------------------------------------
# Validate
# ---------------------------------------------------------------------------
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: Container '${CONTAINER_NAME}' is not running."
    echo "Start the stack first: docker compose -f docker-compose.vps.yml up -d"
    exit 1
fi

# ---------------------------------------------------------------------------
# Backup
# ---------------------------------------------------------------------------
mkdir -p "${BACKUP_DIR}"

echo "Creating SQLite backup inside container..."
docker exec "${CONTAINER_NAME}" sqlite3 "${DB_PATH_INSIDE}" ".backup /tmp/${BACKUP_FILE}"

echo "Copying backup to host: ${BACKUP_DIR}/${BACKUP_FILE}"
docker cp "${CONTAINER_NAME}:/tmp/${BACKUP_FILE}" "${BACKUP_DIR}/${BACKUP_FILE}"

echo "Cleaning up temporary file inside container..."
docker exec "${CONTAINER_NAME}" rm -f "/tmp/${BACKUP_FILE}"

# ---------------------------------------------------------------------------
# Cleanup old backups
# ---------------------------------------------------------------------------
echo "Removing backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "pitchpilot-db-*.db" -type f -mtime "+${RETENTION_DAYS}" -delete

echo "Backup complete: ${BACKUP_DIR}/${BACKUP_FILE}"
echo "Current backups:"
ls -lh "${BACKUP_DIR}"/pitchpilot-db-*.db 2>/dev/null || echo "  (none)"
