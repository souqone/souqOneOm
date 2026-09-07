import { ReviewEntityType } from '@prisma/client';
import { PrismaService } from './prisma.service';

describe('PrismaService - cleanupPolymorphicOrphans', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does NOT include review.deleteMany when entityType is not in ReviewEntityType (e.g. SPARE_PART)', async () => {
    const favoriteOp = { op: 'favorite.deleteMany' };
    const conversationOp = { op: 'conversation.deleteMany' };

    const favoriteSpy = jest
      .spyOn(service.favorite, 'deleteMany')
      .mockReturnValue(favoriteOp as any);
    const conversationSpy = jest
      .spyOn(service.conversation, 'deleteMany')
      .mockReturnValue(conversationOp as any);
    const reviewSpy = jest
      .spyOn(service.review, 'deleteMany')
      .mockReturnValue({ op: 'review.deleteMany' } as any);

    const transactionSpy = jest
      .spyOn(service, '$transaction')
      .mockResolvedValue([{ count: 1 }, { count: 0 }] as any);

    await service.cleanupPolymorphicOrphans('SPARE_PART', 'part-123');

    expect(favoriteSpy).toHaveBeenCalledWith({
      where: { entityType: 'SPARE_PART', entityId: 'part-123' },
    });
    expect(conversationSpy).toHaveBeenCalledWith({
      where: { entityType: 'SPARE_PART', entityId: 'part-123' },
    });
    expect(reviewSpy).not.toHaveBeenCalled();

    expect(transactionSpy).toHaveBeenCalledTimes(1);
    const ops = transactionSpy.mock.calls[0][0] as any[];
    expect(ops).toHaveLength(2);
    expect(ops).toEqual([favoriteOp, conversationOp]);
  });

  it('does NOT include review.deleteMany when entityType is JOB', async () => {
    const favoriteOp = { op: 'favorite.deleteMany' };
    const conversationOp = { op: 'conversation.deleteMany' };

    jest.spyOn(service.favorite, 'deleteMany').mockReturnValue(favoriteOp as any);
    jest.spyOn(service.conversation, 'deleteMany').mockReturnValue(conversationOp as any);
    const reviewSpy = jest.spyOn(service.review, 'deleteMany');

    const transactionSpy = jest
      .spyOn(service, '$transaction')
      .mockResolvedValue([{ count: 0 }, { count: 0 }] as any);

    await service.cleanupPolymorphicOrphans('JOB', 'job-123');

    expect(reviewSpy).not.toHaveBeenCalled();
    const ops = transactionSpy.mock.calls[0][0] as any[];
    expect(ops).toHaveLength(2);
  });

  it('DOES include review.deleteMany when entityType is in ReviewEntityType (e.g. OPERATOR_LISTING)', async () => {
    const favoriteOp = { op: 'favorite.deleteMany' };
    const conversationOp = { op: 'conversation.deleteMany' };
    const reviewOp = { op: 'review.deleteMany' };

    const favoriteSpy = jest
      .spyOn(service.favorite, 'deleteMany')
      .mockReturnValue(favoriteOp as any);
    const conversationSpy = jest
      .spyOn(service.conversation, 'deleteMany')
      .mockReturnValue(conversationOp as any);
    const reviewSpy = jest
      .spyOn(service.review, 'deleteMany')
      .mockReturnValue(reviewOp as any);

    const transactionSpy = jest
      .spyOn(service, '$transaction')
      .mockResolvedValue([{ count: 2 }, { count: 1 }, { count: 3 }] as any);

    await service.cleanupPolymorphicOrphans('OPERATOR_LISTING', 'op-456');

    expect(favoriteSpy).toHaveBeenCalledWith({
      where: { entityType: 'OPERATOR_LISTING', entityId: 'op-456' },
    });
    expect(conversationSpy).toHaveBeenCalledWith({
      where: { entityType: 'OPERATOR_LISTING', entityId: 'op-456' },
    });
    expect(reviewSpy).toHaveBeenCalledWith({
      where: { entityType: ReviewEntityType.OPERATOR_LISTING, entityId: 'op-456' },
    });

    expect(transactionSpy).toHaveBeenCalledTimes(1);
    const ops = transactionSpy.mock.calls[0][0] as any[];
    expect(ops).toHaveLength(3);
    expect(ops).toEqual([favoriteOp, conversationOp, reviewOp]);
  });

  it('DOES include review.deleteMany for other ReviewEntityType values like LISTING and BUS_LISTING', async () => {
    const reviewSpy = jest
      .spyOn(service.review, 'deleteMany')
      .mockReturnValue({} as any);
    jest.spyOn(service.favorite, 'deleteMany').mockReturnValue({} as any);
    jest.spyOn(service.conversation, 'deleteMany').mockReturnValue({} as any);
    jest.spyOn(service, '$transaction').mockResolvedValue([{ count: 0 }, { count: 0 }, { count: 0 }] as any);

    await service.cleanupPolymorphicOrphans('LISTING', 'listing-1');
    expect(reviewSpy).toHaveBeenCalledWith({
      where: { entityType: ReviewEntityType.LISTING, entityId: 'listing-1' },
    });

    await service.cleanupPolymorphicOrphans('BUS_LISTING', 'bus-1');
    expect(reviewSpy).toHaveBeenCalledWith({
      where: { entityType: ReviewEntityType.BUS_LISTING, entityId: 'bus-1' },
    });
  });

  it('catches and logs error without throwing if transaction fails', async () => {
    jest.spyOn(service.favorite, 'deleteMany').mockReturnValue({} as any);
    jest.spyOn(service.conversation, 'deleteMany').mockReturnValue({} as any);
    jest.spyOn(service, '$transaction').mockRejectedValue(new Error('DB failure'));

    await expect(
      service.cleanupPolymorphicOrphans('SPARE_PART', 'part-1'),
    ).resolves.not.toThrow();
  });
});
