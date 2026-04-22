export type QAStatus = 'unreviewed' | 'reviewed' | 'flagged';
export type UserRole = 'qa_analyst' | 'supervisor';

export interface AuthUser {
  username: string;
  role: UserRole;
  display_name: string;
}

export interface CallSummary {
  call_id: string;
  schema: string;
  call_date: string;
  customer_phone: string;
  duration_seconds: number;
  audio_key: string;
  language: string;
  use_case: string;
  qa_status: QAStatus;
  overall_score: number | null;
  good_to_share: boolean;
}

export interface RubricDimension {
  id: string;
  label: string;
  score: number;
}

export interface Comment {
  id: number;
  call_id: string;
  schema: string;
  text: string;
  timestamp_anchor: number | null;
  author: string;
  created_at: string;
}

export interface Review {
  call_id: string;
  schema: string;
  overall_score: number | null;
  rubric: RubricDimension[];
  reviewed_by: string | null;
  reviewed_at: string | null;
  qa_status: QAStatus;
  good_to_share: boolean;
  comments: Comment[];
}

export interface Utterance {
  id: string;
  speaker: 'agent' | 'customer';
  startTime: number;
  endTime: number;
  text: string;
  translatedText?: string;
}

export type TranscriptStatus = 'not_started' | 'pending' | 'in_progress' | 'completed' | 'failed';

export interface TranscriptResponse {
  call_id: string;
  schema: string;
  utterances: Utterance[];
  available: boolean;
  status: TranscriptStatus;
  language_code?: string;
  message?: string;
}

export interface AudioUrlResponse {
  url: string;
  expires_in: number;
}

export interface BulkSampleResponse {
  calls: CallSummary[];
  total_unreviewed: number;
}

export interface Filters {
  dateFrom: string;
  dateTo: string;
  qaStatus: QAStatus | '';
  language: string;
  useCase: string;
  search: string;
  goodToShare: boolean;
}

export interface SilenceRegion {
  start: number;
  end: number;
}
