import {
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SearchService } from '../../search/search.service';
import { generateSlug } from '../utils/entity.utils';
import { incrementViewCount } from '../utils/view-count.helper';
import { LISTING_EVENTS, ListingEventPayload } from '../events/listing.events';
import { USER_SELECT_PUBLIC, USER_SELECT_DETAIL } from '../constants/user-select.constant';

export interface ListingConfig {
  /** Prisma model accessor name, e.g. 'carService' */
  modelName: string;
  /** Meilisearch index name */
  meiliIndex: string;
  /** Entity type for polymorphic cleanup, e.g. 'CAR_SERVICE' */
  entityType: string;
  /** 404 message */
  notFoundMsg: string;
  /** Fields that need Prisma.Decimal conversion on update */
  decimalFields?: string[];
  /** Fields that need Date conversion on update */
  dateFields?: string[];
}

const LIST_CACHE_TTL = 300;    // 5 minutes
const DETAIL_CACHE_TTL = 600;  // 10 minutes

// Use centralised constants — see common/constants/user-select.constant.ts

/**
 * Abstract base class for the 3 marketplace listing services:
 * Services, Transport, Trips.
 *
 * Subclasses only need to:
 *  1. Define `config` (model name, meili index, entity type, etc.)
 *  2. Implement `buildCreateData(dto, slug, userId)` — maps DTO → Prisma create data
 *  3. Implement `buildMeiliDoc(item)` — maps DB record → Meilisearch document
 *  4. Implement `buildWhereFilter(query)` — maps query DTO → Prisma where clause
 *  5. Optionally implement `getListInclude()` / `getDetailInclude()` for custom includes
 */
export abstract class BaseListingService {
  protected readonly logger: Logger;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly searchService: SearchService,
    protected readonly redis: RedisService,
    protected readonly eventEmitter: EventEmitter2,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  protected abstract readonly config: ListingConfig;

  protected abstract buildCreateData(dto: any, slug: string, userId: string): any;
  protected abstract buildMeiliDoc(item: any): Record<string, any>;
  protected abstract buildWhereFilter(query: any): any;

  // ──────────────────────────────────
  // Prisma model accessor (dynamic)
  // ──────────────────────────────────
  protected get model(): any {
    return (this.prisma as any)[this.config.modelName];
  }

  private cacheKey(suffix: string): string {
    return `${this.config.modelName}:${suffix}`;
  }

  // ──────────────────────────────────
  // Include configs — override in subclass if needed
  // ──────────────────────────────────
  protected getListInclude(): any {
    return {
      user: { select: USER_SELECT_PUBLIC },
      images: { orderBy: { order: 'asc' }, take: 1 },
    };
  }

  protected getDetailInclude(): any {
    return {
      user: { select: USER_SELECT_DETAIL },
      images: { orderBy: { order: 'asc' } },
    };
  }

  protected getCreateInclude(): any {
    return {
      user: { select: USER_SELECT_PUBLIC },
      images: true,
    };
  }

  // ══════════════════════════════════
  // CREATE
  // ══════════════════════════════════
  async create(dto: any, userId: string) {
    const slug = generateSlug(dto.title);
    const data = this.buildCreateData(dto, slug, userId);

    const item = await this.model.create({
      data,
      include: this.getCreateInclude(),
    });

    this.searchService
      .indexDocument(this.config.meiliIndex as any, this.buildMeiliDoc(item))
      .catch((err) => this.logger.warn(`Failed to index ${this.config.entityType} ${item.id}: ${(err as Error).message}`));

    // Invalidate list cache
    await this.redis.delPattern(this.cacheKey('list:*'));

    // Emit event
    this.emitEvent(LISTING_EVENTS.CREATED, item);

    return item;
  }

  // ══════════════════════════════════
  // FIND ALL (paginated + filtered + cached)
  // ══════════════════════════════════
  async findAll(query: any) {
    const page = parseInt(query.page ?? '1');
    const limit = Math.min(parseInt(query.limit ?? '20'), 50);
    const skip = (page - 1) * limit;

    // Cache key based on query hash
    const queryHash = Buffer.from(JSON.stringify(query)).toString('base64url');
    const cacheKey = this.cacheKey(`list:${queryHash}`);
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const where = { status: 'ACTIVE', ...this.buildWhereFilter(query) };

    const [items, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.getListInclude(),
      }),
      this.model.count({ where }),
    ]);

    const result = { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    await this.redis.set(cacheKey, result, LIST_CACHE_TTL);
    return result;
  }

  // ══════════════════════════════════
  // FIND ONE (with rate-limited viewCount + cache)
  // ══════════════════════════════════
  async findOne(id: string, ip?: string) {
    const cacheKey = this.cacheKey(`detail:${id}`);
    const cached = await this.redis.get<any>(cacheKey);

    let item: any;
    if (cached) {
      item = cached;
    } else {
      item = await this.model.findUnique({
        where: { id },
        include: this.getDetailInclude(),
      });
      if (!item) throw new NotFoundException(this.config.notFoundMsg);
      await this.redis.set(cacheKey, item, DETAIL_CACHE_TTL);
    }

    // Rate-limited view increment
    const shouldCount = await incrementViewCount(
      this.redis, this.config.entityType, id, ip,
    );
    if (shouldCount) {
      await this.model.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    }

    return item;
  }

  // ══════════════════════════════════
  // FIND BY SLUG
  // ══════════════════════════════════
  async findBySlug(slug: string, ip?: string) {
    const item = await this.model.findUnique({
      where: { slug },
      include: this.getDetailInclude(),
    });
    if (!item) throw new NotFoundException(this.config.notFoundMsg);

    // Rate-limited view increment
    const shouldCount = await incrementViewCount(
      this.redis, this.config.entityType, item.id, ip,
    );
    if (shouldCount) {
      await this.model.update({ where: { id: item.id }, data: { viewCount: { increment: 1 } } });
    }

    return item;
  }

  // ══════════════════════════════════
  // MY LISTINGS (paginated)
  // ══════════════════════════════════
  async myListings(userId: string, page = 1, limit = 20) {
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.model.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: this.getListInclude(),
      }),
      this.model.count({ where: { userId } }),
    ]);

    return { items, meta: { total, page, limit: take, totalPages: Math.ceil(total / take) } };
  }

  // ══════════════════════════════════
  // UPDATE (safe field mapping)
  // ══════════════════════════════════
  async update(id: string, userId: string, dto: Record<string, any>) {
    const existing = await this.model.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(this.config.notFoundMsg);
    if (existing.userId !== userId)
      throw new ForbiddenException('غير مصرح لك بتعديل هذا الإعلان');

    const data: Record<string, unknown> = {};
    const decimals = new Set(this.config.decimalFields ?? []);
    const dates = new Set(this.config.dateFields ?? []);

    for (const [key, val] of Object.entries(dto)) {
      if (val === undefined) continue;
      if (decimals.has(key)) {
        data[key] = new Prisma.Decimal(val as number);
      } else if (dates.has(key)) {
        data[key] = new Date(val as string);
      } else {
        data[key] = val;
      }
    }

    const updated = await this.model.update({
      where: { id },
      data,
      include: this.getListInclude(),
    });

    // Sync to Meilisearch
    this.searchService
      .indexDocument(this.config.meiliIndex as any, this.buildMeiliDoc(updated))
      .catch((err) => this.logger.warn(`Failed to index updated ${this.config.entityType} ${updated.id}: ${(err as Error).message}`));

    // Invalidate caches
    await this.redis.del(this.cacheKey(`detail:${id}`));
    await this.redis.delPattern(this.cacheKey('list:*'));

    // Emit event
    this.emitEvent(LISTING_EVENTS.UPDATED, updated);

    return updated;
  }

  // ══════════════════════════════════
  // REMOVE
  // ══════════════════════════════════
  async remove(id: string, userId: string) {
    const existing = await this.model.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(this.config.notFoundMsg);
    if (existing.userId !== userId)
      throw new ForbiddenException('غير مصرح لك بحذف هذا الإعلان');

    await this.model.delete({ where: { id } });
    await this.prisma.cleanupPolymorphicOrphans(this.config.entityType, id);
    this.searchService.removeDocument(this.config.meiliIndex as any, id)
      .catch((err) => this.logger.warn(`Failed to remove ${this.config.entityType} ${id} from search: ${(err as Error).message}`));

    // Invalidate caches
    await this.redis.del(this.cacheKey(`detail:${id}`));
    await this.redis.delPattern(this.cacheKey('list:*'));

    // Emit event
    this.emitEvent(LISTING_EVENTS.DELETED, existing);

    return { message: 'تم حذف الإعلان بنجاح' };
  }

  // ══════════════════════════════════
  // TOGGLE STATUS (ACTIVE ↔ INACTIVE)
  // ══════════════════════════════════
  async toggleStatus(id: string, userId: string) {
    const existing = await this.model.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(this.config.notFoundMsg);
    if (existing.userId !== userId)
      throw new ForbiddenException('غير مصرح لك بتعديل حالة هذا الإعلان');

    const newStatus = existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await this.model.update({
      where: { id },
      data: { status: newStatus },
    });

    // Sync to Meilisearch
    this.searchService
      .indexDocument(this.config.meiliIndex as any, this.buildMeiliDoc(updated))
      .catch((err) => this.logger.warn(`Failed to index status change for ${this.config.entityType} ${updated.id}: ${(err as Error).message}`));

    // Invalidate caches
    await this.redis.del(this.cacheKey(`detail:${id}`));
    await this.redis.delPattern(this.cacheKey('list:*'));

    // Emit event
    this.emitEvent(LISTING_EVENTS.STATUS_CHANGED, updated, newStatus);

    return { message: `تم تغيير الحالة إلى ${newStatus}`, status: newStatus };
  }

  // ══════════════════════════════════
  // EVENT EMITTER HELPER
  // ══════════════════════════════════
  private emitEvent(event: string, item: any, status?: string) {
    try {
      const payload: ListingEventPayload = {
        entityType: this.config.entityType,
        listingId: item.id,
        title: item.title,
        userId: item.userId,
        status,
      };
      this.eventEmitter.emit(event, payload);
    } catch (err) {
      this.logger.error(`Failed to emit ${event}`, err);
    }
  }
}
