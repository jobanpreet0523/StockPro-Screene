export function getMarketStatus() {
  const ist = new Date(new Date().toLocaleString('en-US', {timeZone:'Asia/Kolkata'}));
  const t = ist.getHours() + ist.getMinutes()/60;
  const isWeekday = ist.getDay() >= 1 && ist.getDay() <= 5;
  if (isWeekday && t >= 9.25 && t < 15.5) return {label:'🟢 MARKET LIVE', color:'#10b981', isOpen:true};
  if (isWeekday && t >= 9.0 && t < 9.25) return {label:'🟡 PRE-OPEN', color:'#f59e0b', isOpen:false};
  return {label:'🔴 MARKET CLOSED', color:'#ef4444', isOpen:false};
}
