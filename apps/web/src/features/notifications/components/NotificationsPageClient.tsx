'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { useAuthModal } from '@/providers/auth-modal-provider';
import { apiRequest, getAuthToken } from '@/lib/auth';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationItem,
  type PaginatedNotifications,
} from '@/lib/api/notifications';
import { getNotifConfig } from '@/lib/constants/notifications';
import { groupNotificationsByDate } from '@/lib/utils/group-by-date';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { NotificationsHero } from './NotificationsHero';
import { NotificationsHeroSkeleton } from './NotificationsHeroSkeleton';
import { NotificationsList } from './NotificationsList';
import { NotificationsListSkeleton } from './NotificationsListSkeleton';
import { NotificationsEmptyState } from './NotificationsEmptyState';
import { NotificationsDesktopSidebar } from './NotificationsDesktopSidebar';
import { NotificationsDesktopDetailPanel } from './NotificationsDesktopDetailPanel';

export function NotificationsPageClient() {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { openAuth } = useAuthModal();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [desktopPage, setDesktopPage] = useState(1);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) openAuth('login');
  }, [authLoading, isAuthenticated, openAuth]);

  // H-2 + L-10: reset desktop page to 1 and scroll to top whenever filter changes
  useEffect(() => {
    setDesktopPage(1);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [filter]);

  // Mobile — infinite scroll (C-1: use ?filter=unread, not ?unread=true)
  const mobileQuery = useInfiniteQuery<PaginatedNotifications>({
    queryKey: ['notifications', 'infinite', filter],
    queryFn: ({ pageParam }) =>
      apiRequest<PaginatedNotifications>(
        `/notifications?page=${pageParam}&limit=20${filter === 'unread' ? '&filter=unread' : ''}`,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    initialPageParam: 1,
    enabled: !!getAuthToken(),
  });

  // Desktop — paginated (H-1: pass filter so it re-fetches on filter change)
  const desktopQuery = useNotifications(desktopPage, filter);
  const { data: unreadData } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = unreadData?.count ?? 0;

  const mobileNotifs = useMemo(
    () => mobileQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [mobileQuery.data],
  );
  const desktopNotifs = useMemo(
    () => desktopQuery.data?.items ?? [],
    [desktopQuery.data],
  );
  const desktopMeta = desktopQuery.data?.meta;

  const mobileGroups = useMemo(
    () => groupNotificationsByDate(mobileNotifs, locale, { today: tp('notifToday'), yesterday: tp('notifYesterday') }),
    [mobileNotifs, locale, tp],
  );
  const desktopGroups = useMemo(
    () => groupNotificationsByDate(desktopNotifs, locale, { today: tp('notifToday'), yesterday: tp('notifYesterday') }),
    [desktopNotifs, locale, tp],
  );

  const typeBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of desktopNotifs) {
      map.set(n.type, (map.get(n.type) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
  }, [desktopNotifs]);

  const handleClick = useCallback(
    (n: NotificationItem) => {
      setSelectedNotif(n);
      const cfg = getNotifConfig(n.type);
      const path = cfg.navigateTo(n.data);

      if (!n.isRead) {
        // H-7: optimistic update for desktop paginated query
        queryClient.setQueryData(
          ['notifications', desktopPage, filter],
          (old: any) => {
            if (!old?.items) return old;
            return {
              ...old,
              items: old.items.map((item: any) =>
                item.id === n.id ? { ...item, isRead: true } : item,
              ),
            };
          },
        );
        // Optimistic update for mobile infinite query
        queryClient.setQueryData(
          ['notifications', 'infinite', filter],
          (old: any) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                items: page.items.map((item: any) =>
                  item.id === n.id ? { ...item, isRead: true } : item,
                ),
              })),
            };
          },
        );
        queryClient.setQueryData(['unread-count'], (old: any) =>
          old ? { count: Math.max(0, (old.count ?? 1) - 1) } : old,
        );
        markRead.mutate(n.id);
      }

      if (path) router.push(path);
    },
    [desktopPage, filter, queryClient, markRead, router],
  );

  const handleMarkAll = useCallback(() => {
    // Optimistic
    queryClient.setQueryData(
      ['notifications', 'infinite', filter],
      (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: any) => ({ ...item, isRead: true })),
          })),
        };
      },
    );
    queryClient.setQueryData(['unread-count'], { count: 0 });
    markAllRead.mutate();
  }, [filter, queryClient, markAllRead]);

  if (authLoading || !isAuthenticated) {
    return (
      <>
        <Navbar />
        <NotificationsHeroSkeleton />
        <NotificationsListSkeleton />
      </>
    );
  }

  const heroLabels = {
    title: tp('notifTitle'),
    unreadSummary: tp('notifUnreadSummary', { count: unreadCount }),
    allRead: tp('notifAllRead'),
    all: tp('notifAll'),
    unread: tp('notifUnread'),
    markAllRead: tp('notifMarkAllRead'),
    markingRead: tp('notifMarkingRead'),
  };

  const emptyLabels = {
    emptyTitle: tp('notifEmpty'),
    emptyDesc: tp('notifEmptyDesc'),
    noUnread: tp('notifNoUnread'),
    showAll: tp('notifShowAll'),
  };

  const isLoadingMobile = mobileQuery.isLoading;
  const isLoadingDesktop = desktopQuery.isLoading;
  const mobileEmpty = !isLoadingMobile && mobileNotifs.length === 0;
  const desktopEmpty = !isLoadingDesktop && desktopNotifs.length === 0;

  return (
    <>
      <Navbar />

      <NotificationsHero
        unreadCount={unreadCount}
        filter={filter}
        onFilterChange={setFilter}
        onMarkAll={handleMarkAll}
        isMarkingAll={markAllRead.isPending}
        labels={heroLabels}
      />

      {/* Mobile layout */}
      <main className="md:hidden pb-24 bg-background" id="main-content">
        {isLoadingMobile ? (
          <NotificationsListSkeleton />
        ) : mobileEmpty ? (
          <NotificationsEmptyState
            variant={filter === 'unread' ? 'all-read' : 'empty'}
            labels={emptyLabels}
            onShowAll={filter === 'unread' ? () => setFilter('all') : undefined}
          />
        ) : (
          <NotificationsList
            groups={mobileGroups}
            onNotificationClick={handleClick}
            variant="mobile"
            hasNextPage={!!mobileQuery.hasNextPage}
            isFetchingNextPage={mobileQuery.isFetchingNextPage}
            fetchNextPage={() => mobileQuery.fetchNextPage()}
          />
        )}
      </main>

      {/* Desktop layout — 3 columns */}
      <main className="hidden md:block bg-background pb-8" id="main-content">
        <div className="max-w-6xl mx-auto px-6 py-6 flex gap-5">
          <NotificationsDesktopSidebar
            total={desktopMeta?.total ?? desktopNotifs.length}
            unread={unreadCount}
            filter={filter}
            onFilterChange={setFilter}
            onMarkAll={handleMarkAll}
            typeBreakdown={typeBreakdown}
            labels={{
              total: tp('notifTitle'),
              unread: tp('notifUnread'),
              all: tp('notifAll'),
              unreadFilter: tp('notifUnread'),
              markAllRead: tp('notifMarkAllRead'),
            }}
          />

          <div className="flex-1 min-w-0">
            {isLoadingDesktop ? (
              <NotificationsListSkeleton />
            ) : desktopEmpty ? (
              <NotificationsEmptyState
                variant={filter === 'unread' ? 'all-read' : 'empty'}
                labels={emptyLabels}
                onShowAll={filter === 'unread' ? () => setFilter('all') : undefined}
              />
            ) : (
              <>
                <NotificationsList
                  groups={desktopGroups}
                  onNotificationClick={handleClick}
                  selectedId={selectedNotif?.id}
                  variant="desktop"
                />
                {desktopMeta && desktopMeta.totalPages > 1 && (
                  <DesktopPagination
                    currentPage={desktopPage}
                    totalPages={desktopMeta.totalPages}
                    onPageChange={setDesktopPage}
                  />
                )}
              </>
            )}
          </div>

          <NotificationsDesktopDetailPanel
            notification={selectedNotif}
            labels={{
              selectPrompt: tp('notifSelectPrompt'),
              readStatus: tp('notifRead'),
              unreadStatus: tp('notifUnread'),
            }}
          />
        </div>
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>
    </>
  );
}

function DesktopPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  const maxVisible = Math.min(totalPages, 5);
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container-lowest border border-outline-variant/10 hover:border-primary/30 hover:text-primary disabled:opacity-30 transition-all"
      >
        <span className="material-symbols-outlined text-base">chevron_right</span>
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${
            currentPage === p
              ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
              : 'bg-surface-container-lowest border border-outline-variant/10 text-on-surface-variant hover:border-primary/30 hover:text-primary'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container-lowest border border-outline-variant/10 hover:border-primary/30 hover:text-primary disabled:opacity-30 transition-all"
      >
        <span className="material-symbols-outlined text-base">chevron_left</span>
      </button>
    </div>
  );
}
