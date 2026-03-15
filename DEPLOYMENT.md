# Deployment Guide - Render.com

This guide explains how to deploy the AI Video Storyteller application to Render.com using the free tier.

## Prerequisites

1. GitHub account with the code pushed to a repository
2. Render.com account (free tier)
3. Environment variables configured

## Step 1: Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Connect your GitHub repository

## Step 2: Create PostgreSQL Database

1. In Render dashboard, click "New +"
2. Select "PostgreSQL"
3. Configure:
   - **Name:** `ai-video-db`
   - **Database:** `ai_video_storyteller`
   - **User:** `postgres`
   - **Plan:** Free
4. Click "Create Database"
5. Copy the connection string (you'll need this for the backend)

## Step 3: Deploy Backend API

1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** `ai-video-api`
   - **Environment:** Node
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `node server/_core/index.ts` or `pnpm start`
   - **Plan:** Free
5. Add Environment Variables:
   ```
   NODE_ENV=production
   DATABASE_URL=<PostgreSQL connection string from Step 2>
   PORT=3000
   JWT_SECRET=<generate a random string>
   VITE_APP_ID=<your Manus app ID>
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://manus.im/oauth
   OWNER_OPEN_ID=<your Manus open ID>
   OWNER_NAME=<your name>
   BUILT_IN_FORGE_API_URL=https://api.manus.im
   BUILT_IN_FORGE_API_KEY=<your Manus API key>
   VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
   VITE_FRONTEND_FORGE_API_KEY=<your Manus frontend API key>
   VITE_ANALYTICS_ENDPOINT=<optional>
   VITE_ANALYTICS_WEBSITE_ID=<optional>
   VITE_APP_TITLE=AI Video Storyteller
   VITE_APP_LOGO=<optional>
   ```
6. Click "Create Web Service"

## Step 4: Deploy Frontend

1. In Render dashboard, click "New +"
2. Select "Static Site"
3. Connect your GitHub repository
4. Configure:
   - **Name:** `ai-video-frontend`
   - **Build Command:** `cd client && pnpm install && pnpm build`
   - **Publish Directory:** `client/dist`
   - **Plan:** Free
5. Add Environment Variables:
   ```
   VITE_API_URL=<your backend API URL from Step 3>
   VITE_APP_ID=<your Manus app ID>
   VITE_OAUTH_PORTAL_URL=https://manus.im/oauth
   VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
   VITE_FRONTEND_FORGE_API_KEY=<your Manus frontend API key>
   VITE_APP_TITLE=AI Video Storyteller
   ```
6. Click "Create Static Site"

## Step 5: Run Database Migrations

1. Once the backend is deployed, connect to your Render PostgreSQL database
2. Run migrations:
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```

## Step 6: Test the Application

1. Visit your frontend URL from Render
2. Test the "Get Started" button
3. Try generating a video
4. Check the pricing page

## Troubleshooting

### "Start Now" button not working
- Ensure the backend API URL is correctly configured in frontend environment variables
- Check that the backend is running and accessible

### Database connection errors
- Verify the DATABASE_URL is correct
- Ensure the PostgreSQL database is running
- Check that migrations have been applied

### Video generation fails
- Verify Manus API credentials are correct
- Check that the backend has access to external APIs
- Review server logs in Render dashboard

## Free Tier Limitations

- **Database:** 256 MB storage, auto-pauses after 15 minutes of inactivity
- **Backend:** Auto-pauses after 15 minutes of inactivity, limited to 512 MB RAM
- **Frontend:** Limited bandwidth
- **Concurrent connections:** Limited

For production use, consider upgrading to paid plans.

## Monitoring

1. Use Render dashboard to monitor:
   - Server logs
   - Database usage
   - Bandwidth usage
   - Uptime

2. Set up alerts for:
   - High memory usage
   - Database connection errors
   - Failed deployments

## Support

For issues with Render.com, visit [render.com/docs](https://render.com/docs)

For issues with the application, check the server logs in Render dashboard.
