#!/bin/bash

# Simple script to push code to GitHub
set -e

GITHUB_USERNAME="mackensonphilbert07-debug"
GITHUB_REPO="Ai-video-storyteller"
GITHUB_URL="https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}.git"

echo "🚀 Pushing code to GitHub..."
echo "Repository: $GITHUB_URL"
echo ""

# Initialize git if not already done
if [ ! -d ".git" ]; then
  echo "📝 Initializing Git repository..."
  git init
  git add .
  git commit -m "Initial commit: Phase 1 Production Features

- Added royalty-free background music service with 5 Incompetech tracks
- Implemented subscription quota verification in video generation
- Enhanced pricing page with tRPC integration and current plan display
- Created comprehensive unit tests (54 tests, 100% passing)
- Added Render.com one-click deployment configuration
- All TypeScript errors resolved
- Ready for deployment to Render.com free tier"
else
  echo "📝 Adding changes to Git..."
  git add .
  git commit -m "Update: Render.com deployment configuration" || echo "ℹ️  No changes to commit"
fi

# Configure git remote
echo "🔗 Configuring GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "$GITHUB_URL"

# Set branch to main
git branch -M main

# Push to GitHub
echo "📤 Pushing to GitHub (you may need to enter your credentials)..."
git push -u origin main

echo ""
echo "✅ Successfully pushed to GitHub!"
echo "📍 Repository: $GITHUB_URL"
echo ""
echo "🎉 Next step: Deploy on Render.com"
echo "   1. Go to https://render.com"
echo "   2. Click 'New +' → 'Blueprint'  "
echo "   3. Connect your GitHub repository"
echo "   4. Render will automatically deploy using render.yaml"
echo ""
