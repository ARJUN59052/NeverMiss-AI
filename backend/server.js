require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();

app.use(cors());
app.use(express.json());

// Initialize connection pool using Supabase connection string from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Create page_views table in database if it doesn't exist
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS page_views (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    visitor_id text NOT NULL,
    page_url text NOT NULL,
    ip_address text,
    timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
  );
`;

pool.query(createTableQuery)
  .then(() => console.log('Database connected and table verified successfully.'))
  .catch(err => console.error('Database connection error:', err));

// POST endpoint to log page visits
app.post('/api/track', async (req, res) => {
  const { visitorId, pageUrl } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!visitorId || !pageUrl) {
    return res.status(400).json({ error: 'Missing visitorId or pageUrl' });
  }

  try {
    const insertQuery = `INSERT INTO page_views (visitor_id, page_url, ip_address) VALUES ($1, $2, $3) RETURNING id`;
    const result = await pool.query(insertQuery, [visitorId, pageUrl, ipAddress]);
    res.json({ success: true, logId: result.rows[0].id });
  } catch (err) {
    console.error('Error logging page view:', err);
    res.status(500).json({ error: 'Database write failed' });
  }
});

// GET endpoint to retrieve tracking logs
app.get('/api/analytics', async (req, res) => {
  try {
    const query = `SELECT visitor_id, page_url, ip_address, timestamp FROM page_views ORDER BY timestamp DESC`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Database read failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
