(async function() {
  // 1. Configuration
  // To use your deployed Express backend server, replace this with your Render web service URL (e.g. 'https://nevermiss-backend.onrender.com')
  // If left empty or undefined, the script will fall back to direct client-side Supabase logging.
  const BACKEND_URL = ''; 

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
  if (BACKEND_URL) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/track`, {
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
