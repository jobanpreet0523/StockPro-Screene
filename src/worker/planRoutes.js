const PRICE_INR = 299;

const respond = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
});

export async function handlePlanRoutes(path, request, env) {
  if (path === '/api/live-plan/status') {
    return respond({
      status: 'setup_required',
      priceInr: PRICE_INR,
      dataMode: 'unavailable',
      message: 'Market-data provider setup is required. No substitute values are active.',
    });
  }

  if (path === '/api/live-plan/create-order' && request.method === 'POST') {
    return respond({
      status: 'setup_required',
      priceInr: PRICE_INR,
      message: 'Order route exists. Add server verification before accepting live users.',
    });
  }

  if (path === '/api/live-plan/verify-payment' && request.method === 'POST') {
    return respond({
      status: 'setup_required',
      priceInr: PRICE_INR,
      dataMode: 'unavailable',
      message: 'Payment verification is disabled until launch readiness is complete.',
    });
  }

  const match = path.match(/^\/api\/provider\/(upstox|zerodha)\/(start|callback)$/);
  if (match) {
    return respond({
      status: 'setup_required',
      provider: match[1],
      step: match[2],
      message: 'Setup route exists. Connect backend redirect and callback before enabling live mode.',
    });
  }

  if (path === '/api/live-feed/status') {
    return respond({
      status: 'disabled',
      dataMode: 'unavailable',
      message: 'Live feed relay is not active.',
    });
  }

  return null;
}
