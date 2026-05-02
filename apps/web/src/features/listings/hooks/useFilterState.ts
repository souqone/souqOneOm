'use client'

import { useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter, usePathname } from '@/i18n/navigation'
import type { ActiveFilters } from '../types/filters.types'
import type { ListingCategory } from '../types/category.types'
import { parseUrlFilters } from '../utils/filter-helpers'
import { FILTERS_CONFIG } from '../config/filters.config'

interface UseFilterStateReturn {
  filters: ActiveFilters
  setFilter: (key: string, value: string | string[] | boolean | null) => void
  setFilters: (updates: Record<string, string | string[] | boolean | null>) => void
  clearAll: () => void
  activeCount: number
  hasActiveFilters: boolean
}

export function useFilterState(category: ListingCategory): UseFilterStateReturn {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters = useMemo(
    () => {
      const config = FILTERS_CONFIG[category] ?? []
      return parseUrlFilters(searchParams, config)
    },
    [searchParams, category],
  )

  const setFilter = useCallback(
    (key: string, value: string | string[] | boolean | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === '' || value === false) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router],
  )

  const setFilters = useCallback(
    (updates: Record<string, string | string[] | boolean | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === '' || v === false) params.delete(k)
        else params.set(k, String(v))
      })
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router]
  )

  const clearAll = useCallback(() => {
    router.push(pathname)
  }, [pathname, router])

  const SYSTEM_KEYS = ['sort', 'page', 'q']
  const activeCount = Object.keys(filters).filter(k => !SYSTEM_KEYS.includes(k)).length
  const hasActiveFilters = activeCount > 0

  return { filters, setFilter, setFilters, clearAll, activeCount, hasActiveFilters }
}
