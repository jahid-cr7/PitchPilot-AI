# PitchPilot AI — Cloud Deployment Plan

**Version:** v1.3.0  
**Date:** 2026-07-19  
**Scope:** FastAPI backend + React frontend production deployment

---

## 1. Recommended Option: VPS + Docker Compose

PitchPilot AI is best deployed on a **VPS (Virtual Private Server)** with Docker Compose for the following reasons:

| Requirement | Why VPS Wins |
|-------------|--------------|
| **Video uploads** | Requires persistent disk for temp files and SQLite |
| **ffmpeg** | Needs system-level binary (not available on all PaaS platforms) |
| **OpenCV** | Heavy C++ dependencies; difficult on serverless platforms |
| **faster-whisper** | ~150 MB model download + ONNX runtime; needs disk + RAM |
| **SQLite volume** | Needs persistent filesystem; ephemeral platforms lose data |
| **ML dependencies** | Large Python wheels (OpenCV, ONNX, PyArrow, NumPy) |
| **Cost** | Flat monthly fee vs. per-request billing for heavy workloads |

**Recommended VPS specs:**
- **CPU:** 2+ cores
- **RAM:** 4 GB minimum, 8 GB recommended
- **Disk:** 40 GB SSD minimum (ML deps + model + uploads + SQLite)
- **OS:** Ubuntu 22.04 LTS or 24.04 LTS
- **Bandwidth:** 1 TB/month minimum (video uploads)

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Reverse Proxy (Caddy / Nginx)                   │
│         TLS termination + static asset caching               │
└──────────┬─────────────────────────────┬────────────────────┘
           │                             │
           ▼                             ▼
┌─────────────────────┐      ┌──────────────────────────────┐
│   Web Container     │      │      API Container           │
│  (nginx :80)        │      │  (uvicorn :8000)             │
│  React static dist  │      │  FastAPI + analyzers         │
└─────────────────────┘      └──────────────┬───────────────┘
                                            │
                               ┌────────────┴────────────┐
                               ▼                         ▼
                    ┌─────────────────┐      ┌──────────────────┐
                    │  SQLite Volume  │      │  Uploads Volume  │
                    │  pitchpilot.db  │      │  temp MP4 files  │
                    └─────────────────┘      └──────────────────┘
```

---

## 3. Deployment Options Comparison

| Platform | Difficulty | Cost | Persistence | ffmpeg | Recommendation |
|----------|-----------|------|-------------|--------|----------------|
| **VPS + Docker** | Medium | $5–20/mo | Full | Yes | **Recommended** |
| **Render** | Easy | Free tier → $7+/mo | Ephemeral disk | Limited | Possible with persistent disk add-on |
| **Railway** | Easy | $5+/mo | Ephemeral | Limited | Possible but volume costs add up |
| **Fly.io** | Medium | $2+/mo | Fly Volumes | Yes | Good option; supports volumes |
| **AWS/GCP/Azure** | Hard | Variable | EBS/Disk | Yes | Overkill for solo/MVP; high complexity |

---

## 4. VPS Deployment Commands (Ubuntu)

### 4.1 Provision Server

1. Create an Ubuntu 22.04/24.04 VPS (DigitalOcean, Hetzner, Linode, AWS Lightsail, etc.)
2. SSH into the server:
   ```bash
   ssh root@your-server-ip
   ```

### 4.2 Install Docker

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify
docker --version
docker compose version
```

### 4.3 Clone Repository

```bash
cd /opt
git clone https://github.com/jahid-cr7/PitchPilot-AI.git
# Or upload via scp: scp -r PitchPilot-AI root@your-server-ip:/opt/
cd PitchPilot-AI
```

### 4.4 Configure Environment

```bash
# Copy production template
cp .env.production.example .env

# Edit with real values
nano .env
```

**Required changes in `.env`:**

| Variable | Example Value | Notes |
|----------|---------------|-------|
| `PITCHPILOT_ENV` | `production` | Required |
| `PITCHPILOT_JWT_SECRET` | `a-long-random-string` | Generate with `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `PITCHPILOT_CORS_ORIGINS` | `https://yourdomain.com` | Must match your frontend domain |
| `PITCHPILOT_AI_API_KEY` | `sk-...` | Your Gemini/OpenAI API key |
| `VITE_API_BASE_URL` | `https://api.yourdomain.com` | Browser-facing API URL |

### 4.5 Configure Domains

Edit `deployment/Caddyfile` and replace the placeholder domains:

```
yourdomain.com       -> your real frontend domain
api.yourdomain.com   -> your real API domain
```

### 4.6 Configure Environment

```bash
# Copy production template
cp .env.production.example .env

# Edit with real values
nano .env
```

**Required changes in `.env`:**

| Variable | Example Value | Notes |
|----------|---------------|-------|
| `PITCHPILOT_ENV` | `production` | Required |
| `PITCHPILOT_JWT_SECRET` | `a-long-random-string` | Generate with `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `PITCHPILOT_CORS_ORIGINS` | `https://yourdomain.com` | Must match your frontend domain |
| `PITCHPILOT_AI_API_KEY` | `sk-...` | Your Gemini/OpenAI API key |
| `VITE_API_BASE_URL` | `https://api.yourdomain.com` | Browser-facing API URL |
| `PUBLIC_WEB_DOMAIN` | `https://yourdomain.com` | Used by deployment scripts |
| `PUBLIC_API_DOMAIN` | `https://api.yourdomain.com` | Used by deployment scripts |

### 4.7 Deploy with One Command

```bash
# One-command deployment (pull, validate, build, start, health check)
./scripts/deploy_vps.sh
```

Or manually:

```bash
# Validate compose file
docker compose -f docker-compose.vps.yml config

# Build and start
docker compose -f docker-compose.vps.yml up --build -d

# Check logs
docker compose -f docker-compose.vps.yml logs -f caddy

# Check health
curl https://api.yourdomain.com/health
```

### 4.8 Restart / Stop

```bash
# Restart all services
docker compose -f docker-compose.vps.yml restart

# Restart only API
docker compose -f docker-compose.vps.yml restart api

# Stop everything
docker compose -f docker-compose.vps.yml down

# Stop and delete volumes (WARNING: data loss)
docker compose -f docker-compose.vps.yml down -v
```

---

## 5. HTTPS

HTTPS is handled automatically by the **Caddy container** in `docker-compose.vps.yml`. Caddy obtains and renews Let's Encrypt certificates without any manual intervention.

**How it works:**
- Caddy listens on ports `80` and `443`
- It proxies `yourdomain.com` → `web:80` and `api.yourdomain.com` → `api:8000`
- TLS certificates are stored in the `caddy-data` volume
- No separate Caddy installation on the host is required

**Requirements:**
- DNS A records must point to the server IP before starting Caddy
- Ports 80 and 443 must be open in the firewall

**Alternative:** If you prefer nginx or Cloudflare, see the manual HTTPS options in [docs/DEPLOYMENT_WEB_API.md](DEPLOYMENT_WEB_API.md).

---

## 6. Backup Plan

### 6.1 SQLite Database Backup

A ready-to-use backup script is included:

```bash
# One-time backup
./scripts/backup_sqlite.sh

# Automated daily backup (add to crontab)
0 2 * * * cd /opt/PitchPilot-AI && ./scripts/backup_sqlite.sh >> /var/log/pitchpilot-backup.log 2>&1
```

The script:
- Creates timestamped backups in `./backups/`
- Automatically cleans up backups older than 7 days
- Uses safe containerized `sqlite3 .backup` (no corruption during copy)

### 6.2 Uploads Volume Backup

```bash
# One-time backup
./scripts/backup_uploads.sh

# Automated weekly backup (add to crontab)
0 3 * * 0 cd /opt/PitchPilot-AI && ./scripts/backup_uploads.sh >> /var/log/pitchpilot-backup.log 2>&1
```

### 6.3 Restore Steps

```bash
# Restore database from a specific backup
./scripts/restore_sqlite.sh ./backups/pitchpilot-db-20260719-120000.db

# Restore uploads from a tar.gz (manual)
docker compose -f docker-compose.vps.yml down
tar xzf ./backups/pitchpilot-uploads-20260719.tar.gz -C /var/lib/docker/volumes/pitchpilotai_pitchpilot-uploads/_data
docker compose -f docker-compose.vps.yml up -d
```

### 6.4 Backup Schedule Recommendation

| Data | Frequency | Retention |
|------|-----------|-----------|
| SQLite database | Daily | 7 days local, 30 days offsite |
| Uploads volume | Weekly | 14 days |
| `.env` file | After every change | Store in password manager |

---

## 7. Environment Variables Reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `PITCHPILOT_ENV` | Yes | `production` | Must be `production` for CORS safety |
| `PITCHPILOT_DB_PATH` | Yes | `/app/data/pitchpilot.db` | SQLite path inside container |
| `PITCHPILOT_CORS_ORIGINS` | Yes | `https://yourdomain.com` | Frontend origin(s), comma-separated |
| `PITCHPILOT_UPLOAD_DIR` | Yes | `/app/uploads` | Temp upload directory |
| `PITCHPILOT_MAX_UPLOAD_MB` | Yes | `200` | Max upload size in MB |
| `PITCHPILOT_AI_API_KEY` | No* | `sk-...` | Required for LLM coaching |
| `PITCHPILOT_AI_BASE_URL` | No* | `https://generativelanguage.googleapis.com/v1beta/openai/` | AI provider endpoint |
| `PITCHPILOT_AI_MODEL` | No* | `gemini-3.5-flash` | Model name |
| `PITCHPILOT_JWT_SECRET` | Yes | `64-char-secret` | **Must be changed from default** |
| `PITCHPILOT_JWT_EXPIRES_MINUTES` | Yes | `1440` | Token lifetime (default 24h) |
| `VITE_API_BASE_URL` | Yes | `https://api.yourdomain.com` | Browser-facing API URL |
| `PUBLIC_WEB_DOMAIN` | Yes | `https://yourdomain.com` | Public web domain (used by deploy script) |
| `PUBLIC_API_DOMAIN` | Yes | `https://api.yourdomain.com` | Public API domain (used by deploy script) |

\* Optional for app startup, but required for AI-powered coaching. Rule-based fallback works without it.

---

## 8. Production Safety Checklist

Before going live, verify every item:

- [ ] **JWT secret changed** — Generate a new 64-byte URL-safe secret; never use `dev-insecure-secret-change-me`
- [ ] **`.env` not committed** — Ensure `.env` is in `.gitignore`; never push secrets
- [ ] **CORS origins correct** — Set to your actual frontend domain(s), not `*` or `localhost`
- [ ] **Frontend API URL correct** — `VITE_API_BASE_URL` must be the browser-facing HTTPS URL
- [ ] **Max upload size set** — Match `PITCHPILOT_MAX_UPLOAD_MB` with your reverse proxy `client_max_body_size`
- [ ] **AI API key secured** — Use environment variables only; never hardcode in source
- [ ] **HTTPS enabled** — Caddy, nginx + certbot, or Cloudflare proxy with TLS
- [ ] **SQLite backed up** — Daily automated backups configured
- [ ] **Disk usage monitored** — ML models + uploads grow over time; set up alerts
- [ ] **Logs checked** — Review `docker compose logs` for errors after first deploy
- [ ] **Health endpoints tested** — `GET /health` and `GET /` return 200
- [ ] **Auth flow tested** — Register, login, dashboard, coaching plan all work
- [ ] **Firewall configured** — Only ports 80, 443, and SSH exposed; 8000/3000 blocked externally
- [ ] **Caddyfile domains configured** — Replace placeholder domains in `deployment/Caddyfile`
- [ ] **Container restart policy** — `restart: unless-stopped` is set in compose
- [ ] **Deploy script tested** — Run `./scripts/deploy_vps.sh` and verify all containers start

---

## 9. Platform-Specific Notes

### Render
- Use a **Web Service** for the API with a **Disk** add-on for SQLite persistence
- Frontend can be a static site; set `VITE_API_BASE_URL` to the API service URL
- Build command: `docker build -f Dockerfile.api .`
- ffmpeg may not be available on all Render plans; verify before deploying

### Railway
- Supports Dockerfiles and volumes via persistent directories
- Set all environment variables in the Railway dashboard
- Build can be slow due to ML dependencies; use a higher tier for faster builds

### Fly.io
- Excellent for Docker-based apps with `fly volumes` for persistence
- Run `fly launch` after configuring `fly.toml`
- Use `fly volumes create` for SQLite and uploads
- Supports Docker natively; good fit for PitchPilot AI

### AWS / GCP / Azure
- Use EC2 / Compute Engine / Virtual Machines with Docker Compose
- Mount EBS / Persistent Disk for SQLite and uploads
- Place behind Application Load Balancer / Cloud Load Balancing
- Overkill for solo developers; consider only for team/enterprise scale

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Build fails / times out | Slow network downloading ML wheels | Retry the build; pip resumes downloads |
| `401 Not authenticated` | Wrong or missing JWT secret | Regenerate secret, rebuild API container |
| CORS errors in browser | `PITCHPILOT_CORS_ORIGINS` missing domain | Add exact frontend URL including protocol |
| `413 Request Entity Too Large` | nginx/Caddy limit too low | Increase `client_max_body_size` to match `.env` |
| SQLite permission denied | Volume mounted as wrong user | Run `chmod 777` on host data directory |
| Frontend blank page | `VITE_API_BASE_URL` is internal Docker URL | Set to browser-facing HTTPS URL and rebuild web image |
| Health check fails | faster-whisper downloading model | Wait 1–2 minutes; check `docker logs` |

---

## 11. Next Steps After Deployment

1. **Custom domain** — Point DNS A record to your VPS IP
2. **HTTPS** — Configure Caddy or nginx with Let's Encrypt
3. **Monitoring** — Set up Uptime Kuma or similar for health alerts
4. **Log aggregation** — Consider `docker logging driver` or journald
5. **CI/CD** — GitHub Actions can SSH into your VPS and run `docker compose up --build -d`

---

*For local Docker deployment details, see [docs/DEPLOYMENT_WEB_API.md](DEPLOYMENT_WEB_API.md).*
