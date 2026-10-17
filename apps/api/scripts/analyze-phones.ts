import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

export interface PhoneStatsResult {
  totalUsers: number;
  nullOrEmptyCount: number;
  validOmanE164Count: number;
  bareEightDigitCount: number;
  otherCountriesCount: Record<string, number>;
  invalidPhoneCount: number;
  duplicateGroups: {
    totalDuplicateGroups: number;
    distribution: Record<number, number>;
  };
}

const KNOWN_1_DIGIT = new Set(['1', '7']);
const KNOWN_2_DIGIT = new Set([
  '20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45', '46', '47', '48', '49',
  '51', '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84',
  '86', '90', '91', '92', '93', '94', '95', '98',
]);

/**
 * Extracts country calling code from an international number starting with +.
 */
export function extractCountryCode(e164Number: string): string | null {
  if (!e164Number.startsWith('+')) return null;
  const digits = e164Number.slice(1);
  if (digits.length < 5) return null;

  const prefix1 = digits.slice(0, 1);
  const prefix2 = digits.slice(0, 2);
  const prefix3 = digits.slice(0, 3);

  // If 2-digit matches (e.g. 20 Egypt, 44 UK, 91 India), prefer 2-digit unless it's known 3-digit zone
  if (KNOWN_2_DIGIT.has(prefix2)) {
    return prefix2;
  }
  if (KNOWN_1_DIGIT.has(prefix1)) {
    return prefix1;
  }
  // Most Middle East & global countries (968, 971, 966, etc.) are 3-digit
  if (/^\d{3}$/.test(prefix3)) {
    return prefix3;
  }
  return null;
}

/**
 * Pure calculation function for phone statistics.
 * Computes strictly numeric aggregates without returning or leaking any user identifiers.
 */
export function calculatePhoneStats(
  records: Array<{ phone: string | null | undefined }>,
): PhoneStatsResult {
  let nullOrEmptyCount = 0;
  let validOmanE164Count = 0;
  let bareEightDigitCount = 0;
  const otherCountriesCount: Record<string, number> = {};
  let invalidPhoneCount = 0;
  const frequencyMap = new Map<string, number>();

  for (const record of records) {
    const raw = record.phone;
    if (!raw || typeof raw !== 'string' || raw.trim() === '') {
      nullOrEmptyCount++;
      continue;
    }

    const trimmed = raw.trim();
    frequencyMap.set(trimmed, (frequencyMap.get(trimmed) || 0) + 1);

    // 1. Valid Omani E.164: +968 followed by 8 digits starting with 7 or 9
    if (/^\+968[79]\d{7}$/.test(trimmed)) {
      validOmanE164Count++;
      continue;
    }

    // 2. Bare 8-digit numbers without country code
    if (/^\d{8}$/.test(trimmed)) {
      bareEightDigitCount++;
      continue;
    }

    // 3. Other countries: numbers starting with + or 00
    let normalized = trimmed;
    if (normalized.startsWith('00')) {
      normalized = '+' + normalized.slice(2);
    }

    if (normalized.startsWith('+')) {
      const cc = extractCountryCode(normalized);
      if (cc) {
        if (cc === '968') {
          // Has +968 prefix but does not match valid mobile pattern
          invalidPhoneCount++;
        } else {
          otherCountriesCount[cc] = (otherCountriesCount[cc] || 0) + 1;
        }
        continue;
      }
    }

    // 4. Otherwise: invalid
    invalidPhoneCount++;
  }

  // Calculate duplicate groups
  let totalDuplicateGroups = 0;
  const distribution: Record<number, number> = {};

  for (const count of frequencyMap.values()) {
    if (count > 1) {
      totalDuplicateGroups++;
      distribution[count] = (distribution[count] || 0) + 1;
    }
  }

  return {
    totalUsers: records.length,
    nullOrEmptyCount,
    validOmanE164Count,
    bareEightDigitCount,
    otherCountriesCount,
    invalidPhoneCount,
    duplicateGroups: {
      totalDuplicateGroups,
      distribution,
    },
  };
}

export function isLocalDatabase(databaseUrl?: string): boolean {
  if (!databaseUrl) return false;
  try {
    const parsed = new URL(databaseUrl);
    const host = parsed.hostname;
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '[::1]'
    );
  } catch {
    return false;
  }
}


export async function runPhoneAnalysis(
  prismaClient?: PrismaClient,
  logger: { log: (...args: any[]) => void; error: (...args: any[]) => void } = console,
): Promise<{ success: boolean; stats?: PhoneStatsResult; error?: string }> {
  const dbUrl = process.env.DATABASE_URL;

  if (!isLocalDatabase(dbUrl)) {
    logger.error('Error: DATABASE_URL is not pointed to a local database (127.0.0.1 / localhost).');
    logger.error('Remote execution and production databases are strictly prohibited for this script.');
    return {
      success: false,
      error: 'REMOTE_DATABASE_PROHIBITED',
    };
  }

  const prisma = prismaClient || new PrismaClient();
  const shouldDisconnect = !prismaClient;

  try {
    const users = await prisma.user.findMany({
      select: { phone: true },
    });

    const stats = calculatePhoneStats(users);

    logger.log('======================================================');
    logger.log('تقرير تحليل أرقام الهواتف (قراءة فقط)');
    logger.log('Phone Numbers Analysis Report (Read-Only)');
    logger.log('======================================================');
    logger.log(`- إجمالي المستخدمين (Total Users):                     ${stats.totalUsers}`);
    logger.log(`- أرقام فارغة أو غير محددة (Null or Empty):          ${stats.nullOrEmptyCount}`);
    logger.log(`- أرقام عُمانية صحيحة بصيغة +968 (Valid Oman E.164):    ${stats.validOmanE164Count}`);
    logger.log(`- أرقام محلية 8 خانات بدون كود (Bare 8-Digit Local):  ${stats.bareEightDigitCount}`);
    logger.log(`- أرقام غير صالحة (Invalid Phone Numbers):            ${stats.invalidPhoneCount}`);
    logger.log('------------------------------------------------------');
    logger.log('- أرقام دول أخرى (Other Countries Counts):');
    const countryEntries = Object.entries(stats.otherCountriesCount);
    if (countryEntries.length === 0) {
      logger.log('  (لا توجد أرقام لدول أخرى)');
    } else {
      for (const [code, count] of countryEntries) {
        logger.log(`  + كود الدولة ${code}: ${count} مستخدم`);
      }
    }
    logger.log('------------------------------------------------------');
    logger.log(`- إجمالي مجموعات الأرقام المكررة (Duplicate Groups):  ${stats.duplicateGroups.totalDuplicateGroups}`);
    const distEntries = Object.entries(stats.duplicateGroups.distribution);
    if (distEntries.length === 0) {
      logger.log('  (لا توجد أرقام مكررة)');
    } else {
      for (const [size, count] of distEntries) {
        logger.log(`  + مجموعات بحجم ${size} تكرارات: ${count} مجموعة`);
      }
    }
    logger.log('======================================================');

    return { success: true, stats };
  } catch (err: any) {
    logger.error('Failed to execute phone analysis against local database:', err?.message || err);
    return { success: false, error: err?.message || 'DB_ERROR' };
  } finally {
    if (shouldDisconnect) {
      await prisma.$disconnect();
    }
  }
}

if (require.main === module) {
  runPhoneAnalysis()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error in analyze-phones script:', err);
      process.exit(1);
    });
}
