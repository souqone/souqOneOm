import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MEILI_CLIENT } from './meili.provider';
import { buildSynonymsMap } from './synonyms';
import { SearchQueryDto } from './dto/search-query.dto';

// Meilisearch is ESM-only — client injected via provider, typed as any
type MeiliClient = any;

// ── Index names ──
export const INDEXES = {
  LISTINGS: 'listings',
  PARTS: 'parts',
  SERVICES: 'services',
  JOBS: 'jobs',
  BUSES: 'buses',
  EQUIPMENT: 'equipment',
  OPERATORS: 'operators',
} as const;

type IndexName = (typeof INDEXES)[keyof typeof INDEXES];

// ── Index configuration per entity ──
interface IndexConfig {
  searchableAttributes: string[];
  filterableAttributes: string[];
  sortableAttributes: string[];
  displayedAttributes?: string[];
}

const INDEX_CONFIGS: Record<IndexName, IndexConfig> = {
  listings: {
    searchableAttributes: ['title', 'description', 'make', 'model', 'governorate', 'city'],
    filterableAttributes: ['price', 'make', 'model', 'year', 'fuelType', 'transmission', 'condition', 'governorate', 'city', 'listingType', 'status', 'isPremium'],
    sortableAttributes: ['price', 'createdAt', 'year', 'mileage', 'viewCount'],
  },
  parts: {
    searchableAttributes: ['title', 'description', 'partNumber', 'compatibleMakes', 'governorate', 'city'],
    filterableAttributes: ['price', 'partCategory', 'condition', 'governorate', 'city', 'status', 'isOriginal'],
    sortableAttributes: ['price', 'createdAt'],
  },
  services: {
    searchableAttributes: ['title', 'description', 'providerName', 'governorate', 'city'],
    filterableAttributes: ['serviceType', 'providerType', 'governorate', 'city', 'status', 'isHomeService'],
    sortableAttributes: ['priceFrom', 'createdAt'],
  },
  jobs: {
    searchableAttributes: ['title', 'description', 'governorate', 'city'],
    filterableAttributes: ['jobType', 'employmentType', 'governorate', 'status', 'salary'],
    sortableAttributes: ['salary', 'createdAt', 'viewCount', 'experienceYears'],
  },
  buses: {
    searchableAttributes: ['title', 'description', 'make', 'model', 'governorate'],
    filterableAttributes: ['price', 'busListingType', 'busType', 'make', 'governorate', 'status', 'capacity', 'isPremium'],
    sortableAttributes: ['price', 'createdAt', 'viewCount', 'capacity'],
  },
  equipment: {
    searchableAttributes: ['title', 'description', 'make', 'model', 'governorate', 'city'],
    filterableAttributes: ['price', 'dailyPrice', 'equipmentType', 'listingType', 'condition', 'governorate', 'status', 'isPremium'],
    sortableAttributes: ['price', 'dailyPrice', 'createdAt', 'viewCount'],
  },
  operators: {
    searchableAttributes: ['title', 'description', 'governorate', 'city'],
    filterableAttributes: ['operatorType', 'governorate', 'status', 'dailyRate', 'hourlyRate'],
    sortableAttributes: ['dailyRate', 'hourlyRate', 'createdAt', 'viewCount'],
  },
};

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @Inject(MEILI_CLIENT) private readonly meili: MeiliClient,
    private readonly prisma: PrismaService,
  ) {}

  // ══════════════════════════════════════════
  // Module initialization — configure all indexes
  // ══════════════════════════════════════════
  async onModuleInit() {
    if (!this.meili) {
      this.logger.warn('Meilisearch client is null — search features disabled');
      return;
    }
    try {
      // Health check
      const health = await this.meili.health();
      this.logger.log(`Meilisearch is ${health.status}`);

      await this.configureAllIndexes();
    } catch (err) {
      this.logger.warn(`Meilisearch not available — search features disabled. Error: ${(err as Error).message}`);
    }
  }

  /**
   * Create indexes and configure attributes, synonyms, ranking, typo tolerance.
   */
  private async configureAllIndexes() {
    const synonyms = buildSynonymsMap();

    for (const [indexName, config] of Object.entries(INDEX_CONFIGS)) {
      try {
        // Create or get index
        await this.meili.createIndex(indexName, { primaryKey: 'id' });

        const index = this.meili.index(indexName);

        // Configure attributes
        await index.updateSearchableAttributes(config.searchableAttributes);
        await index.updateFilterableAttributes(config.filterableAttributes);
        await index.updateSortableAttributes(config.sortableAttributes);

        // Ranking rules — boost premium/featured listings by putting them first
        await index.updateRankingRules([
          'words',
          'typo',
          'proximity',
          'attribute',
          'sort',
          'exactness',
        ]);

        // Typo tolerance
        await index.updateTypoTolerance({
          enabled: true,
          minWordSizeForTypos: { oneTypo: 3, twoTypos: 6 },
        });

        // Synonyms (shared across all indexes)
        await index.updateSynonyms(synonyms);

        this.logger.log(`✅ Index "${indexName}" configured`);
      } catch (err) {
        this.logger.error(`Failed to configure index "${indexName}": ${(err as Error).message}`);
      }
    }
  }

  // ══════════════════════════════════════════
  // Document sync — index / remove documents
  // ══════════════════════════════════════════

  /**
   * Add or update a document in an index. Fire-and-forget.
   */
  async indexDocument(indexName: IndexName, document: Record<string, any>): Promise<void> {
    if (!this.meili) return;
    try {
      const index = this.meili.index(indexName);
      await index.addDocuments([this.serializeDocument(document)]);
    } catch (err) {
      this.logger.error(`Failed to index document in "${indexName}": ${(err as Error).message}`);
    }
  }

  /**
   * Remove a document from an index by ID. Fire-and-forget.
   */
  async removeDocument(indexName: IndexName, docId: string): Promise<void> {
    if (!this.meili) return;
    try {
      const index = this.meili.index(indexName);
      await index.deleteDocument(docId);
    } catch (err) {
      this.logger.error(`Failed to remove document from "${indexName}": ${(err as Error).message}`);
    }
  }

  // ══════════════════════════════════════════
  // Search — multi-index or single-index
  // ══════════════════════════════════════════

  async search(dto: SearchQueryDto) {
    if (!this.meili) return { hits: [], totalHits: 0, page: 1, totalPages: 0, limit: 20 };
    const { q = '', entityType, page = 1, limit = 20, sortBy } = dto;
    const offset = (page - 1) * limit;

    // Build filter string
    const filters = this.buildFilters(dto);

    // Build sort
    const sort = this.buildSort(sortBy, entityType);

    const searchParams: Record<string, any> = {
      limit,
      offset,
      filter: filters.length > 0 ? filters.join(' AND ') : undefined,
      sort: sort.length > 0 ? sort : undefined,
      attributesToHighlight: ['title', 'description'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    };

    // Determine which indexes to search
    const targetIndexes = entityType ? [entityType] : Object.values(INDEXES);

    if (targetIndexes.length === 1) {
      // Single-index search
      return this.searchSingleIndex(targetIndexes[0], q, searchParams, page, limit);
    }

    // Multi-index search
    return this.searchMultiIndex(targetIndexes, q, searchParams, page, limit);
  }

  private async searchSingleIndex(
    indexName: string,
    q: string,
    params: Record<string, any>,
    page: number,
    limit: number,
  ) {
    const index = this.meili.index(indexName);
    const result = await index.search(q, params);

    return {
      items: (result.hits as any[]).map((hit: any) => ({
        ...hit,
        _entityType: indexName,
      })),
      meta: {
        total: result.estimatedTotalHits ?? 0,
        page,
        limit,
        totalPages: Math.ceil((result.estimatedTotalHits ?? 0) / limit),
        processingTimeMs: result.processingTimeMs,
      },
    };
  }

  private async searchMultiIndex(
    indexNames: string[],
    q: string,
    params: Record<string, any>,
    page: number,
    limit: number,
  ) {
    // Use Meilisearch multi-search API
    const queries = indexNames.map(indexUid => ({
      indexUid,
      q,
      ...params,
    }));

    const multiResult = await this.meili.multiSearch({ queries });

    // Merge results
    let allHits: any[] = [];
    let totalEstimate = 0;
    let maxProcessingTime = 0;

    for (const result of multiResult.results) {
      const hits = (result.hits as any[]).map((hit: any) => ({
        ...hit,
        _entityType: result.indexUid,
      }));
      allHits = allHits.concat(hits);
      totalEstimate += result.estimatedTotalHits ?? 0;
      maxProcessingTime = Math.max(maxProcessingTime, result.processingTimeMs ?? 0);
    }

    // Sort merged results by relevance (already sorted per-index by Meilisearch)
    // For multi-index, we interleave fairly but keep within-index order
    // Limit to requested page size
    allHits = allHits.slice(0, limit);

    return {
      items: allHits,
      meta: {
        total: totalEstimate,
        page,
        limit,
        totalPages: Math.ceil(totalEstimate / limit),
        processingTimeMs: maxProcessingTime,
      },
    };
  }

  // ══════════════════════════════════════════
  // Autocomplete — lightweight suggestions
  // ══════════════════════════════════════════

  async autocomplete(q: string, limit: number = 8) {
    const queries = Object.values(INDEXES).map(indexUid => ({
      indexUid,
      q,
      limit: Math.ceil(limit / Object.values(INDEXES).length) + 1,
      attributesToRetrieve: ['id', 'title'],
      attributesToHighlight: ['title'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    }));

    const multiResult = await this.meili.multiSearch({ queries });

    const suggestions: { id: string; title: string; highlighted: string; entityType: string }[] = [];

    for (const result of multiResult.results) {
      for (const hit of result.hits as any[]) {
        suggestions.push({
          id: hit.id as string,
          title: hit.title as string,
          highlighted: (hit._formatted?.title as string) || (hit.title as string),
          entityType: result.indexUid,
        });
      }
    }

    // Deduplicate by title and limit
    const seen = new Set<string>();
    const unique = suggestions.filter(s => {
      const key = s.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.slice(0, limit);
  }

  // ══════════════════════════════════════════
  // Full Reindex — sync all data from PostgreSQL
  // ══════════════════════════════════════════

  async reindexAll(): Promise<{ message: string; counts: Record<string, number> }> {
    const counts: Record<string, number> = {};

    // ── Listings ──
    const listings = await this.prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      include: { images: { take: 1, orderBy: { order: 'asc' } } },
    });
    const listingDocs = listings.map(l => this.serializeDocument({
      id: l.id,
      title: l.title,
      slug: l.slug,
      description: l.description,
      make: l.make,
      model: l.model,
      year: l.year,
      price: Number(l.price),
      currency: l.currency,
      mileage: l.mileage,
      fuelType: l.fuelType,
      transmission: l.transmission,
      condition: l.condition,
      listingType: l.listingType,
      governorate: l.governorate,
      city: l.city,
      isPremium: l.isPremium,
      status: l.status,
      viewCount: l.viewCount,
      imageUrl: l.images[0]?.url || null,
      createdAt: l.createdAt.getTime(),
    }));
    if (listingDocs.length > 0) {
      await this.meili.index(INDEXES.LISTINGS).addDocuments(listingDocs);
    }
    counts.listings = listingDocs.length;

    // ── Parts ──
    const parts = await this.prisma.sparePart.findMany({
      where: { status: 'ACTIVE' },
      include: { images: { take: 1, orderBy: { order: 'asc' } } },
    });
    const partDocs = parts.map(p => this.serializeDocument({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      partCategory: p.partCategory,
      condition: p.condition,
      partNumber: p.partNumber,
      compatibleMakes: p.compatibleMakes,
      price: Number(p.price),
      currency: p.currency,
      isOriginal: p.isOriginal,
      governorate: p.governorate,
      city: p.city,
      status: p.status,
      imageUrl: p.images[0]?.url || null,
      createdAt: p.createdAt.getTime(),
    }));
    if (partDocs.length > 0) {
      await this.meili.index(INDEXES.PARTS).addDocuments(partDocs);
    }
    counts.parts = partDocs.length;

    // ── Services ──
    const services = await this.prisma.carService.findMany({
      where: { status: 'ACTIVE' },
      include: { images: { take: 1, orderBy: { order: 'asc' } } },
    });
    const serviceDocs = services.map(s => this.serializeDocument({
      id: s.id,
      title: s.title,
      slug: s.slug,
      description: s.description,
      serviceType: s.serviceType,
      providerName: s.providerName,
      providerType: s.providerType,
      priceFrom: s.priceFrom ? Number(s.priceFrom) : null,
      currency: s.currency,
      governorate: s.governorate,
      city: s.city,
      isHomeService: s.isHomeService,
      status: s.status,
      imageUrl: s.images[0]?.url || null,
      createdAt: s.createdAt.getTime(),
    }));
    if (serviceDocs.length > 0) {
      await this.meili.index(INDEXES.SERVICES).addDocuments(serviceDocs);
    }
    counts.services = serviceDocs.length;

    // ── Jobs ──
    const jobs = await this.prisma.driverJob.findMany({
      where: { status: 'ACTIVE' },
    });
    const jobDocs = jobs.map(j => this.serializeDocument({
      id: j.id,
      title: j.title,
      slug: j.slug,
      description: j.description,
      jobType: j.jobType,
      employmentType: j.employmentType,
      salary: j.salary ? Number(j.salary) : null,
      salaryPeriod: j.salaryPeriod,
      currency: j.currency,
      governorate: j.governorate,
      city: j.city,
      status: j.status,
      viewCount: j.viewCount,
      createdAt: j.createdAt.getTime(),
    }));
    if (jobDocs.length > 0) {
      await this.meili.index(INDEXES.JOBS).addDocuments(jobDocs);
    }
    counts.jobs = jobDocs.length;

    // ── Buses ──
    const buses = await this.prisma.busListing.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      include: { images: { take: 1, orderBy: { order: 'asc' } } },
    });
    const busDocs = buses.map(b => this.serializeDocument({
      id: b.id,
      title: b.title,
      slug: b.slug,
      description: b.description,
      busListingType: b.busListingType,
      busType: b.busType,
      make: b.make,
      model: b.model,
      year: b.year,
      capacity: b.capacity,
      price: b.price ? Number(b.price) : null,
      currency: b.currency,
      isPremium: b.isPremium,
      governorate: b.governorate,
      status: b.status,
      viewCount: b.viewCount,
      imageUrl: b.images[0]?.url || null,
      createdAt: b.createdAt.getTime(),
    }));
    if (busDocs.length > 0) {
      await this.meili.index(INDEXES.BUSES).addDocuments(busDocs);
    }
    counts.buses = busDocs.length;

    // ── Equipment ──
    const equipment = await this.prisma.equipmentListing.findMany({
      where: { status: 'ACTIVE' },
      include: { images: { take: 1, orderBy: { order: 'asc' } } },
    });
    const equipmentDocs = equipment.map(e => this.serializeDocument({
      id: e.id,
      title: e.title,
      slug: e.slug,
      description: e.description,
      equipmentType: e.equipmentType,
      listingType: e.listingType,
      make: e.make,
      model: e.model,
      condition: e.condition,
      price: e.price ? Number(e.price) : null,
      dailyPrice: e.dailyPrice ? Number(e.dailyPrice) : null,
      currency: e.currency,
      isPremium: e.isPremium,
      governorate: e.governorate,
      city: e.city,
      status: e.status,
      viewCount: e.viewCount,
      imageUrl: e.images[0]?.url || null,
      createdAt: e.createdAt.getTime(),
    }));
    if (equipmentDocs.length > 0) {
      await this.meili.index(INDEXES.EQUIPMENT).addDocuments(equipmentDocs);
    }
    counts.equipment = equipmentDocs.length;

    // ── Operators ──
    const operators = await this.prisma.operatorListing.findMany({
      where: { status: 'ACTIVE' },
    });
    const operatorDocs = operators.map(o => this.serializeDocument({
      id: o.id,
      title: o.title,
      slug: o.slug,
      description: o.description,
      operatorType: o.operatorType,
      dailyRate: o.dailyRate ? Number(o.dailyRate) : null,
      hourlyRate: o.hourlyRate ? Number(o.hourlyRate) : null,
      currency: o.currency,
      governorate: o.governorate,
      city: o.city,
      status: o.status,
      viewCount: o.viewCount,
      createdAt: o.createdAt.getTime(),
    }));
    if (operatorDocs.length > 0) {
      await this.meili.index(INDEXES.OPERATORS).addDocuments(operatorDocs);
    }
    counts.operators = operatorDocs.length;

    this.logger.log(`🔄 Reindex complete: ${JSON.stringify(counts)}`);
    return { message: 'Reindex complete', counts };
  }

  // ══════════════════════════════════════════
  // Private helpers
  // ══════════════════════════════════════════

  /**
   * Convert Prisma Decimal and Date fields to serializable values.
   */
  private serializeDocument(doc: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(doc)) {
      if (value === undefined || value === null) {
        result[key] = null;
      } else if (typeof value === 'object' && 'toNumber' in (value as any)) {
        // Prisma Decimal
        result[key] = (value as any).toNumber();
      } else if (value instanceof Date) {
        result[key] = value.getTime();
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Build Meilisearch filter expressions from DTO.
   */
  private buildFilters(dto: SearchQueryDto): string[] {
    const filters: string[] = [];

    if (dto.minPrice !== undefined) {
      filters.push(`price >= ${dto.minPrice}`);
    }
    if (dto.maxPrice !== undefined) {
      filters.push(`price <= ${dto.maxPrice}`);
    }
    if (dto.category) {
      // category maps to different fields per entity
      // Use OR across possible category fields
      filters.push(`(partCategory = "${dto.category}" OR serviceType = "${dto.category}")`);
    }
    if (dto.city) {
      filters.push(`city = "${dto.city}"`);
    }
    if (dto.governorate) {
      filters.push(`governorate = "${dto.governorate}"`);
    }
    if (dto.make) {
      filters.push(`make = "${dto.make}"`);
    }
    if (dto.condition) {
      filters.push(`condition = "${dto.condition}"`);
    }
    if (dto.listingType) {
      filters.push(`listingType = "${dto.listingType}"`);
    }

    // Only show active listings
    filters.push(`status = "ACTIVE"`);

    return filters;
  }

  /**
   * Build Meilisearch sort array from sortBy param.
   */
  private buildSort(sortBy?: string, entityType?: string): string[] {
    switch (sortBy) {
      case 'price:asc':
        return this.getPriceSortField(entityType, 'asc');
      case 'price:desc':
        return this.getPriceSortField(entityType, 'desc');
      case 'newest':
      default:
        return ['createdAt:desc'];
    }
  }

  /**
   * Get the correct price field for sorting based on entity type.
   */
  private getPriceSortField(entityType?: string, direction: 'asc' | 'desc' = 'asc'): string[] {
    switch (entityType) {
      case 'services':
        return [`priceFrom:${direction}`];
      default:
        return [`price:${direction}`];
    }
  }
}
