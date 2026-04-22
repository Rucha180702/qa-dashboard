import { create } from 'zustand';
import { Call, Filters } from '../types';
import { MOCK_CALLS } from '../data/mockCalls';

interface QAStore {
  calls: Call[];
  selectedCallId: string | null;
  filters: Filters;
  setSelectedCall: (id: string | null) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  filteredCalls: () => Call[];
}

const DEFAULT_FILTERS: Filters = {
  dateFrom: '',
  dateTo: '',
  useCase: '',
  language: '',
  agentId: '',
  qaStatus: '',
  search: '',
};

export const useQAStore = create<QAStore>((set, get) => ({
  calls: MOCK_CALLS,
  selectedCallId: null,
  filters: DEFAULT_FILTERS,

  setSelectedCall: (id) => set({ selectedCallId: id }),

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  filteredCalls: () => {
    const { calls, filters } = get();
    return calls.filter((c) => {
      if (filters.qaStatus && c.qaStatus !== filters.qaStatus) return false;
      if (filters.useCase && c.useCase !== filters.useCase) return false;
      if (filters.language && c.language !== filters.language) return false;
      if (filters.agentId && c.agentId !== filters.agentId) return false;
      if (filters.dateFrom && c.date < filters.dateFrom) return false;
      if (filters.dateTo && c.date > filters.dateTo + 'T23:59:59') return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !c.agentName.toLowerCase().includes(q) &&
          !c.customerName.toLowerCase().includes(q) &&
          !c.id.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  },
}));
