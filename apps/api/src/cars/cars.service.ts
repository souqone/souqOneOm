import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CarFilterDto } from './dto/car-filter.dto';

/* ── Cache TTLs (seconds) ── */
const TTL_BRANDS        = 3600;     // 1 hour
const TTL_BRANDS_SEARCH = 600;      // 10 min
const TTL_MODELS        = 3600;     // 1 hour
const TTL_YEARS         = 3600;     // 1 hour
const TTL_FULL_TREE     = 1800;     // 30 min

@Injectable()
export class CarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /* ═══════════════════════════════════════════
     Brands
  ═══════════════════════════════════════════ */

  async findAllBrands(popular?: boolean) {
    const cacheKey = popular ? 'cars:brands:popular' : 'cars:brands';
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const where = popular !== undefined ? { isPopular: popular } : {};
    const brands = await this.prisma.brand.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        nameAr: true,
        slug: true,
        isPopular: true,
        _count: { select: { models: true } },
      },
    });

    const result = brands.map((b) => ({
      id: b.id,
      name: b.name,
      nameAr: b.nameAr,
      slug: b.slug,
      isPopular: b.isPopular,
      modelCount: b._count.models,
    }));

    await this.redis.set(cacheKey, result, TTL_BRANDS);
    return result;
  }

  async searchBrands(q: string, limit = 10) {
    const cacheKey = `cars:brands:search:${q.toLowerCase()}:${limit}`;
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const brands = await this.prisma.brand.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { nameAr: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q.toLowerCase() } },
        ],
      },
      take: limit,
      orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        nameAr: true,
        slug: true,
        isPopular: true,
        _count: { select: { models: true } },
      },
    });

    const result = brands.map((b) => ({
      id: b.id,
      name: b.name,
      nameAr: b.nameAr,
      slug: b.slug,
      isPopular: b.isPopular,
      modelCount: b._count.models,
    }));

    await this.redis.set(cacheKey, result, TTL_BRANDS_SEARCH);
    return result;
  }

  /* ═══════════════════════════════════════════
     Models
  ═══════════════════════════════════════════ */

  async findModelsByBrand(brandId: string) {
    const cacheKey = `cars:models:${brandId}`;
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const models = await this.prisma.carModel.findMany({
      where: { brandId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        nameAr: true,
        slug: true,
        _count: { select: { years: true } },
      },
    });

    const result = models.map((m) => ({
      id: m.id,
      name: m.name,
      nameAr: m.nameAr,
      slug: m.slug,
      yearCount: m._count.years,
    }));

    await this.redis.set(cacheKey, result, TTL_MODELS);
    return result;
  }

  /* ═══════════════════════════════════════════
     Years
  ═══════════════════════════════════════════ */

  async findYearsByModel(modelId: string) {
    const cacheKey = `cars:years:${modelId}`;
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const years = await this.prisma.carYear.findMany({
      where: { modelId },
      orderBy: { year: 'desc' },
      select: { id: true, year: true },
    });

    await this.redis.set(cacheKey, years, TTL_YEARS);
    return years;
  }

  /* ═══════════════════════════════════════════
     Trims
  ═══════════════════════════════════════════ */

  async findTrimsByModel(modelId: string) {
    const cacheKey = `cars:trims:${modelId}`;
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const trims = await this.prisma.carTrim.findMany({
      where: { modelId },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, nameAr: true, slug: true,
        yearFrom: true, yearTo: true,
        engineCapacity: true, cylinders: true, horsepower: true,
        torque: true, driveType: true, transmission: true,
        fuelType: true, seats: true, isFullOption: true,
      },
    });

    await this.redis.set(cacheKey, trims, 3600);
    return trims;
  }

  /* ═══════════════════════════════════════════
     Filter (advanced)
  ═══════════════════════════════════════════ */

  async filterCars(filters: CarFilterDto) {
    const { brandId, modelId, year, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (brandId) where.brandId = brandId;
    if (modelId) where.id = modelId;

    // If filtering by year, we need to go through CarYear → CarModel
    if (year && !modelId) {
      const modelsWithYear = await this.prisma.carYear.findMany({
        where: { year },
        select: { modelId: true },
        distinct: ['modelId'],
      });
      where.id = { in: modelsWithYear.map((m) => m.modelId) };
    }

    const [models, total] = await Promise.all([
      this.prisma.carModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          brand: { select: { id: true, name: true, nameAr: true, slug: true } },
          years: { orderBy: { year: 'desc' }, select: { id: true, year: true } },
        },
      }),
      this.prisma.carModel.count({ where }),
    ]);

    return {
      data: models.map((m) => ({
        id: m.id,
        name: m.name,
        nameAr: m.nameAr,
        slug: m.slug,
        brand: m.brand,
        years: m.years,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /* ═══════════════════════════════════════════
     Full Tree (Brand → Models → Years)
  ═══════════════════════════════════════════ */

  async getFullTree() {
    const cacheKey = 'cars:full';
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const brands = await this.prisma.brand.findMany({
      orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
      include: {
        models: {
          orderBy: { name: 'asc' },
          include: {
            years: { orderBy: { year: 'desc' }, select: { id: true, year: true } },
          },
        },
      },
    });

    const tree = brands.map((b) => ({
      id: b.id,
      name: b.name,
      nameAr: b.nameAr,
      slug: b.slug,
      isPopular: b.isPopular,
      models: b.models.map((m) => ({
        id: m.id,
        name: m.name,
        nameAr: m.nameAr,
        slug: m.slug,
        years: m.years,
      })),
    }));

    await this.redis.set(cacheKey, tree, TTL_FULL_TREE);
    return tree;
  }

  /* ═══════════════════════════════════════════
     Stats
  ═══════════════════════════════════════════ */

  async getStats() {
    const [brands, models, years] = await Promise.all([
      this.prisma.brand.count(),
      this.prisma.carModel.count(),
      this.prisma.carYear.count(),
    ]);
    return { brands, models, years };
  }
}
