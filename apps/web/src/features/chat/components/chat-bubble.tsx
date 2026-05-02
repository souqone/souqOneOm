'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trash2, Ban } from 'lucide-react';
import { QuickReactions } from './emoji-picker';
import { AudioPlayer } from './voice-recorder';
import type { Message } from '@/lib/api';
import { useTranslations, useLocale } from 'next-intl';

interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
}

type StatusKey = 'sending' | 'sent' | 'delivered' | 'read';

const STATUS_DISPLAY: Record<
  StatusKey,
  { icon: string; color: string }
> = {
  sending: { icon: 'radio_button_unchecked', color: 'text-on-primary/40' },
  sent: { icon: 'done', color: 'text-on-primary/60' },
  delivered: { icon: 'done_all', color: 'text-on-primary/60' },
  read: { icon: 'done_all', color: 'text-primary-container' },
};

function resolveStatus(message: Message): StatusKey {
  if (message.status === 'sending') return 'sending';
  if (message.isRead || message.status === 'read') return 'read';
  return 'sent';
}

export function ChatBubble({ message, isMine, onDelete, onReact }: ChatBubbleProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const [showReactions, setShowReactions] = useState(false);

  const timeDisplay = new Date(message.createdAt).toLocaleTimeString(locale === 'ar' ? 'ar-OM' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const groupedReactions =
    message.reactions?.reduce<Record<string, number>>((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {}) ?? {};

  const hasReactions = Object.keys(groupedReactions).length > 0;
  const statusKey = resolveStatus(message);
  const statusUi = STATUS_DISPLAY[statusKey];

  return (
    <div className={`flex flex-col ${isMine ? 'items-start' : 'items-end'} mb-1 group relative px-1`}>
      <div className={`relative ${hasReactions ? 'mb-3' : ''}`} style={{ maxWidth: 'min(78%, 440px)' }}>
        {showReactions && (
          <QuickReactions
            onReact={(emoji) => {
              onReact(message.id, emoji);
              setShowReactions(false);
            }}
            onClose={() => setShowReactions(false)}
          />
        )}

        <div
          className={`relative ${
            message.isDeleted
              ? 'bg-surface-container-high/60 text-on-surface-variant/50 border border-outline-variant/10 rounded-2xl px-3.5 py-2.5 italic text-[12px]'
              : isMine
                ? 'bg-primary text-on-primary rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
                : 'bg-surface-container-lowest text-on-surface border border-outline-variant/[0.08] rounded-2xl rounded-br-sm px-3.5 py-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
          }`}
          onDoubleClick={() => !message.isDeleted && setShowReactions((s) => !s)}
        >
          {message.isDeleted ? (
            <p className="flex items-center gap-1.5">
              <Ban size={12} className="shrink-0" /> {tp('chatDeletedMsg')}
            </p>
          ) : message.type === 'IMAGE' && message.mediaUrl ? (
            <div className="-mx-1 -mt-0.5">
              <Image
                src={message.mediaUrl}
                alt={tp('chatImageAlt')}
                width={300}
                height={200}
                className="rounded-xl max-w-full max-h-72 object-cover cursor-pointer hover:brightness-[0.97] transition-all"
                onClick={() => window.open(message.mediaUrl!, '_blank')}
                unoptimized
              />
            </div>
          ) : message.type === 'AUDIO' && message.mediaUrl ? (
            <AudioPlayer src={message.mediaUrl} />
          ) : (
            <p className="text-[13.5px] leading-[1.6] whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {isMine && !message.isDeleted && !message.id.startsWith('temp-') && (
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              className="absolute top-1.5 start-1.5 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-black/10 hover:bg-black/20 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
              aria-label={tp('chatDeleteMessageAria')}
            >
              <Trash2 size={11} className="text-white" />
            </button>
          )}
        </div>

        {!message.isDeleted &&
          (isMine ? (
            <div className="flex items-center justify-start gap-1 mt-0.5 px-1">
              <span className="text-[10px] text-on-surface-variant/40 tabular-nums">{timeDisplay}</span>
              <span
                className={`material-symbols-outlined text-sm leading-none ${statusUi.color}`}
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                {statusUi.icon}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-on-surface-variant/40 mt-0.5 px-1 block tabular-nums">{timeDisplay}</span>
          ))}

        {hasReactions && (
          <div className={`flex gap-1 absolute -bottom-3 ${isMine ? 'end-2' : 'start-2'}`}>
            {Object.entries(groupedReactions).map(([emoji, count]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(message.id, emoji)}
                className="bg-surface-container-lowest rounded-full px-1.5 py-0.5 text-[12px] shadow-md ring-1 ring-outline-variant/[0.06] hover:ring-primary/20 transition-all flex items-center gap-0.5 hover:scale-110 active:scale-95"
              >
                {emoji}
                {count > 1 && <span className="text-[9px] font-bold text-on-surface-variant/50">{count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
