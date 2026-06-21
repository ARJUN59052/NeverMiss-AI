(async function() {
  // 1. Configuration
  // Set to true to log visits via your backend server (Vercel/Render).
  // Set to false to write logs directly from client-side script to Supabase.
  const USE_BACKEND = true; 

  // If you are using an external backend host (like Render), paste its URL here (e.g. 'https://nevermiss-backend.onrender.com').
  // Leave empty '' to automatically send requests to your current site's domain (perfect for Vercel deployment).
  const BACKEND_HOST = ''; 

  const SUPABASE_URL = 'https://thriovyovxxdcgzvdxem.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_zcV3c7RVe4xyLe3t6q3oCg_wUq_jDS4';

  // 2. Cookie Helpers
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

  // 3. Visitor ID Creation
  let visitorId = getCookie('visitor_id');
  if (!visitorId) {
    visitorId = 'usr_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setCookie('visitor_id', visitorId, 365);
  }

  // 4. IP Retrieval
  let ipAddress = 'unknown';
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipRes.json();
    ipAddress = ipData.ip;
  } catch (e) {
    console.warn('Could not capture IP address, continuing with unknown.', e);
  }

  // Helper for direct client-side Supabase write (fallback / direct-mode)
  async function logDirectlyToSupabase(email = null) {
    try {
      const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      const { error } = await supabase
        .from('page_views')
        .insert([
          {
            visitor_id: visitorId,
            page_url: window.location.href,
            ip_address: ipAddress,
            email: email
          }
        ]);

      if (error) {
        console.error('Error logging page view to Supabase directly:', error);
      } else {
        console.log('Page view successfully logged directly to Supabase client-side.');
      }
    } catch (err) {
      console.error('Failed to log page view via client-side Supabase client:', err);
    }
  }

  // 5. Log Page View (Backend with Client-side Fallback)
  if (USE_BACKEND) {
    const targetUrl = BACKEND_HOST ? `${BACKEND_HOST}/api/track` : '/api/track';
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          visitorId: visitorId,
          pageUrl: window.location.href
        })
      });
      if (response.ok) {
        console.log('Page view successfully logged via Backend API.');
      } else {
        throw new Error(`Backend tracking endpoint returned status ${response.status}.`);
      }
    } catch (err) {
      console.warn('Error logging page view to backend, attempting client-side fallback:', err);
      await logDirectlyToSupabase();
    }
  } else {
    await logDirectlyToSupabase();
  }

  // 6. Expose global function to log email submissions
  window.logEmailToSupabase = async function(email) {
    if (USE_BACKEND) {
      const targetUrl = BACKEND_HOST ? `${BACKEND_HOST}/api/track` : '/api/track';
      try {
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            visitorId: visitorId,
            pageUrl: window.location.href,
            email: email
          })
        });
        if (response.ok) {
          console.log('Email successfully logged via Backend API.');
        } else {
          throw new Error(`Backend tracking endpoint returned status ${response.status}.`);
        }
      } catch (err) {
        console.warn('Error logging email to backend, attempting client-side fallback:', err);
        await logDirectlyToSupabase(email);
      }
    } else {
      await logDirectlyToSupabase(email);
    }
  };

  // 7. Expose global function to log full lead form submissions directly to Supabase
  //
  // IMPORTANT: Create this table in your Supabase SQL Editor before going live:
  //
  //   CREATE TABLE IF NOT EXISTS leads (
  //     id          BIGSERIAL PRIMARY KEY,
  //     name        TEXT,
  //     email       TEXT,
  //     phone       TEXT,
  //     company     TEXT,
  //     industry    TEXT,
  //     visitor_id  TEXT,
  //     page_url    TEXT,
  //     created_at  TIMESTAMPTZ DEFAULT NOW()
  //   );
  //
  //   ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
  //   CREATE POLICY "allow_anon_insert" ON leads FOR INSERT TO anon WITH CHECK (true);
  //
  window.logLeadToSupabase = async function({ name, email, phone, company, industry }) {
    try {
      const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      const { error } = await supabase
        .from('leads')
        .insert([{
          name:       name     || null,
          email:      email    || null,
          phone:      phone    || null,
          company:    company  || null,
          industry:   industry || null,
          visitor_id: visitorId,
          page_url:   window.location.href
        }]);

      if (error) {
        console.error('Error saving lead to Supabase:', error);
      } else {
        console.log('Lead successfully saved to Supabase leads table.');
      }
    } catch (err) {
      console.error('Failed to save lead via Supabase client:', err);
    }
  };
})();
