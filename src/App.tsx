import { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WaveSurfer from 'wavesurfer.js';
import { PhoneCall, BarChart2, Users } from 'lucide-react';
import { TopNav } from './components/Layout/TopNav';
import { CallList } from './components/CallList/CallList';
import { AudioPlayer } from './components/AudioPlayer/AudioPlayer';
import { TranscriptPanel } from './components/Transcript/TranscriptPanel';
import { RatingPanel } from './components/RatingPanel/RatingPanel';
import { EntityPanel } from './components/Entities/EntityPanel';
import { LoginPage } from './components/Auth/LoginPage';
import { CallAnalysis } from './components/Analytics/CallAnalysis';
import { AgentAnalysis } from './components/Analytics/AgentAnalysis';
import { useAuthStore } from './store/useAuthStore';

type Tab = 'qa_review' | 'call_analysis' | 'agent_analysis';

const INTERNAL_TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'qa_review',      label: 'QA Review',     icon: <PhoneCall size={13} /> },
  { id: 'call_analysis',  label: 'Call Analysis',  icon: <BarChart2 size={13} /> },
  { id: 'agent_analysis', label: 'Agent Analysis', icon: <Users size={13} /> },
];

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
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Dashboard() {
  const wsRef = useRef<WaveSurfer | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('qa_review');
  const user = useAuthStore((s) => s.user);
  const isClient = user?.role === 'client';

  // Client can access QA Review and Call Analysis, but NOT Agent Analysis
  const availableTabs = isClient 
    ? INTERNAL_TABS.filter(t => t.id !== 'agent_analysis')
    : INTERNAL_TABS;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-950">
      <SeekBridge wsRef={wsRef} />
      <TopNav />

      {/* Tab bar — Agent Analysis hidden for client */}
      <div className="shrink-0 flex items-center gap-1 px-4 border-b border-slate-800 bg-slate-900/60">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-300',
            ].join(' ')}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* QA Review — 3-panel layout */}
      {(activeTab === 'qa_review' || isClient) && (
        <main className="flex-1 flex overflow-hidden p-3 gap-3 min-h-0">
          <div className="w-[340px] shrink-0 flex flex-col overflow-hidden">
            <CallList />
          </div>
          <div className="flex-1 flex flex-col gap-3 overflow-hidden min-w-0">
            <div className="shrink-0">
              <AudioPlayer wsRef={wsRef} />
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <TranscriptPanel />
            </div>
          </div>
          <div className="w-80 shrink-0 overflow-hidden">
            {isClient ? <EntityPanel /> : <RatingPanel />}
          </div>
        </main>
      )}

      {/* Call Analysis — visible to client and internal users */}
      {activeTab === 'call_analysis' && <CallAnalysis />}
      
      {/* Agent Analysis — hidden for client */}
      {!isClient && activeTab === 'agent_analysis' && <AgentAnalysis />}
    </div>
  );
}

export default function App() {
  const token = useAuthStore((s) => s.token);
  return (
    <QueryClientProvider client={queryClient}>
      {token ? <Dashboard /> : <LoginPage />}
    </QueryClientProvider>
  );
}
