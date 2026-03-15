#!/bin/bash

# Start script for Render.com deployment
set -e

echo "🚀 Starting AI Video Storyteller..."
echo "Node version: $(node --version)"
echo "Environment: NODE_ENV=${NODE_ENV}"
echo "Port: ${PORT:-3000}"

# Set production environment
export NODE_ENV=production

# Ensure dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ dist directory not found. Running build..."
  bash build.sh
fi

# Verify frontend files exist
if [ ! -f "dist/public/index.html" ]; then
  echo "❌ Frontend files not found at dist/public/index.html"
  exit 1
fi

# Verify backend bundle exists
if [ ! -f "dist/server.js" ]; then
  echo "❌ Backend bundle not found at dist/server.js"
  exit 1
fi

echo "✅ All required files found"
echo "📡 Starting Express server on port ${PORT:-3000}..."

# Start the server with error handling
node dist/server.js || {
  echo "❌ Server failed to start"
  exit 1
}
