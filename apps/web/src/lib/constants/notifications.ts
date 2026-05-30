'use client';

import {
  MessageCircle, ShoppingBag, Heart, Tag, AlertCircle,
  CheckCheck, Briefcase, Bell, Star, CreditCard, PlusCircle, RefreshCw, Trash2, type LucideIcon,
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
    // Use data.url when the backend embeds a deep-link (e.g. driver verification)
    navigateTo: (d) => (d?.url as string) || null,
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
  REVIEW_RECEIVED: {
    icon: Star,
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-600',
    strip: 'bg-yellow-500',
    border: 'border-yellow-200',
    labelKey: 'notifTypeReview',
    navigateTo: (d) => {
      if (d?.bookingId) return `/transport/bookings/${d.bookingId}`;
      if (d?.entityType === 'DRIVER_PROFILE') return '/jobs';
      return '/notifications';
    },
  },
  FEATURED_EXPIRED: {
    icon: Tag,
    bg: 'bg-orange-500/10',
    text: 'text-orange-600',
    strip: 'bg-orange-500',
    border: 'border-orange-200',
    labelKey: 'notifTypeFeatured',
    navigateTo: (d) => {
      if (!d?.listingId) return '/profile';
      if (d.listingType === 'bus') return `/buses/${d.listingId}`;
      if (d.listingType === 'equipment') return `/equipment/${d.listingId}`;
      return `/sale/car/${d.listingId}`;
    },
  },
  PAYMENT_SUCCESS: {
    icon: CreditCard,
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    strip: 'bg-green-500',
    border: 'border-green-200',
    labelKey: 'notifTypePayment',
    navigateTo: () => '/profile',
  },
  SUBSCRIPTION_ACTIVATED: {
    icon: CreditCard,
    bg: 'bg-primary/10',
    text: 'text-primary',
    strip: 'bg-primary',
    border: 'border-primary/20',
    labelKey: 'notifTypePayment',
    navigateTo: () => '/profile',
  },
  JOB_APPLICATION_WITHDRAWN: {
    icon: Briefcase,
    bg: 'bg-surface-container-high',
    text: 'text-on-surface-variant',
    strip: 'bg-outline-variant',
    border: 'border-outline-variant/30',
    labelKey: 'notifTypeWithdrawal',
    navigateTo: (d) => (d?.jobId ? `/jobs/${d.jobId}` : '/jobs'),
  },
  // Listing lifecycle events — emitted via EventEmitter / listing-notification.listener.ts
  LISTING_CREATED: {
    icon: PlusCircle,
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    strip: 'bg-green-500',
    border: 'border-green-200',
    labelKey: 'notifTypeListingCreated',
    navigateTo: (d) => {
      if (!d?.listingId) return '/profile';
      if (d.entityType === 'BUS_LISTING') return `/buses/${d.listingId}`;
      if (d.entityType === 'EQUIPMENT_LISTING') return `/equipment/${d.listingId}`;
      return `/sale/car/${d.listingId}`;
    },
  },
  LISTING_UPDATED: {
    icon: RefreshCw,
    bg: 'bg-primary/10',
    text: 'text-primary',
    strip: 'bg-primary',
    border: 'border-primary/20',
    labelKey: 'notifTypeListingUpdated',
    navigateTo: (d) => {
      if (!d?.listingId) return '/profile';
      if (d.entityType === 'BUS_LISTING') return `/buses/${d.listingId}`;
      if (d.entityType === 'EQUIPMENT_LISTING') return `/equipment/${d.listingId}`;
      return `/sale/car/${d.listingId}`;
    },
  },
  LISTING_DELETED: {
    icon: Trash2,
    bg: 'bg-error/10',
    text: 'text-error',
    strip: 'bg-error',
    border: 'border-error/20',
    labelKey: 'notifTypeListingDeleted',
    navigateTo: () => '/profile',
  },
  LISTING_STATUS_CHANGED: {
    icon: RefreshCw,
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    strip: 'bg-orange-500',
    border: 'border-orange-200',
    labelKey: 'notifTypeListingStatus',
    navigateTo: (d) => {
      if (!d?.listingId) return '/profile';
      if (d.entityType === 'BUS_LISTING') return `/buses/${d.listingId}`;
      if (d.entityType === 'EQUIPMENT_LISTING') return `/equipment/${d.listingId}`;
      return `/sale/car/${d.listingId}`;
    },
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
