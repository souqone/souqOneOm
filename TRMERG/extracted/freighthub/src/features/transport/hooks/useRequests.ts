'use client';

import { useQuery } from '@tanstack/react-query';
import { transportApi } from '../api';
import type { GetRequestsParams } from '../types';

export function useRequests(params: GetRequestsParams = {}) {
  return useQuery({
    queryKey: ['requests', params],
    queryFn: () => transportApi.getRequests(params),
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: ['request', id],
    queryFn: () => transportApi.getRequest(id),
    enabled: !!id,
  });
}

export function useMyRequests(page = 1) {
  return useQuery({
    queryKey: ['my-requests', page],
    queryFn: () => transportApi.myRequests(page),
  });
}