#!/usr/bin/env bash
# Run this ON THE SERVER via SSH to build the frontend.
# Copy this file into public_html/frontend/ on the server, then:
#   ssh -p 65002 u752162317@147.93.39.172
#   cd ~/public_html/frontend
#   bash build-frontend-on-server.sh

set -e

# Must be run from the frontend folder (where package.json and next.config.js are)
if [ ! -f "package.json" ] || [ ! -f "next.config.js" ]; then
  echo "Run this script from the frontend folder on the server."
  echo "  cd ~/public_html/frontend"
  echo "  bash build-frontend-on-server.sh"
  exit 1
fi

# Try to get npm in PATH (nvm or common paths)
if ! command -v npm &>/dev/null; then
  [ -f "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"
  export PATH="/usr/local/bin:/opt/node/bin:$PATH"
fi
if ! command -v npm &>/dev/null; then
  echo "npm not found. Install Node.js on the server (e.g. nvm) or build locally with ./deploy-frontend.sh frontend"
  exit 1
fi

BUILD_VERSION="$(date +%Y%m%d-%H%M%S)"
export NEXT_PUBLIC_BUILD_VERSION="$BUILD_VERSION"
echo "Building version ${NEXT_PUBLIC_BUILD_VERSION} in $(pwd) ..."
export NEXT_PUBLIC_API_URL=
npm ci
npm run build
echo "Done. Built files are in ./out/ (build ${NEXT_PUBLIC_BUILD_VERSION})"
