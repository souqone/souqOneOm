'use client';

interface NotificationsHeroProps {
  unreadCount: number;
  filter: 'all' | 'unread';
  onFilterChange: (f: 'all' | 'unread') => void;
  onMarkAll: () => void;
  isMarkingAll: boolean;
  labels: {
    title: string;
    unreadSummary: string;
    allRead: string;
    all: string;
    unread: string;
    markAllRead: string;
    markingRead: string;
  };
}

export function NotificationsHero({
  unreadCount,
  filter,
  onFilterChange,
  onMarkAll,
  isMarkingAll,
  labels,
}: NotificationsHeroProps) {
  return (
    <div className="bg-gradient-to-bl from-[#004ac6] via-[#1d4ed8] to-[#0B2447] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h30v30H0zm30 30h30v30H30z\' fill=\'%23fff\' fill-opacity=\'.5\'/%3E%3C/svg%3E")', backgroundSize: '30px 30px' }} />
      <div className="relative max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-black text-white">{labels.title}</h1>
        <p className="text-white/70 text-sm mt-1">
          {unreadCount > 0
            ? labels.unreadSummary
            : labels.allRead
          }
        </p>

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <button
            onClick={() => onFilterChange('all')}
            className={`h-8 px-4 rounded-full text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-white text-primary shadow-sm'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            {labels.all}
          </button>
          <button
            onClick={() => onFilterChange('unread')}
            className={`h-8 px-4 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-white text-primary shadow-sm'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            {labels.unread}
            {unreadCount > 0 && (
              <span className="bg-primary text-on-primary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAll}
              disabled={isMarkingAll}
              className="ml-auto h-8 px-4 rounded-full text-xs font-bold bg-white/10 text-white/80 hover:bg-white/20 transition-all disabled:opacity-50"
            >
              {isMarkingAll ? labels.markingRead : labels.markAllRead}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
