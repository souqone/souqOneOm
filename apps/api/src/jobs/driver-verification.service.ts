import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DriverVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /* ───── SUBMIT VERIFICATION ───── */
  async submit(userId: string, data: { licenseImageUrl: string; idImageUrl: string; notes?: string }) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('يجب إنشاء بروفايل سائق أولاً');

    if (profile.isVerified) throw new ConflictException('حسابك موثّق بالفعل');

    // Check for pending verification
    const pending = await this.prisma.driverVerification.findFirst({
      where: { driverProfileId: profile.id, status: 'PENDING' },
    });
    if (pending) throw new ConflictException('لديك طلب توثيق معلّق بالفعل');

    return this.prisma.driverVerification.create({
      data: {
        driverProfileId: profile.id,
        licenseImageUrl: data.licenseImageUrl,
        idImageUrl: data.idImageUrl,
        notes: data.notes,
      },
    });
  }

  /* ───── GET MY VERIFICATION STATUS ───── */
  async getMyStatus(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('لا يوجد بروفايل سائق');

    return this.prisma.driverVerification.findMany({
      where: { driverProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ───── ADMIN: LIST VERIFICATIONS ───── */
  async adminList(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.driverVerification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        driverProfile: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true, email: true } },
          },
        },
      },
    });
  }

  /* ───── ADMIN: REVIEW ───── */
  async adminReview(
    verificationId: string,
    adminId: string,
    decision: 'APPROVED' | 'REJECTED',
    rejectionReason?: string,
  ) {
    const verification = await this.prisma.driverVerification.findUnique({
      where: { id: verificationId },
      include: { driverProfile: { include: { user: true } } },
    });
    if (!verification) throw new NotFoundException('طلب التوثيق غير موجود');
    if (verification.status !== 'PENDING') {
      throw new BadRequestException(`لا يمكن مراجعة طلب بحالة: ${verification.status}`);
    }

    const updated = await this.prisma.driverVerification.update({
      where: { id: verificationId },
      data: {
        status: decision,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: decision === 'REJECTED' ? rejectionReason : null,
      },
    });

    // If approved, mark driver profile as verified
    if (decision === 'APPROVED') {
      await this.prisma.driverProfile.update({
        where: { id: verification.driverProfileId },
        data: { isVerified: true },
      });
    }

    // Notify the driver — include data.url so the SYSTEM type navigates to their profile
    const statusText = decision === 'APPROVED' ? 'تم توثيق حسابك بنجاح ✓' : `تم رفض طلب التوثيق: ${rejectionReason || 'بدون سبب'}`;
    await this.notifications.create({
      userId: verification.driverProfile.userId,
      type: 'SYSTEM' as any,
      title: decision === 'APPROVED' ? 'تم التوثيق' : 'رُفض التوثيق',
      body: statusText,
      data: { verificationId, url: '/jobs/driver-profile' },
    });

    return updated;
  }
}
