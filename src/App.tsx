import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WaveSurfer from 'wavesurfer.js';
import { TopNav } from './components/Layout/TopNav';
import { CallList } from './components/CallList/CallList';
import { AudioPlayer } from './components/AudioPlayer/AudioPlayer';
import { TranscriptPanel } from './components/Transcript/TranscriptPanel';
import { RatingPanel } from './components/RatingPanel/RatingPanel';

// Shared WaveSurfer ref (AudioPlayer creates, transcript listens to seek events)
// The seek event bridge: TranscriptPanel dispatches 'qa:seek', AudioPlayer listens here
function SeekBridge({ wsRef }: { wsRef: React.MutableRefObject<WaveSurfer | null> }) {
  useEffect(() => {
    const handler = (e: Event) => {
      const { time } = (e as CustomEvent<{ time: number }>).detail;
      const ws = wsRef.current;
      if (!ws) return;
      const duration = ws.getDuration();
      if (duration > 0) ws.seekTo(time / duration);
    };
    window.addEventListener('qa:seek', handler);
    return () => window.removeEventListener('qa:seek', handler);
  }, [wsRef]);
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Dashboard() {
  const wsRef = useRef<WaveSurfer | null>(null);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-950">
      <SeekBridge wsRef={wsRef} />
      <TopNav />

      <main className="flex-1 flex overflow-hidden p-3 gap-3 min-h-0">
        {/* Left: Call list */}
        <div className="w-72 shrink-0 flex flex-col overflow-hidden">
          <CallList />
        </div>

        {/* Center: Audio + Transcript */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden min-w-0">
          {/* Audio player — fixed height */}
          <div className="shrink-0">
            <AudioPlayer wsRef={wsRef} />
          </div>
          {/* Transcript — fills remaining space */}
          <div className="flex-1 overflow-hidden min-h-0">
            <TranscriptPanel />
          </div>
        </div>

        {/* Right: Rating panel */}
        <div className="w-72 shrink-0 overflow-hidden">
          <RatingPanel />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
