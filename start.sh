#!/bin/bash

# Start script for Render.com deployment
set -e

echo "🚀 Starting AI Video Storyteller..."

# Set production environment
export NODE_ENV=production

# Ensure dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ dist directory not found. Running build..."
  bash build.sh
fi

# Start the server
echo "📡 Starting Express server on port ${PORT:-3000}..."
node dist/index.js
