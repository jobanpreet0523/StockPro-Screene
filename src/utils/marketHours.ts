// ── Market hours logic (IST = UTC+5:30) ─────────────────────

export function getISTNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

export function isMarketHours(): boolean {
  const ist = getISTNow();
  const day = ist.getDay();
  if (day === 0 || day === 6) return false; // Sun/Sat
  const h = ist.getHours(), m = ist.getMinutes();
  const mins = h * 60 + m;
  return mins >= 555 && mins <= 930; // 9:15 – 15:30 IST
}

export function isWeekday(): boolean {
  const day = getISTNow().getDay();
  return day >= 1 && day <= 5;
}

export function getMarketStatus(): 'OPEN' | 'PRE_MARKET' | 'CLOSED' {
  const ist = getISTNow();
  const day = ist.getDay();
  if (day === 0 || day === 6) return 'CLOSED';
  const h = ist.getHours(), m = ist.getMinutes();
  const mins = h * 60 + m;
  if (mins >= 555 && mins <= 930) return 'OPEN';
  if (mins >= 540 && mins < 555) return 'PRE_MARKET'; // 9:00–9:15
  return 'CLOSED';
}

export function formatIST(date?: Date): string {
  const d = date || getISTNow();
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
}

export function formatISTDate(date?: Date): string {
  const d = date || getISTNow();
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}
