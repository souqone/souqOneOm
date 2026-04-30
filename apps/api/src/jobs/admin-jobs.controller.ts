import {
  Controller, Get, Patch, Delete, Body, Param, Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { AdminJobsService } from './admin-jobs.service';
import { DriverVerificationService } from './driver-verification.service';

@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminJobsController {
  constructor(
    private readonly adminJobsService: AdminJobsService,
    private readonly verificationService: DriverVerificationService,
  ) {}

  @Get()
  listJobs(@Query() query: any) {
    return this.adminJobsService.listJobs(query);
  }

  @Get('stats')
  getStats() {
    return this.adminJobsService.getStats();
  }

  @Patch(':id')
  updateJob(@Param('id') id: string, @Body() body: any) {
    return this.adminJobsService.updateJob(id, body);
  }

  @Delete(':id')
  deleteJob(@Param('id') id: string) {
    return this.adminJobsService.deleteJob(id);
  }

  @Get('drivers')
  listDrivers(@Query() query: any) {
    return this.adminJobsService.listDrivers(query);
  }

  @Get('employers')
  listEmployers(@Query() query: any) {
    return this.adminJobsService.listEmployers(query);
  }

  @Get('verifications')
  listVerifications(@Query('status') status?: string) {
    return this.verificationService.adminList(status);
  }

  @Patch('verifications/:id')
  reviewVerification(
    @Param('id') id: string,
    @Body() body: { decision: 'APPROVED' | 'REJECTED'; rejectionReason?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.verificationService.adminReview(id, user.sub, body.decision, body.rejectionReason);
  }
}
