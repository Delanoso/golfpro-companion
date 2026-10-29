#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
  echo "Usage: $0 <postgres-connection-string>"
  exit 1
fi

CONN="$1"
psql "$CONN" -v ON_ERROR_STOP=1 -f supabase/schema.sql
echo "Schema applied successfully."
