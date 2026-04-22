import { Clock, Phone, User } from 'lucide-react';
import type { CallSummary } from '../../types';
import { formatDuration, formatDate, formatPhone, STATUS_CONFIG } from './callUtils';
import { Star } from 'lucide-react';

interface Props {
  call: CallSummary;
  isSelected: boolean;
  onClick: () => void;
}

export function CallCard({ call, isSelected, onClick }: Props) {
  const status = STATUS_CONFIG[call.qa_status];

  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left px-3.5 py-3 rounded-xl border transition-all duration-150',
        isSelected
          ? 'bg-blue-600/10 border-blue-500/40 ring-1 ring-blue-500/30'
          : 'bg-slate-800/50 border-slate-700/40 hover:bg-slate-800 hover:border-slate-600/60',
      ].join(' ')}
    >
      {/* Row 1: Call ID + status */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono text-slate-500 truncate max-w-[120px]" title={call.call_id}>
          {call.call_id.slice(0, 8)}…
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${status.badgeClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
          {status.label}
        </span>
      </div>

      {/* Row 2: Customer phone */}
      <div className="flex items-center gap-1.5 mb-1">
        <Phone size={11} className="text-slate-500 shrink-0" />
        <span className="text-sm font-semibold text-slate-200 tracking-wide">
          {formatPhone(call.customer_phone)}
        </span>
      </div>

      {/* Row 3: Agent ID */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <User size={11} className="text-slate-500 shrink-0" />
        <span className="text-xs text-slate-400">Agent {call.agent_id || '—'}</span>
      </div>

      {/* Row 4: Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <Clock size={10} />
            {formatDuration(call.duration_seconds)}
          </span>
          <span className="text-[11px] text-slate-600">{formatDate(call.call_date)}</span>
        </div>
        {call.overall_score != null && (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={10}
                className={i < call.overall_score! ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
              />
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
