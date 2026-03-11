#!/usr/bin/env bash
# Run this on the server to build the Next.js app (standalone output).
# From repo root: bash scripts/build-frontend-on-server.sh
# Or from frontend/: bash build-frontend-on-server.sh (if copied there)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-.}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../frontend" 2>/dev/null || cd "$(dirname "$0")" && pwd)"
cd "$FRONTEND_DIR"

if [ ! -f "package.json" ] || [ ! -f "next.config.js" ]; then
  echo "Run this script from the repo root or the frontend folder."
  echo "  bash scripts/build-frontend-on-server.sh"
  exit 1
fi

if ! command -v npm &>/dev/null; then
  [ -f "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"
  export PATH="/usr/local/bin:/opt/node/bin:$PATH"
fi
if ! command -v npm &>/dev/null; then
  echo "npm not found. Install Node.js (e.g. nvm) on the server."
  exit 1
fi

BUILD_VERSION="$(date +%Y%m%d-%H%M%S)"
export NEXT_PUBLIC_BUILD_VERSION="$BUILD_VERSION"
echo "Building version ${NEXT_PUBLIC_BUILD_VERSION} in $(pwd) ..."
npm ci
npm run build
echo "Done. Use .next/standalone + .next/static + public to run the Node server (see README)."
echo "  cd .next/standalone && cp -r ../../.next/static .next/ && cp -r ../../public . && node server.js"