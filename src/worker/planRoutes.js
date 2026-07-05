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
      status: 'free_delayed',
      priceInr: PRICE_INR,
      dataMode: 'delayed',
      message: 'Free delayed data is active. Live mode is not enabled yet.',
    });
  }

  if (path === '/api/live-plan/create-order' && request.method === 'POST') {
    return respond({
      status: 'setup_required',
      priceInr: PRICE_INR,
      message: 'Order route exists. Add server verification before accepting live users.',
    }, 503);
  }

  if (path === '/api/live-plan/verify-payment' && request.method === 'POST') {
    return respond({
      status: 'payment_required',
      priceInr: PRICE_INR,
      dataMode: 'delayed',
      message: 'Verification route exists but live mode remains locked.',
    }, 501);
  }

  const match = path.match(/^\/api\/provider\/(upstox|zerodha)\/(start|callback)$/);
  if (match) {
    return respond({
      status: 'setup_required',
      provider: match[1],
      step: match[2],
      message: 'Setup route exists. Connect backend redirect and callback before enabling live mode.',
    }, 503);
  }

  if (path === '/api/live-feed/status') {
    return respond({
      status: 'disabled',
      dataMode: 'delayed',
      message: 'Live feed relay is not active.',
    });
  }

  return null;
}
