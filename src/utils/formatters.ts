// ── Indian number formatting (lakhs/crores) ─────────────────
export function fmtINR(n: number): string {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function fmtINRWhole(n: number): string {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

export function fmtLakhCrore(n: number): string {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(2) + ' LCr';
  if (abs >= 1e7) return sign + (abs / 1e7).toFixed(2) + ' Cr';
  if (abs >= 1e5) return sign + (abs / 1e5).toFixed(1) + ' L';
  if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + 'K';
  return sign + Math.round(abs).toString();
}

export function fmtPct(n: number, decimals = 2): string {
  if (n == null || isNaN(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  return sign + (n ?? 0).toFixed(decimals) + '%';
}

export function fmtOI(n: number): string {
  return fmtLakhCrore(n);
}

export function fmtPrice(n: number): string {
  if (n == null || isNaN(n)) return '—';
  return '₹' + fmtINR(n);
}
