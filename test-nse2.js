import https from 'https';

async function fetchReal() {
  const fetch = (await import('node-fetch')).default;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Safari/537.36',
    'Accept': '*/*, application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.nseindia.com/option-chain'
  };
  
  try {
    const homeRes = await fetch("https://www.nseindia.com", { headers });
    const cookies = homeRes.headers.raw()['set-cookie'];
    const cookieStr = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';
    console.log("Cookies:", cookieStr);
    
    const url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY";
    const apiRes = await fetch(url, { headers: { ...headers, 'Cookie': cookieStr }});
    console.log("Status:", apiRes.status);
    const json = await apiRes.json();
    console.log("Success! Spot:", json.records.underlyingValue);
  } catch (err) {
    console.log("Error:", err.message);
  }
}

fetchReal();
