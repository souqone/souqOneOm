'use client'

import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import type { TransportBooking } from '../types'

interface BookingActionsProps {
  booking: TransportBooking
  userRole: 'shipper' | 'carrier' | 'other'
  onAction: (action: 'start' | 'complete' | 'cancel') => void
  isLoading: boolean
}

export function BookingActions({ booking, userRole, onAction, isLoading }: BookingActionsProps) {
  const t = useTranslations('transport')

  if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
    return null
  }

  return (
    <div className="flex flex-col gap-2 mt-4">
      {/* Carrier can start trip */}
      {userRole === 'carrier' && booking.status === 'ACCEPTED' && (
        <button
          onClick={() => onAction('start')}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-primary text-on-primary text-[14px] font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : (
            <>
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              {t('actions.startTrip')}
            </>
          )}
        </button>
      )}

      {/* Shipper can mark complete */}
      {userRole === 'shipper' && booking.status === 'IN_PROGRESS' && (
        <button
          onClick={() => onAction('complete')}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-green-600 text-white text-[14px] font-bold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : (
            <>
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {t('actions.completeTrip')}
            </>
          )}
        </button>
      )}

      {/* Carrier can also mark complete */}
      {userRole === 'carrier' && booking.status === 'IN_PROGRESS' && (
        <button
          onClick={() => onAction('complete')}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-green-600 text-white text-[14px] font-bold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : (
            <>
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {t('actions.completeTrip')}
            </>
          )}
        </button>
      )}

      {/* Both can cancel */}
      {(booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS') && (
        <button
          onClick={() => onAction('cancel')}
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl border border-red-300 text-red-600 text-[13px] font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {t('actions.cancelBooking')}
        </button>
      )}
    </div>
  )
}
