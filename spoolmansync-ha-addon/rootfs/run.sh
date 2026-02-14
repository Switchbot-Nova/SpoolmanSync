#!/usr/bin/env bash
# SpoolmanSync Add-on Startup Script

set -e

echo "=== SpoolmanSync Add-on Starting ==="

# Read add-on options
CONFIG_PATH=/data/options.json
DIRECT_PORT=3000
if [ -f "$CONFIG_PATH" ]; then
    SPOOLMAN_URL=$(jq -r '.spoolman_url // ""' "$CONFIG_PATH")
    if [ -n "$SPOOLMAN_URL" ] && [ "$SPOOLMAN_URL" != "null" ]; then
        export SPOOLMAN_URL
        echo "Spoolman URL configured: $SPOOLMAN_URL"
    fi

    CONFIGURED_PORT=$(jq -r '.port // 3000' "$CONFIG_PATH")
    if [ -n "$CONFIGURED_PORT" ] && [ "$CONFIGURED_PORT" != "null" ]; then
        DIRECT_PORT="$CONFIGURED_PORT"
    fi
fi

export DIRECT_ACCESS_PORT="$DIRECT_PORT"
echo "Direct access port: $DIRECT_PORT"

# Update nginx config with the configured port
sed -i "s/listen 3000;/listen ${DIRECT_PORT};/" /etc/nginx/http.d/default.conf

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
# nginx serves the configured direct access port and port 8099 (HA ingress)
# Both proxy to the internal Next.js server on port 3001
echo "Starting nginx on ports ${DIRECT_PORT} and 8099..."
nginx -g 'daemon off;' &

# Start the Next.js server on internal port (3001)
# Bound to 127.0.0.1 - only accessible via nginx, not directly from outside
echo "Starting Next.js server on port ${PORT:-3001}..."
exec node server.js
