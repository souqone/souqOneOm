'use client'

import { useState, useMemo, useCallback } from 'react'
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers'
import { useFavorites, useToggleFavorite, type EntityType } from '@/lib/api/favorites'
import { useToast } from '@/components/toast'
import { ErrorState } from '@/components/error-state'

import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { AuthGuard } from '@/components/auth-guard'

import { FavoritesCategoryFilter } from './FavoritesCategoryFilter'
import { FavoritesCategoryFilterSkeleton } from './FavoritesCategoryFilterSkeleton'
import { FavoritesGrid } from './FavoritesGrid'
import { FavoritesGridSkeleton } from './FavoritesGridSkeleton'
import { FavoritesEmptyState } from './FavoritesEmptyState'
import { FavoritesBulkActions } from './FavoritesBulkActions'

type SortOption = 'newest' | 'price' | 'oldest'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'price', label: 'السعر' },
  { value: 'oldest', label: 'الأقدم' },
]

export function FavoritesPageClient() {
  const { transformFavorite } = useItemTransformers()
  const { addToast } = useToast()
  const toggleFav = useToggleFavorite()

  // ── State ──
  const [activeCategory, setActiveCategory] = useState<EntityType | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ── Data ──
  const filterType = activeCategory === 'ALL' ? undefined : activeCategory
  const { data, isLoading, isError, refetch } = useFavorites(filterType)
  const { data: allFavs } = useFavorites(undefined)

  const items = useMemo(() => data?.items ?? [], [data])
  const allItems = useMemo(() => allFavs?.items ?? [], [allFavs])
  const totalCount = allFavs?.meta?.total ?? 0

  // ── Category counts ──
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const fav of allItems) {
      counts[fav.entityType] = (counts[fav.entityType] ?? 0) + 1
    }
    return counts
  }, [allItems])

  // ── Transform + Sort ──
  const transformed = useMemo(() => {
    return items.map(fav => transformFavorite(fav as any))
  }, [items, transformFavorite])

  const sorted = useMemo(() => {
    const list = [...transformed]
    switch (sortBy) {
      case 'newest':
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case 'oldest':
        return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case 'price':
        return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
      default:
        return list
    }
  }, [transformed, sortBy])

  // ── Handlers ──
  const handleRemove = useCallback(async (id: string) => {
    const fav = items.find(f => f.entityId === id || f.id === id)
    if (!fav) return
    try {
      await toggleFav.mutateAsync({ entityType: fav.entityType, entityId: fav.entityId })
    } catch {
      addToast('error', 'حدث خطأ أثناء الحذف')
    }
  }, [items, toggleFav, addToast])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sorted.map(i => i.id)))
    }
  }, [sorted, selectedIds.size])

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selectedIds]
    setIsSelecting(false)
    setSelectedIds(new Set())
    for (const id of ids) {
      await handleRemove(id)
    }
    addToast('success', `تم حذف ${ids.length} إعلانات`)
  }, [selectedIds, handleRemove, addToast])

  return (
    <AuthGuard>
      <Navbar />
      <div className="min-h-screen bg-background pb-24 lg:pb-16">

        {/* ── Banner Header ── */}
        <div className="relative bg-gradient-to-bl from-primary via-primary-container to-brand-navy overflow-hidden px-4 pt-8 pb-10">
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
          <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <span
                className="material-symbols-outlined text-xl text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
            </div>
            <div>
              <h1 className="text-[24px] font-bold text-white leading-tight">المفضلة</h1>
              {!isLoading && (
                <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-white/15 text-[11px] font-medium text-white/90">
                  {totalCount} إعلان محفوظ
                </span>
              )}
            </div>
            {/* Select button */}
            {totalCount > 0 && !isLoading && (
              <button
                onClick={() => {
                  setIsSelecting(s => !s)
                  setSelectedIds(new Set())
                }}
                className="absolute top-4 left-4 text-white/80 text-sm font-bold min-h-11 min-w-11 flex items-center justify-center"
                aria-label={isSelecting ? 'إلغاء التحديد' : 'تحديد'}
              >
                {isSelecting ? 'إلغاء' : 'تحديد'}
              </button>
            )}
          </div>
        </div>

        {/* ── Category Filter ── */}
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <FavoritesCategoryFilterSkeleton />
          ) : (
            <FavoritesCategoryFilter
              active={activeCategory}
              onChange={setActiveCategory}
              counts={categoryCounts}
            />
          )}
        </div>

        {/* ── Sort Bar ── */}
        {!isLoading && totalCount > 0 && (
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 mb-4">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-colors ${
                    sortBy === opt.value
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant/20 text-on-surface-variant hover:border-primary/30 bg-surface-container-lowest'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <main id="main-content" className="max-w-7xl mx-auto">
          {isLoading ? (
            <FavoritesGridSkeleton />
          ) : isError ? (
            <div className="px-4">
              <ErrorState onRetry={() => refetch()} />
            </div>
          ) : allItems.length === 0 ? (
            <FavoritesEmptyState variant="empty" />
          ) : sorted.length === 0 ? (
            <FavoritesEmptyState variant="no-results" onClear={() => setActiveCategory('ALL')} />
          ) : (
            <FavoritesGrid
              items={sorted}
              isSelecting={isSelecting}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onRemove={handleRemove}
            />
          )}
        </main>

        {/* ── Bulk Actions Bar ── */}
        {isSelecting && (
          <FavoritesBulkActions
            selectedCount={selectedIds.size}
            total={sorted.length}
            onSelectAll={selectAll}
            onDelete={handleBulkDelete}
          />
        )}
      </div>
      <Footer />
    </AuthGuard>
  )
}
