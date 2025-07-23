// Block requests to non-existent static files
(function() {
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch to block bad requests
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && (url.includes('/static/css/main.css') || url.includes('/static/js/main.js'))) {
      console.warn('Blocked request to non-existent file:', url);
      return Promise.resolve(new Response('', { status: 200 }));
    }
    return originalFetch.apply(this, args);
  };
  
  // Override XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if (typeof url === 'string' && (url.includes('/static/css/main.css') || url.includes('/static/js/main.js'))) {
      console.warn('Blocked XHR request to non-existent file:', url);
      return;
    }
    return originalOpen.apply(this, [method, url, ...args]);
  };
  
  // Remove any existing link tags pointing to these files
  document.querySelectorAll('link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href.includes('/static/css/main.css') || href.includes('/static/js/main.js'))) {
      console.warn('Removing invalid link tag:', href);
      link.remove();
    }
  });
  
  // Remove any existing script tags pointing to these files
  document.querySelectorAll('script').forEach(script => {
    const src = script.getAttribute('src');
    if (src && (src.includes('/static/js/main.js'))) {
      console.warn('Removing invalid script tag:', src);
      script.remove();
    }
  });
})();