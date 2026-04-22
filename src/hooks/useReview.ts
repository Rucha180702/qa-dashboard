import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchReview, upsertReview, flagCall, unflagCall,
  addComment, deleteComment, toggleGoodToShare,
} from '../api/reviews';
import type { RubricDimension } from '../types';

export function useReview(callId: string | undefined, schema: string | undefined) {
  return useQuery({
    queryKey: ['review', callId, schema],
    queryFn: () => fetchReview(callId!, schema!),
    enabled: !!callId && !!schema,
    staleTime: 10_000,
  });
}

export function useUpsertReview(callId: string, schema: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { overall_score: number; rubric: RubricDimension[] }) =>
      upsertReview(callId, schema, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review', callId, schema] });
      qc.invalidateQueries({ queryKey: ['calls'] });
    },
  });
}

export function useFlagCall(callId: string, schema: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flagged: boolean) =>
      flagged ? flagCall(callId, schema) : unflagCall(callId, schema),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review', callId, schema] });
      qc.invalidateQueries({ queryKey: ['calls'] });
    },
  });
}

export function useToggleGoodToShare(callId: string, schema: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: boolean) => toggleGoodToShare(callId, schema, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review', callId, schema] });
      qc.invalidateQueries({ queryKey: ['calls'] });
    },
  });
}

export function useAddComment(callId: string, schema: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      text,
      timestampAnchor,
      author,
    }: {
      text: string;
      timestampAnchor?: number;
      author?: string;
    }) => addComment(callId, schema, text, timestampAnchor, author),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['review', callId, schema] }),
  });
}

export function useDeleteComment(callId: string, schema: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => deleteComment(callId, schema, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['review', callId, schema] }),
  });
}
