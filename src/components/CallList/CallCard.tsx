import { Clock, Phone, Star, Copy, Flag, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { CallSummary } from '../../types';
import { formatDuration, formatDate, formatPhone, STATUS_CONFIG } from './callUtils';

interface Props {
  call: CallSummary;
  isSelected: boolean;
  onClick: () => void;
  variant?: 'flagged' | 'good';
}

const USE_CASE_COLORS: Record<string, string> = {
  'Loan Inquiry': 'bg-blue-900/40 text-blue-300',
  'Collection':   'bg-orange-900/40 text-orange-300',
  'Support':      'bg-purple-900/40 text-purple-300',
  'Onboarding':   'bg-emerald-900/40 text-emerald-300',
  'Complaint':    'bg-red-900/40 text-red-300',
  'EMI Inquiry':  'bg-cyan-900/40 text-cyan-300',
};

export function CallCard({ call, isSelected, onClick, variant }: Props) {
  const status = STATUS_CONFIG[call.qa_status];
  const ucColor = USE_CASE_COLORS[call.use_case] ?? 'bg-slate-700/50 text-slate-300';
  const [copied, setCopied] = useState(false);

  const copyUUID = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(call.call_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const baseClass = (() => {
    if (isSelected) {
      if (variant === 'flagged') return 'bg-red-900/40 border-red-500 ring-2 ring-red-500/40 shadow-lg shadow-red-900/30';
      if (variant === 'good')    return 'bg-emerald-900/20 border-emerald-500/60 ring-1 ring-emerald-500/30';
      return 'bg-blue-600/10 border-blue-500/40 ring-1 ring-blue-500/30';
    }
    if (variant === 'flagged') return 'bg-red-950/60 border-red-700 hover:bg-red-900/40 hover:border-red-600 shadow-sm shadow-red-900/20';
    if (variant === 'good')    return 'bg-emerald-950/30 border-emerald-800/40 hover:bg-emerald-950/50 hover:border-emerald-700/50';
    return 'bg-slate-800/50 border-slate-700/40 hover:bg-slate-800 hover:border-slate-600/60';
  })();

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${baseClass}`}
    >
      {/* Row 1: variant icon + Status badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {variant === 'flagged' && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-300 bg-red-900/50 px-2 py-0.5 rounded-md border border-red-700/60">
              <Flag size={11} className="fill-red-300" /> FLAGGED
            </span>
          )}
          {variant === 'good' && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
              <Sparkles size={10} /> GOOD CALL
            </span>
          )}
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${status.badgeClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
          {status.label}
        </span>
      </div>

      {/* Row 2: Full UUID with copy button */}
      <div className="flex items-center gap-1.5 mb-2.5 group/uuid">
        <span className="text-[11px] font-mono text-slate-400 break-all leading-relaxed flex-1">
          {call.call_id}
        </span>
        <button
          onClick={copyUUID}
          className="shrink-0 p-1 rounded text-slate-600 hover:text-slate-300 opacity-0 group-hover/uuid:opacity-100 transition-all"
          title="Copy UUID"
        >
          {copied
            ? <span className="text-[10px] text-emerald-400">✓</span>
            : <Copy size={11} />}
        </button>
      </div>

      {/* Row 2: Phone number — primary info */}
      <div className="flex items-center gap-2 mb-2">
        <Phone size={13} className="text-slate-500 shrink-0" />
        <span className="text-sm font-semibold text-slate-100 tracking-wider">
          {formatPhone(call.customer_phone)}
        </span>
      </div>

      {/* Row 3: Language + Use case chips */}
      <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-700/60 text-slate-400">
          {call.language}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${ucColor}`}>
          {call.use_case}
        </span>
      </div>

      {/* Row 4: Date + duration + score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>{formatDate(call.call_date)}</span>
          <span className="flex items-center gap-0.5">
            <Clock size={10} />
            {formatDuration(call.duration_seconds)}
          </span>
        </div>
        {call.overall_score != null && (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={10}
                className={i < call.overall_score! ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}
              />
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
