#!/bin/bash

# Build script for Render.com deployment
set -e

echo "🔨 Starting build process..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build frontend
echo "🎨 Building frontend..."
pnpm exec vite build

# Build backend
echo "🖥️  Building backend..."
pnpm exec esbuild server/_core/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist

# Run database migrations
echo "🗄️  Running database migrations..."
if [ -n "$DATABASE_URL" ]; then
  pnpm exec drizzle-kit migrate || echo "⚠️  Migration warning (tables may already exist)"
else
  echo "⚠️  DATABASE_URL not set, skipping migrations"
fi

echo "✅ Build completed successfully!"
