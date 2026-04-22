import { PhoneCall, BarChart2, Shield } from 'lucide-react';
import { CallList } from './components/CallList/CallList';
import { useQAStore } from './store/useQAStore';

function Placeholder({ text }: { text: string }) {
  return (
    <div className="panel flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-3">
        <PhoneCall size={22} className="text-slate-600" />
      </div>
      <p className="text-sm font-medium text-slate-400">{text}</p>
      <p className="text-xs text-slate-600 mt-1">Coming soon — select a call to begin</p>
    </div>
  );
}

export default function App() {
  const selectedCallId = useQAStore((s) => s.selectedCallId);
  const calls = useQAStore((s) => s.calls);
  const selected = calls.find((c) => c.id === selectedCallId);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-950">
      {/* Top nav */}
      <header className="shrink-0 h-12 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-100 tracking-tight">QA Center</span>
          <span className="text-xs text-slate-500 ml-1">/ Module 2</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <BarChart2 size={13} className="text-blue-400" />
            <span>KPI Dashboard</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
            QA
          </div>
        </div>
      </header>

      {/* Three-column layout */}
      <main className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* Left: Call list — fixed width */}
        <div className="w-80 shrink-0 flex flex-col overflow-hidden">
          <CallList />
        </div>

        {/* Center: Audio player + Transcript */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden min-w-0">
          <div className="h-48 shrink-0">
            <Placeholder text="Audio Player + Waveform" />
          </div>
          <div className="flex-1 overflow-hidden">
            <Placeholder text="Transcript Panel" />
          </div>
        </div>

        {/* Right: Entities + Rating */}
        <div className="w-80 shrink-0 flex flex-col gap-3 overflow-hidden">
          <div className="flex-1">
            <Placeholder text="Entity Extraction" />
          </div>
          <div className="flex-1">
            {selected ? (
              <Placeholder text={`Rating Panel — ${selected.agentName}`} />
            ) : (
              <Placeholder text="Rating Panel" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
