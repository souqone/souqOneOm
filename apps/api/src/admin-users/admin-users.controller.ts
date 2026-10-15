import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ExposePhone } from '../common/decorators/expose-phone.decorator';
import { AdminUsersService } from './admin-users.service';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { QueryAdminAuditLogsDto } from './dto/query-admin-audit-logs.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } })
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  /* ══════════════════════════════════════════════════════════════
     1. READ ENDPOINTS
     ══════════════════════════════════════════════════════════════ */

  @Roles('ADMIN', 'MODERATOR')
  @ExposePhone()
  @Get()
  listUsers(@Query() query: QueryAdminUsersDto) {
    return this.adminUsersService.listUsers(query);
  }

  /**
   * Note: Defined BEFORE ':id' to prevent NestJS routing conflict
   * where 'audit-logs' would otherwise be matched as the ':id' parameter.
   */
  @Roles('ADMIN')
  @Get('audit-logs')
  listAuditLogs(@Query() query: QueryAdminAuditLogsDto) {
    return this.adminUsersService.listAuditLogs(query);
  }

  @Roles('ADMIN', 'MODERATOR')
  @ExposePhone()
  @Get(':id')
  getUserDetail(@Param('id') id: string) {
    return this.adminUsersService.getUserDetail(id);
  }
}
