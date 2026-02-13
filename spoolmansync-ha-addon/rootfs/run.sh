#!/usr/bin/env bash
# SpoolmanSync Add-on Startup Script

set -e

echo "=== SpoolmanSync Add-on Starting ==="

# Read add-on options
CONFIG_PATH=/data/options.json
if [ -f "$CONFIG_PATH" ]; then
    SPOOLMAN_URL=$(jq -r '.spoolman_url // ""' "$CONFIG_PATH")
    if [ -n "$SPOOLMAN_URL" ] && [ "$SPOOLMAN_URL" != "null" ]; then
        export SPOOLMAN_URL
        echo "Spoolman URL configured: $SPOOLMAN_URL"
    fi
fi

# Supervisor token is automatically available
if [ -n "$SUPERVISOR_TOKEN" ]; then
    echo "Supervisor token available for HA API access"
else
    echo "Warning: SUPERVISOR_TOKEN not set"
fi

# Run Prisma migrations
echo "Running database migrations..."
cd /app
npx prisma migrate deploy 2>&1 || {
    echo "Migration retry..."
    npx prisma migrate deploy 2>&1 || echo "Migration error (non-fatal, continuing...)"
}
echo "Migrations complete."

# Start nginx in background
# nginx serves port 3000 (direct access for QR/NFC) and port 8099 (HA ingress)
# Both proxy to the internal Next.js server on port 3001
echo "Starting nginx on ports 3000 and 8099..."
nginx -g 'daemon off;' &

# Start the Next.js server on internal port (3001)
# Bound to 127.0.0.1 - only accessible via nginx, not directly from outside
echo "Starting Next.js server on port ${PORT:-3001}..."
exec node server.js
