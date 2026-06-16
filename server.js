import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

export default {
 async fetch(request, env) {
 const url = new URL(request.url);
 const path = url.pathname;

 // Yahoo Finance CORS Proxy ( improved path matching )
 if (path.startsWith('/api/yahoo-finance/')) {
 const pathParts = path.split('/');
 const symbol = pathParts[pathParts.length - 1];
 const financeUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

 try {
 const response = await fetch(financeUrl, {
 method: 'GET',
 headers: {
 'User-Agent': 'Mozilla/5.0'
 }
 });

 // Add CORS headers
 const cla = 'Access-Control-Allow-Origin';
 const cam = 'Access-Control-Allow-Methods';
 const headers = {
 'content-type': response.headers.get('content-type'),
 [cla]: '*',
 [cam]: 'GET, OPTIONS'
 };

 return new Response(response.body, {
 status: response.status,
 headers
 });
 } catch (error) {
 return new Response(JSON.stringify({ error: error.message }), {
 status: 500,
 headers: {
 'content-type': 'application/json',
 'Access-Control-Allow-Origin': '*',
 'Access-Control-Allow-Methods': 'GET, OPTIONS'
 }
 });
 }
}

 // Handle API routes
 if (path.startsWith('/api/indices')) {
 // Return mock indices data
 return new Response(JSON.stringify({
 status: 'ok',
 data: [
 { symbol: '.NSEI', price: 24892.50, change: 145.30, changePercent: 0.58 },
 { symbol: 'NSEBANK', price: 47840.15, change: 345.12, changePercent: 0.72 }
 ]
 }));
}

 // Serve static assets with KV
 if (path === '/' || path.startsWith('/static')) {
 const filePath = path === '/' ? '/index.html' : path;
 const handlers = {
 'text/html': async (path) => {
 return await getAssetFromKV(path, env.ASSETS);
 },
 'text/css': async (path) => {
 return await getAssetFromKV(path, env.ASSETS);
 },
 'application/javascript': async (path) => {
 return await getAssetFromKV(path, env.ASSETS);
 }
 };

 const handler = handlers[request.headers.get('accept')] || handlers['text/html'];
 return await handler(filePath);
 }

 // Fallback for other routes
 return new Response('API route not found', { status: 404 });
 }
}