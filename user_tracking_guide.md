# Step-by-Step Guide: Supabase User-Tracking System

This guide explains how to connect your persistent cookie tracking data directly to your **Supabase** database. 

Because Supabase has a robust client-side SDK, you can log visits directly from your static HTML files to your database **without needing a backend server**.

---

## 1. Setup Your Supabase Database

Go to your **Supabase Dashboard**, open the **SQL Editor**, and run the following command to create the `page_views` database table:

```sql
-- Create the page_views table
create table page_views (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  page_url text not null,
  ip_address text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table page_views enable row level security;

-- Policy: Allow ANYONE to insert tracking records (anonymous writes)
create policy "Allow anonymous inserts"
on page_views for insert
to anon
with check (true);

-- Policy: Allow only authenticated users to view logs (admin dashboard)
create policy "Allow authenticated reads only"
on page_views for select
to authenticated
using (true);
```

> [!TIP]
> If you are just testing locally and want to disable RLS restrictions entirely for reading logs from an unauthenticated file, run:
> `alter table page_views disable row level security;`

---

## 2. Add the Tracking Script to Your HTML Pages

Paste this code right before the closing `</body>` tag of your landing pages (e.g. `never_miss.html` or `code.html`).

Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual Supabase credentials found in **Project Settings > API**.

```html
<!-- Supabase JS Client library CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<script>
(async function() {
  // 1. Initialize Supabase Client
  const SUPABASE_URL = 'https://thriovyovxxdcgzvdxem.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_zcV3c7RVe4xyLe3t6q3oCg_wUq_jDS4';
  
  if (SUPABASE_URL === 'YOUR_SUPABASE_PROJECT_URL') {
    console.warn("Please set your real Supabase credentials in the tracking script.");
    return;
  }
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // 2. Cookie Management Helpers
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
  }

  // 3. Retrieve or generate the persistent visitor cookie ID
  let visitorId = getCookie('visitor_id');
  if (!visitorId) {
    visitorId = 'usr_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setCookie('visitor_id', visitorId, 365); // Save cookie for 1 year
  }

  // 4. Fetch the visitor's public IP address asynchronously
  let ipAddress = 'unknown';
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipRes.json();
    ipAddress = ipData.ip;
  } catch (e) {
    console.warn('Could not capture IP address, continuing with unknown.', e);
  }

  // 5. Insert visit statistics into Supabase
  const { error } = await supabase
    .from('page_views')
    .insert([
      {
        visitor_id: visitorId,
        page_url: window.location.href,
        ip_address: ipAddress
      }
    ]);

  if (error) {
    console.error('Error logging page view to Supabase:', error);
  } else {
    console.log('Page view successfully logged to Supabase.');
  }
})();
</script>
```

---

## 3. Querying the Logs (Dashboard App)

To view the tracking database, create a file named `dashboard.html` and run it locally. It reads directly from your Supabase table in real-time.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Supabase Visitor Tracking Dashboard</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f7; padding: 2rem; }
    h1 { color: #1d1d1f; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e5e5ea; }
    th { background-color: #0ea855; color: white; font-weight: 600; }
    tr:hover { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>Supabase Visitor Logs</h1>
  <table>
    <thead>
      <tr>
        <th>Timestamp (Local)</th>
        <th>Visitor ID</th>
        <th>Page URL</th>
        <th>IP Address</th>
      </tr>
    </thead>
    <tbody id="logs-body">
      <tr>
        <td colspan="4">Loading visitor data...</td>
      </tr>
    </tbody>
  </table>

  <!-- Supabase JS CDN -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script>
    // Initialize Supabase Client
    const SUPABASE_URL = 'https://thriovyovxxdcgzvdxem.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_zcV3c7RVe4xyLe3t6q3oCg_wUq_jDS4';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    async function loadLogs() {
      try {
        // Query the logs from Supabase ordered by latest first
        const { data: logs, error } = await supabase
          .from('page_views')
          .select('visitor_id, page_url, ip_address, timestamp')
          .order('timestamp', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('logs-body');
        tbody.innerHTML = '';

        if (logs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4">No visitor logs found.</td></tr>';
          return;
        }

        logs.forEach(log => {
          const localTime = new Date(log.timestamp).toLocaleString();
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${localTime}</strong></td>
            <td><code>${log.visitor_id}</code></td>
            <td><a href="${log.page_url}" target="_blank">${log.page_url}</a></td>
            <td><code>${log.ip_address}</code></td>
          `;
          tbody.appendChild(tr);
        });
      } catch (err) {
        console.error('Error fetching logs:', err);
        document.getElementById('logs-body').innerHTML = '<tr><td colspan="4" style="color: red;">Error connecting to Supabase database. Check your table config or RLS rules.</td></tr>';
      }
    }

    loadLogs();
    setInterval(loadLogs, 5000); // Auto-refresh every 5 seconds
  </script>
</body>
</html>
```
