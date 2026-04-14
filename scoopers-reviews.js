(function () {
  // --- CONFIGURATION ---
  var API_KEY    = 'AIzaSyDBlokBFGQYneCZnerW3iHEvRE6baIGFBs';
  var PLACE_ID   = 'ChIJkWreIPBrAIkRR0ucau4Cb6U';
  var MAX_SHOW   = 5;
  var TRUNCATE   = 120;
  var CACHE_KEY  = 'scoopers_reviews_v1';
  var CACHE_TTL  = 24 * 60 * 60 * 1000; // 24 hours in ms

  // --- DEBUG ---
  function log(msg, type) {
    var output = document.getElementById('debug-output');
    if (!output) return;
    var div = document.createElement('div');
    div.style.marginBottom = '4px';
    if (type === 'err') div.style.color = '#ff4444';
    if (type === 'ok')  div.style.color = '#88ff88';
    div.innerHTML = '[' + new Date().toLocaleTimeString() + '] ' + msg;
    output.appendChild(div);
  }

  // --- CACHE ---
  function getCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (Date.now() - entry.ts > CACHE_TTL) return null;
      return entry.data;
    } catch (e) { return null; }
  }

  function setCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (e) {}
  }

  // --- API ---
  async function fetchFromAPI() {
    var url = 'https://places.googleapis.com/v1/places/' + PLACE_ID
            + '?reviewsSortOrder=NEWEST&key=' + API_KEY;
    var res = await fetch(url, {
      headers: {
        'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews,googleMapsLinks'
      }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' from Places API');
    return await res.json();
  }

  // --- HELPERS ---
  function stars(n) {
    return Array(5).fill(0).map(function (_, i) {
      return '<span style="color:' + (i < n ? '#f5a623' : '#ddd') + ';font-size:15px;line-height:1;">★</span>';
    }).join('');
  }

  function formatDate(publishTime) {
    if (!publishTime) return '';
    var d = new Date(publishTime);
    if (isNaN(d)) return '';
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + String(d.getDate()).padStart(2, '0') + ', ' + d.getFullYear();
  }

  function getInitials(name) {
    if (!name) return 'G';
    var parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }

  var GOOGLE_G = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">'
    + '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>'
    + '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>'
    + '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>'
    + '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.93 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>'
    + '</svg>';

  // --- STYLES ---
  function injectStyles() {
    if (document.getElementById('scoopers-styles')) return;
    var style = document.createElement('style');
    style.id = 'scoopers-styles';
    style.textContent = [
      '#scoopers-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;font-family:sans-serif;}',
      '@media(max-width:1024px){#scoopers-grid{grid-template-columns:repeat(2,1fr);}}',
      '@media(max-width:600px){#scoopers-grid{grid-template-columns:1fr;}}',
      '.sc-card{background:#fff;border-radius:12px;border:1px solid #ebebeb;box-shadow:0 2px 8px rgba(0,0,0,.07);padding:16px;display:flex;flex-direction:column;min-height:160px;}',
      '.sc-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}',
      '.sc-rating{display:flex;align-items:center;gap:5px;}',
      '.sc-num{color:#f5a623;font-weight:700;font-size:15px;}',
      '.sc-date{color:#aaa;font-size:12px;}',
      '.sc-text{font-size:13px;color:#444;line-height:1.55;flex:1;margin:0 0 14px;}',
      '.sc-text a{color:#666;text-decoration:none;font-weight:500;}',
      '.sc-author{display:flex;align-items:center;justify-content:space-between;}',
      '.sc-avatar{width:34px;height:34px;border-radius:50%;background:#9e9e9e;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0;}',
      '.sc-name{font-size:13px;font-weight:500;color:#333;margin-left:9px;flex:1;}',
    ].join('');
    document.head.appendChild(style);
  }

  // --- RENDER ---
  function render(data) {
    var ui = document.getElementById('scoopers-reviews-ui');
    if (!ui) return;

    injectStyles();

    var mapsUri  = data.googleMapsLinks?.reviewsUri || 'https://maps.google.com/?cid=12028608823157291847';
    var allRevs  = data.reviews || [];

    // Filter to 5-star only, then take most recent MAX_SHOW
    var reviews = allRevs.filter(function (r) { return r.rating === 5; }).slice(0, MAX_SHOW);

    var html = '<div id="scoopers-grid">';

    if (reviews.length === 0) {
      html += '<p style="grid-column:1/-1;text-align:center;color:#888;padding:30px;">No 5-star reviews found.</p>';
    } else {
      reviews.forEach(function (r) {
        var rawText    = r.text?.text || r.text || '';
        var truncated  = rawText.length > TRUNCATE;
        var displayTxt = truncated ? rawText.slice(0, TRUNCATE) + '...' : rawText;
        if (!displayTxt) displayTxt = 'No comment provided.';
        var authorName = r.authorAttribution?.displayName || 'Google User';

        html += '<div class="sc-card">';
        html += '<div class="sc-top">';
        html += '<div class="sc-rating"><span class="sc-num">' + r.rating + '</span>' + stars(r.rating) + '</div>';
        html += '<span class="sc-date">' + formatDate(r.publishTime) + '</span>';
        html += '</div>';
        html += '<p class="sc-text">' + displayTxt;
        if (truncated) html += ' <a href="' + mapsUri + '" target="_blank">More</a>';
        html += '</p>';
        html += '<div class="sc-author">';
        html += '<div style="display:flex;align-items:center;">';
        html += '<div class="sc-avatar">' + getInitials(authorName) + '</div>';
        html += '<span class="sc-name">' + authorName + '</span>';
        html += '</div>' + GOOGLE_G + '</div>';
        html += '</div>';
      });
    }

    html += '</div>';
    ui.innerHTML = html;
  }

  // --- MAIN ---
  async function loadReviews() {
    try {
      var cached = getCache();
      if (cached) {
        log('Using cached data — next refresh in ~' + Math.ceil((CACHE_TTL - (Date.now() - JSON.parse(localStorage.getItem(CACHE_KEY)).ts)) / 3600000) + 'h', 'ok');
        render(cached);
        return;
      }

      log('Cache expired or empty — fetching from Google Places API...');
      var data = await fetchFromAPI();
      setCache(data);
      log('Fetched and cached for 24 hours', 'ok');
      render(data);

    } catch (err) {
      log('CRITICAL ERROR: ' + err.message, 'err');
    }
  }

  loadReviews();
})();
