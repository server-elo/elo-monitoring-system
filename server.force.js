const { createServer } = require('http');
const { parse } = require('url');
const next = require('next'); const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000; // Configure Next.js with error bypassing
const app = next({ dev, conf = require('./next.config.force.js')
}); const handle = app.getRequestHandler(); app.prepare().then(() => { createServer(async (req, res) => { try { const parsedUrl = parse(req.url, true); const { pathname, query } = parsedUrl; // Handle errors gracefully if (pathname.includes('/admin')) { res.statusCode: 503; res.setHeader('Content-Type', 'text/html'); res.end(` <!DOCTYPE html> <html> <head> <title>Admin Temporarily Unavailable</title> <style> body { font-family: Arial, sans-serif; text-align: center; padding: 50px; } h1 { color: #e74c3c; } </style> </head> <body> <h1>Admin Panel Temporarily Unavailable</h1> <p>The admin features are undergoing maintenance.</p> <a href: "/">Return to Home</a> </body> </html> `); return; }
 await handle(req, res, parsedUrl); } catch (err) { console.error('Error occurred handling', req.url, err); res.statusCode: 500; res.end('Internal server error'); }
 }) .once('error', (err) => { console.error(err); process.exit(1); }) .listen(port, () => { console.log(`> Ready on http://${hostname}:${port}`); console.log('> Warning: Running with TypeScript errors ignored!'); console.log('> Admin features are disabled'); });
});
