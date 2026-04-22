// Deterministic seeded RNG — same inputs always produce the same data
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function dateKey(d: Date) {
  return d.toISOString().split('T')[0];
}

function dateSeed(iso: string) {
  return iso.split('-').reduce((acc, n) => acc * 100 + parseInt(n), 0);
}

export const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Marathi', 'Bengali'] as const;
export type Language = typeof LANGUAGES[number];

const LANG_BASE_SHARE: Record<Language, number> = {
  Hindi: 0.38, English: 0.24, Tamil: 0.13, Telugu: 0.10, Marathi: 0.09, Bengali: 0.06,
};

const LANG_PICKUP_BASE: Record<Language, number> = {
  Hindi: 0.67, English: 0.72, Tamil: 0.63, Telugu: 0.61, Marathi: 0.65, Bengali: 0.59,
};

const ENTITY_LABELS = [
  'Available',
  'Answered Q1',
  'Consent Given',
  'Answered Q2',
] as const;

// ─── Date range helper ────────────────────────────────────────────────────────

function daysInRange(from: string, to: string): string[] {
  const result: string[] = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    result.push(dateKey(new Date(cur)));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

// ─── KPI summary ─────────────────────────────────────────────────────────────

export interface KPISummary {
  totalCalls: number;
  pickupRate: number;         // 0–1
  avgDurationSec: number;
  avgTurns: number;
  rescheduled: number;
  pickupRateDelta: number;    // vs prior period, percentage points
  totalCallsDelta: number;    // % change
}

export function getKPISummary(from: string, to: string, language: string): KPISummary {
  const days = daysInRange(from, to);
  const rng = seeded(dateSeed(from) ^ dateSeed(to) ^ language.length * 31);
  const langs: Language[] = language ? [language as Language] : [...LANGUAGES];

  let total = 0;
  let pickedUp = 0;
  let durationSum = 0;
  let turnsSum = 0;
  let rescheduledSum = 0;

  for (const d of days) {
    const dr = seeded(dateSeed(d));
    const baseVolume = Math.round(40 + dr() * 60);
    for (const lang of langs) {
      const share = language ? 1 : LANG_BASE_SHARE[lang] ?? 0.1;
      const calls = Math.round(baseVolume * share * (0.9 + dr() * 0.2));
      const pickup = LANG_PICKUP_BASE[lang] ?? 0.65;
      const pu = Math.round(calls * (pickup + (dr() - 0.5) * 0.06));
      total += calls;
      pickedUp += pu;
      durationSum += pu * (140 + dr() * 120);
      turnsSum += pu * (8 + dr() * 8);
      rescheduledSum += Math.round(calls * (0.08 + dr() * 0.07));
    }
  }

  const delta = rng() * 0.08 - 0.04;
  return {
    totalCalls: total,
    pickupRate: total > 0 ? pickedUp / total : 0,
    avgDurationSec: pickedUp > 0 ? durationSum / pickedUp : 0,
    avgTurns: pickedUp > 0 ? turnsSum / pickedUp : 0,
    rescheduled: rescheduledSum,
    pickupRateDelta: delta,
    totalCallsDelta: rng() * 0.2 - 0.1,
  };
}

// ─── Daily call volume (line chart) ──────────────────────────────────────────

export interface DailyVolume {
  date: string;
  total: number;
  picked_up: number;
  [lang: string]: string | number;
}

export function getDailyVolume(from: string, to: string, language: string): DailyVolume[] {
  const days = daysInRange(from, to);
  const langs: Language[] = language ? [language as Language] : [...LANGUAGES];

  return days.map((d) => {
    const dr = seeded(dateSeed(d));
    const baseVolume = Math.round(40 + dr() * 60);
    const row: DailyVolume = { date: d.slice(5), total: 0, picked_up: 0 };
    for (const lang of langs) {
      const share = language ? 1 : LANG_BASE_SHARE[lang] ?? 0.1;
      const calls = Math.round(baseVolume * share * (0.9 + dr() * 0.2));
      const pu = Math.round(calls * (LANG_PICKUP_BASE[lang] + (dr() - 0.5) * 0.06));
      row[lang] = calls;
      row.total += calls;
      row.picked_up += pu;
    }
    return row;
  });
}

// ─── Pickup rate by language (bar chart) ─────────────────────────────────────

export interface LangPickup {
  language: Language;
  pickup_rate: number;
  calls: number;
}

export function getPickupByLanguage(from: string, to: string): LangPickup[] {
  const days = daysInRange(from, to);
  return LANGUAGES.map((lang) => {
    let total = 0, pickedUp = 0;
    for (const d of days) {
      const dr = seeded(dateSeed(d) ^ lang.charCodeAt(0));
      const calls = Math.round((30 + dr() * 50) * (LANG_BASE_SHARE[lang] ?? 0.1) * (0.9 + dr() * 0.2));
      total += calls;
      pickedUp += Math.round(calls * (LANG_PICKUP_BASE[lang] + (dr() - 0.5) * 0.06));
    }
    return { language: lang, pickup_rate: total > 0 ? pickedUp / total : 0, calls: total };
  }).sort((a, b) => b.calls - a.calls);
}

// ─── Entity funnel ────────────────────────────────────────────────────────────

export interface FunnelStage {
  label: string;
  count: number;
  rate: number;       // % of total calls
  convRate: number;   // % of previous stage
}

export function getEntityFunnel(from: string, to: string, language: string): FunnelStage[] {
  const kpi = getKPISummary(from, to, language);
  const total = kpi.totalCalls;
  const rng = seeded(dateSeed(from) ^ dateSeed(to) * 3);

  const rates = [
    kpi.pickupRate,
    kpi.pickupRate * (0.80 + rng() * 0.10),   // answered Q1
    kpi.pickupRate * (0.62 + rng() * 0.10),   // consent given
    kpi.pickupRate * (0.48 + rng() * 0.10),   // answered Q2
  ];

  return ENTITY_LABELS.map((label, i) => ({
    label,
    count: Math.round(total * rates[i]),
    rate: rates[i],
    convRate: i === 0 ? rates[0] : rates[i] / rates[i - 1],
  }));
}

// ─── Language distribution (pie / donut) ──────────────────────────────────────

export interface LangShare {
  language: Language;
  value: number;
  color: string;
}

const LANG_COLORS: Record<Language, string> = {
  Hindi:   '#3b82f6',
  English: '#8b5cf6',
  Tamil:   '#10b981',
  Telugu:  '#f59e0b',
  Marathi: '#ec4899',
  Bengali: '#06b6d4',
};

export function getLanguageDistribution(from: string, to: string): LangShare[] {
  const days = daysInRange(from, to);
  const counts: Record<Language, number> = {} as Record<Language, number>;
  for (const lang of LANGUAGES) counts[lang] = 0;
  for (const d of days) {
    const dr = seeded(dateSeed(d));
    const base = Math.round(40 + dr() * 60);
    for (const lang of LANGUAGES) {
      counts[lang] += Math.round(base * LANG_BASE_SHARE[lang] * (0.9 + dr() * 0.2));
    }
  }
  return LANGUAGES.map((lang) => ({
    language: lang, value: counts[lang], color: LANG_COLORS[lang],
  }));
}

// ─── Avg duration trend (area chart) ─────────────────────────────────────────

export interface DurationPoint {
  date: string;
  avgDuration: number;
  avgTurns: number;
}

export function getDurationTrend(from: string, to: string, language: string): DurationPoint[] {
  const langs: Language[] = language ? [language as Language] : [...LANGUAGES];
  return daysInRange(from, to).map((d) => {
    const dr = seeded(dateSeed(d));
    let durSum = 0, turnsSum = 0, count = 0;
    for (const lang of langs) {
      const calls = Math.round((30 + dr() * 50) * (language ? 1 : LANG_BASE_SHARE[lang]) * (0.9 + dr() * 0.2));
      const pu = Math.round(calls * LANG_PICKUP_BASE[lang]);
      durSum   += pu * (140 + dr() * 120);
      turnsSum += pu * (8 + dr() * 8);
      count    += pu;
    }
    return {
      date: d.slice(5),
      avgDuration: count > 0 ? Math.round(durSum / count) : 0,
      avgTurns: count > 0 ? Math.round((turnsSum / count) * 10) / 10 : 0,
    };
  });
}

export { LANG_COLORS };
