'use client';

import { useQuery } from '@tanstack/react-query';
import { transportApi } from '../api';

type ApiParams = Record<string, string | number | boolean | undefined>;

export function useCarriers(params: ApiParams = {}) {
  return useQuery({
    queryKey: ['transport-carriers', params],
    queryFn: () => transportApi.getCarriers(params),
  });
}
