import { X, Search, SlidersHorizontal } from 'lucide-react';
import { useQAStore } from '../../store/useQAStore';
import { AGENTS } from '../../data/mockCalls';
import { Language, UseCase, QAStatus } from '../../types';

const USE_CASES: { value: UseCase; label: string }[] = [
  { value: 'loan_inquiry', label: 'Loan Inquiry' },
  { value: 'collection',   label: 'Collection'   },
  { value: 'support',      label: 'Support'       },
  { value: 'onboarding',   label: 'Onboarding'    },
  { value: 'complaint',    label: 'Complaint'     },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English'   },
  { value: 'hi', label: 'Hindi'     },
  { value: 'ta', label: 'Tamil'     },
  { value: 'mr', label: 'Marathi'   },
  { value: 'bn', label: 'Bengali'   },
  { value: 'te', label: 'Telugu'    },
];

const QA_STATUSES: { value: QAStatus; label: string }[] = [
  { value: 'unreviewed', label: 'Unreviewed' },
  { value: 'reviewed',   label: 'Reviewed'   },
  { value: 'flagged',    label: 'Flagged'    },
];

export function CallFilters() {
  const { filters, setFilter, resetFilters } = useQAStore();

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="p-4 space-y-3 border-b border-slate-700/60">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <SlidersHorizontal size={15} className="text-blue-400" />
          Filters
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search agent, customer, ID…"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="input pl-8 text-xs"
        />
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilter('dateFrom', e.target.value)}
            className="input text-xs"
          />
        </div>
        <div>
          <label className="label">To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilter('dateTo', e.target.value)}
            className="input text-xs"
          />
        </div>
      </div>

      {/* QA Status */}
      <div>
        <label className="label">QA Status</label>
        <select
          value={filters.qaStatus}
          onChange={(e) => setFilter('qaStatus', e.target.value as QAStatus | '')}
          className="select text-xs"
        >
          <option value="">All statuses</option>
          {QA_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Use Case */}
      <div>
        <label className="label">Use Case</label>
        <select
          value={filters.useCase}
          onChange={(e) => setFilter('useCase', e.target.value as UseCase | '')}
          className="select text-xs"
        >
          <option value="">All use cases</option>
          {USE_CASES.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
      </div>

      {/* Language */}
      <div>
        <label className="label">Language</label>
        <select
          value={filters.language}
          onChange={(e) => setFilter('language', e.target.value as Language | '')}
          className="select text-xs"
        >
          <option value="">All languages</option>
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Agent */}
      <div>
        <label className="label">Agent</label>
        <select
          value={filters.agentId}
          onChange={(e) => setFilter('agentId', e.target.value)}
          className="select text-xs"
        >
          <option value="">All agents</option>
          {AGENTS.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
