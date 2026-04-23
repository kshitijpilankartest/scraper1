// proxy.mjs — Local CORS proxy server
// Runs on port 3501, forwards RSS/Reddit fetch requests server-side
// Usage: node proxy.mjs

import http from 'http';
import https from 'https';

const PORT = 3501;

function fetchUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    const mod = targetUrl.startsWith('https') ? https : http;
    const req = mod.get(targetUrl, {
      headers: {
        'User-Agent': 'Scarper/1.0 (AI News Dashboard)',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/json, */*',
      },
      timeout: 10000,
    }, (res) => {
      // Handle redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, contentType: res.headers['content-type'] || '' }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers — allow all origins for local use
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const target = url.searchParams.get('url');

  if (!target) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing ?url= parameter' }));
    return;
  }

  console.log(`[Proxy] Fetching: ${target}`);

  try {
    const { status, body, contentType } = await fetchUrl(target);
    res.writeHead(status, {
      'Content-Type': contentType.includes('json') ? 'application/json' : 'text/xml; charset=utf-8',
    });
    res.end(body);
  } catch (err) {
    console.error(`[Proxy] Error:`, err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`✅ Scarper CORS Proxy running at http://localhost:${PORT}`);
  console.log(`   Usage: http://localhost:${PORT}/?url=<encoded_target_url>`);
});
