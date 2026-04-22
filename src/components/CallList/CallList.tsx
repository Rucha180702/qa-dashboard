import { PhoneCall, Shuffle } from 'lucide-react';
import { useQAStore } from '../../store/useQAStore';
import { CallFilters } from './CallFilters';
import { CallCard } from './CallCard';

export function CallList() {
  const { selectedCallId, setSelectedCall, filteredCalls, calls } = useQAStore();
  const visible = filteredCalls();

  // QA-09: pick N random unreviewed calls
  function loadBulkSample() {
    const unreviewed = calls.filter((c) => c.qaStatus === 'unreviewed');
    const sample = unreviewed.sort(() => Math.random() - 0.5).slice(0, 5);
    if (sample.length > 0) setSelectedCall(sample[0].id);
  }

  const stats = {
    total:      visible.length,
    unreviewed: visible.filter((c) => c.qaStatus === 'unreviewed').length,
    flagged:    visible.filter((c) => c.qaStatus === 'flagged').length,
  };

  return (
    <div className="flex flex-col h-full panel">
      {/* Header */}
      <div className="panel-header shrink-0">
        <div className="flex items-center gap-2">
          <PhoneCall size={15} className="text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">Call Queue</span>
        </div>
        <button
          onClick={loadBulkSample}
          className="btn-ghost text-xs"
          title="Load 5 random unreviewed calls (bulk QA mode)"
        >
          <Shuffle size={13} />
          Bulk Sample
        </button>
      </div>

      {/* Filters */}
      <CallFilters />

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-slate-800/30 border-b border-slate-700/40 shrink-0">
        <span className="text-xs text-slate-500">
          <span className="text-slate-300 font-medium">{stats.total}</span> calls
        </span>
        {stats.unreviewed > 0 && (
          <span className="text-xs">
            <span className="text-amber-400 font-medium">{stats.unreviewed}</span>
            <span className="text-slate-500"> unreviewed</span>
          </span>
        )}
        {stats.flagged > 0 && (
          <span className="text-xs">
            <span className="text-red-400 font-medium">{stats.flagged}</span>
            <span className="text-slate-500"> flagged</span>
          </span>
        )}
      </div>

      {/* Call cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PhoneCall size={32} className="text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">No calls match your filters</p>
          </div>
        ) : (
          visible.map((call) => (
            <CallCard
              key={call.id}
              call={call}
              isSelected={selectedCallId === call.id}
              onClick={() => setSelectedCall(call.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
