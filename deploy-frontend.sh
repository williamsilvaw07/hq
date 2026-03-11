#!/usr/bin/env bash
# Build the Next.js app (standalone). For upload/deploy, use your own process
# (e.g. rsync standalone + static + public to server and run node server.js).
# Run from repo root: ./deploy-frontend.sh
#
# Requires: FTP_* only if you use the optional upload step below.

set -e
cd "$(dirname "$0")"

echo "Building frontend (standalone)..."
(cd frontend && npm run build)

if [ ! -d frontend/.next/standalone ]; then
  echo "Build failed: frontend/.next/standalone missing"
  exit 1
fi

echo "Done. To run on server: copy frontend/.next/standalone, frontend/.next/static, and frontend/public, then run node server.js (see README)."
