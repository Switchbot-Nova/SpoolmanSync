#!/bin/sh

# SpoolmanSync App Entrypoint
# Runs database migrations and starts the app

set -e

echo "=== SpoolmanSync Starting ==="

# Run Prisma migrations using the local prisma binary
echo "Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Migrations complete."

# Start the Next.js server
echo "Starting Next.js server..."
exec node server.js
