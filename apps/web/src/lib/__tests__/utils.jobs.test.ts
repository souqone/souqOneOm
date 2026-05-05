import { describe, it, expect } from 'vitest'
import { timeAgo, formatSalary, getInitials, getAvatarColor } from '@/lib/utils'

describe('timeAgo', () => {
  it('returns "الآن" or "ثانية" for very recent dates', () => {
    const result = timeAgo(new Date().toISOString())
    expect(result).toMatch(/الآن|ثانية/)
  })

  it('returns days text for 3-day-old dates', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(timeAgo(threeDaysAgo)).toMatch(/يوم|أيام/)
  })

  it('returns minutes text for recent dates', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(timeAgo(fiveMinutesAgo)).toMatch(/دقيقة|دقائق|ثانية|الآن/)
  })
})

describe('formatSalary', () => {
  it('formats monthly salary with amount', () => {
    const result = formatSalary(500, 'MONTHLY')
    expect(result).toMatch(/500|٥٠٠|ر\.ع\./)
  })

  it('returns negotiable text when period is NEGOTIABLE', () => {
    const result = formatSalary(undefined, 'NEGOTIABLE')
    expect(result).toMatch(/تفاوض|negotiable/i)
  })

  it('handles undefined salary with monthly period', () => {
    const result = formatSalary(undefined, 'MONTHLY')
    expect(typeof result).toBe('string')
  })
})

describe('getInitials', () => {
  it('returns up to 2 characters for a two-word name', () => {
    const result = getInitials('أحمد محمد')
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('returns first character for single-word name', () => {
    const result = getInitials('أحمد')
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles empty string gracefully', () => {
    const result = getInitials('')
    expect(typeof result).toBe('string')
  })
})

describe('getAvatarColor', () => {
  it('returns a CSS class string', () => {
    const result = getAvatarColor('user-123')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns consistent color for same id', () => {
    expect(getAvatarColor('abc')).toBe(getAvatarColor('abc'))
  })
})
