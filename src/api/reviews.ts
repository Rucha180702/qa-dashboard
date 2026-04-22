import { apiClient } from './client';
import type { Review, Comment, RubricDimension } from '../types';

export async function fetchReview(callId: string, schema: string): Promise<Review> {
  const res = await apiClient.get<Review>(`/api/calls/${callId}/review`, {
    params: { schema },
  });
  return res.data;
}

export async function upsertReview(
  callId: string,
  schema: string,
  payload: { overall_score: number; rubric: RubricDimension[]; reviewed_by?: string }
): Promise<Review> {
  const res = await apiClient.put<Review>(`/api/calls/${callId}/review`, payload, {
    params: { schema },
  });
  return res.data;
}

export async function flagCall(callId: string, schema: string, flaggedBy = 'QA Analyst'): Promise<void> {
  await apiClient.put(`/api/calls/${callId}/flag`, null, {
    params: { schema, flagged_by: flaggedBy },
  });
}

export async function unflagCall(callId: string, schema: string): Promise<void> {
  await apiClient.delete(`/api/calls/${callId}/flag`, { params: { schema } });
}

export async function addComment(
  callId: string,
  schema: string,
  text: string,
  timestampAnchor?: number,
  author = 'QA Analyst',
): Promise<Comment> {
  const res = await apiClient.post<Comment>(
    `/api/calls/${callId}/comments`,
    { text, timestamp_anchor: timestampAnchor ?? null, author },
    { params: { schema } }
  );
  return res.data;
}

export async function toggleGoodToShare(callId: string, schema: string, value: boolean): Promise<void> {
  await apiClient.put(`/api/calls/${callId}/good-to-share`, null, {
    params: { schema, value },
  });
}

export async function deleteComment(callId: string, schema: string, commentId: number): Promise<void> {
  await apiClient.delete(`/api/calls/${callId}/comments/${commentId}`, {
    params: { schema },
  });
}
