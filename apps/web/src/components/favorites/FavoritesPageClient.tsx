'use client'

import { useState, useMemo, useCallback } from 'react'
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers'
import { useFavorites, useToggleFavorite, type EntityType } from '@/lib/api/favorites'
import { useToast } from '@/components/toast'
import { Button } from '@/components/ui/button'

import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { AuthGuard } from '@/components/auth-guard'
import { Skeleton } from '@/components/seller/Skeleton'

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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

  // ── Error state (same style as seller page) ──
  if (isError) {
    return (
      <AuthGuard>
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center text-3xl">⚠️</div>
          <h2 className="text-on-surface font-bold text-lg">حدث خطأ</h2>
          <p className="text-on-surface-variant text-sm">تعذر تحميل المفضلة. يرجى المحاولة مرة أخرى.</p>
          <Button variant="outline" onClick={() => refetch()} className="rounded-full px-6">
            إعادة المحاولة
          </Button>
        </div>
        <Footer />
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        <div className="flex-1 max-w-5xl mx-auto w-full">
          {/* ── Hero (matches SellerHero style) ── */}
          <section className="relative px-4 pt-6 pb-5 bg-primary/5">
            <div className="flex flex-col items-center md:flex-row md:items-start md:gap-5">
              {/* Icon */}
              {isLoading ? (
                <Skeleton className="w-20 h-20 rounded-2xl mb-3 md:mb-0" />
              ) : (
                <div className="relative mb-3 md:mb-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md ring-4 ring-background bg-primary/20 flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-4xl text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      favorite
                    </span>
                  </div>
                </div>
              )}

              {/* Title + Stats */}
              <div className="text-center md:text-right md:flex-1 min-w-0">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32 mx-auto md:mx-0 rounded" />
                    <Skeleton className="h-4 w-48 mx-auto md:mx-0 rounded" />
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-on-surface mb-3">المفضلة</h1>
                    {/* Stats Row */}
                    <div className="flex items-center justify-center md:justify-start gap-5">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="flex items-center gap-1 text-lg font-bold text-on-surface leading-none">
                          {totalCount}
                          <span
                            className="material-symbols-outlined text-sm text-error"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            favorite
                          </span>
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-medium">إعلان محفوظ</span>
                      </div>
                      <div className="w-px h-8 bg-outline-variant/30" />
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-lg font-bold text-on-surface leading-none">
                          {Object.keys(categoryCounts).length}
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-medium">أقسام</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile CTA */}
            {!isLoading && totalCount > 0 && (
              <div className="flex gap-3 mt-5 md:hidden">
                <button
                  onClick={() => { setIsSelecting(s => !s); setSelectedIds(new Set()) }}
                  className="flex-1 h-11 rounded-xl border-2 border-outline-variant/30 text-on-surface text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-colors"
                  aria-label={isSelecting ? 'إلغاء التحديد' : 'تحديد'}
                >
                  <span className="material-symbols-outlined text-lg">
                    {isSelecting ? 'close' : 'checklist'}
                  </span>
                  {isSelecting ? 'إلغاء التحديد' : 'تحديد متعدد'}
                </button>
              </div>
            )}
          </section>

          {/* ── Sticky Filter Bar (matches SellerTabs) ── */}
          <div className="sticky top-14 z-10 bg-background border-b border-outline-variant/20">
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

          {/* ── Content ── */}
          <div className="pt-5 px-4">
            {/* Sort bar + view toggle */}
            {!isLoading && totalCount > 0 && (
              <div className="flex items-center justify-between gap-3 pb-4">
                {/* Sort pills */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                        sortBy === opt.value
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* View mode toggle + select */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex border border-outline-variant/40 rounded-lg overflow-hidden bg-background">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 transition-colors ${
                        viewMode === 'list' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
                      }`}
                      aria-label="عرض كقائمة"
                    >
                      <span className="material-symbols-outlined text-[18px]">view_list</span>
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 transition-colors ${
                        viewMode === 'grid' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
                      }`}
                      aria-label="عرض كشبكة"
                    >
                      <span className="material-symbols-outlined text-[18px]">grid_view</span>
                    </button>
                  </div>

                  {/* Desktop select button */}
                  <button
                    onClick={() => { setIsSelecting(s => !s); setSelectedIds(new Set()) }}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border border-outline-variant/40 text-on-surface-variant hover:border-primary/30"
                    aria-label={isSelecting ? 'إلغاء التحديد' : 'تحديد'}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isSelecting ? 'close' : 'checklist'}
                    </span>
                    {isSelecting ? 'إلغاء' : 'تحديد'}
                  </button>
                </div>
              </div>
            )}

            {/* Grid */}
            <main id="main-content">
              {isLoading ? (
                <FavoritesGridSkeleton />
              ) : allItems.length === 0 ? (
                <FavoritesEmptyState variant="empty" />
              ) : sorted.length === 0 ? (
                <FavoritesEmptyState variant="no-results" onClear={() => setActiveCategory('ALL')} />
              ) : (
                <FavoritesGrid
                  items={sorted}
                  viewMode={viewMode}
                  isSelecting={isSelecting}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onRemove={handleRemove}
                />
              )}
            </main>
          </div>
        </div>

        {/* ── Bulk Actions Bar ── */}
        {isSelecting && (
          <FavoritesBulkActions
            selectedCount={selectedIds.size}
            total={sorted.length}
            onSelectAll={selectAll}
            onDelete={handleBulkDelete}
          />
        )}

        <Footer />
      </div>
    </AuthGuard>
  )
}
