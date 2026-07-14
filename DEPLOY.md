# Health Tracker - Deployment Guide

## Overview
- **Frontend**: React + Vite → Deploy on **Vercel**
- **Backend**: Express + PostgreSQL → Deploy on **Render**
- **Database**: PostgreSQL (Render managed database)

---

## Step 1: Prepare Database (Render)

1. Go to [Render Dashboard](https://dashboard.render.com/) → **New +** → **PostgreSQL**
2. Create a new database:
   - Name: `health-tracker-db`
   - Plan: **Free**
   - Database name: `health_tracker`
   - User: `health_tracker_user`
3. After creation, copy the **Connection String** (looks like `postgres://user:pass@host:5432/health_tracker`)

---

## Step 2: Deploy Backend to Render

1. Push your code to GitHub (make sure all changes are committed)
2. Go to Render Dashboard → **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `health-tracker-api`
   - **Root Directory**: `apps/api`
   - **Runtime**: `Node`
   - **Plan**: **Free**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = paste the Render PostgreSQL connection string from Step 1
   - `CORS_ORIGIN` = `https://your-frontend-app.vercel.app` (replace with your actual Vercel URL)
6. Click **Create Web Service**

Render will automatically use the `render.yaml` in your repo to provision the database and link it.

---

## Step 3: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/) → **Add New...** → **Project**
2. Import your GitHub repo
3. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://your-backend-app.onrender.com` (replace with your Render URL)
   - `VITE_GEMINI_API_KEY` = your Gemini API key
5. Click **Deploy**

Vercel will build and deploy your frontend. The `vercel.json` in `apps/web` will handle SPA routing.

---

## Step 4: Update CORS After Deployment

1. Once both are deployed, copy your Vercel frontend URL (e.g., `https://my-app.vercel.app`)
2. Go to your Render backend service → **Environment** tab
3. Update `CORS_ORIGIN` to include your Vercel URL:
   ```
   https://your-frontend-app.vercel.app
   ```
4. Save changes (Render will auto-redeploy)

---

## Step 5: Verify

1. Open your Vercel URL on desktop - app should load
2. Register a test account
3. Open the same URL on your phone - app should work

---

## Important Notes

### Environment Variables Summary

**Backend (Render)**:
| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Render PostgreSQL connection string |
| `CORS_ORIGIN` | Your Vercel frontend URL |

**Frontend (Vercel)**:
| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | Your Render backend URL |
| `VITE_GEMINI_API_KEY` | Your Gemini API key |

### Database Migration
The PostgreSQL schema is in `apps/api/src/db/schema.sql` and runs automatically on app startup via `apps/api/src/db/migrate.ts`. No manual migration needed.

### Free Tier Limitations
- **Render Free Tier**: Web service sleeps after 15 min of inactivity. First request after sleep takes ~30s to wake up.
- **Render PostgreSQL Free Tier**: 256 MB storage, suitable for development/testing.
- **Vercel Free Tier**: 100 GB bandwidth/month, sufficient for personal use.

### Troubleshooting
- If frontend can't reach backend: Check CORS_ORIGIN in Render matches your Vercel URL exactly
- If backend fails to start: Check DATABASE_URL is correct in Render environment
- If API returns 404: Make sure VITE_API_BASE_URL is set correctly in Vercel
