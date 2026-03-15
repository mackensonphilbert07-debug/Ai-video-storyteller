# PostgreSQL Setup Guide for Render.com

## Overview

This guide walks you through setting up a free PostgreSQL database on Render.com and connecting it to your AI Video Storyteller application.

---

## Step 1: Create PostgreSQL Database on Render

### 1.1 Go to Render Dashboard

1. Visit https://dashboard.render.com
2. Sign in with your GitHub account
3. Click **"New +"** button in the top right

### 1.2 Create PostgreSQL Service

1. Click **"PostgreSQL"** from the options
2. Fill in the form:
   - **Name:** `ai-video-db` (or any name you prefer)
   - **Database:** `ai_video_storyteller` (or any name)
   - **User:** `postgres` (default)
   - **Region:** Select closest to you (e.g., `Ohio`, `Frankfurt`)
   - **PostgreSQL Version:** `15` (recommended)
   - **Plan:** Select **"Free"** tier

3. Click **"Create Database"**

### 1.3 Wait for Database Creation

- Render will create the database (takes 2-3 minutes)
- You'll see a green checkmark when ready
- Status will show "Available"

---

## Step 2: Get PostgreSQL Connection String

### 2.1 Copy Connection String

1. Go to your PostgreSQL service on Render
2. Look for the **"Connections"** section
3. Copy the **"Internal Database URL"** (starts with `postgresql://`)
   - This is for internal connections (recommended for Render services)
4. Also note the **"External Database URL"** if you need to connect from outside Render

**Example format:**
```
postgresql://postgres:PASSWORD@dpg-xxxxx.render.internal:5432/ai_video_storyteller
```

### 2.2 Save the Connection String

Keep this string safe - you'll need it in the next step.

---

## Step 3: Update Your Web Service Environment Variables

### 3.1 Go to Your Web Service

1. Go to Render dashboard
2. Click on your web service (`ai-video-app`)
3. Go to **"Environment"** tab

### 3.2 Update DATABASE_URL

1. Find the `DATABASE_URL` variable
2. Replace the old MySQL URL with the PostgreSQL URL
3. Format should be:
   ```
   postgresql://postgres:PASSWORD@dpg-xxxxx.render.internal:5432/ai_video_storyteller
   ```

### 3.3 Save and Deploy

1. Click **"Save"**
2. Render will automatically redeploy your service
3. Wait for deployment to complete (5-10 minutes)

---

## Step 4: Verify Database Connection

### 4.1 Check Deployment Logs

1. Go to your web service
2. Click **"Logs"** tab
3. Look for:
   - `[OAuth] Initialized with baseURL`
   - `Server running on http://localhost:PORT`
   - No database connection errors

### 4.2 Test the Application

1. Visit your application URL: `https://your-app.onrender.com`
2. You should see the "AI Video Storyteller" homepage
3. Click "Commencer maintenant" button
4. If it works, database is connected! ✅

### 4.3 Check Database Logs

1. Go to your PostgreSQL service on Render
2. Click **"Logs"** tab
3. Should see connection logs (no errors)

---

## Step 5: Run Database Migrations

### 5.1 Automatic Migrations

The application automatically runs migrations on startup:
- Check the build logs for migration messages
- Tables will be created automatically
- No manual SQL needed

### 5.2 Verify Tables Created

To verify tables were created:

1. Go to your PostgreSQL service on Render
2. Click **"Connect"** tab
3. Use the provided connection string to connect with a database client
4. Query: `SELECT table_name FROM information_schema.tables;`
5. Should see tables like: `users`, `projects`, `scenes`, etc.

---

## Step 6: Troubleshooting

### Issue: "Exited with status 1"

**Check:**
1. DATABASE_URL is correct (no typos)
2. PostgreSQL service is "Available" (green status)
3. Logs show no connection errors

**Solution:**
1. Copy the connection string again carefully
2. Make sure to use "Internal Database URL" (not External)
3. Restart the web service: click "Restart Instance"

### Issue: "ECONNREFUSED" or "Connection refused"

**Cause:** Database service not ready or URL incorrect

**Solution:**
1. Wait 2-3 minutes for PostgreSQL to be fully ready
2. Verify connection string format
3. Check PostgreSQL service status is "Available"

### Issue: "Authentication failed"

**Cause:** Wrong password in connection string

**Solution:**
1. Go to PostgreSQL service on Render
2. Copy the connection string again
3. Update DATABASE_URL in web service environment
4. Restart web service

### Issue: "Database does not exist"

**Cause:** Database name in URL doesn't match created database

**Solution:**
1. Check the database name in the connection string
2. Verify it matches the database name you created
3. Update if needed

### Issue: Tables not created

**Cause:** Migrations didn't run or failed

**Solution:**
1. Check build logs for migration errors
2. If tables already exist from MySQL, that's OK
3. Manually run migrations if needed (see Advanced section)

---

## Step 7: Backup & Monitoring

### 7.1 Enable Automated Backups

1. Go to PostgreSQL service on Render
2. Click **"Settings"** tab
3. Look for **"Backups"** section
4. Enable automated backups (recommended for production)

### 7.2 Monitor Database Usage

1. Go to PostgreSQL service
2. Click **"Metrics"** tab
3. Monitor CPU, memory, storage usage
4. Free tier has limits - monitor to avoid overage charges

---

## Advanced: Manual Database Operations

### Connect to Database Locally

If you need to run SQL commands manually:

```bash
# Install PostgreSQL client (if not already installed)
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client
# Windows: Download from https://www.postgresql.org/download/windows/

# Connect to database
psql "postgresql://postgres:PASSWORD@dpg-xxxxx.render.internal:5432/ai_video_storyteller"

# List tables
\dt

# Run SQL query
SELECT * FROM users;

# Exit
\q
```

### Run Migrations Manually

If migrations didn't run automatically:

```bash
# From your project directory
pnpm exec drizzle-kit migrate
```

---

## Step 8: Production Checklist

Before going live:

- [ ] PostgreSQL service created and "Available"
- [ ] DATABASE_URL set in web service environment
- [ ] Web service deployed successfully
- [ ] Application loads without errors
- [ ] Database tables created (verify in logs)
- [ ] "Commencer maintenant" button works
- [ ] Video generation works (if testing)
- [ ] Automated backups enabled
- [ ] Monitoring set up

---

## Support & Resources

- **Render Documentation:** https://render.com/docs
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Troubleshooting:** https://render.com/docs/troubleshooting
- **Status Page:** https://status.render.com

---

## Summary

1. ✅ Create PostgreSQL database on Render
2. ✅ Copy the Internal Database URL
3. ✅ Update DATABASE_URL in web service environment
4. ✅ Redeploy web service
5. ✅ Verify connection and tables created
6. ✅ Test application

**That's it!** Your application should now be running with PostgreSQL on Render. 🎉

---

**Last Updated:** March 15, 2026
**Status:** Ready for deployment
