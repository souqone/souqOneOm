import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import type { JwtPayload } from '../auth/auth.types';
import { JobsService } from './jobs.service';
import { DriverProfileService } from './driver-profile.service';
import { EmployerProfileService } from './employer-profile.service';
import { JobInviteService } from './job-invite.service';
import { DriverVerificationService } from './driver-verification.service';
import { JobEscrowService } from './job-escrow.service';
import { JobRecommendationService } from './job-recommendation.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { ApplyJobDto } from './dto/apply-job.dto';
import { CreateDriverProfileDto } from './dto/create-driver-profile.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { CreateEmployerProfileDto } from './dto/create-employer-profile.dto';
import { UpdateEmployerProfileDto } from './dto/update-employer-profile.dto';
import { QueryDriversDto } from './dto/query-drivers.dto';
import { ApplicationStatus } from '@prisma/client';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly driverProfileService: DriverProfileService,
    private readonly employerProfileService: EmployerProfileService,
    private readonly jobInviteService: JobInviteService,
    private readonly verificationService: DriverVerificationService,
    private readonly escrowService: JobEscrowService,
    private readonly recommendationService: JobRecommendationService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateJobDto, @CurrentUser() user: JwtPayload) {
    return this.jobsService.create(user.sub, dto);
  }

  @Get()
  findAll(@Query() query: QueryJobsDto) {
    return this.jobsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('recommended')
  getRecommended(@CurrentUser() user: JwtPayload) {
    return this.recommendationService.getRecommended(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  myJobs(@CurrentUser() user: JwtPayload, @Query() query: PaginationQueryDto) {
    return this.jobsService.myJobs(
      user.sub,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  // ─── Driver Profile ───
  @UseGuards(JwtAuthGuard)
  @Post('driver-profile')
  createDriverProfile(@Body() dto: CreateDriverProfileDto, @CurrentUser() user: JwtPayload) {
    return this.driverProfileService.create(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('driver-profile/me')
  getMyDriverProfile(@CurrentUser() user: JwtPayload) {
    return this.driverProfileService.getMyProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('driver-profile')
  updateDriverProfile(@Body() dto: UpdateDriverProfileDto, @CurrentUser() user: JwtPayload) {
    return this.driverProfileService.update(user.sub, dto);
  }

  @Get('drivers')
  findDrivers(@Query() query: QueryDriversDto) {
    return this.driverProfileService.findAll(query);
  }

  @Get('drivers/:id/reviews')
  getDriverReviews(@Param('id') id: string, @Query() query: any) {
    return this.driverProfileService.getReviews(id, query);
  }

  @Get('drivers/:id')
  findDriver(@Param('id') id: string) {
    return this.driverProfileService.findOne(id);
  }

  // ─── Employer Profile ───
  @UseGuards(JwtAuthGuard)
  @Post('employer-profile')
  createEmployerProfile(@Body() dto: CreateEmployerProfileDto, @CurrentUser() user: JwtPayload) {
    return this.employerProfileService.create(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('employer-profile/me')
  getMyEmployerProfile(@CurrentUser() user: JwtPayload) {
    return this.employerProfileService.getMyProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('employer-profile')
  updateEmployerProfile(@Body() dto: UpdateEmployerProfileDto, @CurrentUser() user: JwtPayload) {
    return this.employerProfileService.update(user.sub, dto);
  }

  @Get('employers/:id')
  findEmployer(@Param('id') id: string) {
    return this.employerProfileService.findOne(id);
  }

  // ─── Invites ───
  @UseGuards(JwtAuthGuard)
  @Get('invites/my')
  getMyInvites(@CurrentUser() user: JwtPayload) {
    return this.jobInviteService.getMyInvites(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/invite/:driverId')
  inviteDriver(
    @Param('id') jobId: string,
    @Param('driverId') driverId: string,
    @Body('message') message: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.jobInviteService.invite(decodeURIComponent(jobId), user.sub, driverId, message);
  }

  // ─── Verification ───
  @UseGuards(JwtAuthGuard)
  @Post('verification/submit')
  submitVerification(
    @Body() body: { licenseImageUrl: string; idImageUrl: string; notes?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.verificationService.submit(user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('verification/status')
  getVerificationStatus(@CurrentUser() user: JwtPayload) {
    return this.verificationService.getMyStatus(user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/verifications')
  adminListVerifications(@Query('status') status?: string) {
    return this.verificationService.adminList(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/verifications/:id')
  adminReviewVerification(
    @Param('id') id: string,
    @Body() body: { decision: 'APPROVED' | 'REJECTED'; rejectionReason?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.verificationService.adminReview(id, user.sub, body.decision, body.rejectionReason);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('invites/:id')
  respondToInvite(
    @Param('id') inviteId: string,
    @Body('status') status: 'ACCEPTED' | 'DECLINED',
    @CurrentUser() user: JwtPayload,
  ) {
    return this.jobInviteService.respond(inviteId, user.sub, status);
  }

  // ─── Escrow ───
  @UseGuards(JwtAuthGuard)
  @Post('applications/:id/pay')
  payForApplication(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.escrowService.pay(id, user.sub, amount);
  }

  @UseGuards(JwtAuthGuard)
  @Post('escrow/:id/release')
  releaseEscrow(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.escrowService.release(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('escrow/:id/dispute')
  disputeEscrow(
    @Param('id') id: string,
    @Body('reason') reason: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.escrowService.dispute(id, user.sub, reason);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.jobsService.findOne(decodeURIComponent(id), req.ip);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobDto, @CurrentUser() user: JwtPayload) {
    return this.jobsService.update(decodeURIComponent(id), user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.jobsService.remove(decodeURIComponent(id), user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/apply')
  apply(@Param('id') jobId: string, @Body() dto: ApplyJobDto, @CurrentUser() user: JwtPayload) {
    return this.jobsService.apply(decodeURIComponent(jobId), user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/applications')
  getApplications(@Param('id') jobId: string, @CurrentUser() user: JwtPayload) {
    return this.jobsService.getApplications(decodeURIComponent(jobId), user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('applications/:id')
  updateApplicationStatus(
    @Param('id') applicationId: string,
    @Body('status') status: ApplicationStatus,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.jobsService.updateApplicationStatus(applicationId, user.sub, status);
  }

  @UseGuards(JwtAuthGuard)
  @Post('applications/:id/withdraw')
  withdrawApplication(@Param('id') applicationId: string, @CurrentUser() user: JwtPayload) {
    return this.jobsService.withdrawApplication(applicationId, user.sub);
  }
}
