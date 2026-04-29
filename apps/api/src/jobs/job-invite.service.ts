import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class JobInviteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /* ───── INVITE DRIVER ───── */
  async invite(jobId: string, inviterId: string, inviteeId: string, message?: string) {
    // Verify job exists and belongs to inviter
    const job = await this.prisma.driverJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('الوظيفة غير موجودة');
    if (job.userId !== inviterId) throw new ForbiddenException('فقط صاحب الوظيفة يمكنه إرسال دعوة');
    if (job.status !== 'ACTIVE') throw new BadRequestException('لا يمكن إرسال دعوة لوظيفة غير نشطة');

    // Check invitee is not the owner
    if (inviterId === inviteeId) throw new BadRequestException('لا يمكنك دعوة نفسك');

    // Verify invitee has a driver profile
    const driverProfile = await this.prisma.driverProfile.findUnique({
      where: { userId: inviteeId },
    });
    if (!driverProfile) throw new NotFoundException('السائق لا يملك بروفايل');

    // Check duplicate
    const existing = await this.prisma.jobInvite.findUnique({
      where: { jobId_inviteeId: { jobId, inviteeId } },
    });
    if (existing) throw new ConflictException('تم إرسال دعوة لهذا السائق بالفعل');

    const invite = await this.prisma.jobInvite.create({
      data: {
        jobId,
        inviterId,
        inviteeId,
        message,
      },
      include: {
        job: { select: { title: true } },
      },
    });

    // Notify the driver
    await this.notifications.create({
      userId: inviteeId,
      type: 'JOB_APPLICATION' as any,
      title: 'دعوة وظيفة جديدة',
      body: `تمت دعوتك للتقدم على "${invite.job.title}"`,
      data: { jobId, inviteId: invite.id },
    });

    return invite;
  }

  /* ───── MY INVITES (as driver) ───── */
  async getMyInvites(userId: string) {
    return this.prisma.jobInvite.findMany({
      where: { inviteeId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            governorate: true,
            salary: true,
            salaryPeriod: true,
            currency: true,
            status: true,
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
          },
        },
      },
    });
  }

  /* ───── SENT INVITES (as employer) ───── */
  async getSentInvites(userId: string, jobId: string) {
    // Verify job ownership
    const job = await this.prisma.driverJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('الوظيفة غير موجودة');
    if (job.userId !== userId) throw new ForbiddenException('غير مصرح');

    return this.prisma.jobInvite.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ───── RESPOND TO INVITE ───── */
  async respond(inviteId: string, userId: string, status: 'ACCEPTED' | 'DECLINED') {
    const invite = await this.prisma.jobInvite.findUnique({
      where: { id: inviteId },
      include: { job: { select: { title: true, userId: true } } },
    });
    if (!invite) throw new NotFoundException('الدعوة غير موجودة');
    if (invite.inviteeId !== userId) throw new ForbiddenException('غير مصرح لك بالرد على هذه الدعوة');
    if (invite.status !== 'PENDING') {
      throw new BadRequestException(`لا يمكن تغيير حالة الدعوة — الحالة الحالية: ${invite.status}`);
    }

    const updated = await this.prisma.jobInvite.update({
      where: { id: inviteId },
      data: { status },
    });

    // Notify the employer
    const statusText = status === 'ACCEPTED' ? 'قبل' : 'رفض';
    await this.notifications.create({
      userId: invite.job.userId,
      type: 'JOB_APPLICATION' as any,
      title: `${statusText} الدعوة`,
      body: `${statusText} السائق دعوتك على "${invite.job.title}"`,
      data: { jobId: invite.jobId, inviteId },
    });

    return updated;
  }
}
