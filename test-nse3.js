import https from 'https';

async function fetchReal() {
  const fetch = (await import('node-fetch')).default;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Safari/537.36',
    'Accept': '*/*, application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.nseindia.com'
  };
  
  try {
    const homeRes = await fetch("https://www.nseindia.com", { headers });
    const cookies = homeRes.headers.raw()['set-cookie'];
    const cookieStr = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';
    
    const url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY";
    const apiRes = await fetch(url, { headers: { ...headers, 'Cookie': cookieStr }});
    const text = await apiRes.text();
    console.log("Status:", apiRes.status);
    console.log("Response text:", text.substring(0, 150));
  } catch (err) {
    console.log("Error:", err.message);
  }
}

fetchReal();
