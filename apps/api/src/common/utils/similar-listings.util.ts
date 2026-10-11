/**
 * Vertical-agnostic "similar listings" ranking (price proximity, then recency).
 *
 * Works with any Prisma model delegate (prisma.busListing, prisma.equipmentListing, ...).
 * The caller supplies the vertical-specific `where` fragments and how to read the price;
 * this helper owns the narrow -> rank -> broaden pipeline so every vertical behaves the same.
 */

export interface SimilarDelegate {
  findMany(args: any): Promise<any[]>;
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
