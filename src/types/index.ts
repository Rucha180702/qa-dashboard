export type QAStatus = 'unreviewed' | 'reviewed' | 'flagged';
export type Language = 'en' | 'hi' | 'ta' | 'mr' | 'bn' | 'te';
export type UseCase = 'loan_inquiry' | 'collection' | 'support' | 'onboarding' | 'complaint';

export interface Call {
  id: string;
  agentId: string;
  agentName: string;
  customerId: string;
  customerName: string;
  date: string; // ISO
  duration: number; // seconds
  useCase: UseCase;
  language: Language;
  qaStatus: QAStatus;
}

export interface Filters {
  dateFrom: string;
  dateTo: string;
  useCase: UseCase | '';
  language: Language | '';
  agentId: string;
  qaStatus: QAStatus | '';
  search: string;
}
