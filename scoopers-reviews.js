/* global google */
(function() {
  // --- 1. CONFIGURATION ---
  var API_KEY      = 'AIzaSyDBlokBFGQYneCZnerW3iHEvRE6baIGFBs';
  var PLACE_ID     = 'ChIJkWreIPBrAIkRR0ucau4Cb6U';
  var MAX_REVIEWS  = 8;
  var TRUNCATE     = 120;

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

  function stars(n) {
    return Array(5).fill(0).map(function(_, i) {
      return '<span style="color:' + (i < n ? '#f5a623' : '#ddd') + ';font-size:15px;line-height:1;">★</span>';
    }).join('');
  }

  function formatDate(publishTime) {
    if (!publishTime) return '';
    var d = new Date(publishTime);
    if (isNaN(d)) return '';
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + String(d.getDate()).padStart(2,'0') + ', ' + d.getFullYear();
  }

  function getInitials(name) {
    if (!name) return 'G';
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }

  var GOOGLE_G = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">'
    + '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>'
    + '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>'
    + '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>'
    + '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.93 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>'
    + '</svg>';

  async function loadReviews() {
    var ui = document.getElementById('scoopers-reviews-ui');
    try {
      log('Importing Places Library...');
      const { Place } = await google.maps.importLibrary('places');
      const place = new Place({ id: PLACE_ID, requestedLanguage: 'en' });

      log('Fetching Scoopers data...');
      await place.fetchFields({
        fields: ['displayName', 'rating', 'userRatingCount', 'reviews', 'googleMapsLinks']
      });

      var name    = place.displayName?.text || 'Scoopers Pet Waste Removal';
      var mapsUri = place.googleMapsLinks?.reviewsUri || 'https://maps.google.com/?cid=12028608823157291847';

      log('Success: Received data for ' + name, 'ok');

      var reviews = place.reviews || [];

      // Inject responsive grid styles once
      if (!document.getElementById('scoopers-styles')) {
        var style = document.createElement('style');
        style.id = 'scoopers-styles';
        style.textContent = [
          '#scoopers-grid {',
          '  display: grid;',
          '  grid-template-columns: repeat(4, 1fr);',
          '  gap: 16px;',
          '  font-family: sans-serif;',
          '}',
          '@media (max-width: 1024px) {',
          '  #scoopers-grid { grid-template-columns: repeat(2, 1fr); }',
          '}',
          '@media (max-width: 600px) {',
          '  #scoopers-grid { grid-template-columns: 1fr; }',
          '}',
          '.scoopers-card {',
          '  background: #fff;',
          '  border-radius: 12px;',
          '  border: 1px solid #ebebeb;',
          '  box-shadow: 0 2px 8px rgba(0,0,0,0.07);',
          '  padding: 16px;',
          '  display: flex;',
          '  flex-direction: column;',
          '  justify-content: space-between;',
          '  min-height: 160px;',
          '}',
          '.scoopers-card-top {',
          '  display: flex;',
          '  justify-content: space-between;',
          '  align-items: center;',
          '  margin-bottom: 10px;',
          '}',
          '.scoopers-rating {',
          '  display: flex;',
          '  align-items: center;',
          '  gap: 5px;',
          '}',
          '.scoopers-rating-num {',
          '  color: #f5a623;',
          '  font-weight: 700;',
          '  font-size: 15px;',
          '}',
          '.scoopers-date {',
          '  color: #aaa;',
          '  font-size: 12px;',
          '}',
          '.scoopers-text {',
          '  font-size: 13px;',
          '  color: #444;',
          '  line-height: 1.55;',
          '  flex: 1;',
          '  margin: 0 0 14px;',
          '}',
          '.scoopers-text a {',
          '  color: #666;',
          '  text-decoration: none;',
          '  font-weight: 500;',
          '}',
          '.scoopers-author {',
          '  display: flex;',
          '  align-items: center;',
          '  justify-content: space-between;',
          '}',
          '.scoopers-avatar {',
          '  width: 34px;',
          '  height: 34px;',
          '  border-radius: 50%;',
          '  background: #9e9e9e;',
          '  color: #fff;',
          '  display: flex;',
          '  align-items: center;',
          '  justify-content: center;',
          '  font-size: 13px;',
          '  font-weight: 600;',
          '  flex-shrink: 0;',
          '}',
          '.scoopers-author-name {',
          '  font-size: 13px;',
          '  font-weight: 500;',
          '  color: #333;',
          '  margin-left: 9px;',
          '  flex: 1;',
          '}',
        ].join('\n');
        document.head.appendChild(style);
      }

      var html = '<div id="scoopers-grid">';

      if (reviews.length === 0) {
        html += '<p style="grid-column:1/-1;text-align:center;color:#888;padding:30px;">No recent reviews found.</p>';
      } else {
        reviews.slice(0, MAX_REVIEWS).forEach(function(r) {
          var rawText    = typeof r.text === 'object' ? (r.text?.text || '') : (r.text || '');
          var truncated  = rawText.length > TRUNCATE;
          var displayTxt = truncated ? rawText.slice(0, TRUNCATE) + '...' : rawText;
          if (!displayTxt) displayTxt = 'No comment provided.';
          var dateStr    = formatDate(r.publishTime);
          var authorName = r.authorAttribution?.displayName || 'Google User';
          var initials   = getInitials(authorName);

          html += '<div class="scoopers-card">';

          // Top: stars + date
          html += '<div class="scoopers-card-top">';
          html += '<div class="scoopers-rating">';
          html += '<span class="scoopers-rating-num">' + r.rating + '</span>';
          html += stars(r.rating);
          html += '</div>';
          html += '<span class="scoopers-date">' + dateStr + '</span>';
          html += '</div>';

          // Text
          html += '<p class="scoopers-text">' + displayTxt;
          if (truncated) {
            html += ' <a href="' + mapsUri + '" target="_blank">More</a>';
          }
          html += '</p>';

          // Author row
          html += '<div class="scoopers-author">';
          html += '<div style="display:flex;align-items:center;">';
          html += '<div class="scoopers-avatar">' + initials + '</div>';
          html += '<span class="scoopers-author-name">' + authorName + '</span>';
          html += '</div>';
          html += GOOGLE_G;
          html += '</div>';

          html += '</div>'; // .scoopers-card
        });
      }

      html += '</div>'; // #scoopers-grid

      ui.innerHTML = html;
      log('Widget Rendered!', 'ok');

    } catch (err) {
      log('CRITICAL ERROR: ' + err.message, 'err');
    }
  }

  window._initScoopers = function() { loadReviews(); };

  var s = document.createElement('script');
  s.src = 'https://maps.googleapis.com/maps/api/js?key=' + API_KEY + '&callback=_initScoopers&v=beta&libraries=places';
  s.async = true;
  document.head.appendChild(s);
})();
