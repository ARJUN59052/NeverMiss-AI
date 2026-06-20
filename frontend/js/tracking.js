(async function() {
  const SUPABASE_URL = 'https://thriovyovxxdcgzvdxem.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_zcV3c7RVe4xyLe3t6q3oCg_wUq_jDS4';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

  let visitorId = getCookie('visitor_id');
  if (!visitorId) {
    visitorId = 'usr_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setCookie('visitor_id', visitorId, 365);
  }

  let ipAddress = 'unknown';
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipRes.json();
    ipAddress = ipData.ip;
  } catch (e) {
    console.warn('Could not capture IP address, continuing with unknown.', e);
  }

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
