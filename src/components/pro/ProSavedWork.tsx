import { useQuery } from '@tanstack/react-query';
import ProSetupPanel from './ProSetupPanel';
export default function ProSavedWork() {
  const query=useQuery({queryKey:['saved-work'],queryFn:async()=>{const r=await fetch('/api/saved-work');const p=await r.json().catch(()=>null);if(!r.ok)throw new Error(p?.message||'Saved-work storage requires setup.');return p;},refetchInterval:false});
  if(query.isError)return <ProSetupPanel title="Saved Work setup required" message={query.error instanceof Error?query.error.message:'Authenticated storage is unavailable.'}/>;
  return <div><h1 className="text-2xl font-black">Saved Work</h1><div className="mt-5 grid gap-3 md:grid-cols-2">{['Saved screeners','Saved charts','Saved notes','Saved exports'].map((name)=><ProSetupPanel key={name} title={name} message="No saved item exists. StockPro does not create placeholder work."/>)}</div></div>;
}
