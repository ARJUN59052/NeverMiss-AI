# Deployment Guide: Rapid Voice Landing Page & Analytics

This guide walks you through deploying your restructured project. Depending on your preference, you can choose the **Serverless Static Setup** (simplest, uses direct Supabase client logging) or the **Node.js Server Setup** (uses the Express API backend).

---

## Option A: Serverless Static Deployment (Recommended)

Since the frontend landing pages (`index.html` and `never_miss.html`) handle cookie tracking directly with Supabase via client-side scripts, you do **not** need to deploy the Node.js backend server. The frontend can be hosted for free on any static site hosting provider.

### 1. Deploy on Vercel (Easiest)
1. Sign up/log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project**.
3. Import your GitHub repository (`Rapid-Voice`).
4. In the **Configure Project** settings:
   - **Framework Preset**: Select `Other` (or leave as auto-detected).
   - **Root Directory**: Select `frontend` (this ensures Vercel only serves your static files).
5. Click **Deploy**. Vercel will host your landing pages on a fast CDN and provide a production HTTPS URL (e.g., `rapid-voice.vercel.app`).

### 2. Deploy on GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** > **Pages** (under Code and automation).
3. Under **Build and deployment**, set the Source to **Deploy from a branch**.
4. Set the branch to `main` and the folder to `/docs` or the root. 
   *(Note: Since GitHub Pages defaults to serving the repository root, you can either move files from `/frontend` to root, or use a GitHub Action workflow to build and deploy just the `frontend` folder).*

---

## Option B: Deploying with Node.js Express Backend

If you prefer to route tracking requests through your Express backend server (`/backend/server.js`) rather than direct Supabase logs, follow these steps.

### Step 1: Deploy the Backend on Render
1. Create a free account on [Render](https://render.com).
2. Click **New** > **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: `postgresql://postgres.thriovyovxxdcgzvdxem:OwMel37YeiJgfzIB@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`
   - `PORT`: `10000` (Render allocates ports dynamically, Express will use the custom port).
6. Click **Deploy Web Service**. Render will output a live URL (e.g., `rapid-voice-backend.onrender.com`).

### Step 2: Update Frontend Tracking Code
Since you are now routing database inserts through the backend, update `frontend/js/tracking.js` to send HTTP requests to your backend server instead of direct Supabase inserts:

```javascript
// Replace direct Supabase client-side insert with a POST to backend:
await fetch('https://YOUR-BACKEND-URL.onrender.com/api/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    visitorId: visitorId,
    pageUrl: window.location.href
  })
});
```

---

## Step 3: Production Security Checklist (Supabase)

Regardless of which option you select, ensure your Supabase database is secured:

1. **Enable Row Level Security (RLS)**:
   Ensure RLS is enabled on your `page_views` table so that malicious actors cannot read or delete logs.
   ```sql
   alter table page_views enable row level security;
   ```
2. **Create Insert-Only Access Policy**:
   Allow anonymous users to only write tracking logs, but not read logs.
   ```sql
   create policy "Allow anonymous inserts"
   on page_views for insert
   to anon
   with check (true);
   ```
3. **Admin Dashboard Reads**:
   Only authenticated users or your backend connection pooler (using the `service_role` key or direct PostgreSQL connection string) should have read permissions (`select`).
