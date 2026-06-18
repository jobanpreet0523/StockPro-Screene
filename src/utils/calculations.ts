// ── Derivatives calculations ─────────────────────────────────

export interface MaxPainResult { maxPainStrike: number; painByStrike: Map<number, number> }

export function calcMaxPain(options: { strikePrice: number; callOi: number; putOi: number }[]): MaxPainResult {
  const painMap = new Map<number, number>();
  let minPain = Infinity, maxPainStrike = 0;
  for (const target of options) {
    let pain = 0;
    for (const opt of options) {
      if (target.strikePrice > opt.strikePrice) pain += (target.strikePrice - opt.strikePrice) * opt.callOi;
      if (target.strikePrice < opt.strikePrice) pain += (opt.strikePrice - target.strikePrice) * opt.putOi;
    }
    painMap.set(target.strikePrice, pain);
    if (pain < minPain) { minPain = pain; maxPainStrike = target.strikePrice; }
  }
  return { maxPainStrike, painByStrike: painMap };
}

export function calcPCR(totalPutOI: number, totalCallOI: number): number {
  if (!totalCallOI) return 0;
  return +((totalPutOI ?? 0) / (totalCallOI ?? 1)).toFixed(2);
}

export function calcATMStrike(spot: number, step: number): number {
  return Math.round(spot / step) * step;
}

export function getStrikeStep(symbol: string): number {
  if (symbol === 'BANKNIFTY') return 100;
  if (symbol === 'FINNIFTY') return 50;
  return 50; // NIFTY
}

export function isITMCall(strike: number, spot: number): boolean {
  return strike < spot;
}

export function isITMPut(strike: number, spot: number): boolean {
  return strike > spot;
}

export function isATM(strike: number, spot: number, step: number): boolean {
  return Math.abs(strike - Math.round(spot / step) * step) < 1;
}
