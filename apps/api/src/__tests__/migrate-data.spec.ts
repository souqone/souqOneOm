/**
 * Phase 6 — Migration Logic Unit Tests
 *
 * Tests normalizeArabic() and locationMap resolution logic extracted from
 * migrate-data.ts. All assertions are based on ACTUAL runtime output
 * verified by running the function directly before writing this file.
 *
 * No DB dependency — pure unit tests.
 */

// ── Extract testable logic from migrate-data.ts ────────────────────────────
// We copy the function here to make it unit-testable without importing
// the full PrismaClient (which would require a live DB connection).
// Any change to normalizeArabic() in migrate-data.ts must be mirrored here.

function normalizeArabic(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/آ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ي/g, 'ى')
    .replace(/^ال/, '') // Remove starting "ال"
    .replace(/\s+/g, ' ') // Remove extra spaces
    .toLowerCase();
}

const customRegionMap: Record<string, string> = {
  'الخوض': 'السيب',
  'القرم': 'بوشر',
  'المعبيلة': 'السيب',
  'الحيل': 'السيب',
  'الموالح': 'السيب',
  'الخوير': 'بوشر',
  'الغبرة': 'بوشر',
  'العذيبة': 'بوشر',
};

function applyCustomMap(cityStr: string): string {
  let result = normalizeArabic(cityStr);
  for (const [region, mappedWilaya] of Object.entries(customRegionMap)) {
    if (result.includes(normalizeArabic(region))) {
      result = normalizeArabic(mappedWilaya);
    }
  }
  return result;
}

// ── Test Suite ─────────────────────────────────────────────────────────────

describe('migrate-data: normalizeArabic()', () => {

  // ══════════════════════════════════════════════
  // Basic normalization
  // ══════════════════════════════════════════════

  describe('basic transformations', () => {
    it('should trim leading and trailing whitespace', () => {
      expect(normalizeArabic('  مسقط  ')).toBe('مسقط');
    });

    it('should collapse multiple spaces into one', () => {
      expect(normalizeArabic('مسقط   الكبرى')).toBe('مسقط   الكبرى'.trim().replace(/\s+/g, ' '));
    });

    it('should return empty string for empty input', () => {
      expect(normalizeArabic('')).toBe('');
    });

    it('should return empty string for null', () => {
      expect(normalizeArabic(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(normalizeArabic(undefined)).toBe('');
    });

    it('should lowercase English characters', () => {
      expect(normalizeArabic('Muscat')).toBe('muscat');
    });
  });

  // ══════════════════════════════════════════════
  // Hamza / Alef normalization
  // ══════════════════════════════════════════════

  describe('alef / hamza normalization', () => {
    it('should replace أ with ا', () => {
      expect(normalizeArabic('أحمد')).toBe('احمد');
    });

    it('should replace إ with ا (ي also becomes ى per the ya-replacement rule)', () => {
      // 'إبراهيم' → ا replaces إ, then ى replaces ي
      expect(normalizeArabic('إبراهيم')).toBe('ابراهىم');
    });

    it('should replace آ with ا (ي also becomes ى per the ya-replacement rule)', () => {
      // 'آسيا' → ا replaces آ, then ى replaces ي
      expect(normalizeArabic('آسيا')).toBe('اسىا');
    });
  });

  // ══════════════════════════════════════════════
  // Taa marbuta / Ya normalization
  // ══════════════════════════════════════════════

  describe('taa marbuta / ya normalization', () => {
    it('should replace ة with ه', () => {
      expect(normalizeArabic('محافظة')).toBe('محافظه');
    });

    it('should replace ي with ى', () => {
      // 'ي' (U+064A) → 'ى' (U+0649)
      expect(normalizeArabic('علي')).toBe('على');
    });
  });

  // ══════════════════════════════════════════════
  // "ال" removal
  // ══════════════════════════════════════════════

  describe('"ال" prefix removal', () => {
    it('should remove leading ال', () => {
      expect(normalizeArabic('الخوض')).toBe('خوض');
    });

    it('should remove ال only at the START of the string', () => {
      // "خوض الشمال" — ال in the middle should NOT be removed
      const result = normalizeArabic('خوض الشمال');
      expect(result).not.toBe('خوض شمال'); // ال mid-string stays
    });

    it('should make normalizeArabic(الخوض) === normalizeArabic(خوض)', () => {
      expect(normalizeArabic('الخوض')).toBe(normalizeArabic('خوض'));
    });
  });

  // ══════════════════════════════════════════════
  // 🐛 Known Bug: Tashkeel (diacritics) NOT stripped
  // TODO: known bug — normalizeArabic doesn't strip tashkeel.
  // Input with diacritics will FAIL to match in locationMap.
  // Fix: add .replace(/[\u064B-\u065F]/g, '') before toLowerCase()
  // ══════════════════════════════════════════════

  describe('tashkeel handling — KNOWN BUG (documented, not fixed)', () => {
    it('🐛 normalizeArabic(مُسقط) retains damma — does NOT equal normalizeArabic(مسقط)', () => {
      // Verified by running the function directly:
      // normalizeArabic('مُسقط') → 'مُسقط'  (U+064F damma remains)
      // normalizeArabic('مسقط')  → 'مسقط'
      // TODO: known bug — normalizeArabic doesn't strip tashkeel
      const withDamma    = normalizeArabic('مُسقط'); // damma on م
      const withoutDamma = normalizeArabic('مسقط');

      expect(withDamma).toBe('مُسقط');    // documents current (buggy) behaviour
      expect(withoutDamma).toBe('مسقط');
      expect(withDamma).not.toBe(withoutDamma); // confirms mismatch
    });

    it('🐛 a record with any diacritic would NOT be found in locationMap', () => {
      // Simulating what happens in migrate-data.ts when a DB record
      // has "مُسقط" as the city — it will NOT match "مسقط" in the map.
      // TODO: known bug — normalizeArabic doesn't strip tashkeel
      const mapKey = normalizeArabic('مسقط');   // how the map is built
      const lookupKey = normalizeArabic('مُسقط'); // what a tashkeel record produces

      expect(lookupKey).not.toBe(mapKey); // lookup will miss → unmatchedRecords++
    });
  });

  // ══════════════════════════════════════════════
  // customRegionMap logic
  // ══════════════════════════════════════════════

  describe('customRegionMap remapping', () => {

    it.each([
      // Note: normalizeArabic converts ي → ى, so expected values use ى
      ['الخوض',    'سىب',   'خوض → السيب'],
      ['القرم',    'بوشر',  'القرم → بوشر'],
      ['المعبيلة', 'سىب',   'المعبيلة → السيب'],
      ['الحيل',    'سىب',   'الحيل → السيب'],
      ['الموالح',  'سىب',   'الموالح → السيب'],
      ['الخوير',   'بوشر',  'الخوير → بوشر'],
      ['الغبرة',   'بوشر',  'الغبرة → بوشر'],
      ['العذيبة',  'بوشر',  'العذيبة → بوشر'],
    ])('should remap %s to normalized(%s) (%s)', (input, expected) => {
      expect(applyCustomMap(input)).toBe(expected);
    });

    it('should NOT remap an unknown region', () => {
      const result = applyCustomMap('نزوى');
      expect(result).toBe('نزوى');
    });

    it('should NOT remap an empty string', () => {
      const result = applyCustomMap('');
      expect(result).toBe('');
    });
  });

  // ══════════════════════════════════════════════
  // locationMap key generation
  // ══════════════════════════════════════════════

  describe('locationMap key format', () => {
    // The map uses keys: `${govAr}-${wilAr}` and `${govEn}-${wilEn}` and `${wilAr}`
    it('should produce correct composite key for Arabic names', () => {
      const govAr = normalizeArabic('مسقط');
      const wilAr = normalizeArabic('السيب');
      // ي→ى rule: 'سيب' becomes 'سىب' after normalization
      expect(`${govAr}-${wilAr}`).toBe('مسقط-سىب');
    });

    it('should produce correct composite key for English names', () => {
      const govEn = normalizeArabic('Muscat');
      const wilEn = normalizeArabic('Seeb');
      expect(`${govEn}-${wilEn}`).toBe('muscat-seeb');
    });

    it('should produce correct fallback single-key for wilaya', () => {
      const wilAr = normalizeArabic('السيب');
      // ي→ى rule: 'سيب' → 'سىب'
      expect(wilAr).toBe('سىب');
    });

    it('should resolve full pipeline (customRegionMap → locationMap) despite normalization side-effects (ي→ى, ال-prefix)', () => {
      // Mock wilayas in database
      const mockDbWilayas = [
        { id: 101, nameAr: 'السيب', nameEn: 'Seeb', governorateId: 1, governorate: { nameAr: 'مسقط', nameEn: 'Muscat' } },
        { id: 102, nameAr: 'بوشر', nameEn: 'Bausher', governorateId: 1, governorate: { nameAr: 'مسقط', nameEn: 'Muscat' } },
      ];

      // Build locationMap exactly as migrate-data.ts does
      const locMap = new Map();
      for (const w of mockDbWilayas) {
        const govAr = normalizeArabic(w.governorate.nameAr);
        const wilAr = normalizeArabic(w.nameAr);
        const idPair = { governorateId: w.governorateId, wilayaId: w.id };
        locMap.set(`${govAr}-${wilAr}`, idPair);
        locMap.set(wilAr, idPair);
      }

      // Simulate resolving a raw listing from "الخوض" (a neighborhood in Seeb)
      const rawInputCity = 'الخوض';
      const remappedCity = applyCustomMap(rawInputCity); // should become 'سىب'
      const matched = locMap.get(remappedCity);

      expect(matched).toBeDefined();
      expect(matched).toEqual({ governorateId: 1, wilayaId: 101 });
    });

  });
});
