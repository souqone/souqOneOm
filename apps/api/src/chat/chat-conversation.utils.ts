import { PrismaService } from '../prisma/prisma.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';

export interface ChatEntitySummary {
  type: string;
  id: string;
  title: string;
  imageUrl: string | null;
  isSeller: boolean;
  ownerId: string | null;
}

export interface ResolvedEntityMeta {
  ownerId: string;
  title: string;
  imageUrl: string | null;
}

export interface ChatParticipantLike {
  id?: string;
  userId: string;
  lastReadAt?: Date | string | null;
  isArchived?: boolean;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface ChatConversationLike {
  id: string;
  entityType?: string;
  entityId?: string;
  listingId?: string | null;
  listing?: {
    id: string;
    title: string;
    slug?: string | null;
    sellerId?: string;
    images?: Array<{ url: string }>;
  } | null;
  participants: ChatParticipantLike[];
  messages?: unknown[];
  [key: string]: unknown;
}

export function toValidDateOrNull(value: unknown): Date | null {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toIsoOrNull(value: unknown): string | null {
  const date = toValidDateOrNull(value);
  return date ? date.toISOString() : null;
}

export function entitySummaryKey(entityType: string, entityId: string): string {
  return `${entityType}:${entityId}`;
}

export function buildEntitySummary(
  entityType: string,
  entityId: string,
  meta: ResolvedEntityMeta | undefined,
  callerUserId: string,
): ChatEntitySummary {
  if (!meta) {
    return {
      type: entityType,
      id: entityId,
      title: '',
      imageUrl: null,
      isSeller: false,
      ownerId: null,
    };
  }
  return {
    type: entityType,
    id: entityId,
    title: meta.title,
    imageUrl: meta.imageUrl,
    isSeller: meta.ownerId === callerUserId,
    ownerId: meta.ownerId,
  };
}

const IMAGE_TAKE_ONE_SELECT = {
  select: { url: true },
  orderBy: [{ isPrimary: 'desc' as const }, { order: 'asc' as const }],
  take: 1,
};

type BatchEntityFetcher = (
  prisma: PrismaService,
  ids: string[],
) => Promise<Map<string, ResolvedEntityMeta>>;

const BATCH_ENTITY_FETCHERS: Readonly<Record<string, BatchEntityFetcher>> = {
  [ENTITY_TYPES.LISTING]: async (prisma, ids) => {
    const rows = await prisma.listing.findMany({
      where: { id: { in: ids } },
      select: { id: true, sellerId: true, title: true, images: IMAGE_TAKE_ONE_SELECT },
    });
    return new Map(
      rows.map((r) => [
        r.id,
        { ownerId: r.sellerId, title: r.title, imageUrl: r.images?.[0]?.url ?? null },
      ]),
    );
  },
  [ENTITY_TYPES.BUS_LISTING]: async (prisma, ids) => {
    const rows = await prisma.busListing.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true, title: true, images: IMAGE_TAKE_ONE_SELECT },
    });
    return new Map(
      rows.map((r) => [
        r.id,
        { ownerId: r.userId, title: r.title, imageUrl: r.images?.[0]?.url ?? null },
      ]),
    );
  },
  [ENTITY_TYPES.SPARE_PART]: async (prisma, ids) => {
    const rows = await prisma.sparePart.findMany({
      where: { id: { in: ids } },
      select: { id: true, sellerId: true, title: true, images: IMAGE_TAKE_ONE_SELECT },
    });
    return new Map(
      rows.map((r) => [
        r.id,
        { ownerId: r.sellerId, title: r.title, imageUrl: r.images?.[0]?.url ?? null },
      ]),
    );
  },
  [ENTITY_TYPES.CAR_SERVICE]: async (prisma, ids) => {
    const rows = await prisma.carService.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true, title: true, images: IMAGE_TAKE_ONE_SELECT },
    });
    return new Map(
      rows.map((r) => [
        r.id,
        { ownerId: r.userId, title: r.title, imageUrl: r.images?.[0]?.url ?? null },
      ]),
    );
  },
  [ENTITY_TYPES.EQUIPMENT_LISTING]: async (prisma, ids) => {
    const rows = await prisma.equipmentListing.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true, title: true, images: IMAGE_TAKE_ONE_SELECT },
    });
    return new Map(
      rows.map((r) => [
        r.id,
        { ownerId: r.userId, title: r.title, imageUrl: r.images?.[0]?.url ?? null },
      ]),
    );
  },
  [ENTITY_TYPES.OPERATOR_LISTING]: async (prisma, ids) => {
    const rows = await prisma.operatorListing.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true, title: true, profileImageUrl: true },
    });
    return new Map(
      rows.map((r) => [
        r.id,
        { ownerId: r.userId, title: r.title, imageUrl: r.profileImageUrl ?? null },
      ]),
    );
  },
  [ENTITY_TYPES.JOB]: async (prisma, ids) => {
    const rows = await prisma.driverJob.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true, title: true },
    });
    return new Map(
      rows.map((r) => [r.id, { ownerId: r.userId, title: r.title, imageUrl: null }]),
    );
  },
  [ENTITY_TYPES.DRIVER_JOB]: async (prisma, ids) => {
    const rows = await prisma.driverJob.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true, title: true },
    });
    return new Map(
      rows.map((r) => [r.id, { ownerId: r.userId, title: r.title, imageUrl: null }]),
    );
  },
  [ENTITY_TYPES.TRANSPORT_REQUEST]: async (prisma, ids) => {
    const rows = await prisma.transportRequest.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true, cargoDescription: true },
    });
    return new Map(
      rows.map((r) => [r.id, { ownerId: r.userId, title: r.cargoDescription, imageUrl: null }]),
    );
  },
};

/**
 * Resolves entity metadata (ownerId, title, imageUrl) using ONE batched `findMany`
 * per distinct `entityType` present — never one query per conversation.
 */
export async function batchResolveEntityMetadata(
  prisma: PrismaService,
  refs: ReadonlyArray<{ entityType: string; entityId: string }>,
): Promise<Map<string, ResolvedEntityMeta>> {
  const result = new Map<string, ResolvedEntityMeta>();
  const groupedIds = new Map<string, Set<string>>();

  for (const ref of refs) {
    if (!ref.entityType || !ref.entityId) {
      continue;
    }
    let idSet = groupedIds.get(ref.entityType);
    if (!idSet) {
      idSet = new Set<string>();
      groupedIds.set(ref.entityType, idSet);
    }
    idSet.add(ref.entityId);
  }

  for (const [entityType, idSet] of groupedIds.entries()) {
    const fetcher = BATCH_ENTITY_FETCHERS[entityType];
    if (!fetcher || idSet.size === 0) {
      continue;
    }
    const fetched = await fetcher(prisma, [...idSet]);
    for (const [id, meta] of fetched.entries()) {
      result.set(entitySummaryKey(entityType, id), meta);
    }
  }

  return result;
}

export function buildEnrichedConversationResponse<T extends ChatConversationLike>(
  conv: T,
  callerUserId: string,
  options: {
    entityType: string;
    entityId: string;
    entityMeta?: ResolvedEntityMeta;
    unreadCount: number;
    archivedOverride?: boolean;
  },
) {
  const callerParticipant = conv.participants.find((p) => p.userId === callerUserId);
  const otherParticipant = conv.participants.find((p) => p.userId !== callerUserId);
  const entitySummary = buildEntitySummary(
    options.entityType,
    options.entityId,
    options.entityMeta,
    callerUserId,
  );

  return {
    ...conv,
    entityType: options.entityType,
    entityId: options.entityId,
    entityTitle: entitySummary.title,
    entitySummary,
    isSeller: entitySummary.isSeller,
    archived: options.archivedOverride ?? callerParticipant?.isArchived ?? false,
    participants: conv.participants.map((p) => ({
      ...p.user,
      lastReadAt: p.lastReadAt ?? null,
    })),
    createdById: conv.participants[0]?.userId ?? null,
    otherLastReadAt: toIsoOrNull(otherParticipant?.lastReadAt),
    unreadCount: options.unreadCount,
    lastMessage: conv.messages?.[0] ?? null,
  };
}
