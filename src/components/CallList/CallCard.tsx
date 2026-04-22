import { Clock, User, Phone } from 'lucide-react';
import { Call } from '../../types';
import { formatDuration, formatRelativeDate, useCaseLabel, languageLabel } from './callUtils';

interface Props {
  call: Call;
  isSelected: boolean;
  onClick: () => void;
}

const statusConfig = {
  unreviewed: {
    label: 'Unreviewed',
    classes: 'text-slate-400 bg-slate-700/50',
    dot: 'bg-slate-400',
  },
  reviewed: {
    label: 'Reviewed',
    classes: 'text-emerald-400 bg-emerald-900/30',
    dot: 'bg-emerald-400',
  },
  flagged: {
    label: 'Flagged',
    classes: 'text-red-400 bg-red-900/30',
    dot: 'bg-red-400',
  },
};

export function CallCard({ call, isSelected, onClick }: Props) {
  const status = statusConfig[call.qaStatus];

  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left p-3.5 rounded-lg border transition-all duration-150 group',
        isSelected
          ? 'bg-blue-600/15 border-blue-500/50 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]'
          : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800 hover:border-slate-600/60',
      ].join(' ')}
    >
      {/* Top row: call ID + status badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-slate-500">{call.id}</span>
        <span className={`chip ${status.classes} gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      {/* Agent name */}
      <div className="flex items-center gap-1.5 mb-1">
        <User size={12} className="text-blue-400 shrink-0" />
        <span className="text-sm font-medium text-slate-200 truncate">{call.agentName}</span>
      </div>

      {/* Customer name */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <Phone size={12} className="text-slate-500 shrink-0" />
        <span className="text-xs text-slate-400 truncate">{call.customerName}</span>
      </div>

      {/* Bottom row: meta chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="chip bg-slate-700/60 text-slate-300">
          {useCaseLabel(call.useCase)}
        </span>
        <span className="chip bg-slate-700/60 text-slate-300">
          {languageLabel(call.language)}
        </span>
        <span className="chip bg-slate-700/60 text-slate-400 ml-auto">
          <Clock size={10} />
          {formatDuration(call.duration)}
        </span>
      </div>

      {/* Date */}
      <div className="mt-2 text-xs text-slate-500">
        {formatRelativeDate(call.date)}
      </div>
    </button>
  );
}
