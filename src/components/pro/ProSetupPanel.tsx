import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

export default function ProSetupPanel({ title, message, children }: { title: string; message: string; children?: ReactNode }) {
  return <section className="border border-slate-200 bg-white p-5"><div className="flex items-start gap-3"><AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600"/><div><h2 className="text-base font-black">{title}</h2><p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{message}</p></div></div>{children && <div className="mt-4">{children}</div>}</section>;
}
