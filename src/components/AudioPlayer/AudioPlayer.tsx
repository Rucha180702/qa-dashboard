import { useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import {
  Play, Pause, SkipForward, SkipBack,
  Loader2, AlertCircle, SkipForward as SkipSilenceIcon,
  Volume2,
} from 'lucide-react';
import { useQAStore } from '../../store/useQAStore';
import { useAudioUrl } from '../../hooks/useCalls';
import { WaveformPlayer } from './WaveformPlayer';
import { formatTime, SPEED_OPTIONS, type PlaybackSpeed } from './audioUtils';

interface AudioPlayerProps {
  wsRef: React.MutableRefObject<WaveSurfer | null>;
}

export function AudioPlayer({ wsRef }: AudioPlayerProps) {
  const selectedCall = useQAStore((s) => s.selectedCall);
  const schema       = useQAStore((s) => s.schema);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [duration,     setDuration]     = useState(0);
  const [speed,        setSpeed]        = useState<PlaybackSpeed>(1);
  const [skipSilence,  setSkipSilence]  = useState(false);
  const [isReady,      setIsReady]      = useState(false);

  const currentTime = useQAStore((s) => s.currentTime);

  const { data: audioData, isLoading, error } = useAudioUrl(
    selectedCall?.call_id,
    schema
  );

  const handleReady = useCallback((dur: number) => {
    setDuration(dur);
    setIsReady(true);
    setIsPlaying(false);
  }, []);

  // Reset ready state when call changes
  const audioUrl = audioData?.url;

  const togglePlay = () => {
    if (!wsRef.current || !isReady) return;
    wsRef.current.playPause();
  };

  const seekRelative = (delta: number) => {
    if (!wsRef.current || !isReady || !duration) return;
    const next = Math.max(0, Math.min(duration, currentTime + delta));
    wsRef.current.seekTo(next / duration);
  };

  if (!selectedCall) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 border border-slate-700/60 rounded-xl">
        <Volume2 size={28} className="text-slate-600 mb-2" />
        <p className="text-sm text-slate-500">Select a call to play audio</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/60">
        <div className="flex items-center gap-2 min-w-0">
          <Volume2 size={14} className="text-blue-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-200 truncate">
            {selectedCall.customer_phone}
          </span>
          <span className="text-xs text-slate-500 shrink-0">
            · {selectedCall.call_date}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Skip silence toggle */}
          <button
            onClick={() => setSkipSilence((v) => !v)}
            title="Skip silence"
            className={[
              'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all',
              skipSilence
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/60',
            ].join(' ')}
          >
            <SkipSilenceIcon size={11} />
            Skip Silence
          </button>
        </div>
      </div>

      {/* Waveform area */}
      <div className="px-4 pt-3 pb-2 relative min-h-[88px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={20} className="text-blue-500 animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <span className="text-xs text-red-400">Failed to load audio</span>
          </div>
        )}
        {audioUrl && (
          <WaveformPlayer
            key={audioUrl}
            audioUrl={audioUrl}
            skipSilence={skipSilence}
            playbackSpeed={speed}
            onReady={handleReady}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onFinish={() => setIsPlaying(false)}
            wsRef={wsRef}
          />
        )}
      </div>

      {/* Controls */}
      <div className="px-4 pb-3 flex items-center gap-3">
        {/* Time */}
        <span className="text-[11px] font-mono text-slate-400 w-20 shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Playback buttons */}
        <div className="flex items-center gap-1 mx-auto">
          <button
            onClick={() => seekRelative(-10)}
            disabled={!isReady}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 disabled:opacity-40 transition-all"
            title="Back 10s"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={togglePlay}
            disabled={!isReady}
            className="w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-full transition-all shadow-lg disabled:opacity-40"
          >
            {isPlaying
              ? <Pause size={16} className="text-white" />
              : <Play size={16} className="text-white ml-0.5" />}
          </button>
          <button
            onClick={() => seekRelative(10)}
            disabled={!isReady}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 disabled:opacity-40 transition-all"
            title="Forward 10s"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-1 ml-auto">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={[
                'px-1.5 py-0.5 rounded text-[11px] font-medium transition-all',
                speed === s
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-slate-500 hover:text-slate-300',
              ].join(' ')}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
