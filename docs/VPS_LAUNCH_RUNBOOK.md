# PitchPilot AI — VPS Launch Runbook

**Version:** v1.3.0  
**Date:** 2026-07-19  
**Purpose:** Step-by-step checklist for deploying PitchPilot AI on a public VPS with Docker Compose, Caddy HTTPS, and automated backups.

---

## A. Pre-Launch Checklist

Before running any commands, verify you have completed the following:

| # | Item | Status |
|---|------|--------|
| 1 | **VPS purchased** — Ubuntu 22.04 LTS or 24.04 LTS, 2+ cores, 4 GB RAM, 40 GB SSD | [ ] |
| 2 | **Domain purchased** — You own `yourdomain.com` and `api.yourdomain.com` (or a subdomain) | [ ] |
| 3 | **DNS A records configured** — Both domains point to your VPS IP | [ ] |
| 4 | **SSH key configured** — You can log in as a non-root user with sudo | [ ] |
| 5 | **Docker installed** — `docker --version` and `docker compose version` work | [ ] |
| 6 | **Repository cloned** — Code is on the server at `/opt/PitchPilot-AI` | [ ] |
| 7 | **`.env` created** — Copied from `.env.production.example` and edited | [ ] |
| 8 | **Strong JWT secret set** — Generated with `secrets.token_urlsafe(64)` | [ ] |
| 9 | **CORS origins set** — `PITCHPILOT_CORS_ORIGINS` lists your real domain(s) | [ ] |
| 10 | **AI API key configured** — `PITCHPILOT_AI_API_KEY` is set (optional for rule-based fallback) | [ ] |
| 11 | **Caddy domains edited** — `deployment/Caddyfile` uses your real domains | [ ] |
| 12 | **Firewall configured** — Only ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) are open | [ ] |

---

## B. DNS Checklist

### Required records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `yourdomain.com` | `your-vps-ip` | 300 |
| A | `api.yourdomain.com` | `your-vps-ip` | 300 |

### Verify DNS propagation

```bash
# Check from your local machine
dig +short yourdomain.com
dig +short api.yourdomain.com
nslookup yourdomain.com

# Check from the VPS itself
ping -c 1 yourdomain.com
ping -c 1 api.yourdomain.com
```

> **Wait before deploying:** DNS can take 1–60 minutes to propagate. Caddy will fail to obtain certificates if DNS is not yet pointing to the server.

---

## C. Firewall Commands

```bash
# Log in to your VPS
ssh user@your-vps-ip

# Install and configure UFW
sudo apt update
sudo apt install -y ufw

# Default: deny all incoming
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow required ports
sudo ufw allow OpenSSH      # port 22
sudo ufw allow 80/tcp       # HTTP (Caddy → Let's Encrypt)
sudo ufw allow 443/tcp      # HTTPS

# Enable firewall
sudo ufw enable

# Verify status
sudo ufw status verbose
```

Expected output:
```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp (OpenSSH)           ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
```

> **Do not** expose ports 8000 or 3000 externally. They are internal to the Docker network only.

---

## D. Deployment Commands

```bash
cd /opt/PitchPilot-AI

# 1. Pull latest code (if updating)
git pull origin main

# 2. Validate compose configuration
docker compose -f docker-compose.vps.yml config

# 3. Deploy with the helper script
./scripts/deploy_vps.sh
```

The `deploy_vps.sh` script performs:
- Git pull
- Docker Compose validation
- Image build and container start
- Health check polling (up to 30 attempts)
- Container status display

### Manual deployment (if not using the script)

```bash
# Build and start all services
docker compose -f docker-compose.vps.yml up --build -d

# Check container status
docker compose -f docker-compose.vps.yml ps

# Follow logs
docker compose -f docker-compose.vps.yml logs -f

# Follow API logs only
docker compose -f docker-compose.vps.yml logs -f api

# Follow Caddy logs only
docker compose -f docker-compose.vps.yml logs -f caddy
```

---

## E. Health Checks

Run these commands after deployment to verify the system is live:

```bash
# 1. API health
curl -s https://api.yourdomain.com/health
# Expected: {"status":"ok"}

# 2. Frontend loads
curl -I -s https://yourdomain.com
# Expected: HTTP/2 200

# 3. API docs reachable
curl -s https://api.yourdomain.com/docs | head -n 5
# Expected: HTML containing "Swagger UI"

# 4. Register a test account
curl -s -X POST https://api.yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'
# Expected: {"access_token":"eyJ...","token_type":"bearer","user":{...}}

# 5. Log in
curl -s -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 6. Dashboard stats (replace <token>)
curl -s https://api.yourdomain.com/api/v1/dashboard/stats \
  -H "Authorization: Bearer <token>"
# Expected: {"status":"success","total_sessions":0,...}

# 7. Coaching plan
curl -s https://api.yourdomain.com/api/v1/users/me/coaching-plan \
  -H "Authorization: Bearer <token>"

# 8. Goals list
curl -s https://api.yourdomain.com/api/v1/users/me/goals \
  -H "Authorization: Bearer <token>"

# 9. Upload a real video (replace <token>)
curl -s -X POST https://api.yourdomain.com/api/v1/analyze/full \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/test.mp4" \
  -F "question=Tell me about yourself." \
  -F "role=Software Developer"
```

### Browser verification

1. Open `https://yourdomain.com` in a browser.
2. Verify the padlock icon (HTTPS) is present.
3. Register a new account via the web UI.
4. Log in and navigate to Dashboard.
5. Upload a short MP4 video and run analysis.
6. Check that Coaching Plan and Goals pages load.

---

## F. Backup Setup

### Automated daily SQLite backup

```bash
crontab -e
```

Add:
```cron
# Daily SQLite backup at 02:00
0 2 * * * cd /opt/PitchPilot-AI && ./scripts/backup_sqlite.sh >> /var/log/pitchpilot-backup.log 2>&1
```

### Automated weekly uploads backup

```bash
crontab -e
```

Add:
```cron
# Weekly uploads backup at 03:00 on Sundays
0 3 * * 0 cd /opt/PitchPilot-AI && ./scripts/backup_uploads.sh >> /var/log/pitchpilot-backup.log 2>&1
```

### Verify backups are created

```bash
ls -lh /opt/PitchPilot-AI/backups/
```

### Restore test reminder

> **Before going live, test a restore.** Pick a backup file and run:
> ```bash
> ./scripts/restore_sqlite.sh ./backups/pitchpilot-db-YYYYMMDD-HHMMSS.db
> ```
> Confirm the app still works after restore. This validates your backup strategy.

---

## G. Rollback Plan

If a deployment breaks the application, follow these steps:

### 1. Roll back code

```bash
cd /opt/PitchPilot-AI

# View recent commits
git log --oneline -10

# Roll back to the previous stable commit
git checkout <previous-commit-hash>

# Or roll back to the previous tag
git checkout v1.2.3
```

### 2. Rebuild and restart

```bash
./scripts/deploy_vps.sh
```

### 3. Restore database (if data was corrupted)

```bash
# Stop containers first
docker compose -f docker-compose.vps.yml down

# Restore from the most recent backup
LATEST=$(ls -t ./backups/pitchpilot-db-*.db | head -n 1)
./scripts/restore_sqlite.sh "$LATEST"

# Restart
docker compose -f docker-compose.vps.yml up -d
```

### 4. Verify rollback

```bash
curl -s https://api.yourdomain.com/health
docker compose -f docker-compose.vps.yml ps
```

---

## H. Monitoring Checklist

Run these checks weekly (or set up automated monitoring):

| Check | Command | Alert if |
|-------|---------|----------|
| Container status | `docker compose -f docker-compose.vps.yml ps` | Any container is not `healthy` or `Up` |
| API logs | `docker compose -f docker-compose.vps.yml logs api --tail 100` | Repeated errors or 500s |
| Caddy logs | `docker compose -f docker-compose.vps.yml logs caddy --tail 100` | Certificate errors or 403s |
| Disk usage | `df -h` | Root partition > 80% |
| Upload volume | `docker system df -v` | Uploads growing unexpectedly |
| Backup folder | `du -sh ./backups/` | Backups not being created |
| Container restarts | `docker inspect pitchpilot-api | grep RestartCount` | High restart count |

### Simple uptime check (cron every 5 minutes)

```bash
crontab -e
```

Add:
```cron
*/5 * * * * curl -sf https://api.yourdomain.com/health || echo "$(date): API down" >> /var/log/pitchpilot-uptime.log
```

---

## I. Common Launch Errors

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| **Caddy certificate error** | DNS not yet propagated to the VPS IP | Wait 5–60 minutes; verify with `dig yourdomain.com` |
| **CORS blocked in browser** | `PITCHPILOT_CORS_ORIGINS` does not include the web domain | Update `.env` with exact `https://yourdomain.com`, rebuild API image |
| **401 Unauthorized** | JWT secret rotated or token expired | Log out and log in again; verify `PITCHPILOT_JWT_SECRET` is stable |
| **413 Request Entity Too Large** | Upload exceeds Caddy `max_size` or `PITCHPILOT_MAX_UPLOAD_MB` | Align both values; increase if needed |
| **Frontend blank page** | `VITE_API_BASE_URL` is internal Docker URL | Set to public `https://api.yourdomain.com` and rebuild web image |
| **API health fails** | Container crashed or still starting | Check logs: `docker compose logs api --tail 50` |
| **Docker build very slow** | Heavy ML wheels downloading on first build | Normal — wait 10–15 minutes; subsequent builds are fast |
| **SQLite permission denied** | Volume mounted with wrong user/permissions | `chmod 777` on host data directory or recreate volume |
| **Rate limit 429** | Too many requests from same IP | Wait for the limit window to reset; check `api/rate_limiter.py` defaults |
| **Caddy shows 502 Bad Gateway** | API container is not healthy | Check `docker compose ps`; restart API: `docker compose restart api` |

---

## Post-Launch Sign-Off

Before announcing the launch, confirm:

- [ ] HTTPS works on both domains (padlock icon in browser)
- [ ] Registration and login work via the web UI
- [ ] Dashboard loads with zero sessions for a new user
- [ ] Video upload and analysis complete successfully
- [ ] Coaching plan and goals pages load
- [ ] Backups are being created automatically
- [ ] Firewall is active and only 22/80/443 are open
- [ ] Logs show no errors after 30 minutes of uptime
- [ ] `.env` is not in the Git repository (`git status` is clean)
- [ ] JWT secret is strong and unique
- [ ] Rate limits are active (tested with repeated requests)

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| [DEPLOYMENT_WEB_API.md](DEPLOYMENT_WEB_API.md) | Local Docker deployment, env vars, troubleshooting |
| [CLOUD_DEPLOYMENT_PLAN.md](CLOUD_DEPLOYMENT_PLAN.md) | Cloud platform comparison, architecture, backup strategy |
| [SECURITY_HARDENING.md](SECURITY_HARDENING.md) | JWT rules, CORS, rate limits, headers, incident response |
| [FULL_SYSTEM_QA_V1_3.md](FULL_SYSTEM_QA_V1_3.md) | QA results, test checklist, known limitations |

---

*Good luck with your launch! 🚀*
