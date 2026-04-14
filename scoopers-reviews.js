/* global google */
(function () {
  // --- CONFIGURATION ---
  var API_KEY     = 'AIzaSyDBlokBFGQYneCZnerW3iHEvRE6baIGFBs';
  var PLACE_ID    = 'ChIJkWreIPBrAIkRR0ucau4Cb6U';
  var MAX_SHOW    = 5;
  var TRUNCATE    = 160;
  var MAPS_URI    = 'https://maps.google.com/?cid=12028608823157291847';
  var GREEN       = '#1a9e75';
  var GREEN_DARK  = '#157a5a';

  var AVATAR_COLORS = ['#1a9e75','#2196F3','#9C27B0','#FF5722','#607D8B','#E91E63','#00897B','#FF9800'];

  // --- HELPERS ---
  function log(msg, type) {
    var el = document.getElementById('debug-output');
    if (!el) return;
    var d = document.createElement('div');
    d.style.marginBottom = '4px';
    if (type === 'err') d.style.color = '#ff4444';
    if (type === 'ok')  d.style.color = '#88ff88';
    d.innerHTML = '[' + new Date().toLocaleTimeString() + '] ' + msg;
    el.appendChild(d);
  }

  function getInitials(name) {
    if (!name) return 'G';
    var parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
  }

  function getAvatarColor(name) {
    var sum = 0;
    for (var i = 0; i < (name || '').length; i++) sum += name.charCodeAt(i);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
  }

  function formatDate(publishTime) {
    if (!publishTime) return '';
    var d = new Date(publishTime);
    if (isNaN(d)) return '';
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function starHTML(n, size) {
    size = size || 16;
    return Array(5).fill(0).map(function (_, i) {
      return '<span style="color:' + (i < n ? '#f5a623' : '#ddd') + ';font-size:' + size + 'px;">★</span>';
    }).join('');
  }

  // --- API (Google Maps JS SDK) ---
  async function fetchFromAPI() {
    const { Place } = await google.maps.importLibrary('places');
    const place = new Place({ id: PLACE_ID, requestedLanguage: 'en' });
    await place.fetchFields({
      fields: ['displayName', 'rating', 'userRatingCount', 'reviews']
    });
    return {
      displayName:     place.displayName,
      rating:          place.rating,
      userRatingCount: place.userRatingCount,
      reviews:         place.reviews || []
    };
  }

  // --- STYLES ---
  function injectStyles() {
    if (document.getElementById('scoopers-styles')) return;
    var s = document.createElement('style');
    s.id = 'scoopers-styles';
    s.textContent = `
      .scoop-wrap {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 16px;
      }
      .scoop-header {
        text-align: center;
        margin-bottom: 36px;
      }
      .scoop-header-top {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }
      .scoop-google-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 20px;
        padding: 5px 14px;
        font-size: 13px;
        color: #555;
        font-weight: 500;
        box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      }
      .scoop-rating-big {
        font-size: 52px;
        font-weight: 800;
        color: #1a1a1a;
        line-height: 1;
        letter-spacing: -2px;
      }
      .scoop-rating-sub {
        font-size: 14px;
        color: #888;
        margin-top: 6px;
      }
      .scoop-cta-btn {
        display: inline-block;
        margin-top: 18px;
        background: ${GREEN};
        color: #ffffff !important;
        text-decoration: none !important;
        padding: 11px 28px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.3px;
        transition: background 0.2s;
      }
      .scoop-cta-btn:hover { background: ${GREEN_DARK}; color: #ffffff !important; }
      .scoop-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
        justify-content: center;
      }
      .scoop-card {
        background: #fff;
        border-radius: 14px;
        border: 1px solid #ebebeb;
        box-shadow: 0 2px 12px rgba(0,0,0,0.07);
        padding: 20px;
        flex: 1 1 200px;
        max-width: 280px;
        min-width: 200px;
        display: flex;
        flex-direction: column;
        transition: transform 0.2s, box-shadow 0.2s;
        position: relative;
      }
      .scoop-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.11);
      }
      .scoop-quote-icon {
        position: absolute;
        top: 16px;
        right: 18px;
        font-size: 36px;
        color: #f0f0f0;
        line-height: 1;
        font-family: Georgia, serif;
      }
      .scoop-card-stars { margin-bottom: 10px; }
      .scoop-card-text {
        font-size: 13.5px;
        color: #444;
        line-height: 1.6;
        flex: 1;
        margin: 0 0 16px;
      }
      .scoop-card-text a {
        color: ${GREEN};
        text-decoration: none;
        font-weight: 500;
      }
      .scoop-card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid #f5f5f5;
        padding-top: 12px;
        margin-top: auto;
      }
      .scoop-author {
        display: flex;
        align-items: center;
        gap: 9px;
      }
      .scoop-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .scoop-author-info { line-height: 1.3; }
      .scoop-author-name {
        font-size: 13px;
        font-weight: 600;
        color: #222;
      }
      .scoop-author-date {
        font-size: 11px;
        color: #aaa;
      }
      @media (max-width: 640px) {
        .scoop-card { max-width: 100%; min-width: unset; flex: 1 1 100%; }
        .scoop-rating-big { font-size: 40px; }
      }
    `;
    document.head.appendChild(s);
  }

  var GOOGLE_G = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">'
    + '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>'
    + '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>'
    + '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>'
    + '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.93 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>'
    + '</svg>';

  // --- RENDER ---
  function render(data) {
    var ui = document.getElementById('scoopers-reviews-ui');
    if (!ui) return;
    injectStyles();

    var rating   = data.rating || 5.0;
    var count    = data.userRatingCount || 0;
    var allRevs  = data.reviews || [];

    // 3 hardcoded real reviews to always fill the grid
    var PINNED = [
      { rating: 5, text: 'Wow thanks so much! We let our yard go over the holidays and Scoopers was there to help us get it right again! Very professional and great communication throughout the whole process. Highly recommend!', authorAttribution: { displayName: 'Adam Law' }, publishTime: '2026-01-09T00:00:00Z' },
      { rating: 5, text: 'Max was polite and very easy to work with. He fit me in immediately. The text messages were a great touch. I would recommend this company above and beyond to anyone looking for this service!', authorAttribution: { displayName: 'Dwayne Kirk' }, publishTime: '2025-12-04T00:00:00Z' },
      { rating: 5, text: 'We are extremely pleased with this service! Everything was explained to us, we set a day for his return, and the yard looked extremely good when he was done. Will definitely use again!', authorAttribution: { displayName: 'Kimberly Hill' }, publishTime: '2026-03-10T00:00:00Z' }
    ];

    // Get up to MAX_SHOW from API (5-star, newest first)
    var apiReviews = allRevs
      .filter(function (r) { return r.rating === 5; })
      .sort(function (a, b) { return new Date(b.publishTime) - new Date(a.publishTime); })
      .slice(0, MAX_SHOW);

    // Add pinned reviews that aren't already showing from the API
    var apiNames = apiReviews.map(function (r) {
      return (r.authorAttribution?.displayName || '').toLowerCase();
    });
    var extras = PINNED.filter(function (p) {
      return apiNames.indexOf(p.authorAttribution.displayName.toLowerCase()) === -1;
    });

    var reviews = apiReviews.concat(extras);

    var html = '<div class="scoop-wrap">';

    // Header
    html += '<div class="scoop-header">';
    html += '<div class="scoop-rating-big">' + rating.toFixed(1) + '</div>';
    html += '<div>' + starHTML(Math.round(rating), 22) + '</div>';
    html += '<div class="scoop-rating-sub">Based on <strong>' + count + '</strong> reviews</div>';
    html += '</div>';

    // Cards
    html += '<div class="scoop-grid">';
    if (reviews.length === 0) {
      html += '<p style="color:#888;text-align:center;width:100%;padding:30px 0;">No 5-star reviews found.</p>';
    } else {
      reviews.forEach(function (r) {
        var raw       = r.text?.text || r.text || '';
        var truncated = raw.length > TRUNCATE;
        var text      = truncated ? raw.slice(0, TRUNCATE) + '...' : raw;
        if (!text) text = 'Highly recommended!';
        var name      = r.authorAttribution?.displayName || 'Google User';
        var color     = getAvatarColor(name);

        html += '<div class="scoop-card">';
        html += '<span class="scoop-quote-icon">&ldquo;</span>';
        html += '<div class="scoop-card-stars">' + starHTML(r.rating, 15) + '</div>';
        html += '<p class="scoop-card-text">' + text;
        if (truncated) html += ' <a href="' + MAPS_URI + '" target="_blank">More</a>';
        html += '</p>';
        html += '<div class="scoop-card-footer">';
        html += '<div class="scoop-author">';
        html += '<div class="scoop-avatar" style="background:' + color + ';">' + getInitials(name) + '</div>';
        html += '<div class="scoop-author-info">';
        html += '<div class="scoop-author-name">' + name + '</div>';
        html += '<div class="scoop-author-date">' + formatDate(r.publishTime) + '</div>';
        html += '</div></div>';
        html += GOOGLE_G;
        html += '</div></div>';
      });
    }
    html += '</div>';
    html += '<div style="text-align:center;margin-top:28px;">';
    html += '<a class="scoop-cta-btn" href="' + MAPS_URI + '" target="_blank">Leave a Review</a>';
    html += '</div>';
    html += '</div>';

    ui.innerHTML = html;
    log('Widget rendered.', 'ok');
  }

  // --- MAIN ---
  async function loadReviews() {
    try {
      log('Fetching from Google Places API...');
      var data = await fetchFromAPI();
      log('Fetched successfully.', 'ok');
      render(data);
    } catch (err) {
      log('ERROR: ' + err.message, 'err');
      var ui = document.getElementById('scoopers-reviews-ui');
      if (ui) ui.innerHTML = '<p style="color:#cc0000;font-family:monospace;font-size:12px;padding:10px;">Widget error: ' + err.message + '</p>';
    }
  }

  // Load Google Maps JS SDK, then run widget
  window._initScoopers = function () { loadReviews(); };
  var s = document.createElement('script');
  s.src = 'https://maps.googleapis.com/maps/api/js?key=' + API_KEY + '&callback=_initScoopers&v=beta&libraries=places';
  s.async = true;
  document.head.appendChild(s);
})();
