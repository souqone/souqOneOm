import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// A simple normalizer to match Arabic text despite common typos
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

async function main() {
  console.log('--- Starting Data Migration (Dry Run) ---');

  // 1. Load all Governorates and Wilayas to build a lookup table
  const wilayas = await prisma.wilaya.findMany({
    include: { governorate: true },
  });

  const locationMap = new Map();
  
  for (const w of wilayas) {
    const govAr = normalizeArabic(w.governorate.nameAr);
    const govEn = normalizeArabic(w.governorate.nameEn);
    const wilAr = normalizeArabic(w.nameAr);
    const wilEn = normalizeArabic(w.nameEn);

    // Save references to both Arabic and English forms for easier lookup
    const idPair = { governorateId: w.governorateId, wilayaId: w.id };
    locationMap.set(`${govAr}-${wilAr}`, idPair);
    locationMap.set(`${govEn}-${wilEn}`, idPair);
    // Also save just by wilaya name as fallback
    locationMap.set(wilAr, idPair);
    locationMap.set(wilEn, idPair);
  }

  // List of tables to migrate
  const tables = [
    { name: 'user', model: prisma.user },
    { name: 'listing', model: prisma.listing },
    { name: 'driverJob', model: prisma.driverJob },
    { name: 'driverProfile', model: prisma.driverProfile },
    { name: 'employerProfile', model: prisma.employerProfile },
    { name: 'sparePart', model: prisma.sparePart },
    { name: 'carService', model: prisma.carService },
    { name: 'busListing', model: prisma.busListing },
    { name: 'equipmentListing', model: prisma.equipmentListing },
    { name: 'operatorListing', model: prisma.operatorListing },
    { name: 'carrierProfile', model: prisma.carrierProfile },
  ];

  let totalRecords = 0;
  let matchedRecords = 0;
  let unmatchedRecords = 0;
  let updatedRecords = 0;
  const unmatchedExamples = new Set<string>();

  // Custom mapping for popular regions
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

  const govNameMap = new Map();
  for (const w of wilayas) {
    govNameMap.set(normalizeArabic(w.governorate.nameAr), w.governorateId);
    govNameMap.set(normalizeArabic(w.governorate.nameEn), w.governorateId);
    // Common codes
    govNameMap.set('om_mus', 1); // Assuming Muscat is ID 1, we will do dynamic search
    if (w.governorate.nameEn === 'Muscat') govNameMap.set('om_mus', w.governorateId);
  }

  for (const table of tables) {
    let records: any[] = [];
    try {
      // @ts-ignore
      records = await table.model.findMany();
    } catch (e) {
      console.error(`Failed to fetch from ${table.name}`);
      continue;
    }

    for (const record of records) {
      if (!record.governorate && !record.city) continue;
      
      totalRecords++;
      const govStrRaw = record.governorate || '';
      const cityStrRaw = record.city || '';
      const govStr = normalizeArabic(govStrRaw);
      let cityStr = normalizeArabic(cityStrRaw);

      // Apply custom region mapping if exists
      for (const [region, mappedWilaya] of Object.entries(customRegionMap)) {
        if (cityStr.includes(normalizeArabic(region)) || govStr.includes(normalizeArabic(region))) {
          cityStr = normalizeArabic(mappedWilaya);
        }
      }

      let match = locationMap.get(`${govStr}-${cityStr}`);
      if (!match) match = locationMap.get(cityStr);

      let finalGovId = null;
      let finalWilayaId = null;

      if (match) {
        finalGovId = match.governorateId;
        finalWilayaId = match.wilayaId;
      } else {
        // Fallback: match governorate only
        const govMatch = govNameMap.get(govStr) || govNameMap.get(cityStr);
        if (govMatch) {
          finalGovId = govMatch;
        } else if (govStrRaw.toUpperCase() === 'OM_MUS' || cityStrRaw.toUpperCase() === 'OM_MUS') {
          finalGovId = govNameMap.get('muscat');
        } else if (govStr.includes('باطنة شمال') || govStr.includes('شمال باطنة') || govStr.includes('north al batinah')) {
          finalGovId = govNameMap.get('al batinah north');
        } else if (govStr.includes('باطنة جنوب') || govStr.includes('جنوب باطنة') || govStr.includes('south al batinah')) {
          finalGovId = govNameMap.get('al batinah south');
        }
      }

      if (finalGovId || finalWilayaId) {
        matchedRecords++;
        
        // Execute the UPDATE
        try {
          // @ts-ignore
          await table.model.update({
            where: { id: record.id },
            data: {
              governorateId: finalGovId,
              wilayaId: finalWilayaId,
            }
          });
          updatedRecords++;
        } catch(e) {
          console.error(`Failed to update record ${record.id} in ${table.name}`, e);
        }

      } else {
        unmatchedRecords++;
        unmatchedExamples.add(`${record.governorate || 'NULL'} / ${record.city || 'NULL'}`);
      }
    }
  }

  console.log('--- Migration Results ---');
  console.log(`Total Records Examined: ${totalRecords}`);
  console.log(`Successfully Matched & Updated: ${updatedRecords}`);
  console.log(`Failed to Match: ${unmatchedRecords}`);
  
  if (unmatchedExamples.size > 0) {
    console.log('--- Unmatched (Ignored) Locations ---');
    console.log(Array.from(unmatchedExamples).slice(0, 20).join('\n'));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
