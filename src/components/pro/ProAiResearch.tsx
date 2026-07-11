import { useState } from 'react';
import ProSetupPanel from './ProSetupPanel';
export default function ProAiResearch() {
  const [question,setQuestion]=useState('');
  return <div><h1 className="text-2xl font-black">AI Research</h1><p className="mt-1 text-sm font-semibold text-slate-600">Source-backed educational research only. No picks or recommendations.</p><textarea value={question} onChange={(e)=>setQuestion(e.target.value)} placeholder="Ask a research question requiring cited sources..." className="mt-5 min-h-32 w-full border border-slate-300 bg-white p-3"/><button type="button" disabled className="mt-3 bg-slate-950 px-4 py-2 text-sm font-bold text-white opacity-50">Research provider setup required</button><div className="mt-4"><ProSetupPanel title="AI provider setup required" message="Responses stay disabled until a server-side provider and mandatory source citations are configured. StockPro does not generate fake AI picks."/></div></div>;
}
