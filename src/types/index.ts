export type QAStatus = 'unreviewed' | 'reviewed' | 'flagged';

export interface CallSummary {
  call_id: string;
  schema: string;
  call_date: string;
  customer_phone: string;
  agent_id: string;
  duration_seconds: number;
  audio_key: string;
  qa_status: QAStatus;
  overall_score: number | null;
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

export interface TranscriptResponse {
  call_id: string;
  schema: string;
  utterances: Utterance[];
  available: boolean;
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
  agentId: string;
  search: string;
}

export interface SilenceRegion {
  start: number;
  end: number;
}
