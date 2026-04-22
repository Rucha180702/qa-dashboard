import { Users } from 'lucide-react';

export function AgentAnalysis() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center">
          <Users size={24} className="text-slate-500" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-300 mb-1">Agent Analysis</p>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
            Per-agent performance metrics, scoring trends, and quality breakdowns.<br />
            Coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
