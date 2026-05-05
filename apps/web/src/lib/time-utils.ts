type TimeT = (key: string, values?: Record<string, number>) => string;

export function relativeTimeT(dateStr: string, t: TimeT, locale?: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return t('now');
  if (minutes < 60) return t('minutesAgo', { count: minutes });
  if (hours < 24) return t('hoursAgo', { count: hours });
  if (days === 1) return t('yesterday');
  if (days < 7) return t('daysAgo', { count: days });
  if (weeks === 1) return t('weekAgo');
  if (weeks < 4) return t('weeksAgo', { count: weeks });
  if (months === 1) return t('monthAgo');
  if (months < 12) return t('monthsAgo', { count: months });
  return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-OM-u-nu-latn');
}
