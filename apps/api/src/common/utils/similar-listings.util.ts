import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { assertPublicOrOwner, VisibilityViewer } from '../public-visibility';
import { VisibilityPrismaDelegateName } from '../constants/owner-visibility.registry';
import { RedisService } from '../../redis/redis.service';

/**
 * Vertical-agnostic "similar listings" ranking (price proximity, then recency).
 *
 * Works with any Prisma model delegate (prisma.busListing, prisma.equipmentListing, ...).
 * The caller supplies the vertical-specific `where` fragments and how to read the price;
 * this helper owns the narrow -> rank -> broaden pipeline so every vertical behaves the same.
 */

export const SIMILAR_DEFAULT_LIMIT = 8;
export const SIMILAR_MIN_LIMIT = 1;
export const SIMILAR_MAX_LIMIT = 20;
export const SIMILAR_CACHE_TTL_SECONDS = 300; // 5 minutes

export function clampSimilarLimit(limit = SIMILAR_DEFAULT_LIMIT): number {
  return Math.min(Math.max(Math.trunc(limit) || SIMILAR_DEFAULT_LIMIT, SIMILAR_MIN_LIMIT), SIMILAR_MAX_LIMIT);
}

export function buildSimilarPriceWindow(
  priceField: string,
  referencePrice: unknown,
  enabled = true,
): Record<string, any> {
  if (!enabled) return {};
  const refNum = toNumber(referencePrice);
  if (refNum <= 0) return {};
  return {
    [priceField]: {
      gte: new Prisma.Decimal(refNum * 0.7),
      lte: new Prisma.Decimal(refNum * 1.3),
    },
  };
}

export interface SimilarDelegate {
  findMany(args: any): Promise<any[]>;
}

export interface SimilarOriginDelegate extends SimilarDelegate {
  findFirst(args: any): Promise<any>;
}

export interface ExecuteSimilarQueryOptions<TOriginal = any, TItem = any> {
  model: VisibilityPrismaDelegateName;
  delegate: SimilarOriginDelegate;
  id: string;
  limit?: number;
  viewer?: VisibilityViewer | string | null;
  notFoundMessage: string;
  originalSelect: Record<string, boolean>;
  ownerField?: 'userId' | 'sellerId';
  redis?: RedisService;
  cachePrefix?: string;
  cacheTtlSeconds?: number;
  buildSearch: (original: TOriginal, safeLimit: number) => Omit<SimilarListingsOptions, 'delegate' | 'excludeId' | 'limit'>;
  transformResults?: (items: any[]) => TItem[];
}

/**
 * Shared execution pipeline for `GET /:vertical/:id/similar` across Buses, Equipment, Parts, and Services:
 * 1. Clamps limit (`Math.trunc(limit) || 8`, clamped 1..20).
 * 2. Fetches original record with `deletedAt: null` and runs visibility gate BEFORE checking cache.
 * 3. Checks Redis cache (`${cachePrefix}:similar:${id}:${safeLimit}`) when `redis` + `cachePrefix` are provided.
 * 4. Runs `findSimilarListings` (narrow -> rank by price proximity -> broader fallback).
 * 5. Transforms results (if needed) and writes to Redis cache.
 */
export async function executeSimilarListingsQuery<TOriginal = any, TItem = any>(
  opts: ExecuteSimilarQueryOptions<TOriginal, TItem>,
): Promise<TItem[]> {
  const safeLimit = clampSimilarLimit(opts.limit);

  const original = await opts.delegate.findFirst({
    where: { id: opts.id, deletedAt: null },
    select: opts.originalSelect,
  });
  if (!original) {
    throw new NotFoundException(opts.notFoundMessage);
  }

  const ownerField = opts.ownerField ?? 'userId';
  assertPublicOrOwner(opts.model, original, original[ownerField], opts.viewer, opts.notFoundMessage);

  const cacheKey =
    opts.redis && opts.cachePrefix ? `${opts.cachePrefix}:similar:${opts.id}:${safeLimit}` : undefined;
  if (opts.redis && cacheKey) {
    const cached = await opts.redis.get<TItem[]>(cacheKey);
    if (cached) return cached;
  }

  const searchOpts = opts.buildSearch(original as TOriginal, safeLimit);
  const rawItems = await findSimilarListings({
    delegate: opts.delegate,
    excludeId: opts.id,
    limit: safeLimit,
    ...searchOpts,
  });

  const result = opts.transformResults ? opts.transformResults(rawItems) : (rawItems as TItem[]);
  if (opts.redis && cacheKey) {
    await opts.redis.set(cacheKey, result, opts.cacheTtlSeconds ?? SIMILAR_CACHE_TTL_SECONDS);
  }
  return result;
}

export interface SimilarListingsOptions {
  delegate: SimilarDelegate;
  /** Id of the listing the user is looking at (always excluded). */
  excludeId: string;
  limit: number;
  /** Applied to every pass (status ACTIVE, deletedAt null, same listing type ...). */
  baseWhere: Record<string, any>;
  /** First, strict pass (same make/model, year window, price window ...). */
  narrowWhere: Record<string, any>;
  /** Fallback pass used to top up when the strict pass returns fewer than `limit`. */
  broaderWhere?: Record<string, any>;
  /** Price of the reference listing; <= 0 / null disables price ranking. */
  referencePrice: unknown;
  /** Reads the comparable price from a candidate row. */
  priceOf: (row: any) => unknown;
  /** Prisma `include` / `select` shape for the returned rows. */
  query: { include?: Record<string, any>; select?: Record<string, any> };
}

export function toNumber(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && typeof (val as any).toNumber === 'function') return (val as any).toNumber();
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

/** Sorts by closeness to `reference` price, ties broken by newest first. */
export function rankByPriceProximity<T extends { createdAt: Date | string }>(
  rows: T[],
  reference: number,
  priceOf: (row: T) => unknown,
): T[] {
  return [...rows].sort((a, b) => {
    const diffA = Math.abs(toNumber(priceOf(a)) - reference);
    const diffB = Math.abs(toNumber(priceOf(b)) - reference);
    if (diffA !== diffB) return diffA - diffB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function findSimilarListings(opts: SimilarListingsOptions): Promise<any[]> {
  const { delegate, excludeId, limit, baseWhere, narrowWhere, broaderWhere, query } = opts;
  const reference = toNumber(opts.referencePrice);
  const hasPrice = reference > 0;

  const narrow = await delegate.findMany({
    where: { ...baseWhere, ...narrowWhere, id: { not: excludeId } },
    orderBy: { createdAt: 'desc' },
    take: limit * 3,
    ...query,
  });

  const ranked = hasPrice ? rankByPriceProximity(narrow, reference, opts.priceOf) : narrow;
  let results = ranked.slice(0, limit);

  if (results.length < limit && broaderWhere) {
    const broader = await delegate.findMany({
      where: {
        ...baseWhere,
        ...broaderWhere,
        id: { notIn: [excludeId, ...results.map((r) => r.id)] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit - results.length,
      ...query,
    });
    results = [...results, ...broader];
  }

  return results;
}
