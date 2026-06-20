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

  // 5. Log Page View (Backend vs Direct Supabase fallback)
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
        throw new Error('Backend tracking endpoint returned an error.');
      }
    } catch (err) {
      console.error('Error logging page view to backend:', err);
    }
  } else {
    // Fallback: direct client-side Supabase write
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
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
      console.error('Error logging page view to Supabase directly:', error);
    } else {
      console.log('Page view successfully logged directly to Supabase client-side.');
    }
  }
})();
