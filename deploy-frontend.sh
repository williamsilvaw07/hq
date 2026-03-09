#!/usr/bin/env bash
# Build the frontend and upload to Hostinger.
# Run from repo root when you have frontend changes:
#   ./deploy-frontend.sh           # upload to public_html/public/
#   ./deploy-frontend.sh frontend  # upload to public_html/frontend/out/
#
# Requires: FTP_HOST, FTP_USERNAME, FTP_PASSWORD (env or .env.deploy).
# On Mac: brew install sshpass  (for password-based SSH)

set -e
cd "$(dirname "$0")"

# Upload target: "public" (default, Laravel public/) or "frontend" (public_html/frontend/out/)
TARGET="${1:-public}"
if [ "$TARGET" = "frontend" ]; then
  REMOTE_DIR="public_html/frontend/out"
else
  REMOTE_DIR="public_html/public"
fi

# Load credentials from .env.deploy if it exists (optional)
if [ -f .env.deploy ]; then
  set -a
  source .env.deploy
  set +a
fi

for v in FTP_HOST FTP_USERNAME FTP_PASSWORD; do
  if [ -z "${!v}" ]; then
    echo "Error: $v is not set. Export it or add to .env.deploy"
    exit 1
  fi
done

echo "Building frontend..."
(cd frontend && NEXT_PUBLIC_API_URL= npm run build)

if [ ! -f frontend/out/index.html ]; then
  echo "Build failed: frontend/out/index.html missing"
  exit 1
fi

echo "Creating remote directory (if needed)..."
sshpass -p "$FTP_PASSWORD" ssh -p 65002 -o StrictHostKeyChecking=no \
  "$FTP_USERNAME@$FTP_HOST" "mkdir -p $REMOTE_DIR"

echo "Uploading to $FTP_HOST:$REMOTE_DIR/ ..."
sshpass -p "$FTP_PASSWORD" rsync -avz --delete \
  -e "ssh -p 65002 -o StrictHostKeyChecking=no" \
  frontend/out/ "$FTP_USERNAME@$FTP_HOST:$REMOTE_DIR/"

echo "Done. Frontend is live at $REMOTE_DIR"
