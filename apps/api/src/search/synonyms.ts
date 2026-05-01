/**
 * Arabic ↔ English synonyms for Meilisearch.
 * Covers car brands, common search terms, and abbreviations.
 * Format: each key maps to an array of equivalent terms.
 */
export const BRAND_SYNONYMS: Record<string, string[]> = {
  // ── Popular Brands ──
  'Toyota': ['تويوتا', 'toyota'],
  'Nissan': ['نيسان', 'nissan'],
  'Lexus': ['لكزس', 'lexus'],
  'Land Rover': ['لاند روفر', 'land rover', 'لاندروفر'],
  'Mercedes-Benz': ['مرسيدس', 'مرسيدس بنز', 'mercedes', 'benz', 'مرسدس'],
  'BMW': ['بي إم دبليو', 'بي ام دبليو', 'bmw', 'بيم'],
  'Honda': ['هوندا', 'honda'],
  'Hyundai': ['هيونداي', 'hyundai', 'هيونداى'],
  'Kia': ['كيا', 'kia'],
  'Ford': ['فورد', 'ford'],
  'Chevrolet': ['شيفروليه', 'شيفروله', 'chevrolet', 'chevy'],
  'GMC': ['جي إم سي', 'جي ام سي', 'gmc'],
  'Audi': ['أودي', 'audi'],
  'Porsche': ['بورشه', 'بورش', 'porsche'],
  'Mitsubishi': ['ميتسوبيشي', 'ميتسوبشي', 'mitsubishi'],

  // ── Global Brands ──
  'Volkswagen': ['فولكس فاجن', 'فولكس', 'volkswagen', 'vw'],
  'Mazda': ['مازدا', 'mazda'],
  'Subaru': ['سوبارو', 'subaru'],
  'Suzuki': ['سوزوكي', 'suzuki'],
  'Jeep': ['جيب', 'jeep'],
  'Dodge': ['دودج', 'dodge'],
  'RAM': ['رام', 'ram'],
  'Cadillac': ['كاديلاك', 'cadillac'],
  'Lincoln': ['لينكولن', 'lincoln'],
  'Infiniti': ['إنفينيتي', 'انفينيتي', 'infiniti'],
  'Volvo': ['فولفو', 'volvo'],
  'Jaguar': ['جاكوار', 'جاغوار', 'jaguar'],
  'Maserati': ['مازيراتي', 'maserati'],

  // ── Luxury / Sports ──
  'Ferrari': ['فيراري', 'ferrari'],
  'Lamborghini': ['لامبورغيني', 'لمبرجيني', 'lamborghini'],
  'Bentley': ['بنتلي', 'bentley'],
  'Rolls-Royce': ['رولز رويس', 'rolls royce', 'رولز'],
  'Aston Martin': ['أستون مارتن', 'aston martin'],
  'McLaren': ['ماكلارين', 'mclaren'],

  // ── Electric / Chinese ──
  'Tesla': ['تسلا', 'tesla'],
  'BYD': ['بي واي دي', 'byd'],
  'Changan': ['شانجان', 'changan'],
  'Geely': ['جيلي', 'geely'],
  'Haval': ['هافال', 'haval'],
  'Chery': ['شيري', 'chery'],
  'MG': ['إم جي', 'ام جي', 'mg'],
  'Tank': ['تانك', 'tank'],
  'Jetour': ['جيتور', 'jetour'],
  'GAC': ['جي أيه سي', 'gac'],
  'Great Wall': ['جريت وول', 'great wall'],

  // ── Korean ──
  'Genesis': ['جينيسيس', 'genesis'],
  'SsangYong': ['سانج يونج', 'ssangyong'],
};

/**
 * Common search term synonyms (non-brand).
 */
export const GENERAL_SYNONYMS: Record<string, string[]> = {
  // Listing types
  'بيع': ['للبيع', 'sale', 'sell'],
  'إيجار': ['ايجار', 'تأجير', 'rent', 'rental'],

  // Conditions
  'جديد': ['جديدة', 'new', 'زيرو'],
  'مستعمل': ['مستعملة', 'used', 'يوزد'],

  // Vehicle types
  'سيارة': ['سيارات', 'car', 'cars', 'vehicle'],
  'جيب': ['دفع رباعي', 'SUV', 'suv', '4x4'],
  'شاحنة': ['شاحنات', 'truck', 'بيك أب', 'pickup'],
  'فان': ['ميني فان', 'van', 'minivan'],
  'باص': ['حافلة', 'bus'],

  // Parts
  'قطع غيار': ['قطع', 'spare parts', 'parts'],
  'محرك': ['ماكينة', 'engine', 'motor'],
  'فرامل': ['بريك', 'brakes'],
  'إطارات': ['كفرات', 'تواير', 'tires', 'tyres'],
  'بطارية': ['بطاريات', 'battery'],

  // Services
  'صيانة': ['تصليح', 'إصلاح', 'maintenance', 'repair'],
  'تلميع': ['بوليش', 'تنظيف', 'polish', 'cleaning'],
  'سمكرة': ['دهان', 'bodywork', 'paint'],
  'سطحة': ['ونش', 'نجدة', 'towing'],

  // Transport
  'نقل': ['شحن', 'transport', 'shipping'],
  'توصيل': ['delivery'],

};

/**
 * Build the Meilisearch synonyms object (bidirectional).
 * Returns Record<string, string[]> suitable for index.updateSynonyms().
 */
export function buildSynonymsMap(): Record<string, string[]> {
  const synonyms: Record<string, string[]> = {};

  const allMaps = { ...BRAND_SYNONYMS, ...GENERAL_SYNONYMS };

  for (const [key, equivalents] of Object.entries(allMaps)) {
    // All terms (key + equivalents) are synonyms of each other
    const allTerms = [key.toLowerCase(), ...equivalents.map(e => e.toLowerCase())];
    const unique = [...new Set(allTerms)];

    for (const term of unique) {
      const others = unique.filter(t => t !== term);
      if (others.length > 0) {
        // Merge with any existing synonyms for this term
        const existing = synonyms[term] || [];
        synonyms[term] = [...new Set([...existing, ...others])];
      }
    }
  }

  return synonyms;
}
