# Job Flow AI Production Deployment

This runbook deploys Job Flow AI on an Ubuntu 24.04 VPS at:

```text
https://chakerjowajdi.online
```

Production architecture:

- Nginx serves the React build and terminates HTTPS.
- Nginx proxies `/api` to the Node API on `127.0.0.1:4000`.
- SQLite is the source of truth at `/var/lib/job-flow-ai/jobs.db`.
- Native Meilisearch runs on `127.0.0.1:7700`.
- LinkedIn runs every 12 hours in GitHub Actions and sends jobs through the HTTPS scraper API.
- HN Hiring runs in the Node API process through the existing `node-cron` scheduler.
- Bayt runs every 12 hours from host cron. Its wrapper starts Byparr in Docker, runs the Python scraper through the backend scraper API, and removes Byparr afterward.

Do not expose ports `4000`, `7700`, or `8191` publicly.

## 1. Prepare the repository before deployment

The VPS must clone a revision containing all current application changes. On the development machine:

```bash
cd /home/wajdi/Desktop/job-flow-ai
git status
```

Review the changes carefully. Do not commit `.env`, database files, API keys, credentials, or Meilisearch data.

The production revision must include:

- Protected client routes.
- Protected `/api/jobs` routes.
- `/api/scraper/jobs` and `/api/scraper/existing-urls`.
- `SCRAPER_API_KEY` middleware.
- SQLite insertion and Meilisearch auto-indexing.
- The Python scraper API client.
- The LinkedIn GitHub Actions workflow.
- Bayt API storage support described below.

### 1.1 Make Bayt use the backend scraper API

The current Bayt sample must not write directly to VPS SQLite from cron. It should use the same API-storage fallback pattern as the LinkedIn sample.

Open:

```bash
cd /home/wajdi/Desktop/job-flow-ai
nano linkedin_scraper/samples/scrape_bayt_past_24h.py
```

Add these imports near the existing storage imports:

```python
from linkedin_scraper.storage.api_client import (
    get_existing_job_urls as get_existing_api_job_urls,
    ingest_jobs as ingest_jobs_via_api,
    is_api_storage_enabled,
)
```

Add these functions before `main()`:

```python
def get_existing_urls(sqlite_path: str, urls: List[str]) -> Set[str]:
    if is_api_storage_enabled():
        return get_existing_api_job_urls(urls)
    return get_existing_sqlite_job_urls(sqlite_path, urls)


def save_jobs(sqlite_path: str, documents: List[dict]) -> None:
    if not documents:
        log("No documents to insert")
        return

    if is_api_storage_enabled():
        log(f"Sending {len(documents)} job(s) to backend API...")
        result = ingest_jobs_via_api(documents)
        log(
            f"API ingest complete: inserted {result['inserted']}, "
            f"skipped {result['skipped']}"
        )
        return

    log(f"Inserting {len(documents)} job(s) into SQLite...")
    sqlite_count = insert_jobs_into_sqlite(sqlite_path, documents)
    log(f"Inserted {sqlite_count} jobs into SQLite ({sqlite_path})")
```

Replace:

```python
existing_urls = get_existing_sqlite_job_urls(
    sqlite_path, normalized_search_urls
)
```

with:

```python
existing_urls = get_existing_urls(sqlite_path, normalized_search_urls)
```

Replace:

```python
if documents:
    log(f"Inserting {len(documents)} new job(s) into SQLite...")
    sqlite_count = insert_jobs_into_sqlite(sqlite_path, documents)
    log(f"Inserted {sqlite_count} jobs into SQLite ({sqlite_path})")
else:
    log("No documents to insert")
```

with:

```python
save_jobs(sqlite_path, documents)
```

Verify the script:

```bash
python3 -m py_compile \
  linkedin_scraper/samples/scrape_bayt_past_24h.py

rg "is_api_storage_enabled|ingest_jobs_via_api" \
  linkedin_scraper/samples/scrape_bayt_past_24h.py
```

### 1.2 Build locally before pushing

```bash
cd /home/wajdi/Desktop/job-flow-ai
npm ci
npm ci --prefix server
npm ci --prefix client
npm run build-all
```

Commit the reviewed production changes and push them to the branch that will be deployed:

```bash
git status
git add <REVIEWED_FILES_ONLY>
git commit -m "Prepare production deployment"
git push
```

Do not use `git add .` without reviewing every untracked and modified file.

## 2. Configure DNS

In the DNS management panel for `chakerjowajdi.online`, create:

```text
Type: A
Name: @
Value: YOUR_VPS_PUBLIC_IP
TTL: 300
```

Optionally configure `www`:

```text
Type: CNAME
Name: www
Value: chakerjowajdi.online
TTL: 300
```

Verify from the development machine:

```bash
nslookup chakerjowajdi.online
```

The returned address must match the VPS public IP before requesting a TLS certificate.

## 3. Connect to the VPS

```bash
ssh YOUR_VPS_USER@YOUR_VPS_PUBLIC_IP
```

Set deployment variables. Replace every placeholder:

```bash
export DOMAIN="chakerjowajdi.online"
export EMAIL="YOUR_EMAIL_ADDRESS"
export REPO_URL="https://github.com/YOUR_USERNAME/job-flow-ai.git"
export GOOGLE_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
export APP_USER="$(id -un)"
```

If the SSH session is disconnected, set these variables again before running later commands that use them.

## 4. Update Ubuntu and install packages

```bash
sudo apt update
sudo apt upgrade -y
```

```bash
sudo apt install -y \
  curl \
  git \
  nginx \
  certbot \
  python3-certbot-nginx \
  sqlite3 \
  openssl \
  build-essential \
  python3 \
  python3-venv \
  python3-pip \
  docker.io \
  dnsutils \
  util-linux \
  ufw
```

Install Node.js 24:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

```bash
node --version
npm --version
python3 --version
```

Enable Docker:

```bash
sudo systemctl enable --now docker
sudo docker version
```

## 5. Configure the firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow "Nginx Full"
sudo ufw --force enable
sudo ufw status
```

The firewall should permit only SSH, HTTP, and HTTPS. Do not add public rules for `4000`, `7700`, or `8191`.

## 6. Clone the application

```bash
sudo mkdir -p /opt/job-flow-ai
sudo chown "$APP_USER":"$APP_USER" /opt/job-flow-ai
```

```bash
git clone "$REPO_URL" /opt/job-flow-ai
cd /opt/job-flow-ai
```

For a private repository, configure an SSH deploy key or use an authenticated GitHub URL. Verify the deployed revision:

```bash
git status
git log -1 --oneline
```

## 7. Install JavaScript and Python dependencies

```bash
cd /opt/job-flow-ai
npm ci
npm ci --prefix server
npm ci --prefix client
```

Create the Python virtual environment:

```bash
python3 -m venv /opt/job-flow-ai/linkedin_scraper/.venv
```

```bash
/opt/job-flow-ai/linkedin_scraper/.venv/bin/pip install \
  --upgrade pip
```

```bash
/opt/job-flow-ai/linkedin_scraper/.venv/bin/pip install \
  -r /opt/job-flow-ai/linkedin_scraper/requirements.txt
```

LinkedIn runs in GitHub Actions, so Playwright Chromium does not need to be installed on the VPS. Bayt uses Byparr instead of host Playwright.

## 8. Install native Meilisearch

```bash
cd /tmp
curl -L https://install.meilisearch.com | sh
sudo install -m 755 meilisearch /usr/local/bin/meilisearch
meilisearch --version
```

Create persistent application storage:

```bash
sudo mkdir -p /var/lib/job-flow-ai
sudo mkdir -p /var/lib/meilisearch
sudo chown -R "$APP_USER":"$APP_USER" /var/lib/job-flow-ai
sudo chown -R "$APP_USER":"$APP_USER" /var/lib/meilisearch
```

## 9. Copy the current `.env` securely

The current backend environment may contain values such as the Google client ID, DeepSeek key, proxy configuration, and other application settings that should be preserved. Copy it over SSH instead of committing it to Git.

Run this command on the development machine, not on the VPS:

```bash
scp /home/wajdi/Desktop/job-flow-ai/server/.env \
  YOUR_VPS_USER@YOUR_VPS_PUBLIC_IP:/tmp/job-flow-server.env
```

Reconnect to the VPS if necessary:

```bash
ssh YOUR_VPS_USER@YOUR_VPS_PUBLIC_IP
```

Restore the deployment variables:

```bash
export DOMAIN="chakerjowajdi.online"
export EMAIL="YOUR_EMAIL_ADDRESS"
export GOOGLE_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
export APP_USER="$(id -un)"
```

Create the protected configuration directory:

```bash
sudo install -d \
  -m 750 \
  -o root \
  -g "$APP_USER" \
  /etc/job-flow-ai
```

Install the copied file as a protected temporary import:

```bash
sudo install \
  -o root \
  -g "$APP_USER" \
  -m 640 \
  /tmp/job-flow-server.env \
  /etc/job-flow-ai/server.env.imported
```

Securely remove the upload from `/tmp`:

```bash
shred -u /tmp/job-flow-server.env
```

Confirm that the imported file exists without printing its secrets:

```bash
sudo test -s /etc/job-flow-ai/server.env.imported
sudo awk -F= \
  '/^[A-Za-z_][A-Za-z0-9_]*=/{print $1}' \
  /etc/job-flow-ai/server.env.imported
```

Do not copy `.env` into Git and do not leave the temporary upload under `/tmp`.

## 10. Generate secrets and create the production environment

Generate independent secrets:

```bash
JWT_SECRET="$(openssl rand -hex 32)"
SCRAPER_API_KEY="$(openssl rand -hex 32)"
MEILI_MASTER_KEY="$(openssl rand -hex 32)"
```

Create the backend production environment:

```bash
sudo tee /etc/job-flow-ai/server.env >/dev/null <<EOF
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://${DOMAIN}
SQLITE_DB_PATH=/var/lib/job-flow-ai/jobs.db

MEILI_HOST=http://127.0.0.1:7700
MEILI_API_KEY=${MEILI_MASTER_KEY}

GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
JWT_SECRET=${JWT_SECRET}
SCRAPER_API_KEY=${SCRAPER_API_KEY}
EOF
```

Set permissions:

```bash
sudo chown root:"$APP_USER" /etc/job-flow-ai/server.env
sudo chmod 640 /etc/job-flow-ai/server.env
```

Compare only the variable names in the imported and production files:

```bash
echo "Imported variables:"
sudo awk -F= \
  '/^[A-Za-z_][A-Za-z0-9_]*=/{print $1}' \
  /etc/job-flow-ai/server.env.imported \
  | sort

echo "Production variables:"
sudo awk -F= \
  '/^[A-Za-z_][A-Za-z0-9_]*=/{print $1}' \
  /etc/job-flow-ai/server.env \
  | sort
```

Open both files and manually copy any still-needed optional values, such as `DEEPSEEK_API_KEY`, proxy settings, or scraper limits, into the production file:

```bash
sudoedit /etc/job-flow-ai/server.env.imported
sudoedit /etc/job-flow-ai/server.env
```

Do not copy local development values for `PORT`, `FRONTEND_URL`, `SQLITE_DB_PATH`, `MEILI_HOST`, `MEILI_API_KEY`, `JWT_SECRET`, or `SCRAPER_API_KEY` over the production values created above.

After merging and checking the production file, securely delete the imported copy:

```bash
sudo shred -u /etc/job-flow-ai/server.env.imported
```

Create the Meilisearch environment:

```bash
sudo tee /etc/job-flow-ai/meilisearch.env >/dev/null <<EOF
MEILI_ENV=production
MEILI_MASTER_KEY=${MEILI_MASTER_KEY}
EOF
```

```bash
sudo chown root:"$APP_USER" /etc/job-flow-ai/meilisearch.env
sudo chmod 640 /etc/job-flow-ai/meilisearch.env
```

Do not commit either environment file.

## 11. Configure and build the React client

The Google client ID is embedded at build time:

```bash
tee /opt/job-flow-ai/client/.env.production >/dev/null <<EOF
VITE_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
EOF
```

```bash
chmod 600 /opt/job-flow-ai/client/.env.production
```

Build the client and server:

```bash
cd /opt/job-flow-ai
npm run build-all
```

Confirm both artifacts exist:

```bash
test -f /opt/job-flow-ai/client/dist/index.html
test -f /opt/job-flow-ai/server/dist/server.js
```

## 12. Create the Meilisearch systemd service

```bash
sudo tee /etc/systemd/system/meilisearch.service >/dev/null <<EOF
[Unit]
Description=Job Flow Meilisearch
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
EnvironmentFile=/etc/job-flow-ai/meilisearch.env
ExecStart=/usr/local/bin/meilisearch --http-addr=127.0.0.1:7700 --db-path=/var/lib/meilisearch --master-key=\${MEILI_MASTER_KEY}
Restart=always
RestartSec=5
LimitNOFILE=65535
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
```

## 13. Create the API and HN scheduler systemd service

Run exactly one API process because the HN Hiring cron scheduler runs inside it. Multiple API processes would create duplicate scheduled executions.

```bash
sudo tee /etc/systemd/system/job-flow-api.service >/dev/null <<EOF
[Unit]
Description=Job Flow API and HN Scheduler
After=network-online.target meilisearch.service
Wants=network-online.target meilisearch.service

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=/opt/job-flow-ai/server
EnvironmentFile=/etc/job-flow-ai/server.env
ExecStart=/usr/bin/node /opt/job-flow-ai/server/dist/server.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
```

Enable and start both services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now meilisearch
sudo systemctl enable --now job-flow-api
```

Verify:

```bash
sudo systemctl status meilisearch --no-pager
sudo systemctl status job-flow-api --no-pager
curl http://127.0.0.1:7700/health
curl http://127.0.0.1:4000/api/health
```

Inspect startup logs if either service fails:

```bash
sudo journalctl -u meilisearch -n 100 --no-pager
sudo journalctl -u job-flow-api -n 100 --no-pager
```

## 14. Configure Nginx

```bash
sudo tee /etc/nginx/sites-available/job-flow-ai >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;

    server_name ${DOMAIN};

    root /opt/job-flow-ai/client/dist;
    index index.html;

    client_max_body_size 5m;

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_connect_timeout 10s;
        proxy_read_timeout 120s;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
```

Enable the site and disable the default:

```bash
sudo ln -sfn \
  /etc/nginx/sites-available/job-flow-ai \
  /etc/nginx/sites-enabled/job-flow-ai
```

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx
```

Verify HTTP before requesting the certificate:

```bash
curl http://chakerjowajdi.online/api/health
curl -I http://chakerjowajdi.online/
```

Do not continue to Certbot until DNS and HTTP work.

## 15. Enable HTTPS

```bash
sudo certbot --nginx \
  --domain chakerjowajdi.online \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --redirect
```

Verify:

```bash
curl https://chakerjowajdi.online/api/health
curl -I https://chakerjowajdi.online/
sudo certbot renew --dry-run
```

## 16. Configure Google OAuth

In Google Cloud Console:

1. Open **APIs & Services → Credentials**.
2. Open the OAuth 2.0 Web Client used by this project.
3. Add this authorized JavaScript origin:

```text
https://chakerjowajdi.online
```

4. Save the credential.
5. Confirm that the client ID is identical in:

```text
/etc/job-flow-ai/server.env
/opt/job-flow-ai/client/.env.production
```

If the ID was changed, rebuild and restart:

```bash
cd /opt/job-flow-ai
npm run build:client
sudo systemctl restart job-flow-api
sudo systemctl reload nginx
```

Open the site and test sign-in:

```text
https://chakerjowajdi.online
```

Test logout, login persistence, protected routes, and a direct visit to `/hidden`.

## 17. Configure LinkedIn GitHub Actions

Retrieve the backend scraper key:

```bash
sudo awk -F= \
  '$1 == "SCRAPER_API_KEY" { print $2 }' \
  /etc/job-flow-ai/server.env
```

In the GitHub repository:

1. Open **Settings → Secrets and variables → Actions**.
2. Add:

```text
SCRAPER_API_URL=https://chakerjowajdi.online/api/scraper
SCRAPER_API_KEY=<value printed by the command above>
PROXY=<LinkedIn proxy in the format expected by the scraper>
```

If the workflow is updated to pass a proxy pool, also add:

```text
PROXY_LIST=proxy1|proxy2|proxy3
```

The existing workflow runs every 12 hours. Test invalid authentication:

```bash
curl -i \
  -X POST \
  https://chakerjowajdi.online/api/scraper/existing-urls \
  -H "Authorization: Bearer invalid" \
  -H "Content-Type: application/json" \
  --data '{"urls":[]}'
```

The response must be `401`.

Manually dispatch the LinkedIn workflow from GitHub Actions. Watch backend logs on the VPS:

```bash
sudo journalctl -u job-flow-api -f
```

Confirm recently inserted LinkedIn jobs:

```bash
sqlite3 /var/lib/job-flow-ai/jobs.db \
  "SELECT id, source, title, date_posted FROM jobs WHERE source='linkedin' ORDER BY id DESC LIMIT 10;"
```

## 18. Verify the HN Hiring scheduler

No OS cron entry is required for HN Hiring. It starts with the Node API through `startScraperScheduler()`.

Verify its startup message:

```bash
sudo journalctl -u job-flow-api | grep -i "scraper scheduler"
```

Inspect HN activity:

```bash
sudo journalctl -u job-flow-api | grep -i "HN Hiring"
```

Keep exactly one `job-flow-api` process running:

```bash
systemctl show job-flow-api --property=MainPID
pgrep -af "server/dist/server.js"
```

## 19. Configure the Bayt environment

Confirm that the deployed Bayt script contains API storage support:

```bash
rg "is_api_storage_enabled|ingest_jobs_via_api" \
  /opt/job-flow-ai/linkedin_scraper/samples/scrape_bayt_past_24h.py
```

Do not install the cron entry if this returns no matches.

Read the scraper key:

```bash
SCRAPER_API_KEY="$(
  sudo awk -F= \
    '$1 == "SCRAPER_API_KEY" { print $2 }' \
    /etc/job-flow-ai/server.env
)"
```

Create the Bayt environment:

```bash
sudo tee /etc/job-flow-ai/bayt.env >/dev/null <<EOF
SCRAPER_API_URL=http://127.0.0.1:4000/api/scraper
SCRAPER_API_KEY=${SCRAPER_API_KEY}
BYPARR_URL=http://127.0.0.1:8191
BYPARR_TIMEOUT_MS=120000
SCRAPE_LIMIT=50
PYTHONPATH=/opt/job-flow-ai/linkedin_scraper
EOF
```

```bash
sudo chmod 600 /etc/job-flow-ai/bayt.env
```

If Bayt requires proxies:

```bash
sudoedit /etc/job-flow-ai/bayt.env
```

Add one or both:

```env
PROXY=host:port:username:password
PROXY_LIST=host:port:user:pass|host:port:user:pass
```

## 20. Create the Bayt wrapper

The wrapper:

- Prevents overlapping runs with `flock`.
- Removes stale Byparr containers.
- Starts Byparr bound only to loopback.
- Applies memory, CPU, and shared-memory limits.
- Runs the host Python scraper.
- Removes Byparr after success, failure, or interruption.

```bash
sudo tee /usr/local/sbin/run-job-flow-bayt >/dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

LOCK_FILE=/run/lock/job-flow-bayt.lock
CONTAINER_NAME=job-flow-byparr
IMAGE=ghcr.io/thephaseless/byparr:latest

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    echo "Bayt scraper is already running"
    exit 0
fi

cleanup() {
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

set -a
source /etc/job-flow-ai/bayt.env
set +a

cleanup
docker pull "$IMAGE"

docker run -d \
    --name "$CONTAINER_NAME" \
    --rm \
    --memory=1g \
    --cpus=1.5 \
    --shm-size=1g \
    -p 127.0.0.1:8191:8191 \
    "$IMAGE"

cd /opt/job-flow-ai

/opt/job-flow-ai/linkedin_scraper/.venv/bin/python \
    /opt/job-flow-ai/linkedin_scraper/samples/scrape_bayt_past_24h.py
EOF
```

```bash
sudo chmod 750 /usr/local/sbin/run-job-flow-bayt
```

Test manually before creating cron:

```bash
sudo /usr/local/sbin/run-job-flow-bayt
```

Confirm that Byparr was removed:

```bash
sudo docker ps -a --filter name=job-flow-byparr
```

The output should not contain a running or stopped `job-flow-byparr` container.

Confirm Bayt insertion:

```bash
sqlite3 /var/lib/job-flow-ai/jobs.db \
  "SELECT id, source, title, date_posted FROM jobs WHERE source='bayt' ORDER BY id DESC LIMIT 10;"
```

## 21. Schedule Bayt every 12 hours

Create its log:

```bash
sudo touch /var/log/job-flow-bayt.log
sudo chmod 640 /var/log/job-flow-bayt.log
```

Create `/etc/cron.d/job-flow-bayt`:

```bash
sudo tee /etc/cron.d/job-flow-bayt >/dev/null <<'EOF'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

0 */12 * * * root /usr/local/sbin/run-job-flow-bayt >> /var/log/job-flow-bayt.log 2>&1
EOF
```

```bash
sudo chmod 644 /etc/cron.d/job-flow-bayt
sudo systemctl restart cron
```

Verify:

```bash
sudo systemctl status cron --no-pager
sudo grep job-flow-bayt /etc/cron.d/job-flow-bayt
```

`sudo crontab -l` may be empty because this job is stored in `/etc/cron.d`.

Configure log rotation:

```bash
sudo tee /etc/logrotate.d/job-flow-bayt >/dev/null <<'EOF'
/var/log/job-flow-bayt.log {
    weekly
    rotate 8
    compress
    missingok
    notifempty
    copytruncate
}
EOF
```

Test log rotation configuration:

```bash
sudo logrotate --debug /etc/logrotate.d/job-flow-bayt
```

## 22. Import the existing SQLite database

Skip this section if production should start with an empty database.

On the development machine:

```bash
scp /home/wajdi/Desktop/job-flow-ai/data/jobs.db \
  YOUR_VPS_USER@YOUR_VPS_PUBLIC_IP:/tmp/jobs.db
```

If the actual local database has a different path, use that path instead.

On the VPS:

```bash
export APP_USER="$(id -un)"
sudo systemctl stop job-flow-api
```

```bash
sudo install \
  -o "$APP_USER" \
  -g "$APP_USER" \
  -m 640 \
  /tmp/jobs.db \
  /var/lib/job-flow-ai/jobs.db
```

```bash
rm /tmp/jobs.db
sudo systemctl start job-flow-api
```

Verify:

```bash
sqlite3 /var/lib/job-flow-ai/jobs.db \
  "SELECT COUNT(*) AS job_count FROM jobs;"
```

## 23. Reindex Meilisearch

Run this after importing SQLite, after Meilisearch data loss, or after changing indexed fields:

```bash
cd /opt/job-flow-ai/server
```

```bash
set -a
source /etc/job-flow-ai/server.env
set +a
```

```bash
npm run reindex:meili
```

Verify:

```bash
curl http://127.0.0.1:7700/health
```

Use the application search interface to confirm that text and date filters work.

## 24. Configure SQLite backups

Create the backup directory:

```bash
sudo mkdir -p /var/backups/job-flow-ai
sudo chown "$APP_USER":"$APP_USER" /var/backups/job-flow-ai
```

Create an online SQLite backup script:

```bash
sudo tee /usr/local/sbin/backup-job-flow >/dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

DB=/var/lib/job-flow-ai/jobs.db
BACKUP_DIR=/var/backups/job-flow-ai
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
OUTPUT="${BACKUP_DIR}/jobs-${TIMESTAMP}.db"

sqlite3 "$DB" ".backup '$OUTPUT'"
gzip "$OUTPUT"

find "$BACKUP_DIR" \
  -type f \
  -name 'jobs-*.db.gz' \
  -mtime +14 \
  -delete
EOF
```

```bash
sudo chmod 750 /usr/local/sbin/backup-job-flow
```

Create the backup service:

```bash
sudo tee /etc/systemd/system/job-flow-backup.service >/dev/null <<EOF
[Unit]
Description=Back up Job Flow SQLite database

[Service]
Type=oneshot
User=${APP_USER}
Group=${APP_USER}
ExecStart=/usr/local/sbin/backup-job-flow
EOF
```

Create its daily timer:

```bash
sudo tee /etc/systemd/system/job-flow-backup.timer >/dev/null <<'EOF'
[Unit]
Description=Daily Job Flow database backup

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=15m

[Install]
WantedBy=timers.target
EOF
```

Enable and test:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now job-flow-backup.timer
sudo systemctl start job-flow-backup.service
```

```bash
sudo systemctl status job-flow-backup.service --no-pager
sudo systemctl list-timers job-flow-backup.timer
ls -lh /var/backups/job-flow-ai
```

Copy backups to another server or object-storage provider. A backup stored only on the same VPS does not protect against VPS loss.

## 25. Test a backup restore

List backups:

```bash
ls -lh /var/backups/job-flow-ai
```

Choose one backup and restore it to a temporary file without replacing production:

```bash
gunzip -c \
  /var/backups/job-flow-ai/jobs-YYYYMMDD-HHMMSS.db.gz \
  > /tmp/job-flow-restore-test.db
```

Verify integrity:

```bash
sqlite3 /tmp/job-flow-restore-test.db "PRAGMA integrity_check;"
sqlite3 /tmp/job-flow-restore-test.db "SELECT COUNT(*) FROM jobs;"
rm /tmp/job-flow-restore-test.db
```

The integrity check must return `ok`.

## 26. Final production verification

Verify public endpoints:

```bash
curl https://chakerjowajdi.online/api/health
curl -I https://chakerjowajdi.online/
```

Verify anonymous jobs API protection:

```bash
curl -i https://chakerjowajdi.online/api/jobs
```

It should return `401`.

Verify services:

```bash
sudo systemctl status nginx --no-pager
sudo systemctl status job-flow-api --no-pager
sudo systemctl status meilisearch --no-pager
sudo systemctl status cron --no-pager
sudo systemctl status job-flow-backup.timer --no-pager
```

Verify listening ports:

```bash
sudo ss -ltnp
```

Expected:

- Nginx on public `80` and `443`.
- API on `4000`.
- Meilisearch on loopback `127.0.0.1:7700`.
- Byparr absent except while Bayt is running.

Verify the browser:

1. Open `https://chakerjowajdi.online`.
2. Sign in with Google.
3. Reload and confirm the session persists.
4. Search by text.
5. Test before/after date filtering.
6. Open LinkedIn, Bayt, and HN source tabs.
7. Hide a job.
8. Open `/hidden`.
9. Restore the hidden job.
10. Log out and confirm protected routes return to login.

## 27. Logs and troubleshooting

API and HN scheduler:

```bash
sudo journalctl -u job-flow-api -f
```

Meilisearch:

```bash
sudo journalctl -u meilisearch -f
```

Nginx:

```bash
sudo journalctl -u nginx -f
```

Bayt:

```bash
sudo tail -f /var/log/job-flow-bayt.log
```

Certbot:

```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

Check recent service failures:

```bash
sudo systemctl --failed
sudo journalctl -p err --since "1 hour ago"
```

## 28. Deploy future application updates

Before deployment, push and test the new revision from the development machine.

On the VPS:

```bash
cd /opt/job-flow-ai
git status
git pull --ff-only
```

```bash
npm ci
npm ci --prefix server
npm ci --prefix client
```

```bash
/opt/job-flow-ai/linkedin_scraper/.venv/bin/pip install \
  -r /opt/job-flow-ai/linkedin_scraper/requirements.txt
```

```bash
npm run build-all
sudo systemctl restart job-flow-api
sudo systemctl reload nginx
```

Verify immediately:

```bash
curl http://127.0.0.1:4000/api/health
curl https://chakerjowajdi.online/api/health
sudo systemctl status job-flow-api --no-pager
sudo journalctl -u job-flow-api -n 100 --no-pager
```

Do not delete or replace:

```text
/var/lib/job-flow-ai
/var/lib/meilisearch
/var/backups/job-flow-ai
/etc/job-flow-ai
```

## 29. Roll back a failed deployment

Identify the previous known-good commit:

```bash
cd /opt/job-flow-ai
git log --oneline -10
```

Check out a new rollback branch rather than deleting data:

```bash
git switch -c rollback-production PREVIOUS_GOOD_COMMIT
```

Reinstall, rebuild, and restart:

```bash
npm ci
npm ci --prefix server
npm ci --prefix client
npm run build-all
sudo systemctl restart job-flow-api
sudo systemctl reload nginx
```

Verify:

```bash
curl https://chakerjowajdi.online/api/health
sudo journalctl -u job-flow-api -n 100 --no-pager
```

Rollback code only. Do not roll back SQLite unless a database migration specifically requires it and a verified backup is available.
