#!/bin/sh
set -e

# Start nginx in background
nginx
echo "Nginx started on :80"

# Start game server in foreground
echo "Game server starting on :8080..."
cd /app/server
exec node dist/main.js
