import type { QAStatus } from '../../types';

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

export function formatPhone(phone: string): string {
  if (!phone) return '—';
  if (phone.length === 10) return `${phone.slice(0, 5)} ${phone.slice(5)}`;
  return phone;
}

export const STATUS_CONFIG: Record<QAStatus, { label: string; dotClass: string; badgeClass: string }> = {
  unreviewed: {
    label: 'Unreviewed',
    dotClass: 'bg-slate-400',
    badgeClass: 'text-slate-400 bg-slate-700/50',
  },
  reviewed: {
    label: 'Reviewed',
    dotClass: 'bg-emerald-400',
    badgeClass: 'text-emerald-400 bg-emerald-900/30',
  },
  flagged: {
    label: 'Flagged',
    dotClass: 'bg-red-400',
    badgeClass: 'text-red-400 bg-red-900/30',
  },
};
