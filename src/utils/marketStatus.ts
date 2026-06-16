export type MarketStatusKey = 'LIVE' | 'PREOPEN' | 'POSTCLOSE' | 'CLOSED';

export interface MarketStatus {
  status: MarketStatusKey;
  label: string;
  color: string;
  isOpen: boolean;
}

export function getMarketStatus(): MarketStatus {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const t = ist.getHours() + ist.getMinutes() / 60;
  const day = ist.getDay();
  const isWeekday = day >= 1 && day <= 5;

  if (isWeekday && t >= 9.25 && t < 15.5)
    return { status: 'LIVE', label: '🟢 MARKET LIVE', color: '#10b981', isOpen: true };
  if (isWeekday && t >= 9.0 && t < 9.25)
    return { status: 'PREOPEN', label: '🟡 PRE-OPEN', color: '#f59e0b', isOpen: false };
  if (isWeekday && t >= 15.5 && t < 16.0)
    return { status: 'POSTCLOSE', label: '🟠 POST-CLOSE', color: '#f97316', isOpen: false };
  return { status: 'CLOSED', label: '🔴 MARKET CLOSED', color: '#ef4444', isOpen: false };
}

export function getISTTime(): string {
  return new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
