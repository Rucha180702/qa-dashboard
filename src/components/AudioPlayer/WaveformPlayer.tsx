import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useQAStore } from '../../store/useQAStore';
import type { SilenceRegion } from '../../types';
import { detectSilenceRegions } from './audioUtils';

interface Props {
  audioUrl: string;
  skipSilence: boolean;
  playbackSpeed: number;
  onReady: (duration: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onFinish: () => void;
  wsRef: React.MutableRefObject<WaveSurfer | null>;
}

export function WaveformPlayer({
  audioUrl, skipSilence, playbackSpeed,
  onReady, onPlay, onPause, onFinish, wsRef,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setCurrentTime = useQAStore((s) => s.setCurrentTime);
  const [silenceRegions, setSilenceRegions] = useState<SilenceRegion[]>([]);
  const skipRef = useRef(skipSilence);
  const regionsRef = useRef<SilenceRegion[]>([]);

  skipRef.current = skipSilence;
  regionsRef.current = silenceRegions;

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    if (!skipRef.current || !wsRef.current) return;
    const region = regionsRef.current.find((r) => time >= r.start && time < r.end);
    if (region) {
      const duration = wsRef.current.getDuration();
      if (duration > 0) wsRef.current.seekTo(region.end / duration);
    }
  }, [setCurrentTime, wsRef]);

  // Build WaveSurfer when URL changes
  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    wsRef.current?.destroy();
    setSilenceRegions([]);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#334155',
      progressColor: '#3b82f6',
      cursorColor: '#60a5fa',
      height: 72,
      barWidth: 2,
      barGap: 1,
      barRadius: 3,
      normalize: true,
      url: audioUrl,
    });

    wsRef.current = ws;

    ws.on('ready', () => {
      onReady(ws.getDuration());
      ws.setPlaybackRate(playbackSpeed, true);

      const decoded = ws.getDecodedData();
      if (decoded) {
        const regions = detectSilenceRegions(decoded);
        setSilenceRegions(regions);
      }
    });

    ws.on('timeupdate', handleTimeUpdate);
    ws.on('play',   onPlay);
    ws.on('pause',  onPause);
    ws.on('finish', onFinish);

    return () => { ws.destroy(); wsRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  // Sync speed without re-creating instance
  useEffect(() => {
    wsRef.current?.setPlaybackRate(playbackSpeed, true);
  }, [playbackSpeed, wsRef]);

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full" />
      {/* Silence region markers */}
      {silenceRegions.length > 0 && wsRef.current && (
        <div className="absolute inset-x-0 top-0 h-full pointer-events-none">
          {silenceRegions.map((r, i) => {
            const dur = wsRef.current!.getDuration();
            if (!dur) return null;
            const left = (r.start / dur) * 100;
            const width = ((r.end - r.start) / dur) * 100;
            return (
              <div
                key={i}
                className="absolute top-0 h-full bg-yellow-400/10 border-x border-yellow-400/20"
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
