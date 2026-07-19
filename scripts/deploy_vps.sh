#!/usr/bin/env bash
# =============================================================================
# scripts/deploy_vps.sh
# =============================================================================
# One-command VPS deployment helper for PitchPilot AI.
#
# Usage:
#   ./scripts/deploy_vps.sh
#
# This script:
#   1. Pulls the latest Git changes (if run inside a git repo)
#   2. Validates the Docker Compose configuration
#   3. Builds and starts all containers
#   4. Shows running container status
#   5. Tests the API health endpoint
#
# Prerequisites:
#   - Docker and Docker Compose must be installed
#   - .env file must exist and be configured
#   - Run from the project root directory
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
COMPOSE_FILE="${PITCHPILOT_COMPOSE_FILE:-docker-compose.vps.yml}"
CADDYFILE="${PITCHPILOT_CADDYFILE:-deployment/Caddyfile}"
HEALTH_URL="${PITCHPILOT_HEALTH_URL:-http://localhost:8000/health}"
MAX_HEALTH_RETRIES="${PITCHPILOT_HEALTH_RETRIES:-30}"
HEALTH_INTERVAL="${PITCHPILOT_HEALTH_INTERVAL:-2}"

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
info "Pre-flight checks..."

if [ ! -f ".env" ]; then
    error ".env file not found."
    echo "Copy the template and configure it:"
    echo "  cp .env.production.example .env"
    echo "  nano .env"
    exit 1
fi

if [ ! -f "${CADDYFILE}" ]; then
    error "Caddyfile not found at ${CADDYFILE}"
    echo "Ensure deployment/Caddyfile exists and domains are configured."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    error "Docker is not installed."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    error "Docker Compose plugin is not installed."
    exit 1
fi

# ---------------------------------------------------------------------------
# Git pull (optional)
# ---------------------------------------------------------------------------
if [ -d ".git" ]; then
    info "Pulling latest changes from Git..."
    git pull || warn "Git pull failed (continuing with local code)"
else
    warn "Not a Git repository. Skipping git pull."
fi

# ---------------------------------------------------------------------------
# Validate compose
# ---------------------------------------------------------------------------
info "Validating Docker Compose configuration..."
docker compose -f "${COMPOSE_FILE}" config > /dev/null
info "Compose configuration is valid."

# ---------------------------------------------------------------------------
# Build and start
# ---------------------------------------------------------------------------
info "Building and starting containers..."
docker compose -f "${COMPOSE_FILE}" pull caddy || true
docker compose -f "${COMPOSE_FILE}" up --build -d

# ---------------------------------------------------------------------------
# Wait for API health
# ---------------------------------------------------------------------------
info "Waiting for API to become healthy..."
attempt=0
while [ ${attempt} -lt ${MAX_HEALTH_RETRIES} ]; do
    if curl -sf "${HEALTH_URL}" > /dev/null 2>&1; then
        info "API is healthy!"
        break
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep "${HEALTH_INTERVAL}"
done

if [ ${attempt} -eq ${MAX_HEALTH_RETRIES} ]; then
    warn "API health check timed out after ${MAX_HEALTH_RETRIES} attempts."
    warn "Check logs: docker compose -f ${COMPOSE_FILE} logs api"
fi

# ---------------------------------------------------------------------------
# Status
# ---------------------------------------------------------------------------
echo ""
info "Container status:"
docker compose -f "${COMPOSE_FILE}" ps

echo ""
info "Deployment complete!"
echo ""
echo "Services:"
echo "  Web:    https://yourdomain.com     (replace with your domain)"
echo "  API:    https://api.yourdomain.com (replace with your domain)"
echo "  Health: ${HEALTH_URL}"
echo ""
echo "Useful commands:"
echo "  View logs:     docker compose -f ${COMPOSE_FILE} logs -f"
echo "  View API log:  docker compose -f ${COMPOSE_FILE} logs -f api"
echo "  Stop:          docker compose -f ${COMPOSE_FILE} down"
echo "  Backup DB:     ./scripts/backup_sqlite.sh"
echo "  Backup Uploads: ./scripts/backup_uploads.sh"
