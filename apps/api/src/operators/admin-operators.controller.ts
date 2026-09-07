import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { OperatorsService } from './operators.service';
import { AdminReviewDeletionDto } from './dto/admin-review-deletion.dto';
import { AdminListDeletionRequestsDto } from './dto/admin-list-deletion-requests.dto';

@Controller('admin/operators')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Get('deletion-requests')
  listDeletionRequests(@Query() query: AdminListDeletionRequestsDto) {
    const pageNum = query.page ?? 1;
    const limitNum = query.limit ?? 20;
    return this.operatorsService.adminListDeletionRequests(query.status, pageNum, limitNum);
  }

  @Patch('deletion-requests/:id')
  reviewDeletion(
    @Param('id') id: string,
    @Body() dto: AdminReviewDeletionDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.operatorsService.adminReviewDeletion(
      id,
      admin.sub,
      dto.decision,
      dto.rejectionReason,
    );
  }
}
