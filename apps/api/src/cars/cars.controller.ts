import { Controller, Get, Param, Query } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarFilterDto } from './dto/car-filter.dto';
import { BrandSearchDto } from './dto/brand-search.dto';
import { GULF_BRANDS as SEED_BRANDS } from './data/seed-gulf-v1';

@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  /**
   * GET /cars/brands
   * Query: ?popular=true
   */
  @Get('brands')
  async getBrands(@Query('popular') popular?: string) {
    const isPopular = popular === 'true' ? true : popular === 'false' ? false : undefined;
    return this.carsService.findAllBrands(isPopular);
  }

  /**
   * GET /cars/brands/search?q=toyo&limit=10
   */
  @Get('brands/search')
  async searchBrands(@Query() dto: BrandSearchDto) {
    return this.carsService.searchBrands(dto.q, dto.limit);
  }

  /**
   * GET /cars/brands/:brandId/models
   */
  @Get('brands/:brandId/models')
  async getModelsByBrand(@Param('brandId') brandId: string) {
    return this.carsService.findModelsByBrand(brandId);
  }

  /**
   * GET /cars/models/:modelId/years
   */
  @Get('models/:modelId/years')
  async getYearsByModel(@Param('modelId') modelId: string) {
    return this.carsService.findYearsByModel(modelId);
  }

  /**
   * GET /cars/models/:modelId/trims
   */
  @Get('models/:modelId/trims')
  async getTrimsByModel(@Param('modelId') modelId: string) {
    return this.carsService.findTrimsByModel(modelId);
  }

  /**
   * GET /cars/filter?brandId=...&modelId=...&year=2024&page=1&limit=50
   */
  @Get('filter')
  async filterCars(@Query() dto: CarFilterDto) {
    return this.carsService.filterCars(dto);
  }

  /**
   * GET /cars/full — Full brand → model → year tree
   */
  @Get('full')
  async getFullTree() {
    return this.carsService.getFullTree();
  }

  /**
   * GET /cars/stats — Quick count
   */
  @Get('stats')
  async getStats() {
    return this.carsService.getStats();
  }

  /* ═══════════════════════════════════════════
     Static endpoints — serve from seed data (no DB required)
  ═══════════════════════════════════════════ */

  /**
   * GET /cars/static/brands
   * Query: ?popular=true
   */
  @Get('static/brands')
  getStaticBrands(@Query('popular') popular?: string) {
    let brands = SEED_BRANDS;
    if (popular === 'true') brands = brands.filter((b) => b.isPopular);
    if (popular === 'false') brands = brands.filter((b) => !b.isPopular);
    return brands.map((b) => ({
      id: b.slug,
      name: b.name,
      nameAr: b.nameAr,
      slug: b.slug,
      isPopular: b.isPopular,
      modelCount: b.models.length,
    }));
  }

  /**
   * GET /cars/static/brands/:slug/models
   */
  @Get('static/brands/:slug/models')
  getStaticModels(@Param('slug') slug: string) {
    const brand = SEED_BRANDS.find((b) => b.slug === slug);
    if (!brand) return [];
    return brand.models.map((m) => ({
      id: `${slug}--${m.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: m.name,
      nameAr: m.nameAr,
      slug: m.name.toLowerCase().replace(/\s+/g, '-'),
      trimCount: m.trims.length,
    }));
  }

  /**
   * GET /cars/static/brands/:slug/models/:modelSlug/years
   * Derives year range from trims (min yearFrom → max yearTo)
   */
  @Get('static/brands/:slug/models/:modelSlug/years')
  getStaticYears(@Param('slug') slug: string, @Param('modelSlug') modelSlug: string) {
    const brand = SEED_BRANDS.find((b) => b.slug === slug);
    if (!brand) return [];
    const model = brand.models.find(
      (m) => m.name.toLowerCase().replace(/\s+/g, '-') === modelSlug,
    );
    if (!model || !model.trims.length) return [];
    const from = Math.min(...model.trims.map((t) => t.from));
    const to   = Math.max(...model.trims.map((t) => t.to ?? 2026));
    const years: number[] = [];
    for (let y = to; y >= from; y--) years.push(y);
    return years.map((y) => ({ id: `${slug}--${modelSlug}--${y}`, year: y }));
  }

  /**
   * GET /cars/static/brands/:slug/models/:modelSlug/trims
   */
  @Get('static/brands/:slug/models/:modelSlug/trims')
  getStaticTrims(@Param('slug') slug: string, @Param('modelSlug') modelSlug: string) {
    const brand = SEED_BRANDS.find((b) => b.slug === slug);
    if (!brand) return [];
    const model = (brand as any).models.find(
      (m: any) => m.name.toLowerCase().replace(/\s+/g, '-') === modelSlug,
    );
    if (!model || !model.trims) return [];
    return model.trims.map((t: any) => ({
      id:       `${slug}--${modelSlug}--${t.name.toLowerCase().replace(/\s+/g, '-')}`,
      name:     t.name,
      nameAr:   t.nameAr ?? t.name,
      slug:     t.name.toLowerCase().replace(/\s+/g, '-'),
      yearFrom: t.from,
      yearTo:   t.to ?? 2026,
    }));
  }

  /**
   * GET /cars/static/full — Full brand → model → year tree
   */
  @Get('static/full')
  getStaticFullTree() {
    return SEED_BRANDS
      .sort((a, b) => (a.isPopular === b.isPopular ? a.name.localeCompare(b.name) : a.isPopular ? -1 : 1))
      .map((b) => ({
        id: b.slug,
        name: b.name,
        nameAr: b.nameAr,
        slug: b.slug,
        isPopular: b.isPopular,
        models: b.models.map((m) => ({
          id: `${b.slug}--${m.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: m.name,
          nameAr: m.nameAr,
          slug: m.name.toLowerCase().replace(/\s+/g, '-'),
          trims: m.trims.map((t) => ({
            id:       `${b.slug}--${m.name.toLowerCase().replace(/\s+/g, '-')}--${t.name.toLowerCase().replace(/\s+/g, '-')}`,
            name:     t.name,
            nameAr:   t.nameAr ?? t.name,
            slug:     t.name.toLowerCase().replace(/\s+/g, '-'),
            yearFrom: t.from,
            yearTo:   t.to ?? 2026,
          })),
        })),
      }));
  }
}
