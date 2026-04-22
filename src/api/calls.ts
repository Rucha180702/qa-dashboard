import { apiClient } from './client';
import type {
  CallSummary, AudioUrlResponse, TranscriptResponse, BulkSampleResponse, Filters, Entity,
} from '../types';

export async function startTranscription(
  callId: string, schema: string
): Promise<{ status: string; job_name?: string; message?: string }> {
  const res = await apiClient.post(`/api/calls/${callId}/transcribe`, null, { params: { schema } });
  return res.data;
}

export async function fetchCalls(
  schema: string,
  filters: Filters
): Promise<CallSummary[]> {
  const params: Record<string, string> = { schema };
  if (filters.dateFrom) params.date_from = filters.dateFrom;
  if (filters.dateTo)   params.date_to   = filters.dateTo;
  if (filters.qaStatus) params.qa_status = filters.qaStatus;
  if (filters.language) params.language  = filters.language;
  if (filters.useCase)  params.use_case  = filters.useCase;
  if (filters.search)   params.search    = filters.search;
  if (filters.goodToShare) params.good_to_share = 'true';
  const res = await apiClient.get<CallSummary[]>('/api/calls', { params });
  return res.data;
}

export async function fetchSchemas(): Promise<string[]> {
  const res = await apiClient.get<string[]>('/api/calls/schemas');
  return res.data;
}

export async function fetchAudioUrl(callId: string, schema: string): Promise<AudioUrlResponse> {
  const res = await apiClient.get<AudioUrlResponse>(`/api/calls/${callId}/audio`, {
    params: { schema },
  });
  return res.data;
}

export async function fetchTranscript(callId: string, schema: string): Promise<TranscriptResponse> {
  const res = await apiClient.get<TranscriptResponse>(`/api/calls/${callId}/transcript`, {
    params: { schema },
  });
  return res.data;
}

export async function fetchBulkSample(
  schema: string,
  n: number,
  dateFrom?: string,
  dateTo?: string,
): Promise<BulkSampleResponse> {
  const params: Record<string, string | number> = { schema, n };
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo)   params.date_to   = dateTo;
  const res = await apiClient.get<BulkSampleResponse>('/api/calls/bulk-sample', { params });
  return res.data;
}

export async function fetchEntities(callId: string, schema: string): Promise<Entity[]> {
  const res = await apiClient.get<Entity[]>(`/api/calls/${callId}/entities`, {
    params: { schema },
  });
  return res.data;
}

export async function downloadReport(
  schema: string,
  dateFrom: string,
  dateTo: string,
  qaStatus?: string,
): Promise<void> {
  const params: Record<string, string> = { schema };
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo)   params.date_to   = dateTo;
  if (qaStatus) params.qa_status  = qaStatus;
  const res = await apiClient.get('/api/calls/export', { params, responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `qa_report_${schema}_${dateFrom}_to_${dateTo}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
