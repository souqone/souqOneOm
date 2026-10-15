import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ExposePhone } from '../common/decorators/expose-phone.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { AdminUsersService } from './admin-users.service';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { QueryAdminAuditLogsDto } from './dto/query-admin-audit-logs.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { UnsuspendUserDto } from './dto/unsuspend-user.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { UnbanUserDto } from './dto/unban-user.dto';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';

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

  /* ══════════════════════════════════════════════════════════════
     2. MUTATION ENDPOINTS
     ══════════════════════════════════════════════════════════════ */

  @Roles('ADMIN', 'MODERATOR')
  @HttpCode(HttpStatus.OK)
  @Post(':id/suspend')
  suspendUser(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SuspendUserDto,
    @Req() req: Request,
  ) {
    return this.adminUsersService.suspendUser(
      admin,
      id,
      dto,
      req.ip,
      req.headers['user-agent'] as string | undefined,
    );
  }

  @Roles('ADMIN', 'MODERATOR')
  @HttpCode(HttpStatus.OK)
  @Post(':id/unsuspend')
  unsuspendUser(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UnsuspendUserDto,
    @Req() req: Request,
  ) {
    return this.adminUsersService.unsuspendUser(
      admin,
      id,
      dto,
      req.ip,
      req.headers['user-agent'] as string | undefined,
    );
  }

  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @Post(':id/ban')
  banUser(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: BanUserDto,
    @Req() req: Request,
  ) {
    return this.adminUsersService.banUser(
      admin,
      id,
      dto,
      req.ip,
      req.headers['user-agent'] as string | undefined,
    );
  }

  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @Post(':id/unban')
  unbanUser(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UnbanUserDto,
    @Req() req: Request,
  ) {
    return this.adminUsersService.unbanUser(
      admin,
      id,
      dto,
      req.ip,
      req.headers['user-agent'] as string | undefined,
    );
  }

  @Roles('ADMIN')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Patch(':id/role')
  changeUserRole(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ChangeUserRoleDto,
    @Req() req: Request,
  ) {
    return this.adminUsersService.changeUserRole(
      admin,
      id,
      dto,
      req.ip,
      req.headers['user-agent'] as string | undefined,
    );
  }
}
