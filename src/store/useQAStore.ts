import { create } from 'zustand';
import type { CallSummary, Filters } from '../types';

interface BulkSession {
  calls: CallSummary[];
  currentIndex: number;
}

interface QAStore {
  schema: string;
  setSchema: (s: string) => void;

  selectedCall: CallSummary | null;
  setSelectedCall: (call: CallSummary | null) => void;

  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, val: Filters[K]) => void;
  resetFilters: () => void;

  // Shared playback time (AudioPlayer → Transcript sync)
  currentTime: number;
  setCurrentTime: (t: number) => void;

  // Translation toggle
  showTranslation: boolean;
  toggleTranslation: () => void;

  // Bulk review session
  bulkSession: BulkSession | null;
  startBulkSession: (calls: CallSummary[]) => void;
  bulkNext: () => void;
  bulkPrev: () => void;
  exitBulk: () => void;
}

const today = new Date().toISOString().split('T')[0];
const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString().split('T')[0];

const DEFAULT_FILTERS: Filters = {
  dateFrom: sevenDaysAgo,
  dateTo: today,
  qaStatus: '',
  language: '',
  useCase: '',
  search: '',
  goodToShare: false,
};

export const useQAStore = create<QAStore>((set, get) => ({
  schema: '',
  setSchema: (schema) => set({ schema }),

  selectedCall: null,
  setSelectedCall: (call) => set({ selectedCall: call, currentTime: 0 }),

  filters: DEFAULT_FILTERS,
  setFilter: (key, val) => set((s) => ({ filters: { ...s.filters, [key]: val } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  currentTime: 0,
  setCurrentTime: (t) => set({ currentTime: t }),

  showTranslation: false,
  toggleTranslation: () => set((s) => ({ showTranslation: !s.showTranslation })),

  bulkSession: null,
  startBulkSession: (calls) => {
    if (calls.length === 0) return;
    set({ bulkSession: { calls, currentIndex: 0 }, selectedCall: calls[0] });
  },
  bulkNext: () => {
    const { bulkSession } = get();
    if (!bulkSession) return;
    const next = bulkSession.currentIndex + 1;
    if (next >= bulkSession.calls.length) return;
    set({
      bulkSession: { ...bulkSession, currentIndex: next },
      selectedCall: bulkSession.calls[next],
      currentTime: 0,
    });
  },
  bulkPrev: () => {
    const { bulkSession } = get();
    if (!bulkSession) return;
    const prev = bulkSession.currentIndex - 1;
    if (prev < 0) return;
    set({
      bulkSession: { ...bulkSession, currentIndex: prev },
      selectedCall: bulkSession.calls[prev],
      currentTime: 0,
    });
  },
  exitBulk: () => set({ bulkSession: null }),
}));
