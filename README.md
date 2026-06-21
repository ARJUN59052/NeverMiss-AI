# Rapid Voice — Landing Page & Visitor Tracking System

An elegant, modern landing page with a built-in persistent user-tracking cookie system integrated with Supabase. The project features a structured design separating the frontend and backend, configured to deploy seamlessly together on **Vercel** or independently.

---

## 📂 Project Structure

```
Rapid-Voice/
├── frontend/                  # Static Frontend Website

│   ├── js/
│   │   ├── form_handler.js    # Interactive form submission (FormSubmit.co API)
│   │   └── tracking.js        # Cookie creation and visit logger handler
│   ├── index.html             # Video Ad Landing Page
│   ├── never_miss.html        # Main Landing Page
│   └── mail_body.txt          # Templated email body configuration
├── backend/                   # Standalone Backend Database Logs Service
│   ├── server.js              # Express API Server
│   ├── package.json           # Backend node dependencies configuration
│   └── .env                   # Local backend database credentials configuration
├── api/                       # Serverless Backend entrypoint for Vercel
│   └── index.js               # Vercel Express routing handler
├── vercel.json                # Vercel monorepo routing configurations
├── package.json               # Root dependencies for Vercel Serverless compilation
├── user_tracking_guide.md     # Reference guide for Supabase setup
└── deployment_guide.md        # Reference guide for cloud deployment hosting
```

---

## 🚀 How to Run Locally

### 1. Running the Frontend
The frontend consists of static HTML/JS files. You can open them directly in your browser or serve them using a static file server:
```bash
# Start a simple local server inside the frontend folder
cd frontend
python -m http.server 8000
```
Open your browser and navigate to `http://localhost:8000`.

### 2. Running the Backend Server
To run the Express database logging service locally:
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside `/backend` and add your database URL:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   PORT=3000
   ```
4. Start the server:
   ```bash
   npm start
   ```

---

## ☁️ Deployment

### Option A: Monorepo Serverless Deployment on Vercel (Recommended & Easiest)
Deploy both the frontend static site and backend serverless endpoints together under a single Vercel project:

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Configure project settings:
   - **Root Directory**: Select the **project root** directory (do NOT select `frontend` or `backend`).
3. Add the following **Environment Variable**:
   - `DATABASE_URL` = `your_supabase_postgresql_connection_pooler_string`
4. Click **Deploy**. Vercel will host the website and compile `/api/index.js` into serverless API endpoints under the same domain.

### Option B: Deploying Separately (Static Frontend + Independent Backend)
1. **Frontend**: Deploy the `/frontend` directory to **Vercel** or **Netlify** (set root directory as `frontend`).
2. **Backend**: Deploy the `/backend` directory as a web service on **Koyeb** or **Render**. Ensure you configure `DATABASE_URL` in the environment settings.
3. **Connection**: Update the `BACKEND_HOST` variable inside `frontend/js/tracking.js` with your backend web service URL.

---

## 🛠️ Database Setup (Supabase)

Create the `page_views` table in your Supabase SQL editor using the query below:

```sql
-- Create tracking table
create table page_views (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  page_url text not null,
  ip_address text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table page_views enable row level security;

-- Policy: Allow anonymous users to insert visitor logs
create policy "Allow anonymous inserts"
on page_views for insert
to anon
with check (true);
```
