import { useEffect } from 'react';
import { Shield, ChevronDown, Building2, Loader2 } from 'lucide-react';
import { useQAStore } from '../../store/useQAStore';
import { useSchemas } from '../../hooks/useCalls';

export function TopNav() {
  const schema    = useQAStore((s) => s.schema);
  const setSchema = useQAStore((s) => s.setSchema);
  const { data: schemas = [], isLoading } = useSchemas();

  // Auto-select first schema on initial load
  useEffect(() => {
    if (!schema && schemas.length > 0) {
      setSchema(schemas[0]);
    }
  }, [schema, schemas, setSchema]);

  return (
    <header className="shrink-0 h-12 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <Shield size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold text-slate-100 tracking-tight">QA Center</span>
        <span className="text-[11px] text-slate-600 font-medium border border-slate-700/60 rounded px-1.5 py-0.5">
          Module 2
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Tenant selector */}
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-1.5">
          <Building2 size={13} className="text-slate-500 shrink-0" />
          <span className="text-[11px] text-slate-500 font-medium">Tenant</span>
          <div className="w-px h-3.5 bg-slate-700" />
          {isLoading ? (
            <div className="flex items-center gap-1.5">
              <Loader2 size={12} className="text-slate-500 animate-spin" />
              <span className="text-xs text-slate-500">Loading…</span>
            </div>
          ) : schemas.length === 0 ? (
            <span className="text-xs text-red-400">No tenants found</span>
          ) : (
            <div className="relative flex items-center">
              <select
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                className="appearance-none bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer pr-5"
              >
                {schemas.map((s) => (
                  <option key={s} value={s} className="bg-slate-800 font-normal text-slate-200">
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-0 text-slate-500 pointer-events-none" />
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[11px] font-bold text-blue-400">
          QA
        </div>
      </div>
    </header>
  );
}
