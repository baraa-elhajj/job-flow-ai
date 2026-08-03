#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/data/meili_data"

export MEILI_ENV=development
export MEILI_MASTER_KEY="${MEILI_MASTER_KEY:-dev-master-key-change-me}"

MEILI_BIN="${MEILI_BIN:-meilisearch}"
if ! command -v "$MEILI_BIN" >/dev/null 2>&1; then
  if [ -x "$ROOT/meilisearch" ]; then
    MEILI_BIN="$ROOT/meilisearch"
  else
    echo "meilisearch not found in PATH or at $ROOT/meilisearch"
    echo "Install: curl -L https://install.meilisearch.com | sh"
    exit 1
  fi
fi

exec "$MEILI_BIN" \
  --http-addr 127.0.0.1:7700 \
  --db-path "$ROOT/data/meili_data" \
  --master-key "$MEILI_MASTER_KEY"
