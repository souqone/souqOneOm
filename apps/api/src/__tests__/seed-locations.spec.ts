/**
 * Phase 1 — Locations Seed Integrity & Regression Tests
 *
 * Tests the structural completeness and integrity of the Oman governorates and
 * wilayas seed dataset to prevent regressions (duplicate names, orphaned wilayas,
 * missing names, or altered counts).
 *
 * No DB dependency — pure unit tests on the canonical dataset.
 */

// Canonical dataset extracted from prisma/seed-locations.ts
const governoratesData = [
  {
    nameAr: 'مسقط',
    nameEn: 'Muscat',
    wilayas: [
      { nameAr: 'مسقط', nameEn: 'Muscat' },
      { nameAr: 'مطرح', nameEn: 'Muttrah' },
      { nameAr: 'بوشر', nameEn: 'Bawshar' },
      { nameAr: 'السيب', nameEn: 'Al Seeb' },
      { nameAr: 'العامرات', nameEn: 'Al Amerat' },
      { nameAr: 'قريات', nameEn: 'Qurayyat' },
    ],
  },
  {
    nameAr: 'ظفار',
    nameEn: 'Dhofar',
    wilayas: [
      { nameAr: 'صلالة', nameEn: 'Salalah' },
      { nameAr: 'طاقة', nameEn: 'Taqah' },
      { nameAr: 'مرباط', nameEn: 'Mirbat' },
      { nameAr: 'سدح', nameEn: 'Sadah' },
      { nameAr: 'ثمريت', nameEn: 'Thumrait' },
      { nameAr: 'ضلكوت', nameEn: 'Dhalkut' },
      { nameAr: 'رخيوت', nameEn: 'Rakhyut' },
      { nameAr: 'مقشن', nameEn: 'Muqshin' },
      { nameAr: 'شليم وجزر الحلانيات', nameEn: 'Shalim and the Hallaniyat Islands' },
      { nameAr: 'المزيونة', nameEn: 'Al Mazyunah' },
    ],
  },
  {
    nameAr: 'مسندم',
    nameEn: 'Musandam',
    wilayas: [
      { nameAr: 'خصب', nameEn: 'Khasab' },
      { nameAr: 'بخاء', nameEn: 'Bukha' },
      { nameAr: 'دباء', nameEn: 'Dibba' },
      { nameAr: 'مدحاء', nameEn: 'Madha' },
    ],
  },
  {
    nameAr: 'البريمي',
    nameEn: 'Al Buraimi',
    wilayas: [
      { nameAr: 'البريمي', nameEn: 'Al Buraimi' },
      { nameAr: 'محضة', nameEn: 'Mahdah' },
      { nameAr: 'السنينة', nameEn: 'Al Sunaynah' },
    ],
  },
  {
    nameAr: 'الداخلية',
    nameEn: 'Ad Dakhiliyah',
    wilayas: [
      { nameAr: 'نزوى', nameEn: 'Nizwa' },
      { nameAr: 'بهلاء', nameEn: 'Bahla' },
      { nameAr: 'منح', nameEn: 'Manah' },
      { nameAr: 'الحمراء', nameEn: 'Al Hamra' },
      { nameAr: 'أدم', nameEn: 'Adam' },
      { nameAr: 'إزكي', nameEn: 'Izki' },
      { nameAr: 'سمائل', nameEn: 'Samail' },
      { nameAr: 'بدبد', nameEn: 'Bidbid' },
      { nameAr: 'الجبل الأخضر', nameEn: 'Al Jabal Al Akhdar' },
    ],
  },
  {
    nameAr: 'شمال الباطنة',
    nameEn: 'Al Batinah North',
    wilayas: [
      { nameAr: 'صحار', nameEn: 'Sohar' },
      { nameAr: 'شناص', nameEn: 'Shinas' },
      { nameAr: 'لوى', nameEn: 'Liwa' },
      { nameAr: 'صحم', nameEn: 'Saham' },
      { nameAr: 'الخابورة', nameEn: 'Al Khaburah' },
      { nameAr: 'السويق', nameEn: 'Al Suwayq' },
    ],
  },
  {
    nameAr: 'جنوب الباطنة',
    nameEn: 'Al Batinah South',
    wilayas: [
      { nameAr: 'الرستاق', nameEn: 'Rustaq' },
      { nameAr: 'العوابي', nameEn: 'Al Awabi' },
      { nameAr: 'نخل', nameEn: 'Nakhal' },
      { nameAr: 'وادي المعاول', nameEn: 'Wadi Al Maawil' },
      { nameAr: 'بركاء', nameEn: 'Barka' },
      { nameAr: 'المصنعة', nameEn: 'Al Musanaah' },
    ],
  },
  {
    nameAr: 'جنوب الشرقية',
    nameEn: 'Ash Sharqiyah South',
    wilayas: [
      { nameAr: 'صور', nameEn: 'Sur' },
      { nameAr: 'الكامل والوافي', nameEn: 'Al Kamil Wal Wafi' },
      { nameAr: 'جعلان بني بو حسن', nameEn: 'Jalan Bani Bu Hassan' },
      { nameAr: 'جعلان بني بو علي', nameEn: 'Jalan Bani Bu Ali' },
      { nameAr: 'مصيرة', nameEn: 'Masirah' },
    ],
  },
  {
    nameAr: 'شمال الشرقية',
    nameEn: 'Ash Sharqiyah North',
    wilayas: [
      { nameAr: 'إبراء', nameEn: 'Ibra' },
      { nameAr: 'المضيبي', nameEn: 'Al Mudhaibi' },
      { nameAr: 'بدية', nameEn: 'Bidiya' },
      { nameAr: 'القابل', nameEn: 'Al Qabil' },
      { nameAr: 'وادي بني خالد', nameEn: 'Wadi Bani Khalid' },
      { nameAr: 'دماء والطائيين', nameEn: 'Dima W\'attayeen' },
      { nameAr: 'سناو', nameEn: 'Sinaw' },
    ],
  },
  {
    nameAr: 'الظاهرة',
    nameEn: 'Ad Dhahirah',
    wilayas: [
      { nameAr: 'عبري', nameEn: 'Ibri' },
      { nameAr: 'ينقل', nameEn: 'Yanqul' },
      { nameAr: 'ضنك', nameEn: 'Dhank' },
    ],
  },
  {
    nameAr: 'الوسطى',
    nameEn: 'Al Wusta',
    wilayas: [
      { nameAr: 'هيما', nameEn: 'Haima' },
      { nameAr: 'محوت', nameEn: 'Mahout' },
      { nameAr: 'الدقم', nameEn: 'Duqm' },
      { nameAr: 'الجازر', nameEn: 'Al Jazir' },
    ],
  },
];

describe('Seed Locations Data Integrity (Regression Suite)', () => {
  const allWilayas = governoratesData.flatMap((g) =>
    g.wilayas.map((w) => ({ ...w, parentGovernorateAr: g.nameAr, parentGovernorateEn: g.nameEn })),
  );

  // ══════════════════════════════════════════════
  // Spec 1.1: Exact Counts
  // ══════════════════════════════════════════════

  describe('Total counts matching specification', () => {
    it('should have exactly 11 governorates', () => {
      expect(governoratesData.length).toBe(11);
    });

    it('should have exactly 63 wilayas across all governorates', () => {
      expect(allWilayas.length).toBe(63);
    });

    it.each([
      ['مسقط', 'Muscat', 6],
      ['ظفار', 'Dhofar', 10],
      ['مسندم', 'Musandam', 4],
      ['البريمي', 'Al Buraimi', 3],
      ['الداخلية', 'Ad Dakhiliyah', 9],
      ['شمال الباطنة', 'Al Batinah North', 6],
      ['جنوب الباطنة', 'Al Batinah South', 6],
      ['جنوب الشرقية', 'Ash Sharqiyah South', 5],
      ['شمال الشرقية', 'Ash Sharqiyah North', 7],
      ['الظاهرة', 'Ad Dhahirah', 3],
      ['الوسطى', 'Al Wusta', 4],
    ])('governorate %s (%s) should contain exactly %i wilayas', (nameAr, nameEn, expectedCount) => {
      const gov = governoratesData.find((g) => g.nameAr === nameAr && g.nameEn === nameEn);
      expect(gov).toBeDefined();
      expect(gov?.wilayas.length).toBe(expectedCount);
    });
  });

  // ══════════════════════════════════════════════
  // Spec 1.2: No Duplicates
  // ══════════════════════════════════════════════

  describe('Uniqueness constraints (no duplicates)', () => {
    it('should not contain duplicate Arabic governorate names', () => {
      const names = governoratesData.map((g) => g.nameAr);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });

    it('should not contain duplicate English governorate names', () => {
      const names = governoratesData.map((g) => g.nameEn);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });

    it('should not contain duplicate Arabic wilaya names', () => {
      const names = allWilayas.map((w) => w.nameAr);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });

    it('should not contain duplicate English wilaya names', () => {
      const names = allWilayas.map((w) => w.nameEn);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });
  });

  // ══════════════════════════════════════════════
  // Spec 1.3: No Empty / Whitespace-only values
  // ══════════════════════════════════════════════

  describe('Non-empty field validation', () => {
    it('should have non-empty nameAr and nameEn for all governorates', () => {
      for (const g of governoratesData) {
        expect(g.nameAr.trim().length).toBeGreaterThan(0);
        expect(g.nameEn.trim().length).toBeGreaterThan(0);
      }
    });

    it('should have non-empty nameAr and nameEn for all wilayas', () => {
      for (const w of allWilayas) {
        expect(w.nameAr.trim().length).toBeGreaterThan(0);
        expect(w.nameEn.trim().length).toBeGreaterThan(0);
      }
    });
  });

  // ══════════════════════════════════════════════
  // Spec 1.4: No Orphaned Wilayas
  // ══════════════════════════════════════════════

  describe('Relational integrity (no orphaned wilayas)', () => {
    it('every wilaya must belong to an existing parent governorate', () => {
      const govArSet = new Set(governoratesData.map((g) => g.nameAr));
      for (const w of allWilayas) {
        expect(govArSet.has(w.parentGovernorateAr)).toBe(true);
      }
    });
  });
});
