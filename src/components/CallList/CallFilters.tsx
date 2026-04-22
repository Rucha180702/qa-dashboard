import { Search, SlidersHorizontal, X, Sparkles, Flag } from 'lucide-react';
import { useQAStore } from '../../store/useQAStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { QAStatus } from '../../types';

const QA_STATUSES: { value: QAStatus; label: string }[] = [
  { value: 'unreviewed', label: 'Unreviewed' },
  { value: 'reviewed',   label: 'Reviewed'   },
  { value: 'flagged',    label: 'Flagged'    },
];

const LANGUAGES = ['Hindi', 'English', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada'];

// TODO: replace with DB-driven list once ClickHouse integration is live
const USE_CASES = ['Loan Inquiry', 'Collection', 'Support', 'Onboarding', 'Complaint', 'EMI Inquiry'];

export function CallFilters() {
  const filters    = useQAStore((s) => s.filters);
  const setFilter  = useQAStore((s) => s.setFilter);
  const reset      = useQAStore((s) => s.resetFilters);
  const user       = useAuthStore((s) => s.user);
  const isClient   = user?.role === 'client';

  const hasActive =
    filters.language !== '' || filters.useCase !== '' || filters.search !== '' ||
    (!isClient && (filters.qaStatus !== '' || filters.goodToShare));

  return (
    <div className="p-3 space-y-2.5 border-b border-slate-700/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <SlidersHorizontal size={13} className="text-blue-400" />
          Filters
        </div>
        {hasActive && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={11} /> Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Phone number or call ID…"
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

      {/* QA Status — internal only */}
      {!isClient && (
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
      )}

      {/* Language */}
      <div>
        <label className="block text-[11px] text-slate-500 mb-1">Language</label>
        <select
          value={filters.language}
          onChange={(e) => setFilter('language', e.target.value)}
          className="w-full bg-slate-800 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
        >
          <option value="">All languages</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {/* Use Case */}
      <div>
        <label className="block text-[11px] text-slate-500 mb-1">Use Case</label>
        <select
          value={filters.useCase}
          onChange={(e) => setFilter('useCase', e.target.value)}
          className="w-full bg-slate-800 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
        >
          <option value="">All use cases</option>
          {USE_CASES.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Quick-filter toggles — internal only */}
      {!isClient && (
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('goodToShare', !filters.goodToShare)}
            className={[
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
              filters.goodToShare
                ? 'bg-emerald-900/40 border-emerald-600/60 text-emerald-300'
                : 'bg-slate-800/60 border-slate-600/40 text-slate-400 hover:text-emerald-300 hover:border-emerald-700/50',
            ].join(' ')}
          >
            <Sparkles size={11} />
            Good Calls
          </button>
          <button
            onClick={() => setFilter('qaStatus', filters.qaStatus === 'flagged' ? '' : 'flagged')}
            className={[
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
              filters.qaStatus === 'flagged'
                ? 'bg-red-900/40 border-red-600/60 text-red-300'
                : 'bg-slate-800/60 border-slate-600/40 text-slate-400 hover:text-red-300 hover:border-red-700/50',
            ].join(' ')}
          >
            <Flag size={11} className={filters.qaStatus === 'flagged' ? 'fill-red-400' : ''} />
            Flagged
          </button>
        </div>
      )}
    </div>
  );
}
