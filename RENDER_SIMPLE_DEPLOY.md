# Deploy AI Video Storyteller to Render.com - Simple Guide

## 3 Easy Steps

### Step 1: Create PostgreSQL Database (2 minutes)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in:
   - **Name:** `ai-video-db`
   - **Database:** `ai_video_storyteller`
   - **Plan:** Free
4. Click **"Create Database"**
5. Wait for green "Available" status
6. Copy the **"Internal Database URL"** (starts with `postgresql://`)

### Step 2: Deploy Web Service (5 minutes)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `Ai-video-storyteller`
4. Fill in:
   - **Name:** `ai-video-app`
   - **Environment:** `Node`
   - **Build Command:** `bash build.sh`
   - **Start Command:** `bash start.sh`
   - **Plan:** Free
5. Click **"Create Web Service"**

### Step 3: Add Environment Variables (2 minutes)

1. Go to your web service on Render
2. Click **"Environment"** tab
3. Add/Update these variables:
   ```
   DATABASE_URL=postgresql://postgres:PASSWORD@dpg-xxxxx.render.internal:5432/ai_video_storyteller
   NODE_ENV=production
   VITE_APP_ID=your_manus_app_id
   OWNER_OPEN_ID=your_manus_owner_id
   OWNER_NAME=your_name
   BUILT_IN_FORGE_API_KEY=your_api_key
   VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
   ```
4. Click **"Save"**
5. Render will auto-deploy (5-10 minutes)

---

## Done! ✅

Your application is now live on Render.com!

- Visit: `https://ai-video-app.onrender.com`
- Click "Commencer maintenant"
- Start generating videos!

---

## If Something Goes Wrong

Check the **"Logs"** tab in your web service:
- Look for `Server running on http://localhost:PORT`
- If you see errors, check RENDER_TROUBLESHOOTING.md

---

**That's it!** No more billing issues, completely free, and ready to use. 🎉
