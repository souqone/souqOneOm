import { calculatePhoneStats, isLocalDatabase, extractCountryCode } from '../../../scripts/analyze-phones';

describe('analyze-phones script', () => {
  describe('isLocalDatabase', () => {
    it('returns true for localhost, 127.0.0.1, and ::1', () => {
      expect(isLocalDatabase('postgresql://user:pass@localhost:5432/db')).toBe(true);
      expect(isLocalDatabase('postgresql://user:pass@127.0.0.1:5432/db')).toBe(true);
      expect(isLocalDatabase('postgresql://user:pass@[::1]:5432/db')).toBe(true);
    });

    it('returns false for remote database hosts or invalid URLs', () => {
      expect(isLocalDatabase('postgresql://user:pass@roundhouse.proxy.rlwy.net:12345/db')).toBe(false);
      expect(isLocalDatabase('postgresql://user:pass@aws.rds.amazonaws.com:5432/db')).toBe(false);
      expect(isLocalDatabase(undefined)).toBe(false);
      expect(isLocalDatabase('not-a-url')).toBe(false);
    });
  });

  describe('extractCountryCode', () => {
    it('correctly extracts country codes', () => {
      expect(extractCountryCode('+96891234567')).toBe('968');
      expect(extractCountryCode('+971501234567')).toBe('971');
      expect(extractCountryCode('+201012345678')).toBe('20');
      expect(extractCountryCode('+447911123456')).toBe('44');
      expect(extractCountryCode('+14155552671')).toBe('1');
      expect(extractCountryCode('12345')).toBeNull();
    });
  });

  describe('calculatePhoneStats', () => {
    it('accurately counts user categories without exposing any personal information', () => {
      const mockRecords = [
        { phone: null },
        { phone: undefined },
        { phone: '' },
        { phone: '   ' },
        // Valid Oman E.164 (3 records, 2 unique, one duplicate)
        { phone: '+96891234567' },
        { phone: '+96891234567' },
        { phone: '+96871234567' },
        // Bare 8-digit local
        { phone: '91234567' },
        { phone: '71234567' },
        // Other countries (Egypt, UAE)
        { phone: '+201012345678' },
        { phone: '00201012345678' },
        { phone: '+971501234567' },
        // Invalid
        { phone: 'not-a-phone' },
        { phone: '+96824123456' }, // Oman landline with +968
        { phone: '12345' },
      ];

      const stats = calculatePhoneStats(mockRecords);

      expect(stats.totalUsers).toBe(15);
      expect(stats.nullOrEmptyCount).toBe(4);
      expect(stats.validOmanE164Count).toBe(3);
      expect(stats.bareEightDigitCount).toBe(2);
      expect(stats.otherCountriesCount['20']).toBe(2);
      expect(stats.otherCountriesCount['971']).toBe(1);
      expect(stats.invalidPhoneCount).toBe(3);

      // Duplicates: '+96891234567' appears 2 times
      expect(stats.duplicateGroups.totalDuplicateGroups).toBe(1);
      expect(stats.duplicateGroups.distribution[2]).toBe(1);
    });

    it('handles an empty record set', () => {
      const stats = calculatePhoneStats([]);
      expect(stats.totalUsers).toBe(0);
      expect(stats.nullOrEmptyCount).toBe(0);
      expect(stats.validOmanE164Count).toBe(0);
      expect(stats.bareEightDigitCount).toBe(0);
      expect(stats.invalidPhoneCount).toBe(0);
      expect(stats.duplicateGroups.totalDuplicateGroups).toBe(0);
    });
  });
});
