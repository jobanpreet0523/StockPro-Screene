import fetch from 'node-fetch';

async function test() {
  const target = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY";
  const res = await fetch(target, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': '*/*, application/json',
        'Referer': 'https://www.nseindia.com/'
    }
  });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text.substring(0, 100));
}
test();
