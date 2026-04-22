import { Call } from '../types';

const agents = [
  { id: 'a1', name: 'Priya Sharma' },
  { id: 'a2', name: 'Ravi Kumar' },
  { id: 'a3', name: 'Anjali Singh' },
  { id: 'a4', name: 'Mohammed Iqbal' },
  { id: 'a5', name: 'Deepa Nair' },
];

function fmtDate(daysAgo: number, hour: number, min: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

export const MOCK_CALLS: Call[] = [
  { id: 'call-001', agentId: 'a1', agentName: 'Priya Sharma',   customerId: 'c1', customerName: 'Suresh Patil',   date: fmtDate(0, 10, 15), duration: 342,  useCase: 'loan_inquiry', language: 'hi', qaStatus: 'unreviewed' },
  { id: 'call-002', agentId: 'a2', agentName: 'Ravi Kumar',     customerId: 'c2', customerName: 'Meena Reddy',   date: fmtDate(0, 11, 5),  duration: 187,  useCase: 'collection',   language: 'te', qaStatus: 'flagged'    },
  { id: 'call-003', agentId: 'a3', agentName: 'Anjali Singh',   customerId: 'c3', customerName: 'Vikram Joshi',  date: fmtDate(0, 11, 40), duration: 519,  useCase: 'complaint',    language: 'hi', qaStatus: 'reviewed'   },
  { id: 'call-004', agentId: 'a1', agentName: 'Priya Sharma',   customerId: 'c4', customerName: 'Fatima Shaikh', date: fmtDate(1, 9, 20),  duration: 264,  useCase: 'support',      language: 'en', qaStatus: 'reviewed'   },
  { id: 'call-005', agentId: 'a4', agentName: 'Mohammed Iqbal', customerId: 'c5', customerName: 'Arjun Mehta',   date: fmtDate(1, 14, 0),  duration: 431,  useCase: 'onboarding',   language: 'mr', qaStatus: 'unreviewed' },
  { id: 'call-006', agentId: 'a5', agentName: 'Deepa Nair',     customerId: 'c6', customerName: 'Lakshmi Iyer',  date: fmtDate(1, 15, 30), duration: 156,  useCase: 'loan_inquiry', language: 'ta', qaStatus: 'unreviewed' },
  { id: 'call-007', agentId: 'a2', agentName: 'Ravi Kumar',     customerId: 'c7', customerName: 'Santosh Gupta', date: fmtDate(2, 10, 45), duration: 622,  useCase: 'collection',   language: 'hi', qaStatus: 'flagged'    },
  { id: 'call-008', agentId: 'a3', agentName: 'Anjali Singh',   customerId: 'c8', customerName: 'Rekha Pillai',  date: fmtDate(2, 13, 10), duration: 298,  useCase: 'support',      language: 'en', qaStatus: 'reviewed'   },
  { id: 'call-009', agentId: 'a4', agentName: 'Mohammed Iqbal', customerId: 'c1', customerName: 'Suresh Patil',  date: fmtDate(3, 9, 0),   duration: 375,  useCase: 'complaint',    language: 'hi', qaStatus: 'unreviewed' },
  { id: 'call-010', agentId: 'a5', agentName: 'Deepa Nair',     customerId: 'c2', customerName: 'Meena Reddy',   date: fmtDate(3, 11, 20), duration: 211,  useCase: 'onboarding',   language: 'ta', qaStatus: 'reviewed'   },
  { id: 'call-011', agentId: 'a1', agentName: 'Priya Sharma',   customerId: 'c3', customerName: 'Vikram Joshi',  date: fmtDate(4, 10, 0),  duration: 489,  useCase: 'loan_inquiry', language: 'en', qaStatus: 'unreviewed' },
  { id: 'call-012', agentId: 'a2', agentName: 'Ravi Kumar',     customerId: 'c5', customerName: 'Arjun Mehta',   date: fmtDate(5, 14, 30), duration: 133,  useCase: 'support',      language: 'hi', qaStatus: 'reviewed'   },
  { id: 'call-013', agentId: 'a3', agentName: 'Anjali Singh',   customerId: 'c6', customerName: 'Lakshmi Iyer',  date: fmtDate(5, 9, 45),  duration: 557,  useCase: 'collection',   language: 'ta', qaStatus: 'flagged'    },
  { id: 'call-014', agentId: 'a4', agentName: 'Mohammed Iqbal', customerId: 'c7', customerName: 'Santosh Gupta', date: fmtDate(6, 16, 10), duration: 302,  useCase: 'complaint',    language: 'mr', qaStatus: 'unreviewed' },
  { id: 'call-015', agentId: 'a5', agentName: 'Deepa Nair',     customerId: 'c4', customerName: 'Fatima Shaikh', date: fmtDate(6, 11, 55), duration: 418,  useCase: 'onboarding',   language: 'en', qaStatus: 'reviewed'   },
];

export const AGENTS = agents;
