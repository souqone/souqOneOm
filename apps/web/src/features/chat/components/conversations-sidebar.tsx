'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useConversations, useArchiveConversation } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { connectSocket } from '@/lib/socket';
import { Search, MessageCircle, Archive, Loader2, CheckCheck } from 'lucide-react';
import { ConversationFilters } from './conversation-filters';
import { getImageUrl } from '@/lib/image-utils';
import { useTranslations, useLocale } from 'next-intl';

const ENTITY_KEYS: Record<string, string> = {
  LISTING: 'entityListing',
  BUS_LISTING: 'entityBusListing',
  SPARE_PART: 'entitySparePart',
  CAR_SERVICE: 'entityCarService',
  TRANSPORT: 'entityTransport',
  JOB: 'entityJob',
  EQUIPMENT_LISTING: 'entityEquipmentListing',
  EQUIPMENT_REQUEST: 'entityEquipmentRequest',
  OPERATOR_LISTING: 'entityOperatorListing',
};

const AVATAR_GRADIENTS = [
  'from-blue-500/25 to-indigo-500/10',
  'from-emerald-500/25 to-teal-500/10',
  'from-rose-500/25 to-pink-500/10',
  'from-amber-500/25 to-orange-500/10',
  'from-violet-500/25 to-purple-500/10',
  'from-cyan-500/25 to-sky-500/10',
];

function getAvatarGradient(id: string) {
  const idx = id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function formatTimeAgo(dateStr: string, tp: (key: string, values?: Record<string, string | number | Date>) => string, locale: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return tp('sidebarTimeNow');
  if (diff < 3600) return tp('sidebarTimeMin', { value: Math.floor(diff / 60) });
  if (diff < 86400) return tp('sidebarTimeHour', { value: Math.floor(diff / 3600) });
  if (diff < 604800) return tp('sidebarTimeDay', { value: Math.floor(diff / 86400) });
  return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US');
}

export default function ConversationsSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const tp = useTranslations('pages');
  const locale = useLocale();
  const { data: conversations, isLoading, refetch } = useConversations();
  const archiveMutation = useArchiveConversation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Listen for real-time conversation updates
  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();

    const onNewMessage = () => { refetch(); };
    const onOnlineStatus = (data: { userId: string; online: boolean }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        data.online ? next.add(data.userId) : next.delete(data.userId);
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

  // Check online status for all conversation participants
  useEffect(() => {
    if (!conversations || !user) return;
    const socket = connectSocket();
    conversations.forEach(conv => {
      const other = conv.participants?.find(p => p.id !== user.id);
      if (other) socket.emit('check-online', { userId: other.id });
    });
  }, [conversations, user]);

  const filtered = conversations?.filter(conv => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const other = conv.participants?.find(p => p.id !== user?.id);
      const name = (other?.displayName || other?.username || '').toLowerCase();
      const entityTitle = (conv.entityTitle || conv.listing?.title || '').toLowerCase();
      if (!name.includes(q) && !entityTitle.includes(q)) return false;
    }
    if (filter === 'buying') return conv.createdById === user?.id;
    if (filter === 'selling') return conv.createdById !== user?.id;
    return true;
  }) ?? [];

  const activeConvId = pathname.split('/messages/')[1];

  return (
    <>
      {/* ══ Premium Header ══ */}
      <div className="relative bg-gradient-to-bl from-[#004ac6] via-[#1d4ed8] to-[#0B2447] overflow-hidden px-4 pt-5 pb-8">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h30v30H0zm30 30h30v30H30z\' fill=\'%23fff\' fill-opacity=\'.5\'/%3E%3C/svg%3E")', backgroundSize: '30px 30px' }} />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-surface-container-lowest to-transparent" />
        {/* Title row */}
        <div className="relative flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
              <MessageCircle size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-white leading-tight">{tp('sidebarTitle')}</h2>
              <p className="text-[10px] text-white/60">{conversations?.length ?? 0} محادثة</p>
            </div>
          </div>
          <button className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-white text-base">edit_square</span>
          </button>
        </div>
        {/* Filter pills */}
        <div className="relative mt-3">
          <ConversationFilters active={filter} onChange={setFilter} inHeader />
        </div>
      </div>

      {/* Search bar — sits below gradient */}
      <div className="px-4 -mt-5 mb-1 relative z-10">
        <div className="relative">
          <Search size={14} className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tp('sidebarSearchPlaceholder')}
            className="w-full pe-9 ps-3 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-xs shadow-[0_2px_12px_rgba(0,0,0,0.08)] focus:ring-2 focus:ring-primary/20 focus:outline-none placeholder:text-on-surface-variant/35 transition-shadow"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="animate-spin text-primary" size={28} />
            <span className="text-[11px] text-on-surface-variant/50">{tp('sidebarLoading')}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={32} className="text-primary/30" />
            </div>
            <p className="text-sm font-bold text-on-surface/60 mb-1">
              {search ? tp('sidebarNoResults') : tp('sidebarNoConversations')}
            </p>
            <p className="text-[11px] text-on-surface-variant/40 leading-relaxed">
              {search ? tp('sidebarTryAnother') : tp('sidebarStartConversation')}
            </p>
          </div>
        ) : (
          filtered.map(conv => {
            const other = conv.participants?.find(p => p.id !== user?.id);
            const name = other?.displayName || other?.username || tp('chatDefaultUser');
            const initial = name[0]?.toUpperCase() || '?';
            const isActive = activeConvId === conv.id;
            const isOnline = other ? onlineUsers.has(other.id) : false;
            const lastMsg = conv.lastMessage;
            const hasUnread = conv.unreadCount > 0;
            const gradient = other ? getAvatarGradient(other.id) : AVATAR_GRADIENTS[0];

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={`flex items-center gap-3 px-5 py-3.5 transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-primary/[0.06] border-r-[3px] border-r-primary'
                    : 'hover:bg-surface-container-low/50 border-r-[3px] border-r-transparent'
                }`}
              >
                {/* Avatar + online dot */}
                <div className="relative shrink-0">
                  {other?.avatarUrl ? (
                    <Image src={getImageUrl(other.avatarUrl) || ''} alt={name} width={52} height={52} className="w-[52px] h-[52px] rounded-2xl object-cover ring-2 ring-outline-variant/5" />
                  ) : (
                    <div className={`w-[52px] h-[52px] rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-primary font-black text-lg`}>
                      {initial}
                    </div>
                  )}
                  {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-surface-container-lowest rounded-full" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[13.5px] truncate ${hasUnread ? 'font-black text-on-surface' : 'font-semibold text-on-surface/80'}`}>
                      {name}
                    </span>
                    {lastMsg && (
                      <span className={`text-[10px] shrink-0 me-2 tabular-nums ${hasUnread ? 'text-primary font-bold' : 'text-on-surface-variant/45'}`}>
                        {formatTimeAgo(lastMsg.createdAt, tp, locale)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[12px] line-clamp-1 flex-1 leading-relaxed ${
                      hasUnread ? 'font-semibold text-on-surface/80' : 'text-on-surface-variant/55'
                    }`}>
                      {lastMsg ? (
                        <>
                          {lastMsg.senderId === user?.id && (
                            <CheckCheck size={13} className="inline-block ms-0.5 -mt-0.5 text-on-surface-variant/35" />
                          )}
                          {lastMsg.senderId === user?.id && ' '}
                          {lastMsg.content || (lastMsg.type === 'IMAGE' ? tp('sidebarImageMsg') : tp('sidebarAudioMsg'))}
                        </>
                      ) : (
                        <span className="text-on-surface-variant/35">{tp('sidebarStartChat')}</span>
                      )}
                    </p>

                    {hasUnread && (
                      <span className="min-w-[20px] h-[20px] px-1.5 bg-primary text-on-primary text-[10px] font-black rounded-full flex items-center justify-center shrink-0 shadow-sm">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {(conv.entityTitle || conv.listing?.title) && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {conv.entityType && conv.entityType !== 'LISTING' && (
                        <span className="bg-primary/8 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                          {ENTITY_KEYS[conv.entityType] ? tp(ENTITY_KEYS[conv.entityType]) : conv.entityType}
                        </span>
                      )}
                      <span className="text-[10px] text-on-surface-variant/40 truncate max-w-[160px]">
                        {conv.entityTitle || conv.listing?.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* Archive button (on hover) */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    archiveMutation.mutate({ id: conv.id, archive: true });
                  }}
                  className="absolute start-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-xl bg-surface-container-high/80 hover:bg-surface-container-highest flex items-center justify-center transition-all duration-200 shadow-sm"
                  title={tp('sidebarArchive')}
                >
                  <Archive size={14} className="text-on-surface-variant/60" />
                </button>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
