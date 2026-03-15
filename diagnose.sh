#!/bin/bash

# Diagnostic script to identify deployment issues
echo "🔍 AI Video Storyteller - Deployment Diagnostic"
echo "=================================================="
echo ""

# Check Node.js version
echo "📌 Node.js Environment:"
echo "  Version: $(node --version)"
echo "  Path: $(which node)"
echo ""

# Check environment variables
echo "📌 Environment Variables:"
echo "  NODE_ENV: ${NODE_ENV:-NOT SET}"
echo "  PORT: ${PORT:-NOT SET (default 3000)}"
echo "  DATABASE_URL: ${DATABASE_URL:+SET (hidden for security)}${DATABASE_URL:-NOT SET}"
echo "  VITE_APP_ID: ${VITE_APP_ID:+SET}${VITE_APP_ID:-NOT SET}"
echo "  OWNER_OPEN_ID: ${OWNER_OPEN_ID:+SET}${OWNER_OPEN_ID:-NOT SET}"
echo ""

# Check build artifacts
echo "📌 Build Artifacts:"
if [ -f "dist/index.js" ]; then
  echo "  ✅ Backend bundle: dist/index.js ($(ls -lh dist/index.js | awk '{print $5}'))"
else
  echo "  ❌ Backend bundle: NOT FOUND"
fi

if [ -f "dist/public/index.html" ]; then
  echo "  ✅ Frontend files: dist/public/index.html ($(ls -lh dist/public/index.html | awk '{print $5}'))"
else
  echo "  ❌ Frontend files: NOT FOUND"
fi
echo ""

# Check dependencies
echo "📌 Dependencies:"
if [ -d "node_modules" ]; then
  echo "  ✅ node_modules directory exists"
  echo "  Package count: $(ls -1 node_modules | wc -l)"
else
  echo "  ❌ node_modules directory NOT FOUND"
fi
echo ""

# Try to start the server
echo "📌 Server Startup Test:"
echo "  Starting server on port 3004..."
NODE_ENV=production PORT=3004 timeout 5 node dist/index.js 2>&1 || true
echo ""

# Check if server started
if timeout 2 bash -c "echo > /dev/tcp/localhost/3004" 2>/dev/null; then
  echo "  ✅ Server is running on port 3004"
else
  echo "  ❌ Server failed to start or not listening"
fi
echo ""

echo "=================================================="
echo "✅ Diagnostic complete"
