# Render Deployment Troubleshooting Guide

## Error: "Exited with status 1 while running your code"

This error occurs when the start command fails. Here are the solutions:

### 1. Check Render Logs

1. Go to https://dashboard.render.com
2. Select your service (`ai-video-app`)
3. Click "Logs" tab
4. Look for error messages

### 2. Common Issues & Solutions

#### Issue A: Database Connection Failed

**Symptoms:**
- Logs show "ECONNREFUSED" or "Cannot connect to database"

**Solution:**
1. Verify PostgreSQL service is running on Render
2. Check `DATABASE_URL` environment variable is set
3. Ensure database credentials are correct
4. Test connection locally first

#### Issue B: Port Already in Use

**Symptoms:**
- Logs show "EADDRINUSE" or "Port 3000 already in use"

**Solution:**
- Render automatically sets `PORT` environment variable
- Our scripts use `${PORT:-3000}` which respects this
- No manual fix needed - restart the service

#### Issue C: Missing Environment Variables

**Symptoms:**
- Logs show "Cannot read property of undefined"
- OAuth or API calls fail

**Solution:**
Set these in Render dashboard → Environment:
- `VITE_APP_ID` - Your Manus OAuth App ID
- `OWNER_OPEN_ID` - Your Manus Owner ID
- `OWNER_NAME` - Your name
- `BUILT_IN_FORGE_API_KEY` - Your Manus API Key
- `VITE_FRONTEND_FORGE_API_KEY` - Your Manus Frontend API Key

#### Issue D: Frontend Files Not Found

**Symptoms:**
- Logs show "dist/public/index.html not found"
- Browser shows "Cannot GET /"

**Solution:**
1. Verify build completes: check build logs
2. Ensure `pnpm exec vite build` runs successfully
3. Check `dist/public/` directory exists with files

#### Issue E: Backend Bundle Errors

**Symptoms:**
- Logs show esbuild errors or module resolution issues

**Solution:**
1. Verify all dependencies are in package.json
2. Check for circular dependencies
3. Ensure `--packages=external` flag is used in esbuild

### 3. Deployment Checklist

Before redeploying, verify:

- [ ] All environment variables are set in Render
- [ ] PostgreSQL service is running
- [ ] Build script completes without errors
- [ ] Start script runs successfully
- [ ] Frontend files exist in `dist/public/`
- [ ] Backend bundle exists in `dist/index.js`
- [ ] PORT environment variable is respected

### 4. Manual Testing

Test locally before deploying:

```bash
# Build
bash build.sh

# Start with production settings
NODE_ENV=production PORT=3002 bash start.sh

# Test in another terminal
curl http://localhost:3002/
```

### 5. Render Configuration

Current `render.yaml` configuration:

```yaml
services:
  - type: pserv
    name: ai-video-db
    plan: free
    postgresSQLVersion: "15"

  - type: web
    name: ai-video-app
    plan: free
    runtime: node
    buildCommand: bash build.sh
    startCommand: bash start.sh
```

### 6. Debugging Steps

1. **Check build logs:**
   - Render dashboard → Logs
   - Look for "Build started" → "Build completed"

2. **Check start logs:**
   - Look for "Starting Express server"
   - Look for "Server running on"

3. **Test endpoint:**
   - Visit `https://your-app.onrender.com/`
   - Should show "AI Video Storyteller" page

4. **Check API:**
   - Visit `https://your-app.onrender.com/api/trpc`
   - Should show tRPC endpoint info

### 7. Restart Service

If deployment fails:

1. Go to Render dashboard
2. Select service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Or click "Restart" to restart current deployment

### 8. Contact Support

If issues persist:

1. Check Render status page: https://status.render.com
2. Review Render documentation: https://render.com/docs
3. Check GitHub issues for similar problems

---

**Last Updated:** March 15, 2026
**Status:** Ready for deployment
