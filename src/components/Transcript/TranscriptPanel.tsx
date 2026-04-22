import { useEffect, useRef } from 'react';
import { FileText, Languages, Loader2, Bot } from 'lucide-react';
import { useQAStore } from '../../store/useQAStore';
import { useTranscript } from '../../hooks/useCalls';
import type { Utterance } from '../../types';

function UtteranceRow({
  utterance,
  isActive,
  showTranslation,
  onClick,
}: {
  utterance: Utterance;
  isActive: boolean;
  showTranslation: boolean;
  onClick: () => void;
}) {
  const isAgent = utterance.speaker === 'agent';
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 group',
        isActive
          ? 'bg-blue-500/15 border border-blue-500/30 utterance-active'
          : 'hover:bg-slate-800/60 border border-transparent',
      ].join(' ')}
    >
      <div className="flex items-start gap-2.5">
        {/* Speaker badge */}
        <div className={[
          'shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
          isAgent
            ? 'bg-blue-900/50 text-blue-300'
            : 'bg-slate-700/60 text-slate-400',
        ].join(' ')}>
          {isAgent ? 'Agent' : 'Cust'}
        </div>

        <div className="flex-1 min-w-0">
          {/* Timestamp */}
          <span className="text-[10px] text-slate-600 font-mono mr-2">
            {String(Math.floor(utterance.startTime / 60)).padStart(2, '0')}:
            {String(Math.floor(utterance.startTime % 60)).padStart(2, '0')}
          </span>

          {/* Text */}
          <span className={[
            'text-sm leading-relaxed',
            isActive ? 'text-slate-100' : 'text-slate-300',
          ].join(' ')}>
            {showTranslation && utterance.translatedText
              ? utterance.translatedText
              : utterance.text}
          </span>

          {/* Show both side by side if translation is available */}
          {showTranslation && utterance.translatedText && utterance.text !== utterance.translatedText && (
            <p className="text-xs text-slate-500 mt-0.5 italic">{utterance.text}</p>
          )}
        </div>
      </div>
    </button>
  );
}

export function TranscriptPanel() {
  const selectedCall     = useQAStore((s) => s.selectedCall);
  const schema           = useQAStore((s) => s.schema);
  const currentTime      = useQAStore((s) => s.currentTime);
  const showTranslation  = useQAStore((s) => s.showTranslation);
  const toggleTranslation = useQAStore((s) => s.toggleTranslation);

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const { data: transcriptData, isLoading } = useTranscript(
    selectedCall?.call_id,
    schema
  );

  const utterances: Utterance[] = transcriptData?.utterances ?? [];

  const activeIndex = utterances.findIndex(
    (u) => currentTime >= u.startTime && currentTime < u.endTime
  );

  // Auto-scroll to active utterance
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  const seekToUtterance = (utterance: Utterance) => {
    // Expose seekTo via store's currentTime — AudioPlayer watches this
    // The actual seek is triggered via WaveSurfer in AudioPlayer
    window.dispatchEvent(
      new CustomEvent('qa:seek', { detail: { time: utterance.startTime } })
    );
  };

  const hasTranslation = utterances.some((u) => u.translatedText);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">Transcript</span>
          {utterances.length > 0 && (
            <span className="text-[11px] text-slate-500">{utterances.length} turns</span>
          )}
        </div>
        {hasTranslation && (
          <button
            onClick={toggleTranslation}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
              showTranslation
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60',
            ].join(' ')}
          >
            <Languages size={12} />
            {showTranslation ? 'Translated' : 'Original'}
          </button>
        )}
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {!selectedCall && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <FileText size={28} className="text-slate-700" />
            <p className="text-sm text-slate-500">No call selected</p>
          </div>
        )}

        {selectedCall && isLoading && (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 size={18} className="text-blue-500 animate-spin" />
            <span className="text-xs text-slate-500">Loading transcript…</span>
          </div>
        )}

        {selectedCall && !isLoading && utterances.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
              <Bot size={18} className="text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-400">Transcript not available</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {transcriptData?.message ?? 'Transcript integration pending'}
            </p>
          </div>
        )}

        {utterances.map((u, i) => (
          <div key={u.id} ref={i === activeIndex ? activeRef : undefined}>
            <UtteranceRow
              utterance={u}
              isActive={i === activeIndex}
              showTranslation={showTranslation}
              onClick={() => seekToUtterance(u)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
