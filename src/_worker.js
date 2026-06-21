// src/worker.ts - Main Cloudflare Worker entry point
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Serve static assets from the 'dist' directory
    if (url.pathname.startsWith('/assets/') || url.pathname === '/favicon.ico') {
      return env.ASSETS.fetch(request);
    }

    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleAPIRequest(request, env, ctx);
    }

    // For all other routes, serve the React app (handles client-side routing)
    const response = await env.ASSETS.fetch(request);
    
    // If the response is a 404, serve index.html for React Router
    if (response.status === 404) {
      const indexResponse = await env.ASSETS.fetch(new Request('/', request));
      return new Response(indexResponse.body, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          ...indexResponse.headers,
        },
      });
    }

    return response;
  },
};

async function handleAPIRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  
  try {
    // Example: Proxy Gemini API calls
    if (url.pathname === '/api/gemini') {
      const geminiKey = env.GEMINI_API_KEY;
      if (!geminiKey) {
        return new Response(
          JSON.stringify({ error: 'Gemini API key not configured' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Forward the request to Gemini API
      const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${geminiKey}`,
        },
        body: request.body,
      });

      return new Response(geminiResponse.body, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Example: Proxy Yahoo Finance API calls
    if (url.pathname.startsWith('/api/stocks/')) {
      const symbol = url.pathname.split('/').pop();
      const yahooResponse = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      return new Response(yahooResponse.body, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'API endpoint not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

interface Env {
  ASSETS: Fetcher;
  GEMINI_API_KEY?: string;
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
}
