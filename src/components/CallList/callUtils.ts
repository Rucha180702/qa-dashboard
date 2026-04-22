import { UseCase, Language } from '../../types';

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);

  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Yesterday';
  if (diffD < 7) return `${diffD} days ago`;

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

const USE_CASE_LABELS: Record<UseCase, string> = {
  loan_inquiry: 'Loan Inquiry',
  collection:   'Collection',
  support:      'Support',
  onboarding:   'Onboarding',
  complaint:    'Complaint',
};

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN', hi: 'HI', ta: 'TA', mr: 'MR', bn: 'BN', te: 'TE',
};

export const useCaseLabel = (uc: UseCase) => USE_CASE_LABELS[uc];
export const languageLabel = (l: Language)  => LANGUAGE_LABELS[l];
