#!/bin/bash

# Build script for Render.com deployment
set -e

echo "🔨 Starting build process..."
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile || {
  echo "❌ Failed to install dependencies"
  exit 1
}

# Build frontend
echo "🎨 Building frontend with Vite..."
pnpm exec vite build || {
  echo "❌ Failed to build frontend"
  exit 1
}

# Verify frontend build
if [ ! -f "dist/public/index.html" ]; then
  echo "❌ Frontend build failed: index.html not found"
  exit 1
fi
echo "✅ Frontend built successfully"

# Build backend
echo "🖥️  Building backend with esbuild..."
pnpm exec esbuild server/_core/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist || {
  echo "❌ Failed to build backend"
  exit 1
}

# Verify backend build
if [ ! -f "dist/index.js" ]; then
  echo "❌ Backend build failed: index.js not found"
  exit 1
fi
echo "✅ Backend built successfully"

# Run database migrations
echo "🗄️  Running database migrations..."
if [ -n "$DATABASE_URL" ]; then
  pnpm exec drizzle-kit migrate || echo "⚠️  Migration warning (tables may already exist)"
else
  echo "⚠️  DATABASE_URL not set, skipping migrations"
fi

echo "✅ Build completed successfully!"
echo "📊 Build artifacts:"
ls -lh dist/public/index.html 2>/dev/null || echo "⚠️  Frontend index.html not found"
ls -lh dist/index.js 2>/dev/null || echo "⚠️  Backend index.js not found"
