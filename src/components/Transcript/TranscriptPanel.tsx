import { useEffect, useRef } from 'react';
import { FileText, Languages, Loader2, Bot, AlertCircle, RefreshCw } from 'lucide-react';
import { useQAStore } from '../../store/useQAStore';
import { useTranscript, useStartTranscription } from '../../hooks/useCalls';
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
        <div className={[
          'shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
          isAgent
            ? 'bg-blue-900/50 text-blue-300'
            : 'bg-slate-700/60 text-slate-400',
        ].join(' ')}>
          {isAgent ? 'Agent' : 'Cust'}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-slate-600 font-mono mr-2">
            {String(Math.floor(utterance.startTime / 60)).padStart(2, '0')}:
            {String(Math.floor(utterance.startTime % 60)).padStart(2, '0')}
          </span>
          <span className={[
            'text-sm leading-relaxed',
            isActive ? 'text-slate-100' : 'text-slate-300',
          ].join(' ')}>
            {showTranslation && utterance.translatedText
              ? utterance.translatedText
              : utterance.text}
          </span>
          {showTranslation && utterance.translatedText && utterance.text !== utterance.translatedText && (
            <p className="text-xs text-slate-500 mt-0.5 italic">{utterance.text}</p>
          )}
        </div>
      </div>
    </button>
  );
}

function TranscribingState({ status }: { status: 'pending' | 'in_progress' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-blue-900/30 border border-blue-700/40 flex items-center justify-center">
          <FileText size={20} className="text-blue-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
          <Loader2 size={12} className="text-blue-400 animate-spin" />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-300 mb-1">
          {status === 'pending' ? 'Queued for transcription' : 'Transcribing audio…'}
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          AWS Transcribe is processing this call.<br />
          Usually takes 1–3 minutes. Auto-refreshing.
        </p>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function TranscriptPanel() {
  const selectedCall      = useQAStore((s) => s.selectedCall);
  const schema            = useQAStore((s) => s.schema);
  const currentTime       = useQAStore((s) => s.currentTime);
  const showTranslation   = useQAStore((s) => s.showTranslation);
  const toggleTranslation = useQAStore((s) => s.toggleTranslation);

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const { data: transcriptData, isLoading } = useTranscript(selectedCall?.call_id, schema);
  const { mutate: startTranscription } = useStartTranscription();

  // Auto-trigger transcription when a call is selected and none exists yet
  useEffect(() => {
    if (selectedCall && schema && transcriptData?.status === 'not_started') {
      startTranscription({ callId: selectedCall.call_id, schema });
    }
  }, [selectedCall?.call_id, schema, transcriptData?.status]);

  const utterances: Utterance[] = transcriptData?.utterances ?? [];

  const activeIndex = utterances.findIndex(
    (u) => currentTime >= u.startTime && currentTime < u.endTime
  );

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  const seekToUtterance = (utterance: Utterance) => {
    window.dispatchEvent(new CustomEvent('qa:seek', { detail: { time: utterance.startTime } }));
  };

  const hasTranslation = utterances.some((u) => u.translatedText);
  const txStatus = transcriptData?.status;

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
          {transcriptData?.language_code && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {transcriptData.language_code}
            </span>
          )}
          {(txStatus === 'pending' || txStatus === 'in_progress') && (
            <span className="flex items-center gap-1 text-[11px] text-blue-400">
              <Loader2 size={10} className="animate-spin" />
              {txStatus === 'pending' ? 'Queued' : 'Processing'}
            </span>
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
            {showTranslation ? 'EN (translated)' : 'Original'}
          </button>
        )}
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* No call selected */}
        {!selectedCall && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <FileText size={28} className="text-slate-700" />
            <p className="text-sm text-slate-500">No call selected</p>
          </div>
        )}

        {/* Initial loading (fetching transcript row) */}
        {selectedCall && isLoading && (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 size={18} className="text-blue-500 animate-spin" />
            <span className="text-xs text-slate-500">Loading…</span>
          </div>
        )}

        {/* Transcription in progress */}
        {selectedCall && !isLoading && (txStatus === 'pending' || txStatus === 'in_progress') && (
          <TranscribingState status={txStatus} />
        )}

        {/* Failed state */}
        {selectedCall && !isLoading && txStatus === 'failed' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-red-900/20 border border-red-800/40 flex items-center justify-center">
              <AlertCircle size={18} className="text-red-400" />
            </div>
            <p className="text-sm font-medium text-red-400">Transcription failed</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              {transcriptData?.message ?? 'An error occurred during transcription'}
            </p>
            <button
              onClick={() => startTranscription({ callId: selectedCall.call_id, schema })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
            >
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        )}

        {/* Not started — shows briefly before auto-trigger fires */}
        {selectedCall && !isLoading && txStatus === 'not_started' && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 size={18} className="text-blue-500 animate-spin" />
            <p className="text-xs text-slate-500">Starting transcription…</p>
          </div>
        )}

        {/* Utterances */}
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

        {/* No transcript message when not started from backend (edge case) */}
        {selectedCall && !isLoading && !txStatus && utterances.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
              <Bot size={18} className="text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-400">Transcript unavailable</p>
            <p className="text-xs text-slate-600">
              {transcriptData?.message ?? 'No transcript data'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
