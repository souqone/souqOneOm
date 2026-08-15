import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ── Security: Whitelisted tables and columns ──────────────────────────────
// Defined ONCE here so adding a new module requires updating ONE place only.
// Both syncLocation() and clearLocation() validate against these lists.

const ALLOWED_TABLES = [
  'users', 'listings', 'driver_jobs', 'driver_profiles',
  'employer_profiles', 'spare_parts', 'car_services',
  'bus_listings', 'equipment_listings', 'operator_listings',
  'carrier_profiles', 'transport_requests',
] as const;

const ALLOWED_COLUMNS = [
  'location', 'fromLocation', 'toLocation',
] as const;

// ── GeoService ────────────────────────────────────────────────────────────

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Syncs the latitude and longitude to the PostGIS Geography column.
   * @param tableName  The mapped PostgreSQL table name (must be in ALLOWED_TABLES)
   * @param recordId   The UUID/string ID of the record
   * @param lat        Latitude  (-90 … 90)
   * @param lng        Longitude (-180 … 180)
   * @param idColumnName      Optional, defaults to 'id'
   * @param locationColumnName Optional, must be in ALLOWED_COLUMNS, defaults to 'location'
   */
  async syncLocation(
    tableName: string,
    recordId: string,
    lat: number,
    lng: number,
    idColumnName: string = 'id',
    locationColumnName: string = 'location',
  ): Promise<boolean> {
    try {
      // ── Coordinate validation ──────────────────────────────────────────
      // IMPORTANT: 0 is a valid coordinate (equator / prime meridian).
      // The old `if (!lat || !lng)` was a bug — it rejected lat=0 or lng=0.
      if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return false;
      if (lat < -90 || lat > 90) return false;
      if (lng < -180 || lng > 180) return false;

      // ── Table / column whitelist ───────────────────────────────────────
      if (!(ALLOWED_TABLES as readonly string[]).includes(tableName)) {
        throw new Error(`Invalid table name for Geo sync: ${tableName}`);
      }
      if (!(ALLOWED_COLUMNS as readonly string[]).includes(locationColumnName)) {
        throw new Error(`Invalid location column for Geo sync: ${locationColumnName}`);
      }

      await this.prisma.$executeRawUnsafe(`
        UPDATE "${tableName}" 
        SET "${locationColumnName}" = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326) 
        WHERE "${idColumnName}" = '${recordId}';
      `);

      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to sync Geo location for ${tableName} ${recordId}: ${error.message}`,
      );
      return false; // Fail silently so it doesn't break the main transaction
    }
  }

  /**
   * Validates that the provided wilaya actually belongs to the provided governorate.
   * Throws BadRequestException if they don't match or if required and missing.
   */
  async validateLocationPair(governorateId?: number, wilayaId?: number, required = true): Promise<void> {
    if (!governorateId || !wilayaId) {
      if (required) {
        throw new BadRequestException('المحافظة والولاية مطلوبتان');
      }
      if (governorateId || wilayaId) {
        throw new BadRequestException('يجب توفير كل من المحافظة والولاية معاً');
      }
      return;
    }

    const wilaya = await this.prisma.wilaya.findUnique({
      where: { id: wilayaId },
      select: { governorateId: true },
    });

    if (!wilaya || wilaya.governorateId !== governorateId) {
      throw new BadRequestException('الولاية لا تتبع للمحافظة المحددة');
    }
  }

  /**
   * Clears the location column when coordinates are removed.
   * @param tableName          Must be in ALLOWED_TABLES
   * @param recordId           The UUID/string ID of the record
   * @param idColumnName       Optional, defaults to 'id'
   * @param locationColumnName Optional, must be in ALLOWED_COLUMNS, defaults to 'location'
   */
  async clearLocation(
    tableName: string,
    recordId: string,
    idColumnName: string = 'id',
    locationColumnName: string = 'location',
  ): Promise<boolean> {
    try {
      // ── Table / column whitelist ───────────────────────────────────────
      if (!(ALLOWED_TABLES as readonly string[]).includes(tableName)) {
        throw new Error(`Invalid table name for Geo clear: ${tableName}`);
      }
      if (!(ALLOWED_COLUMNS as readonly string[]).includes(locationColumnName)) {
        throw new Error(`Invalid location column for Geo clear: ${locationColumnName}`);
      }

      await this.prisma.$executeRawUnsafe(`
        UPDATE "${tableName}" 
        SET "${locationColumnName}" = NULL 
        WHERE "${idColumnName}" = '${recordId}';
      `);
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to clear Geo location for ${tableName} ${recordId}: ${error.message}`,
      );
      return false;
    }
  }
}

