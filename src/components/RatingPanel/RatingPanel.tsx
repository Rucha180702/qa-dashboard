import { useState, useRef, KeyboardEvent } from 'react';
import {
  Star, Flag, FlagOff, Loader2, Send, Trash2,
  CheckCircle, ClipboardCheck, MessageSquarePlus,
  ChevronLeft, ChevronRight, Sparkles,
} from 'lucide-react';
import { useQAStore } from '../../store/useQAStore';
import { useReview, useUpsertReview, useFlagCall, useAddComment, useDeleteComment, useToggleGoodToShare } from '../../hooks/useReview';
import { useEntities } from '../../hooks/useCalls';
import type { RubricDimension } from '../../types';

const ENTITY_COLORS: Record<string, string> = {
  'Person Name': 'bg-purple-900/40 text-purple-300 border-purple-700/40',
  'Loan Amount':  'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  'Account No':   'bg-blue-900/40 text-blue-300 border-blue-700/40',
  'EMI Date':     'bg-amber-900/40 text-amber-300 border-amber-700/40',
  'City':         'bg-cyan-900/40 text-cyan-300 border-cyan-700/40',
  'Loan Type':    'bg-indigo-900/40 text-indigo-300 border-indigo-700/40',
  'Due Amount':   'bg-red-900/40 text-red-300 border-red-700/40',
};

const DEFAULT_RUBRIC: RubricDimension[] = [
  { id: 'accuracy',   label: 'Accuracy',   score: 0 },
  { id: 'tone',       label: 'Tone',       score: 0 },
  { id: 'resolution', label: 'Resolution', score: 0 },
  { id: 'compliance', label: 'Compliance', score: 0 },
];

function StarRow({ label, score, onChange }: {
  label: string;
  score: number;
  onChange: (s: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-slate-400 w-24 shrink-0">{label}</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              size={16}
              className={
                n <= (hover || score)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-600'
              }
            />
          </button>
        ))}
        <span className="text-[11px] text-slate-500 w-5 text-right ml-1">
          {score > 0 ? score : '—'}
        </span>
      </div>
    </div>
  );
}

function OverallStarRow({ score, onChange }: { score: number; onChange: (s: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={24}
            className={
              n <= (hover || score)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-600'
            }
          />
        </button>
      ))}
    </div>
  );
}

export function RatingPanel() {
  const selectedCall  = useQAStore((s) => s.selectedCall);
  const schema        = useQAStore((s) => s.schema);
  const currentTime   = useQAStore((s) => s.currentTime);
  const bulkSession   = useQAStore((s) => s.bulkSession);
  const bulkNext      = useQAStore((s) => s.bulkNext);
  const bulkPrev      = useQAStore((s) => s.bulkPrev);

  const [overallScore, setOverallScore] = useState(0);
  const [rubric, setRubric] = useState<RubricDimension[]>(DEFAULT_RUBRIC);
  const [commentText, setCommentText] = useState('');
  const [anchorTs, setAnchorTs] = useState<number | null>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const callId = selectedCall?.call_id ?? '';
  const { data: review, isLoading: reviewLoading } = useReview(
    selectedCall ? callId : undefined,
    selectedCall ? schema : undefined,
  );

  // Sync local state when review loads
  const prevCallId = useRef<string>('');
  if (review && callId !== prevCallId.current) {
    prevCallId.current = callId;
    setOverallScore(review.overall_score ?? 0);
    setRubric(
      DEFAULT_RUBRIC.map((d) => ({
        ...d,
        score: review.rubric.find((r) => r.id === d.id)?.score ?? 0,
      }))
    );
  }

  const { data: entities = [] } = useEntities(
    selectedCall ? callId : undefined,
    selectedCall ? schema : undefined,
  );

  const upsert          = useUpsertReview(callId, schema);
  const flagMutation    = useFlagCall(callId, schema);
  const goodToShare     = useToggleGoodToShare(callId, schema);
  const addComment      = useAddComment(callId, schema);
  const deleteComment   = useDeleteComment(callId, schema);

  const isFlagged   = review?.qa_status === 'flagged';
  const isReviewed  = review?.qa_status === 'reviewed';
  const isGoodCall  = review?.good_to_share ?? false;

  const updateRubric = (id: string, score: number) => {
    setRubric((r) => r.map((d) => d.id === id ? { ...d, score } : d));
  };

  const handleSubmit = () => {
    if (overallScore === 0) return;
    upsert.mutate(
      { overall_score: overallScore, rubric },
      {
        onSuccess: () => {
          // Reset ratings after successful save
          setOverallScore(0);
          setRubric(DEFAULT_RUBRIC.map(d => ({ ...d, score: 0 })));
        },
      }
    );
  };

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
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 border border-slate-700/60 rounded-xl">
        <ClipboardCheck size={28} className="text-slate-600 mb-2" />
        <p className="text-sm text-slate-500">Select a call to review</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 shrink-0">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">QA Review</span>
          {isReviewed && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle size={11} /> Saved
            </span>
          )}
        </div>
        <button
          onClick={() => flagMutation.mutate(!isFlagged)}
          disabled={flagMutation.isPending}
          className={[
            'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
            isFlagged
              ? 'bg-red-900/30 text-red-400 border border-red-800/40 hover:bg-red-900/50'
              : 'text-slate-400 hover:text-red-400 hover:bg-red-900/20',
          ].join(' ')}
          title={isFlagged ? 'Remove flag' : 'Flag for secondary review'}
        >
          {flagMutation.isPending
            ? <Loader2 size={12} className="animate-spin" />
            : isFlagged ? <FlagOff size={12} /> : <Flag size={12} />}
          {isFlagged ? 'Flagged' : 'Flag'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Extracted Entities */}
        {entities.length > 0 && (
          <div className="px-4 pt-3 pb-2 border-b border-slate-800">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 mb-2">
              Extracted Entities
            </p>
            <div className="flex flex-wrap gap-1.5">
              {entities.map((e, i) => {
                const color = ENTITY_COLORS[e.type] ?? 'bg-slate-700/40 text-slate-300 border-slate-600/40';
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] border ${color}`}
                  >
                    <span className="font-semibold opacity-70 mr-1">{e.type}:</span>
                    <span className="font-medium">{e.value}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Overall Score */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
            Overall Score
          </p>
          <OverallStarRow score={overallScore} onChange={setOverallScore} />
        </div>

        {/* Rubric */}
        <div className="px-4 py-3 border-t border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Rubric
          </p>
          {rubric.map((dim) => (
            <StarRow
              key={dim.id}
              label={dim.label}
              score={dim.score}
              onChange={(s) => updateRubric(dim.id, s)}
            />
          ))}
        </div>

        {/* Submit */}
        <div className="px-4 pb-3 space-y-2">
          <button
            onClick={handleSubmit}
            disabled={overallScore === 0 || upsert.isPending}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium transition-all"
          >
            {upsert.isPending
              ? <Loader2 size={14} className="animate-spin" />
              : <CheckCircle size={14} />}
            {upsert.isPending ? 'Saving…' : 'Save Review'}
          </button>
          <button
            onClick={() => goodToShare.mutate(!isGoodCall)}
            disabled={goodToShare.isPending}
            className={[
              'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all',
              isGoodCall
                ? 'bg-emerald-900/40 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-slate-800/60 border-slate-600/40 text-slate-400 hover:text-emerald-300 hover:border-emerald-700/50',
            ].join(' ')}
          >
            {goodToShare.isPending
              ? <Loader2 size={14} className="animate-spin" />
              : <Sparkles size={14} />}
            {isGoodCall ? 'Good to Share ✓' : 'Mark as Good to Share'}
          </button>
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

      {/* Bulk navigation footer */}
      {bulkSession && (
        <div className="px-4 py-2.5 border-t border-slate-700/60 shrink-0 flex items-center justify-between bg-slate-800/30">
          <button
            onClick={bulkPrev}
            disabled={bulkSession.currentIndex === 0}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-all"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs text-slate-500">
            {bulkSession.currentIndex + 1} / {bulkSession.calls.length}
          </span>
          <button
            onClick={bulkNext}
            disabled={bulkSession.currentIndex >= bulkSession.calls.length - 1}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-all"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
