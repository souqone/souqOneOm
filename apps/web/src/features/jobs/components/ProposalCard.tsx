'use client';
import React, { useState } from 'react';
import { CheckCircle, X, RotateCcw, Lock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { JobApplication } from '../types';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, STRINGS } from '../constants';
import { timeAgo, getInitials, getAvatarColor, cn } from '@/lib/utils';
import RatingBadges from './RatingBadges';

interface ProposalCardProps {
  application: JobApplication
  isJobOwner: boolean
  isOwnProposal: boolean
  isAuthenticated: boolean
  onAccept?: (id: string) => void | Promise<void>
  onReject?: (id: string) => void | Promise<void>
  onWithdraw?: (id: string) => void | Promise<void>
}

export default function ProposalCard({
  application,
  isJobOwner,
  isOwnProposal,
  isAuthenticated,
  onAccept,
  onReject,
  onWithdraw,
}: ProposalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  const canSeeAll = isJobOwner || isOwnProposal
  const statusColor = APPLICATION_STATUS_COLORS[application.status] ?? '#9ca3af'
  const statusLabel = APPLICATION_STATUS_LABELS[application.status] ?? application.status

  const displayName = application.driverProfile?.user.displayName
    ?? application.applicant?.displayName
    ?? 'مستخدم'
  const userId = application.applicantId

  const message = application.message ?? ''
  const isLongMessage = message.length > 120
  const previewMessage = isLongMessage && !expanded && !canSeeAll
    ? message.slice(0, 100) + '...'
    : message

  const handleAccept = async () => {
    if (!onAccept || accepting || rejecting) return
    setAccepting(true)
    try { await onAccept(application.id) } finally { setAccepting(false) }
  }

  const handleReject = async () => {
    if (!onReject || accepting || rejecting) return
    setRejecting(true)
    try { await onReject(application.id) } finally { setRejecting(false) }
  }

  const handleWithdraw = async () => {
    if (!onWithdraw || withdrawing) return
    setWithdrawing(true)
    try { await onWithdraw(application.id) } finally { setWithdrawing(false) }
  }

  return (
    <div className="card-base rounded-2xl p-4 transition-all duration-200 hover:shadow-card-hover">
      {/* Header: avatar + name + badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
            getAvatarColor(userId)
          )}>
            {getInitials(displayName)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-on-surface">{displayName}</span>
              {application.driverProfile?.isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600">
                  <CheckCircle size={10} />
                  {STRINGS.VERIFIED}
                </span>
              )}
            </div>
            {application.driverProfile && (
              <RatingBadges
                rating={application.driverProfile.averageRating}
                completionRate={application.driverProfile.completionRate}
                responseTime={application.driverProfile.responseTimeHours}
                size="sm"
              />
            )}
          </div>
        </div>
        <span className="text-xs text-on-surface-variant shrink-0">
          {timeAgo(application.createdAt)}
        </span>
      </div>

      {/* Message / Partial Reveal */}
      <div className="mb-3">
        {canSeeAll ? (
          <p className="text-sm text-on-surface leading-relaxed">{message}</p>
        ) : isAuthenticated ? (
          <div>
            <p className="text-sm text-on-surface leading-relaxed">
              {previewMessage}
            </p>
            {isLongMessage && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 flex items-center gap-1 text-xs font-bold text-primary hover:underline transition-colors"
              >
                {expanded ? (
                  <><ChevronUp size={12} /> عرض أقل</>
                ) : (
                  <><ChevronDown size={12} /> اقرأ المزيد</>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant">
            <Lock size={14} className="text-on-surface-variant shrink-0" />
            <span className="text-sm text-on-surface-variant">سجّل دخول لعرض التفاصيل الكاملة</span>
          </div>
        )}
      </div>

      {/* Status + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="status-pill">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: statusColor }}
          />
          {statusLabel}
        </span>

        <div className="flex items-center gap-2">
          {isJobOwner && application.status === 'PENDING' && (
            <>
              <button
                onClick={handleAccept}
                disabled={accepting || rejecting}
                aria-label={`قبول عرض ${displayName}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed min-w-[4rem] justify-center"
              >
                {accepting
                  ? <Loader2 size={12} className="animate-spin" />
                  : <><CheckCircle size={13} />{STRINGS.ACCEPT}</>
                }
              </button>
              <button
                onClick={handleReject}
                disabled={accepting || rejecting}
                aria-label={`رفض عرض ${displayName}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-error hover:bg-red-100 transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed min-w-[4rem] justify-center"
              >
                {rejecting
                  ? <Loader2 size={12} className="animate-spin" />
                  : <><X size={13} />{STRINGS.REJECT}</>
                }
              </button>
            </>
          )}
          {isOwnProposal && application.status === 'PENDING' && (
            <button
              onClick={handleWithdraw}
              disabled={withdrawing}
              aria-label="سحب الطلب"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-surface text-on-surface-variant hover:bg-surface-dim transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {withdrawing
                ? <Loader2 size={12} className="animate-spin" />
                : <><RotateCcw size={13} />{STRINGS.WITHDRAW}</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
