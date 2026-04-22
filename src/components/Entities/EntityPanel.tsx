import { Download, Loader2, Sparkles, Phone, Clock, Trash2, Send, MessageSquarePlus } from 'lucide-react';
import { useState, useRef, KeyboardEvent } from 'react';
import { useQAStore } from '../../store/useQAStore';
import { useEntities, useAudioUrl } from '../../hooks/useCalls';
import { useReview, useAddComment, useDeleteComment } from '../../hooks/useReview';
import { formatDuration, formatDate, formatPhone } from '../CallList/callUtils';

const ENTITY_COLORS: Record<string, string> = {
  'Person Name': 'bg-purple-900/40 text-purple-300 border-purple-700/40',
  'Loan Amount':  'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  'Account No':   'bg-blue-900/40 text-blue-300 border-blue-700/40',
  'EMI Date':     'bg-amber-900/40 text-amber-300 border-amber-700/40',
  'City':         'bg-cyan-900/40 text-cyan-300 border-cyan-700/40',
  'Loan Type':    'bg-indigo-900/40 text-indigo-300 border-indigo-700/40',
  'Due Amount':   'bg-red-900/40 text-red-300 border-red-700/40',
};

export function EntityPanel() {
  const selectedCall = useQAStore((s) => s.selectedCall);
  const schema       = useQAStore((s) => s.schema);
  const currentTime  = useQAStore((s) => s.currentTime);

  const [commentText, setCommentText] = useState('');
  const [anchorTs, setAnchorTs] = useState<number | null>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const callId = selectedCall?.call_id ?? '';
  const { data: entities = [], isLoading: entitiesLoading } = useEntities(
    selectedCall?.call_id,
    schema,
  );
  const { data: audioUrl } = useAudioUrl(selectedCall?.call_id, schema);
  const { data: review, isLoading: reviewLoading } = useReview(
    selectedCall ? callId : undefined,
    selectedCall ? schema : undefined,
  );
  
  const addComment = useAddComment(callId, schema);
  const deleteComment = useDeleteComment(callId, schema);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment.mutate({
      text: commentText.trim(),
      timestampAnchor: anchorTs ?? undefined,
    });
    setCommentText('');
    setAnchorTs(null);
  };

  const handleCommentKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment();
  };

  const setTimestampAnchor = () => {
    setAnchorTs(currentTime);
    commentRef.current?.focus();
  };

  if (!selectedCall) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 border border-slate-700/60 rounded-xl gap-2">
        <Sparkles size={28} className="text-slate-600" />
        <p className="text-sm text-slate-500">Select a call to view details</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-emerald-400" />
          <span className="text-sm font-semibold text-slate-200">Call Details</span>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-900/30 border border-emerald-700/40 px-2 py-0.5 rounded-full font-medium">
          <Sparkles size={9} /> Good to Share
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Call metadata */}
        <div className="px-4 py-3 border-b border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <Phone size={12} className="text-slate-500 shrink-0" />
            <span className="text-sm font-semibold text-slate-100 tracking-wider">
              {formatPhone(selectedCall.customer_phone)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>{formatDate(selectedCall.call_date)}</span>
            <span className="flex items-center gap-0.5">
              <Clock size={10} /> {formatDuration(selectedCall.duration_seconds)}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
              {selectedCall.language}
            </span>
          </div>
        </div>

        {/* Download audio */}
        {audioUrl && (
          <div className="px-4 py-3 border-b border-slate-800">
            <a
              href={audioUrl.url}
              download
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-sm font-medium transition-all"
            >
              <Download size={14} />
              Download Audio
            </a>
          </div>
        )}

        {/* Entities */}
        <div className="px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Extracted Entities
          </p>
          {entitiesLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={14} className="text-slate-500 animate-spin" />
            </div>
          ) : entities.length === 0 ? (
            <p className="text-xs text-slate-600">No entities extracted</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {entities.map((entity, i) => {
                const color = ENTITY_COLORS[entity.type] ?? 'bg-slate-700/40 text-slate-300 border-slate-600/40';
                return (
                  <span key={i} className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs border ${color}`}>
                    <span className="font-semibold opacity-70 mr-1.5">{entity.type}:</span>
                    <span className="font-medium">{entity.value}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="px-4 py-3 border-t border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Comments
          </p>

          {/* Existing comments */}
          {reviewLoading ? (
            <div className="flex justify-center py-3">
              <Loader2 size={14} className="text-slate-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 mb-3">
              {(review?.comments ?? []).map((c) => (
                <div key={c.id} className="bg-slate-800/50 rounded-lg p-2.5 group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-300 leading-relaxed flex-1">{c.text}</p>
                    <button
                      onClick={() => deleteComment.mutate(c.id)}
                      className="shrink-0 p-1 rounded text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {c.timestamp_anchor != null && (
                      <span className="text-[10px] font-mono bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">
                        @{String(Math.floor(c.timestamp_anchor / 60)).padStart(2, '0')}:
                        {String(Math.floor(c.timestamp_anchor % 60)).padStart(2, '0')}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-600">{c.author}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <div className="space-y-2">
            {anchorTs != null && (
              <div className="flex items-center justify-between bg-blue-900/20 border border-blue-800/30 rounded-lg px-2.5 py-1.5">
                <span className="text-xs text-blue-400">
                  Anchored @{String(Math.floor(anchorTs / 60)).padStart(2, '0')}:
                  {String(Math.floor(anchorTs % 60)).padStart(2, '0')}
                </span>
                <button onClick={() => setAnchorTs(null)} className="text-blue-500 hover:text-blue-300 text-[11px]">
                  Remove
                </button>
              </div>
            )}
            <textarea
              ref={commentRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleCommentKey}
              placeholder="Add a comment… (Ctrl+Enter to save)"
              rows={3}
              className="w-full bg-slate-800 border border-slate-600/50 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
            <div className="flex gap-2">
              <button
                onClick={setTimestampAnchor}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 border border-slate-700/40 transition-all"
                title="Anchor to current playback position"
              >
                <MessageSquarePlus size={12} />
                Anchor @{String(Math.floor(currentTime / 60)).padStart(2, '0')}:
                {String(Math.floor(currentTime % 60)).padStart(2, '0')}
              </button>
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim() || addComment.isPending}
                className="px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-medium transition-all flex items-center gap-1"
              >
                {addComment.isPending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
