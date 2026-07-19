#!/usr/bin/env bash
# =============================================================================
# scripts/backup_uploads.sh
# =============================================================================
# Backup the PitchPilot AI uploads volume (temporary video files).
#
# Usage:
#   ./scripts/backup_uploads.sh
#
# The backup is written to ./backups/ as a timestamped tar.gz archive.
# Backups older than 14 days are automatically cleaned up.
#
# Prerequisites:
#   - Docker must be installed
#   - The uploads volume must exist (default: pitchpilotai_pitchpilot-uploads)
#   - Run from the project root directory
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
VOLUME_NAME="${PITCHPILOT_UPLOAD_VOLUME:-pitchpilotai_pitchpilot-uploads}"
BACKUP_DIR="${PITCHPILOT_BACKUP_DIR:-./backups}"
RETENTION_DAYS="${PITCHPILOT_UPLOAD_RETENTION:-14}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="pitchpilot-uploads-${TIMESTAMP}.tar.gz"

# ---------------------------------------------------------------------------
# Validate
# ---------------------------------------------------------------------------
if ! docker volume ls -q | grep -q "^${VOLUME_NAME}$"; then
    echo "Error: Docker volume '${VOLUME_NAME}' not found."
    echo "Has the stack been started at least once?"
    exit 1
fi

# ---------------------------------------------------------------------------
# Backup
# ---------------------------------------------------------------------------
mkdir -p "${BACKUP_DIR}"

echo "Creating uploads archive: ${BACKUP_DIR}/${BACKUP_FILE}"
docker run --rm \
    -v "${VOLUME_NAME}:/source:ro" \
    -v "$(realpath "${BACKUP_DIR}"):/dest" \
    alpine:latest \
    tar czf "/dest/${BACKUP_FILE}" -C /source .

# ---------------------------------------------------------------------------
# Cleanup old backups
# ---------------------------------------------------------------------------
echo "Removing upload backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "pitchpilot-uploads-*.tar.gz" -type f -mtime "+${RETENTION_DAYS}" -delete

echo "Backup complete: ${BACKUP_DIR}/${BACKUP_FILE}"
echo "Current upload backups:"
ls -lh "${BACKUP_DIR}"/pitchpilot-uploads-*.tar.gz 2>/dev/null || echo "  (none)"
