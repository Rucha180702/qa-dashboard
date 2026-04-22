import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useQAStore } from '../../store/useQAStore';
import type { QAStatus } from '../../types';

const QA_STATUSES: { value: QAStatus; label: string }[] = [
  { value: 'unreviewed', label: 'Unreviewed' },
  { value: 'reviewed',   label: 'Reviewed'   },
  { value: 'flagged',    label: 'Flagged'    },
];

export function CallFilters() {
  const filters  = useQAStore((s) => s.filters);
  const setFilter = useQAStore((s) => s.setFilter);
  const reset     = useQAStore((s) => s.resetFilters);

  const hasActive = filters.qaStatus !== '' || filters.agentId !== '' || filters.search !== '';

  return (
    <div className="p-3 space-y-2.5 border-b border-slate-700/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <SlidersHorizontal size={13} className="text-blue-400" />
          Filters
        </div>
        {hasActive && (
          <button onClick={reset} className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Phone, UUID, agent ID…"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="w-full bg-slate-800 border border-slate-600/50 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        />
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-slate-500 mb-1">From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilter('dateFrom', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-500 mb-1">To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilter('dateTo', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      {/* QA Status */}
      <div>
        <label className="block text-[11px] text-slate-500 mb-1">QA Status</label>
        <select
          value={filters.qaStatus}
          onChange={(e) => setFilter('qaStatus', e.target.value as QAStatus | '')}
          className="w-full bg-slate-800 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
        >
          <option value="">All statuses</option>
          {QA_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Agent ID */}
      <div>
        <label className="block text-[11px] text-slate-500 mb-1">Agent ID</label>
        <input
          type="text"
          placeholder="e.g. 6407"
          value={filters.agentId}
          onChange={(e) => setFilter('agentId', e.target.value)}
          className="w-full bg-slate-800 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
        />
      </div>
    </div>
  );
}
