import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { firstValueFrom } from 'rxjs';

/* ── CarQuery API types ── */
interface RawMake {
  make_id: string;
  make_display: string;
  make_country: string;
}

interface RawModel {
  model_name: string;
  model_make_id: string;
}

interface RawTrim {
  model_year: string;
  model_name: string;
  model_make_id: string;
}

export interface ImportResult {
  source: 'api' | 'seed';
  brands: number;
  models: number;
  years: number;
  errors: string[];
  durationMs: number;
}

const CARQUERY_BASE = 'https://www.carqueryapi.com/api/0.3/';
const RATE_LIMIT_MS = 300;
const MAX_RETRIES = 2;

const IMPORT_STATE_KEY = 'cars:import:state';

@Injectable()
export class CarImporterService {
  private readonly logger = new Logger(CarImporterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly http: HttpService,
  ) {}

  /**
   * Main entry — tries CarQuery API first, falls back to seed data
   */
  async importAll(): Promise<ImportResult> {
    const start = Date.now();
    this.logger.log('🚗 Starting car data import...');

    let result: ImportResult;

    try {
      result = await this.importFromApi();
    } catch (err: any) {
      this.logger.error(`CarQuery API failed: ${err?.message}`);
      result = { source: 'api', brands: 0, models: 0, years: 0, errors: [err?.message], durationMs: 0 };
    }

    result.durationMs = Date.now() - start;

    // Save import state to Redis
    await this.redis.set(IMPORT_STATE_KEY, {
      completedAt: new Date().toISOString(),
      source: result.source,
      brands: result.brands,
      models: result.models,
      years: result.years,
      errors: result.errors.slice(0, 20),
      durationMs: result.durationMs,
    });

    // Invalidate all cached car data
    await this.redis.delPattern('cars:*');

    this.logger.log(
      `✅ Import complete [${result.source}]: ${result.brands} brands, ${result.models} models, ${result.years} years in ${result.durationMs}ms`,
    );

    return result;
  }

  /* ═══════════════════════════════════════════
     CarQuery API Import
  ═══════════════════════════════════════════ */

  private async importFromApi(): Promise<ImportResult> {
    const result: ImportResult = { source: 'api', brands: 0, models: 0, years: 0, errors: [], durationMs: 0 };

    // 1. Fetch all makes
    const makes = await this.fetchMakes();
    this.logger.log(`Fetched ${makes.length} makes from CarQuery API`);

    for (const make of makes) {
      try {
        const brand = await this.upsertBrand(make.make_display, this.toSlug(make.make_display), false);
        result.brands++;

        // 2. Fetch models for this make
        await this.delay(RATE_LIMIT_MS);
        const models = await this.fetchModels(make.make_id);

        const uniqueModels = new Map<string, string[]>();
        for (const m of models) {
          if (!uniqueModels.has(m.model_name)) {
            uniqueModels.set(m.model_name, []);
          }
        }

        // 3. Fetch trims/years for each model
        for (const [modelName] of uniqueModels) {
          try {
            await this.delay(RATE_LIMIT_MS);
            const trims = await this.fetchTrims(make.make_id, modelName);

            const carModel = await this.upsertModel(modelName, this.toSlug(modelName), brand.id);
            result.models++;

            const years = new Set(trims.map((t) => parseInt(t.model_year, 10)).filter((y) => !isNaN(y)));
            for (const year of years) {
              await this.upsertCarYear(year, carModel.id);
              result.years++;
            }
          } catch (err: any) {
            result.errors.push(`Model ${modelName}: ${err?.message}`);
          }
        }
      } catch (err: any) {
        result.errors.push(`Brand ${make.make_display}: ${err?.message}`);
      }
    }

    return result;
  }

  /* ═══════════════════════════════════════════
     CarQuery API Fetchers
  ═══════════════════════════════════════════ */

  private async fetchMakes(): Promise<RawMake[]> {
    const data = await this.fetchWithRetry(`${CARQUERY_BASE}?cmd=getMakes`);
    return data?.Makes || [];
  }

  private async fetchModels(makeId: string): Promise<RawModel[]> {
    const data = await this.fetchWithRetry(`${CARQUERY_BASE}?cmd=getModels&make=${encodeURIComponent(makeId)}`);
    return data?.Models || [];
  }

  private async fetchTrims(makeId: string, modelName: string): Promise<RawTrim[]> {
    const data = await this.fetchWithRetry(
      `${CARQUERY_BASE}?cmd=getTrims&make=${encodeURIComponent(makeId)}&model=${encodeURIComponent(modelName)}`,
    );
    return data?.Trims || [];
  }

  /**
   * Fetch with retry + JSONP handling
   */
  private async fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<any> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await firstValueFrom(
          this.http.get(url, {
            timeout: 10000,
            headers: { 'User-Agent': 'CarOne/1.0' },
          }),
        );

        let data = response.data;

        // Handle JSONP response: strip callback wrapper
        if (typeof data === 'string') {
          const match = data.match(/^\w+\(([\s\S]*)\);?\s*$/);
          if (match) {
            data = JSON.parse(match[1]);
          } else {
            data = JSON.parse(data);
          }
        }

        return data;
      } catch (err) {
        if (attempt < retries) {
          const backoff = Math.pow(2, attempt) * 1000;
          this.logger.warn(`Retry ${attempt + 1}/${retries} for ${url} in ${backoff}ms`);
          await this.delay(backoff);
        } else {
          throw err;
        }
      }
    }
  }

  /* ═══════════════════════════════════════════
     DB Upserts
  ═══════════════════════════════════════════ */

  private async upsertBrand(name: string, slug: string, isPopular: boolean) {
    return this.prisma.brand.upsert({
      where: { slug },
      create: { name, slug, isPopular },
      update: { name, isPopular },
    });
  }

  private async upsertModel(name: string, slug: string, brandId: string) {
    return this.prisma.carModel.upsert({
      where: { name_brandId: { name, brandId } },
      create: { name, slug, brandId },
      update: { slug },
    });
  }

  private async upsertCarYear(year: number, modelId: string) {
    return this.prisma.carYear.upsert({
      where: { year_modelId: { year, modelId } },
      create: { year, modelId },
      update: {},
    });
  }

  /* ═══════════════════════════════════════════
     Helpers
  ═══════════════════════════════════════════ */

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
