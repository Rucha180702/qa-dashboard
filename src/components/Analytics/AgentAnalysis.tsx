import { useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Users, TrendingUp, Clock, Zap } from 'lucide-react';

// Dummy data for agent scores
const agentScoreData = [
  { date: '2026-04-15', agent: 'Agent A', quality: 4.2, completeness: 3.8, accuracy: 4.0, overall: 4.0 },
  { date: '2026-04-16', agent: 'Agent A', quality: 4.5, completeness: 4.1, accuracy: 4.3, overall: 4.3 },
  { date: '2026-04-17', agent: 'Agent A', quality: 3.9, completeness: 3.5, accuracy: 4.1, overall: 3.8 },
  { date: '2026-04-18', agent: 'Agent A', quality: 4.7, completeness: 4.3, accuracy: 4.5, overall: 4.5 },
  { date: '2026-04-19', agent: 'Agent A', quality: 4.1, completeness: 3.9, accuracy: 4.2, overall: 4.1 },
  { date: '2026-04-20', agent: 'Agent A', quality: 4.4, completeness: 4.0, accuracy: 4.4, overall: 4.3 },
  { date: '2026-04-21', agent: 'Agent A', quality: 4.6, completeness: 4.2, accuracy: 4.5, overall: 4.4 },
  { date: '2026-04-15', agent: 'Agent B', quality: 3.5, completeness: 3.2, accuracy: 3.4, overall: 3.4 },
  { date: '2026-04-16', agent: 'Agent B', quality: 3.8, completeness: 3.5, accuracy: 3.7, overall: 3.7 },
  { date: '2026-04-17', agent: 'Agent B', quality: 4.0, completeness: 3.8, accuracy: 4.1, overall: 4.0 },
  { date: '2026-04-18', agent: 'Agent B', quality: 3.6, completeness: 3.3, accuracy: 3.5, overall: 3.5 },
  { date: '2026-04-19', agent: 'Agent B', quality: 4.2, completeness: 4.0, accuracy: 4.3, overall: 4.2 },
  { date: '2026-04-20', agent: 'Agent B', quality: 3.9, completeness: 3.6, accuracy: 3.8, overall: 3.8 },
  { date: '2026-04-21', agent: 'Agent B', quality: 4.1, completeness: 3.9, accuracy: 4.2, overall: 4.1 },
  { date: '2026-04-15', agent: 'Agent C', quality: 4.8, completeness: 4.5, accuracy: 4.7, overall: 4.7 },
  { date: '2026-04-16', agent: 'Agent C', quality: 4.6, completeness: 4.4, accuracy: 4.5, overall: 4.5 },
  { date: '2026-04-17', agent: 'Agent C', quality: 4.9, completeness: 4.7, accuracy: 4.8, overall: 4.8 },
  { date: '2026-04-18', agent: 'Agent C', quality: 4.5, completeness: 4.2, accuracy: 4.4, overall: 4.4 },
  { date: '2026-04-19', agent: 'Agent C', quality: 4.7, completeness: 4.5, accuracy: 4.6, overall: 4.6 },
  { date: '2026-04-20', agent: 'Agent C', quality: 4.4, completeness: 4.1, accuracy: 4.3, overall: 4.3 },
  { date: '2026-04-21', agent: 'Agent C', quality: 4.8, completeness: 4.6, accuracy: 4.7, overall: 4.7 },
];

// Dummy data for latency metrics
const latencyData = [
  { time: '00:00', tts: 120, stt: 450, nlu: 180, overall: 750 },
  { time: '02:00', tts: 115, stt: 430, nlu: 175, overall: 720 },
  { time: '04:00', tts: 110, stt: 420, nlu: 170, overall: 700 },
  { time: '06:00', tts: 125, stt: 460, nlu: 185, overall: 770 },
  { time: '08:00', tts: 140, stt: 520, nlu: 200, overall: 860 },
  { time: '10:00', tts: 155, stt: 580, nlu: 220, overall: 955 },
  { time: '12:00', tts: 165, stt: 610, nlu: 235, overall: 1010 },
  { time: '14:00', tts: 160, stt: 590, nlu: 225, overall: 975 },
  { time: '16:00', tts: 150, stt: 550, nlu: 210, overall: 910 },
  { time: '18:00', tts: 145, stt: 530, nlu: 205, overall: 880 },
  { time: '20:00', tts: 130, stt: 480, nlu: 190, overall: 800 },
  { time: '22:00', tts: 118, stt: 440, nlu: 178, overall: 736 },
];

// Agent performance summary
const agentSummary = [
  { name: 'Agent A', calls: 145, avgScore: 4.2, avgLatency: 820, trend: '+5%' },
  { name: 'Agent B', calls: 132, avgScore: 3.8, avgLatency: 890, trend: '-2%' },
  { name: 'Agent C', calls: 128, avgScore: 4.6, avgLatency: 750, trend: '+12%' },
  { name: 'Agent D', calls: 118, avgScore: 4.0, avgLatency: 810, trend: '+8%' },
  { name: 'Agent E', calls: 105, avgScore: 3.7, avgLatency: 950, trend: '-5%' },
];

const COLORS = {
  quality: '#3b82f6',
  completeness: '#8b5cf6',
  accuracy: '#10b981',
  overall: '#f59e0b',
  tts: '#06b6d4',
  stt: '#8b5cf6',
  nlu: '#f97316',
};

export function AgentAnalysis() {
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('overall');

  const filteredData = selectedAgent === 'all' 
    ? agentScoreData 
    : agentScoreData.filter(d => d.agent === selectedAgent);

  return (
    <div className="flex-1 overflow-auto bg-slate-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Users size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Agent Analysis</h2>
            <p className="text-sm text-slate-500">Per-agent performance metrics and trends</p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="all">All Agents</option>
            <option value="Agent A">Agent A</option>
            <option value="Agent B">Agent B</option>
            <option value="Agent C">Agent C</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-blue-400" />
            <span className="text-xs font-medium text-slate-400">Avg Quality Score</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">4.15</p>
          <p className="text-xs text-green-400 mt-1">+3.2% vs last week</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-purple-400" />
            <span className="text-xs font-medium text-slate-400">Total Calls</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">628</p>
          <p className="text-xs text-slate-500 mt-1">Last 7 days</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-cyan-400" />
            <span className="text-xs font-medium text-slate-400">Avg Latency</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">843ms</p>
          <p className="text-xs text-green-400 mt-1">-5.1% vs last week</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-amber-400" />
            <span className="text-xs font-medium text-slate-400">Active Agents</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">5</p>
          <p className="text-xs text-slate-500 mt-1">Currently online</p>
        </div>
      </div>

      {/* Agent Score Graph */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Agent Score Trends</h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="radio"
                name="metric"
                checked={selectedMetric === 'overall'}
                onChange={() => setSelectedMetric('overall')}
                className="accent-blue-500"
              />
              Overall
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="radio"
                name="metric"
                checked={selectedMetric === 'quality'}
                onChange={() => setSelectedMetric('quality')}
                className="accent-blue-500"
              />
              Quality
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="radio"
                name="metric"
                checked={selectedMetric === 'completeness'}
                onChange={() => setSelectedMetric('completeness')}
                className="accent-blue-500"
              />
              Completeness
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="radio"
                name="metric"
                checked={selectedMetric === 'accuracy'}
                onChange={() => setSelectedMetric('accuracy')}
                className="accent-blue-500"
              />
              Accuracy
            </label>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#94a3b8', fontSize: 11 }} 
              tickFormatter={(value) => value.slice(5)}
            />
            <YAxis 
              domain={[3, 5]} 
              tick={{ fill: '#94a3b8', fontSize: 11 }} 
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            {selectedMetric === 'overall' ? (
              <>
                <Line type="monotone" dataKey="quality" stroke={COLORS.quality} strokeWidth={2} dot={false} name="Quality" />
                <Line type="monotone" dataKey="completeness" stroke={COLORS.completeness} strokeWidth={2} dot={false} name="Completeness" />
                <Line type="monotone" dataKey="accuracy" stroke={COLORS.accuracy} strokeWidth={2} dot={false} name="Accuracy" />
              </>
            ) : (
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke={COLORS[selectedMetric as keyof typeof COLORS]} 
                strokeWidth={2} 
                dot={{ fill: COLORS[selectedMetric as keyof typeof COLORS], strokeWidth: 2 }}
                name={selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Latency Graphs */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* TTS, SST, NLU Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Component Latency (ms)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="time" 
                tick={{ fill: '#94a3b8', fontSize: 11 }} 
              />
              <YAxis 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(value) => `${value}ms`}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Bar dataKey="tts" fill={COLORS.tts} name="TTS" radius={[4, 4, 0, 0]} />
              <Bar dataKey="stt" fill={COLORS.stt} name="STT" radius={[4, 4, 0, 0]} />
              <Bar dataKey="nlu" fill={COLORS.nlu} name="NLU" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Overall Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Overall Latency (ms)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="time" 
                tick={{ fill: '#94a3b8', fontSize: 11 }} 
              />
              <YAxis 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(value) => `${value}ms`}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value: number) => [`${value}ms`, 'Latency']}
              />
              <Line 
                type="monotone" 
                dataKey="overall" 
                stroke="#f59e0b" 
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                name="Overall Latency"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Performance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Agent Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-medium text-slate-400 py-3 px-4">Agent</th>
                <th className="text-left text-xs font-medium text-slate-400 py-3 px-4">Total Calls</th>
                <th className="text-left text-xs font-medium text-slate-400 py-3 px-4">Avg Score</th>
                <th className="text-left text-xs font-medium text-slate-400 py-3 px-4">Avg Latency</th>
                <th className="text-left text-xs font-medium text-slate-400 py-3 px-4">Trend</th>
              </tr>
            </thead>
            <tbody>
              {agentSummary.map((agent, idx) => (
                <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-3 px-4 text-sm text-slate-200 font-medium">{agent.name}</td>
                  <td className="py-3 px-4 text-sm text-slate-300">{agent.calls}</td>
                  <td className="py-3 px-4 text-sm text-slate-300">{agent.avgScore.toFixed(1)}</td>
                  <td className="py-3 px-4 text-sm text-slate-300">{agent.avgLatency}ms</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      agent.trend.startsWith('+') 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {agent.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
