#!/usr/bin/env node
/**
 * Production-like static + Netlify-function server for Docker / local parity.
 * Uses esbuild-bundled handlers from .netlify-build/functions (see build:functions).
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'apps/react-web/dist');
const functionsDir = path.join(root, '.netlify-build/functions');
const port = Number(process.env.PORT ?? 8080);

function loadHandler(name) {
  const mod = require(path.join(functionsDir, `${name}.js`));
  if (typeof mod.handler !== 'function') {
    throw new Error(`Function ${name} has no handler export`);
  }
  return mod.handler;
}

const handlers = {
  health: loadHandler('health'),
  'surfy-token': loadHandler('surfy-token'),
  'surfy-api-proxy': loadHandler('surfy-api-proxy'),
};

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
  };
  return map[ext] ?? 'application/octet-stream';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function toNetlifyEvent(req, url, body, proxySplat) {
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers[key] = Array.isArray(value) ? value.join(',') : value;
  }
  return {
    httpMethod: req.method ?? 'GET',
    path: proxySplat !== undefined ? `/api/v1/${proxySplat}` : url.pathname,
    rawUrl: url.toString(),
    rawQuery: url.search.startsWith('?') ? url.search.slice(1) : url.search,
    headers,
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    body: body.length ? body.toString('utf8') : null,
    isBase64Encoded: false,
  };
}

async function invoke(handler, event) {
  const result = await handler(event, {});
  return result ?? { statusCode: 204, body: '' };
}

function sendStatic(res, filePath) {
  const stat = statSync(filePath);
  res.writeHead(200, {
    'Content-Type': contentType(filePath),
    'Content-Length': stat.size,
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host ?? `127.0.0.1:${port}`;
    const url = new URL(req.url ?? '/', `http://${host}`);
    const body = ['GET', 'HEAD'].includes(req.method ?? 'GET') ? Buffer.alloc(0) : await readBody(req);

    if (url.pathname === '/api/health') {
      const out = await invoke(handlers.health, toNetlifyEvent(req, url, body));
      return writeHandlerResult(res, out);
    }
    if (url.pathname === '/api/surfy-token') {
      const out = await invoke(handlers['surfy-token'], toNetlifyEvent(req, url, body));
      return writeHandlerResult(res, out);
    }
    if (url.pathname.startsWith('/api/v1/')) {
      const splat = url.pathname.slice('/api/v1/'.length);
      const out = await invoke(handlers['surfy-api-proxy'], toNetlifyEvent(req, url, body, splat));
      return writeHandlerResult(res, out);
    }

    let filePath = path.join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!filePath.startsWith(distDir)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    sendStatic(res, filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  }
});

function writeHandlerResult(res, out) {
  const status = out.statusCode ?? 200;
  const headers = { ...(out.headers ?? {}) };
  let body = out.body ?? '';
  if (out.isBase64Encoded && typeof body === 'string') {
    const buf = Buffer.from(body, 'base64');
    res.writeHead(status, headers);
    res.end(buf);
    return;
  }
  res.writeHead(status, headers);
  res.end(body);
}

server.listen(port, '0.0.0.0', () => {
  console.log(`Surfy demos (Netlify-parity) on http://0.0.0.0:${port}`);
});
