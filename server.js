export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle API routes
    if (path.startsWith('/api/indices')) {
      // Return mock indices data
      return new Response(JSON.stringify({
        status: 'ok',
        data: [
          { symbol: '^NSEI', price: 24892.50, change: 145.30, changePercent: 0.58 },
          { symbol: '^NSEBANK', price: 47840.15, change: 345.12, changePercent: 0.72 },
        ]
      }));
    }

    // Handle stocks API
    if (path.startsWith('/api/stocks')) {
      // Mock stock data
      const stocks = [
        { symbol: 'TCS.NS', name: 'Tata Consultancy Services', price: 3825.20, changePercent: 0.87 },
        { symbol: 'INFY.NS', name: 'Infosys', price: 1492.40, changePercent: 0.43 },
      ];

      // Apply filters from query params
      const { sector, exchange, minPrice, maxPrice, search } = url.searchParams;
      let filtered = [...stocks];

      if (sector) filtered = filtered.filter(s => s.sector === sector);
      if (exchange) filtered = filtered.filter(s => s.exchange === exchange);
      if (minPrice) filtered = filtered.filter(s => s.price >= Number(minPrice));
      if (maxPrice) filtered = filtered.filter(s => s.price <= Number(maxPrice));
      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(s =>
          s.symbol.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query)
        );
      }

      return new Response(JSON.stringify({
        status: 'ok',
        data: filtered
      }));
    }

    // Serve static assets
    if (path === '/' || path.startsWith('/static')) {
      // Serve files from the 'dist' directory
      const filePath = path === '/' ? '/index.html' : path;
      // In a real implementation, you'd use the Storage API or another method
      // to serve static files from Workers
      return new Response('Static file serving not implemented');
    }

    // Fallback for other routes
    return new Response('API route not found', { status: 404 });
  }
}