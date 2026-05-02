'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useConversations, useArchiveConversation } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { connectSocket } from '@/lib/socket';
import { Archive } from 'lucide-react';
import { ConversationFilters } from './conversation-filters';
import { getImageUrl } from '@/lib/image-utils';
import { useTranslations, useLocale } from 'next-intl';
import { ENTITY_KEYS, ENTITY_BADGE_COLORS } from '../constants/entity-config';

function formatTimeAgo(dateStr: string, tp: (key: string, values?: Record<string, string | number | Date>) => string, locale: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return tp('sidebarTimeNow');
  if (diff < 3600) return tp('sidebarTimeMin', { value: Math.floor(diff / 60) });
  if (diff < 86400) return tp('sidebarTimeHour', { value: Math.floor(diff / 3600) });
  if (diff < 604800) return tp('sidebarTimeDay', { value: Math.floor(diff / 86400) });
  return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US');
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/[0.06]" aria-hidden>
      <div className="w-11 h-11 rounded-2xl flex-shrink-0 bg-surface-container-high animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between gap-2">
          <div className="h-3 w-28 rounded-full bg-surface-container-high animate-pulse" />
          <div className="h-3 w-10 rounded-full bg-surface-container-high animate-pulse shrink-0" />
        </div>
        <div className="h-2.5 w-20 rounded-full bg-surface-container-high animate-pulse" />
        <div className="h-2.5 w-[75%] max-w-[200px] rounded-full bg-surface-container-high animate-pulse" />
      </div>
    </div>
  );
}

export default function ConversationsSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const tp = useTranslations('pages');
  const locale = useLocale();
  const [filter, setFilter] = useState('all');
  const { data: conversations, isLoading, refetch } = useConversations(filter === 'archived');
  const archiveMutation = useArchiveConversation();
  const [search, setSearch] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const unreadTotal = useMemo(
    () => (conversations ?? []).reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
    [conversations],
  );

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();

    const onNewMessage = () => {
      refetch();
    };
    const onOnlineStatus = (data: { userId: string; online: boolean }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.online) next.add(data.userId);
        else next.delete(data.userId);
        return next;
      });
    };

    socket.on('message', onNewMessage);
    socket.on('online-status', onOnlineStatus);
    socket.on('notification', onNewMessage);

    return () => {
      socket.off('message', onNewMessage);
      socket.off('online-status', onOnlineStatus);
      socket.off('notification', onNewMessage);
    };
  }, [user, refetch]);

  useEffect(() => {
    if (!conversations || !user) return;
    const socket = connectSocket();
    conversations.forEach((conv) => {
      const other = conv.participants?.find((p) => p.id !== user.id);
      if (other) socket.emit('check-online', { userId: other.id });
    });
  }, [conversations, user]);

  const filtered =
    conversations?.filter((conv) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const other = conv.participants?.find((p) => p.id !== user?.id);
        const name = (other?.displayName || other?.username || '').toLowerCase();
        const entityTitle = (conv.entityTitle || conv.listing?.title || '').toLowerCase();
        if (!name.includes(q) && !entityTitle.includes(q)) return false;
      }
      if (filter === 'archived') return conv.archived === true;
      // For non-archived filters, exclude archived conversations
      if (conv.archived) return false;
      if (filter === 'buying') return conv.createdById === user?.id;
      if (filter === 'selling') return conv.createdById !== user?.id;
      return true;
    }) ?? [];

  const activeConvId = pathname.split('/messages/')[1]?.split('/')[0];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-surface-container-lowest">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-outline-variant/8 sticky top-0 bg-surface-container-lowest z-10 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-on-surface text-[16px]">{tp('sidebarTitle')}</h2>
            {unreadTotal > 0 && (
              <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full min-w-5 text-center">
                {unreadTotal}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label={tp('chatNewConversationAria')}
            className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center text-primary hover:bg-primary/15 transition-all"
          >
            <span className="material-symbols-outlined text-base">edit</span>
          </button>
        </div>

        <div className="relative mb-3">
          <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-base pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tp('sidebarSearchPlaceholder')}
            className="w-full ps-9 pe-3 py-2.5 bg-surface-container-low rounded-xl text-[12px]
                       border border-outline-variant/10 focus:outline-none focus:ring-2
                       focus:ring-primary/15 focus:border-primary/20 transition-all
                       placeholder:text-on-surface-variant/30"
          />
        </div>

        <ConversationFilters active={filter} onChange={setFilter} inHeader={false} />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 && !search.trim() ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6" role="status">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl">chat</span>
            </div>
            <p className="text-on-surface font-semibold text-[14px]">{tp('sidebarNoConversations')}</p>
            <p className="text-on-surface-variant text-[12px]">{tp('sidebarStartConversation')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6" role="status">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-4xl">search_off</span>
            <p className="text-on-surface-variant text-[13px]">{tp('sidebarNoResults')}</p>
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-primary text-[12px] font-medium underline underline-offset-2"
            >
              {tp('sidebarTryAnother')}
            </button>
          </div>
        ) : (
          filtered.map((conv) => {
            const other = conv.participants?.find((p) => p.id !== user?.id);
            const name = other?.displayName || other?.username || tp('chatDefaultUser');
            const initial = name[0]?.toUpperCase() || '?';
            const isActive = activeConvId === conv.id;
            const isOnline = other ? onlineUsers.has(other.id) : false;
            const lastMsg = conv.lastMessage;
            const hasUnread = conv.unreadCount > 0;
            const lastAt = lastMsg?.createdAt ?? conv.createdAt;
            const badgeKey = conv.entityType ? ENTITY_KEYS[conv.entityType] : undefined;

            return (
              <div key={conv.id} className="relative group border-b border-outline-variant/[0.06]">
                {hasUnread && (
                  <div className="absolute top-0 bottom-0 inset-inline-end-0 w-0.5 bg-primary rounded-s-full" aria-hidden />
                )}
                <Link
                  href={`/messages/${conv.id}`}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-start transition-all relative
                    ${isActive ? 'bg-primary/5' : 'hover:bg-surface-container-low/60'}`}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`relative w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center font-semibold text-base shadow-sm flex-shrink-0
                      ${isActive
                        ? 'bg-gradient-to-br from-primary to-[#0B2447] text-on-primary'
                        : 'bg-gradient-to-br from-surface-container-high to-surface-container text-on-surface-variant'
                      }`}
                    >
                      {other?.avatarUrl ? (
                        <Image
                          src={getImageUrl(other.avatarUrl) || ''}
                          alt=""
                          fill
                          className="object-cover rounded-2xl"
                          sizes="44px"
                        />
                      ) : (
                        <span className={isActive ? 'text-on-primary' : 'text-on-surface-variant'}>{initial}</span>
                      )}
                    </div>
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -start-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className={`text-[13px] truncate ${hasUnread ? 'font-bold text-on-surface' : 'font-medium text-on-surface/80'}`}
                      >
                        {name}
                      </span>
                      <span className="text-[10px] text-on-surface-variant/50 flex-shrink-0 tabular-nums">
                        {formatTimeAgo(lastAt, tp, locale)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                      {conv.entityType && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0
                          ${ENTITY_BADGE_COLORS[conv.entityType] ?? 'bg-surface-container-high text-on-surface-variant border-outline-variant/20'}`}
                        >
                          {badgeKey ? tp(badgeKey) : tp('notifTypeOther')}
                        </span>
                      )}
                      {(conv.entityTitle || conv.listing?.title) && (
                        <span className="text-[10px] text-on-surface-variant/60 truncate">
                          {conv.entityTitle || conv.listing?.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] truncate min-w-0 ${hasUnread ? 'text-on-surface-variant font-medium' : 'text-on-surface-variant/60'}`}
                      >
                        {!lastMsg ? (
                          tp('sidebarStartChat')
                        ) : lastMsg.type === 'IMAGE' ? (
                          <>
                            📷 {tp('sidebarImageMsg')}
                          </>
                        ) : lastMsg.type === 'AUDIO' ? (
                          <>
                            🎤 {tp('sidebarAudioMsg')}
                          </>
                        ) : (
                          lastMsg.content ?? ''
                        )}
                      </span>
                      {hasUnread && (
                        <span className="flex-shrink-0 min-w-5 h-5 bg-primary text-on-primary text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {filter === 'archived' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      archiveMutation.mutate({ id: conv.id, archive: false });
                    }}
                    className="absolute start-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all duration-200 shadow-sm z-[1]"
                    title={tp('sidebarUnarchive')}
                  >
                    <Archive size={14} className="text-primary" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      archiveMutation.mutate({ id: conv.id, archive: true });
                    }}
                    className="absolute start-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-xl bg-surface-container-high/90 hover:bg-surface-container-highest flex items-center justify-center transition-all duration-200 shadow-sm z-[1]"
                    title={tp('sidebarArchive')}
                  >
                    <Archive size={14} className="text-on-surface-variant/60" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
