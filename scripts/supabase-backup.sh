#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
  echo "Usage: $0 <postgres-connection-string> [output-file]"
  exit 1
fi

CONN="$1"
STAMP="$(date -u +%Y%m%d-%H%M%SZ)"
OUT="${2:-supabase-backup-$STAMP.sql.gz}"

pg_dump "$CONN" --no-owner --no-privileges | gzip > "$OUT"
echo "Backup written to $OUT"
