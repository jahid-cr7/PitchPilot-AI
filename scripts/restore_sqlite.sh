#!/usr/bin/env bash
# =============================================================================
# scripts/restore_sqlite.sh
# =============================================================================
# Restore the PitchPilot AI SQLite database from a backup file.
#
# Usage:
#   ./scripts/restore_sqlite.sh <path-to-backup-file>
#
# Example:
#   ./scripts/restore_sqlite.sh ./backups/pitchpilot-db-20260719-120000.db
#
# WARNING:
#   - This will OVERWRITE the current database.
#   - The API container will be restarted after restore.
#   - Make a fresh backup before restoring if the current data matters.
#
# Prerequisites:
#   - Docker and Docker Compose must be installed
#   - The API container must exist (default name: pitchpilot-api)
#   - Run from the project root directory
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
CONTAINER_NAME="${PITCHPILOT_CONTAINER:-pitchpilot-api}"
DB_PATH_INSIDE="${PITCHPILOT_DB_PATH:-/app/data/pitchpilot.db}"
COMPOSE_FILE="${PITCHPILOT_COMPOSE_FILE:-docker-compose.vps.yml}"

# ---------------------------------------------------------------------------
# Validate arguments
# ---------------------------------------------------------------------------
if [ $# -ne 1 ]; then
    echo "Usage: $0 <path-to-backup-file>"
    echo "Example: $0 ./backups/pitchpilot-db-20260719-120000.db"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: Container '${CONTAINER_NAME}' does not exist."
    exit 1
fi

# ---------------------------------------------------------------------------
# Confirm
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "WARNING: This will OVERWRITE the current database!"
echo "============================================================"
echo "Backup file: ${BACKUP_FILE}"
echo "Target:      ${CONTAINER_NAME}:${DB_PATH_INSIDE}"
echo ""
read -r -p "Are you sure you want to continue? [y/N] " confirm
if [[ ! "${confirm}" =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# ---------------------------------------------------------------------------
# Restore
# ---------------------------------------------------------------------------
echo "Stopping API container..."
docker compose -f "${COMPOSE_FILE}" stop api

echo "Copying backup into container..."
docker cp "${BACKUP_FILE}" "${CONTAINER_NAME}:/tmp/restore.db"

echo "Replacing database..."
docker exec "${CONTAINER_NAME}" sh -c "cp /tmp/restore.db '${DB_PATH_INSIDE}' && rm -f /tmp/restore.db"

echo "Restarting API container..."
docker compose -f "${COMPOSE_FILE}" start api

echo ""
echo "Restore complete. Database now: ${BACKUP_FILE}"
echo "Verify: curl https://api.yourdomain.com/health"
