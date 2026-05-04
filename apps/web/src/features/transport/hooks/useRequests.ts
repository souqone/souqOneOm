'use client';

import { useQuery } from '@tanstack/react-query';
import { transportApi } from '../api';
import type { GetRequestsParams } from '../types';

type ApiParams = Record<string, string | number | boolean | undefined>;

export function useRequests(params: GetRequestsParams = {}) {
  return useQuery({
    queryKey: ['transport-requests', params],
    queryFn: () => transportApi.getRequests(params as ApiParams),
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: ['transport-request', id],
    queryFn: () => transportApi.getRequest(id),
    enabled: !!id,
  });
}

export function useMyRequests(page = 1) {
  return useQuery({
    queryKey: ['transport-my-requests', page],
    queryFn: () => transportApi.myRequests(page),
  });
}
