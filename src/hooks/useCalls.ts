import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCalls, fetchSchemas, fetchAudioUrl, fetchTranscript, fetchBulkSample, startTranscription, fetchEntities } from '../api/calls';
import { useQAStore } from '../store/useQAStore';
import type { Entity, TranscriptResponse } from '../types';

export function useSchemas() {
  return useQuery({ queryKey: ['schemas'], queryFn: fetchSchemas, staleTime: Infinity });
}

export function useCalls() {
  const schema = useQAStore((s) => s.schema);
  const filters = useQAStore((s) => s.filters);
  return useQuery({
    queryKey: ['calls', schema, filters],
    queryFn: () => fetchCalls(schema, filters),
    enabled: !!schema,
    staleTime: 30_000,
  });
}

export function useAudioUrl(callId: string | undefined, schema: string | undefined) {
  return useQuery({
    queryKey: ['audio', callId, schema],
    queryFn: () => fetchAudioUrl(callId!, schema!),
    enabled: !!callId && !!schema,
    staleTime: 50 * 60 * 1000, // re-fetch before 1hr presigned URL expires
    gcTime: 60 * 60 * 1000,
  });
}

export function useTranscript(callId: string | undefined, schema: string | undefined) {
  return useQuery<TranscriptResponse>({
    queryKey: ['transcript', callId, schema],
    queryFn: () => fetchTranscript(callId!, schema!),
    enabled: !!callId && !!schema,
    staleTime: 0,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'pending' || s === 'in_progress' ? 5000 : false;
    },
  });
}

export function useStartTranscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ callId, schema }: { callId: string; schema: string }) =>
      startTranscription(callId, schema),
    onSuccess: (_data, { callId, schema }) => {
      queryClient.invalidateQueries({ queryKey: ['transcript', callId, schema] });
    },
  });
}

export function useEntities(callId: string | undefined, schema: string | undefined) {
  return useQuery<Entity[]>({
    queryKey: ['entities', callId, schema],
    queryFn: () => fetchEntities(callId!, schema!),
    enabled: !!callId && !!schema,
    staleTime: Infinity,
  });
}

export function useBulkSample() {
  const schema = useQAStore((s) => s.schema);
  const filters = useQAStore((s) => s.filters);
  const startBulkSession = useQAStore((s) => s.startBulkSession);

  return useMutation({
    mutationFn: (n: number) =>
      fetchBulkSample(schema, n, filters.dateFrom, filters.dateTo),
    onSuccess: (data) => startBulkSession(data.calls),
  });
}
