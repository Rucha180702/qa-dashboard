import { AlertCircle, Loader2, PhoneCall, Shuffle } from 'lucide-react';
import { useQAStore } from '../../store/useQAStore';
import { useCalls, useBulkSample } from '../../hooks/useCalls';
import { CallFilters } from './CallFilters';
import { CallCard } from './CallCard';

export function CallList() {
  const selectedCall  = useQAStore((s) => s.selectedCall);
  const setSelectedCall = useQAStore((s) => s.setSelectedCall);
  const bulkSession   = useQAStore((s) => s.bulkSession);

  const { data: calls = [], isLoading, error, isFetching } = useCalls();
  const bulkSample = useBulkSample();

  const stats = {
    total:      calls.length,
    unreviewed: calls.filter((c) => c.qa_status === 'unreviewed').length,
    flagged:    calls.filter((c) => c.qa_status === 'flagged').length,
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 shrink-0">
        <div className="flex items-center gap-2">
          <PhoneCall size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">Call Queue</span>
          {isFetching && !isLoading && (
            <Loader2 size={12} className="text-slate-500 animate-spin" />
          )}
        </div>
        <button
          onClick={() => bulkSample.mutate(5)}
          disabled={bulkSample.isPending}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-all disabled:opacity-50"
          title="Load 5 random unreviewed calls"
        >
          {bulkSample.isPending
            ? <Loader2 size={12} className="animate-spin" />
            : <Shuffle size={12} />}
          Bulk Sample
        </button>
      </div>

      {/* Bulk mode banner */}
      {bulkSession && (
        <div className="px-3 py-2 bg-blue-600/10 border-b border-blue-500/20 text-xs text-blue-300 flex items-center justify-between shrink-0">
          <span>Bulk mode — {bulkSession.currentIndex + 1}/{bulkSession.calls.length}</span>
          <button
            onClick={() => useQAStore.getState().exitBulk()}
            className="text-blue-400 hover:text-blue-200 transition-colors text-[11px]"
          >
            Exit
          </button>
        </div>
      )}

      {/* Filters */}
      <CallFilters />

      {/* Stats bar */}
      <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/30 border-b border-slate-700/40 shrink-0">
        <span className="text-[11px] text-slate-500">
          <span className="text-slate-300 font-medium">{stats.total}</span> calls
        </span>
        {stats.unreviewed > 0 && (
          <span className="text-[11px]">
            <span className="text-amber-400 font-medium">{stats.unreviewed}</span>
            <span className="text-slate-500"> pending</span>
          </span>
        )}
        {stats.flagged > 0 && (
          <span className="text-[11px]">
            <span className="text-red-400 font-medium">{stats.flagged}</span>
            <span className="text-slate-500"> flagged</span>
          </span>
        )}
      </div>

      {/* Call list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={24} className="text-blue-500 animate-spin" />
            <p className="text-xs text-slate-500">Loading calls from S3…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 px-4 text-center">
            <AlertCircle size={24} className="text-red-400" />
            <p className="text-sm text-red-400 font-medium">Failed to load calls</p>
            <p className="text-xs text-slate-500">{(error as Error).message}</p>
          </div>
        )}

        {!isLoading && !error && calls.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <PhoneCall size={28} className="text-slate-600" />
            <p className="text-sm text-slate-500">No calls found</p>
            <p className="text-[11px] text-slate-600">Try adjusting the date range or filters</p>
          </div>
        )}

        {!isLoading && calls.map((call) => (
          <CallCard
            key={call.call_id}
            call={call}
            isSelected={selectedCall?.call_id === call.call_id}
            onClick={() => setSelectedCall(call)}
          />
        ))}
      </div>
    </div>
  );
}
