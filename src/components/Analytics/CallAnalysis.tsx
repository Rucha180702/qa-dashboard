import { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, Tooltip, XAxis, YAxis,
  CartesianGrid, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Phone, TrendingUp, TrendingDown, Clock, MessageSquare,
  CalendarClock, Filter,
} from 'lucide-react';
import {
  LANGUAGES, LANG_COLORS,
  getKPISummary, getDailyVolume, getPickupByLanguage,
  getEntityFunnel, getLanguageDistribution, getDurationTrend,
} from './analyticsData';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}m ${sec.toString().padStart(2, '0')}s`;
}

function fmtPct(v: number, decimals = 1) {
  return `${(v * 100).toFixed(decimals)}%`;
}

const today = new Date().toISOString().split('T')[0];
const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString().split('T')[0];

const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 11,
};

// ─── KPI card ────────────────────────────────────────────────────────────────

function KPICard({
  label, value, sub, delta, icon,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  icon: React.ReactNode;
}) {
  const positive = delta !== undefined && delta >= 0;
  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="p-1.5 rounded-lg bg-slate-800 text-blue-400">{icon}</div>
        {delta !== undefined && (
          <span className={`flex items-center gap-0.5 text-[11px] font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(delta * 100).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-[11px] text-slate-500 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-slate-100">{value}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-4">
      <p className="text-xs font-semibold text-slate-400 mb-4">{title}</p>
      {children}
    </div>
  );
}

// ─── Entity funnel ────────────────────────────────────────────────────────────

const FUNNEL_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

function EntityFunnel({ from, to, language }: { from: string; to: string; language: string }) {
  const stages = useMemo(() => getEntityFunnel(from, to, language), [from, to, language]);
  const max = stages[0]?.count ?? 1;

  return (
    <div className="space-y-2.5">
      {stages.map((stage, i) => (
        <div key={stage.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-300">{stage.label}</span>
            <div className="flex items-center gap-3 text-[11px]">
              {i > 0 && (
                <span className="text-slate-500">
                  conv. <span className="text-slate-300 font-medium">{fmtPct(stage.convRate)}</span>
                </span>
              )}
              <span className="text-slate-100 font-semibold tabular-nums w-16 text-right">
                {stage.count.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="h-7 bg-slate-800 rounded-lg overflow-hidden">
            <div
              className="h-full rounded-lg flex items-center px-2 transition-all duration-500"
              style={{
                width: `${(stage.count / max) * 100}%`,
                backgroundColor: FUNNEL_COLORS[i],
              }}
            >
              <span className="text-[10px] font-medium text-white/80">{fmtPct(stage.rate, 0)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CallAnalysis() {
  const [dateFrom, setDateFrom]   = useState(sevenDaysAgo);
  const [dateTo, setDateTo]       = useState(today);
  const [language, setLanguage]   = useState('');

  const kpi         = useMemo(() => getKPISummary(dateFrom, dateTo, language),   [dateFrom, dateTo, language]);
  const volume      = useMemo(() => getDailyVolume(dateFrom, dateTo, language),  [dateFrom, dateTo, language]);
  const pickupByLang = useMemo(() => getPickupByLanguage(dateFrom, dateTo),       [dateFrom, dateTo]);
  const langDist    = useMemo(() => getLanguageDistribution(dateFrom, dateTo),   [dateFrom, dateTo]);
  const duration    = useMemo(() => getDurationTrend(dateFrom, dateTo, language), [dateFrom, dateTo, language]);

  const visibleLangs = (language ? [language] : [...LANGUAGES]) as string[];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950">
      <div className="max-w-[1400px] mx-auto p-5 space-y-5">

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-1">
            <Filter size={12} className="text-blue-400" /> Filters
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-500">From</label>
            <input
              type="date" value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-800 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-500">To</label>
            <input
              type="date" value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-800 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-800 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 appearance-none cursor-pointer"
          >
            <option value="">All languages</option>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <div className="ml-auto text-[11px] text-slate-600">
            Showing dummy data — connect ClickHouse for live metrics
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard
            label="Total Calls"
            value={kpi.totalCalls.toLocaleString()}
            delta={kpi.totalCallsDelta}
            icon={<Phone size={14} />}
            sub="in selected period"
          />
          <KPICard
            label="Pickup Rate"
            value={fmtPct(kpi.pickupRate)}
            delta={kpi.pickupRateDelta}
            icon={<TrendingUp size={14} />}
            sub="calls answered"
          />
          <KPICard
            label="Avg Duration"
            value={fmtDuration(kpi.avgDurationSec)}
            icon={<Clock size={14} />}
            sub="per answered call"
          />
          <KPICard
            label="Avg Turns"
            value={kpi.avgTurns.toFixed(1)}
            icon={<MessageSquare size={14} />}
            sub="conversation turns"
          />
          <KPICard
            label="Rescheduled"
            value={kpi.rescheduled.toLocaleString()}
            icon={<CalendarClock size={14} />}
            sub="calls rescheduled"
          />
        </div>

        {/* Row 1: Call volume + Language distribution */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Section title="Daily Call Volume">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={volume} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  {!language && (
                    <Legend
                      wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                      formatter={(v) => <span style={{ color: '#94a3b8' }}>{v}</span>}
                    />
                  )}
                  {visibleLangs.map((lang) => (
                    <Line
                      key={lang}
                      type="monotone"
                      dataKey={lang}
                      stroke={LANG_COLORS[lang as keyof typeof LANG_COLORS] ?? '#64748b'}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Section>
          </div>

          <Section title="Language Distribution">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={langDist}
                  dataKey="value"
                  nameKey="language"
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {langDist.map((entry) => (
                    <Cell key={entry.language} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v) => Number(v).toLocaleString()}
                />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{ fontSize: 10 }}
                  formatter={(v) => <span style={{ color: '#94a3b8' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* Row 2: Entity funnel + Pickup rate by language */}
        <div className="grid grid-cols-2 gap-4">
          <Section title="Entity Conversion Funnel">
            <EntityFunnel from={dateFrom} to={dateTo} language={language} />
          </Section>

          <Section title="Pickup Rate by Language">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={pickupByLang}
                layout="vertical"
                margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 1]}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="language"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`}
                />
                <Bar dataKey="pickup_rate" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {pickupByLang.map((entry) => (
                    <Cell
                      key={entry.language}
                      fill={LANG_COLORS[entry.language as keyof typeof LANG_COLORS] ?? '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* Row 3: Duration + Turns trend */}
        <Section title="Avg Duration & Turns Trend">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={duration} margin={{ top: 4, right: 24, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="durGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="turnsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
              <YAxis
                yAxisId="dur"
                tickFormatter={(v) => `${Math.round(v / 60)}m`}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="turns"
                orientation="right"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v, name) =>
                  name === 'avgDuration' ? fmtDuration(Number(v)) : Number(v).toFixed(1)
                }
              />
              <Legend
                wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                formatter={(v) => (
                  <span style={{ color: '#94a3b8' }}>
                    {v === 'avgDuration' ? 'Avg Duration' : 'Avg Turns'}
                  </span>
                )}
              />
              <Area
                yAxisId="dur"
                type="monotone"
                dataKey="avgDuration"
                stroke="#3b82f6"
                strokeWidth={1.5}
                fill="url(#durGrad)"
                dot={false}
              />
              <Area
                yAxisId="turns"
                type="monotone"
                dataKey="avgTurns"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                fill="url(#turnsGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Section>

      </div>
    </div>
  );
}
