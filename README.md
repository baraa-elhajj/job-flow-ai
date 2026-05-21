# JobFlow AI

JobFlow AI aggregates high-signal tech job postings from **LinkedIn** and **Hacker News Hiring**, stores them in MongoDB, and presents them in a searchable web UI with light/dark themes.

## Features

- **Unified job feed** — browse all jobs or filter by source (LinkedIn / HN Hiring)
- **Job details** — full descriptions and parsed metadata for HN Hiring posts
- **Automated ingestion** — scheduled scrapers on the server; LinkedIn Lebanon jobs via GitHub Actions
- **Gruvbox UI** — responsive React app with light and dark mode
- **Pagination** — paginated job lists with URL-based page state

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express 5, TypeScript, Mongoose |
| Database | MongoDB |
| Scraping | Cheerio, Playwright (Node); Python + Playwright (`linkedin_scraper/`) |
| Scheduling | node-cron, GitHub Actions |

## Project structure

```
job-flow-ai/
├── client/                 # React frontend (port 5173)
├── server/                 # Express API (port 4000)
├── linkedin_scraper/       # Python LinkedIn scraper (CI / manual runs)
└── .github/workflows/      # Scheduled LinkedIn scrape workflow
```

## Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** (local or Atlas)
- **DeepSeek API key** (optional) — improves HN Hiring post parsing
- **Python 3.12+** (only if running `linkedin_scraper/` locally)

## Quick start

From the repository root:

```bash
npm run install-all
```

Copy environment files and fill in your values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env   # optional, for future Google Sign-In
```

Start both the API and the frontend:

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Web app | http://localhost:5173 |
| API | http://localhost:4000 |
| Health check | http://localhost:4000/api/health |

The Vite dev server proxies `/api` requests to the backend.

## Environment variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | API port (default: `4000`) |
| `FRONTEND_URL` | No | CORS origin (default: `http://localhost:5173`) |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `DEEPSEEK_API_KEY` | No | API key for LLM-based HN Hiring parsing |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (auth integration) |
| `JWT_SECRET` | No | Secret for signing session JWTs (auth integration) |

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | No | Same Google OAuth client ID as the server |

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/jobs?src=&page=&limit=` | List jobs (`src`: `all`, `linkedin`, or `hnhiring`) |
| `GET` | `/api/jobs/parsed/:id` | Single parsed HN Hiring job by ID |

## Scrapers

### HN Hiring (server)

Runs on a cron schedule when the server is up:

- **Days 1–5 of each month:** every 2 hours
- **Rest of month:** every 12 hours (on even UTC hours)

Posts are scraped from the monthly “Who is hiring?” thread and optionally parsed with DeepSeek.

### LinkedIn (server)

A TypeScript LinkedIn scraper is wired in the scheduler but **currently disabled** (`linkedInScrapeAllowed = false` in `jobScraperScheduler.ts`) until fixes land.

### LinkedIn (GitHub Actions)

The workflow [`.github/workflows/linkedin-scraper.yml`](.github/workflows/linkedin-scraper.yml) runs every 12 hours and executes the Python scraper for Lebanon-based software engineer roles.

Required GitHub secrets:

- `MONGODB_URI`
- `PROXY_DOWNLOAD_URL` — Webshare proxy list download URL (fetched on each run; `username/direct` format returns `host:port:username:password` per line)

### Manual scraper scripts

```bash
# HN Hiring (from server/)
npx tsx tests/scripts/scrapeHNhiring.ts

# LinkedIn (from server/)
npx tsx tests/scripts/scrapeLinkedIn.ts

# Python LinkedIn sample (from repo root)
cd linkedin_scraper && pip install -r requirements.txt
playwright install chromium
python samples/scrape_from_past_12_lb.py
```

## Production build

```bash
npm run build-all
```

```bash
# Start API
cd server && npm start

# Serve static frontend (example)
cd client && npm run preview
```

Set `NODE_ENV=production` on the server and use a strong `JWT_SECRET` if auth is enabled.

## Frontend routes

| Path | Description |
|------|-------------|
| `/` | All jobs |
| `/linkedin` | LinkedIn jobs only |
| `/hnhiring` | HN Hiring jobs only |
| `/jobs/:id` | Job detail (HN parsed jobs) |
| `/login` | Sign-in page |

## License

See individual packages and `linkedin_scraper/LICENSE` where applicable.
