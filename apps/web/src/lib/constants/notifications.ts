'use client';

import {
  MessageCircle, ShoppingBag, Heart, Tag, AlertCircle,
  CheckCheck, Briefcase, Bell, type LucideIcon,
} from 'lucide-react';
import { createElement } from 'react';

export interface NotifTypeConfig {
  icon: LucideIcon;
  bg: string;
  text: string;
  strip: string;
  border: string;
  labelKey: string;
  navigateTo: (data: Record<string, any> | null) => string | null;
}

export const NOTIFICATION_TYPE_CONFIG: Record<string, NotifTypeConfig> = {
  MESSAGE: {
    icon: MessageCircle,
    bg: 'bg-primary/10',
    text: 'text-primary',
    strip: 'bg-primary',
    border: 'border-primary/20',
    labelKey: 'notifTypeMessage',
    navigateTo: (d) => (d?.conversationId ? `/messages/${d.conversationId}` : null),
  },
  LISTING_SOLD: {
    icon: ShoppingBag,
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    strip: 'bg-green-500',
    border: 'border-green-200',
    labelKey: 'notifTypeSold',
    navigateTo: (d) => (d?.listingId ? `/sale/car/${d.listingId}` : null),
  },
  LISTING_FAVORITED: {
    icon: Heart,
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    strip: 'bg-red-500',
    border: 'border-red-200',
    labelKey: 'notifTypeFavorite',
    navigateTo: (d) => (d?.listingId ? `/sale/car/${d.listingId}` : null),
  },
  PRICE_DROP: {
    icon: Tag,
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    strip: 'bg-orange-500',
    border: 'border-orange-200',
    labelKey: 'notifTypePriceDrop',
    navigateTo: (d) => (d?.listingId ? `/sale/car/${d.listingId}` : null),
  },
  SYSTEM: {
    icon: AlertCircle,
    bg: 'bg-surface-container-high',
    text: 'text-on-surface-variant',
    strip: 'bg-outline-variant',
    border: 'border-outline-variant/30',
    labelKey: 'notifTypeSystem',
    navigateTo: () => null,
  },
  JOB_APPLICATION: {
    icon: Briefcase,
    bg: 'bg-violet-500/10',
    text: 'text-violet-600',
    strip: 'bg-violet-500',
    border: 'border-violet-200',
    labelKey: 'notifTypeJobApplication',
    navigateTo: (d) => (d?.jobId ? `/jobs/${d.jobId}` : null),
  },
  JOB_APPLICATION_ACCEPTED: {
    icon: CheckCheck,
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    strip: 'bg-green-500',
    border: 'border-green-200',
    labelKey: 'notifTypeJobAccepted',
    navigateTo: (d) => (d?.jobId ? `/jobs/${d.jobId}` : null),
  },
  JOB_APPLICATION_REJECTED: {
    icon: AlertCircle,
    bg: 'bg-error/10',
    text: 'text-error',
    strip: 'bg-error',
    border: 'border-error/20',
    labelKey: 'notifTypeJobRejected',
    navigateTo: (d) => (d?.jobId ? `/jobs/${d.jobId}` : null),
  },
  JOB_RECOMMENDATION: {
    icon: Briefcase,
    bg: 'bg-violet-500/10',
    text: 'text-violet-600',
    strip: 'bg-violet-500',
    border: 'border-violet-200',
    labelKey: 'notifTypeJobRecommendation',
    navigateTo: (d) => (d?.jobId ? `/jobs/${d.jobId}` : '/jobs'),
  },
  TRANSPORT_QUOTE_RECEIVED: {
    icon: Tag,
    bg: 'bg-teal-500/10',
    text: 'text-teal-600',
    strip: 'bg-teal-500',
    border: 'border-teal-200',
    labelKey: 'notifTypeTransport',
    navigateTo: (d) => (d?.requestId ? `/transport/requests/${d.requestId}` : '/transport/my-requests'),
  },
  TRANSPORT_QUOTE_ACCEPTED: {
    icon: CheckCheck,
    bg: 'bg-teal-500/10',
    text: 'text-teal-600',
    strip: 'bg-teal-500',
    border: 'border-teal-200',
    labelKey: 'notifTypeTransport',
    navigateTo: (d) => (d?.bookingId ? `/transport/bookings/${d.bookingId}` : '/transport/my-bookings'),
  },
  TRANSPORT_QUOTE_REJECTED: {
    icon: AlertCircle,
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    strip: 'bg-orange-500',
    border: 'border-orange-200',
    labelKey: 'notifTypeTransport',
    navigateTo: (d) => (d?.requestId ? `/transport/requests/${d.requestId}` : '/transport/my-quotes'),
  },
  TRANSPORT_BOOKING_CONFIRMED: {
    icon: CheckCheck,
    bg: 'bg-teal-500/10',
    text: 'text-teal-600',
    strip: 'bg-teal-500',
    border: 'border-teal-200',
    labelKey: 'notifTypeTransport',
    navigateTo: (d) => (d?.bookingId ? `/transport/bookings/${d.bookingId}` : '/transport/my-requests'),
  },
  TRANSPORT_BOOKING_CANCELLED: {
    icon: AlertCircle,
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    strip: 'bg-orange-500',
    border: 'border-orange-200',
    labelKey: 'notifTypeTransport',
    navigateTo: (d) => (d?.bookingId ? `/transport/bookings/${d.bookingId}` : '/transport/my-requests'),
  },
  TRANSPORT_REQUEST_CLOSED: {
    icon: CheckCheck,
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    strip: 'bg-green-500',
    border: 'border-green-200',
    labelKey: 'notifTypeTransport',
    navigateTo: (d) => (d?.bookingId ? `/transport/bookings/${d.bookingId}` : '/transport/my-requests'),
  },
  TRANSPORT_REQUEST_CANCELLED: {
    icon: AlertCircle,
    bg: 'bg-error/10',
    text: 'text-error',
    strip: 'bg-error',
    border: 'border-error/20',
    labelKey: 'notifTypeTransport',
    navigateTo: (d) => (d?.requestId ? `/transport/requests/${d.requestId}` : '/transport/my-quotes'),
  },
  TRANSPORT_REQUEST_EXPIRED: {
    icon: AlertCircle,
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    strip: 'bg-orange-500',
    border: 'border-orange-200',
    labelKey: 'notifTypeTransport',
    navigateTo: (d) => (d?.requestId ? `/transport/requests/${d.requestId}` : '/transport/my-requests'),
  },
};

export const DEFAULT_NOTIF_CONFIG: NotifTypeConfig = {
  icon: Bell,
  bg: 'bg-surface-container-high',
  text: 'text-on-surface-variant',
  strip: 'bg-outline-variant',
  border: 'border-outline-variant/30',
  labelKey: 'notifTypeOther',
  navigateTo: () => null,
};

export function getNotifConfig(type: string): NotifTypeConfig {
  return NOTIFICATION_TYPE_CONFIG[type] ?? DEFAULT_NOTIF_CONFIG;
}

export function renderNotifIcon(cfg: NotifTypeConfig, size = 16) {
  return createElement(cfg.icon, { size });
}
