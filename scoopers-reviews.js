(function() {
  // --- 1. CONFIGURATION ---
  var API_KEY  = 'AIzaSyDBlokBFGQYneCZnerW3iHEvRE6baIGFBs';
  var PLACE_ID = 'ChIJkWreIPBrAIkRR0ucau4Cb6U'; // Your verified ID
  var ACCENT   = '#1a9e75';
  var MAX_REVIEWS = 5;

  function log(msg, type) {
    var output = document.getElementById('debug-output');
    if (!output) return;
    var div = document.createElement('div');
    div.style.marginBottom = '4px';
    if (type === 'err') div.style.color = '#ff4444';
    if (type === 'ok') div.style.color = '#88ff88';
    div.innerHTML = '[' + new Date().toLocaleTimeString() + '] ' + msg;
    output.appendChild(div);
  }

  function stars(n) {
    return Array(5).fill(0).map(function(_, i) {
      return '<span style="color:' + (i < n ? '#f5a623' : '#ddd') + ';font-size:16px;">★</span>';
    }).join('');
  }

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

      var name = place.displayName?.text || "Scoopers Pet Waste Removal";
      var rating = place.rating || 5.0;
      var count = place.userRatingCount || 0;
      var mapsUri = place.googleMapsLinks?.reviewsUri || 'https://maps.google.com/?cid=12028608823157291847';

      log('Success: Received data for ' + name, 'ok');

      var html = '<div style="font-family:sans-serif; max-width:780px; margin:0 auto; padding:25px; border:1px solid #eee; border-radius:15px; background:#fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">';

      // Header
      html += '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f9f9f9; padding-bottom:15px; margin-bottom:20px;">';
      html += '<div><h3 style="margin:0; font-size:20px;">' + name + '</h3>';
      html += '<div style="margin-top:5px;">' + stars(Math.round(rating)) + ' <b>' + rating + '</b> <span style="color:#888;">(' + count + ' reviews)</span></div></div>';
      html += '<a href="' + mapsUri + '" target="_blank" style="background:'+ACCENT+'; color:#fff; text-decoration:none; padding:10px 15px; border-radius:8px; font-weight:bold; font-size:13px;">Write a Review</a></div>';

      // Reviews
      var reviews = place.reviews || [];
      if (reviews.length === 0) {
        html += '<p style="text-align:center; padding:20px; color:#888;">No recent reviews found. Click below to see all on Google.</p>';
      } else {
        reviews.slice(0, MAX_REVIEWS).forEach(function(r) {
          var t = typeof r.text === 'object' ? r.text.text : (r.text || 'No comment provided.');
          html += '<div style="padding:15px 0; border-top:1px solid #f0f0f0; display:flex; gap:12px;">';
          html += '<div style="flex:1;"><div style="font-weight:bold; font-size:14px;">' + (r.authorAttribution?.displayName || 'Google User') + '</div>';
          html += '<div>' + stars(r.rating) + '</div>';
          html += '<p style="margin:5px 0 0; font-size:13.5px; color:#555; line-height:1.5;">' + t + '</p></div></div>';
        });
      }

      html += '<div style="text-align:center; margin-top:20px; border-top:1px solid #eee; padding-top:15px;"><a href="'+mapsUri+'" target="_blank" style="color:'+ACCENT+'; text-decoration:none; font-weight:bold;">View All on Google Maps →</a></div></div>';

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
