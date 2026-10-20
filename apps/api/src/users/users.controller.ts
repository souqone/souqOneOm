import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { LinkGoogleDto } from './dto/link-google.dto';
import { LinkAppleDto } from './dto/link-apple.dto';
import { ExpoPushService } from '../notifications/expo-push.service';
import { ExposePhone } from '../common/decorators/expose-phone.decorator';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly expoPushService: ExpoPushService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ExposePhone()
  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ExposePhone()
  @Patch('me')
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/sessions')
  getActiveSessions(@CurrentUser() user: JwtPayload) {
    return this.usersService.getActiveSessions(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/sessions/:sessionId')
  revokeSession(@CurrentUser() user: JwtPayload, @Param('sessionId') sessionId: string) {
    return this.usersService.revokeSession(user.sub, sessionId);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('me/sessions/revoke-all')
  revokeAllSessions(@CurrentUser() user: JwtPayload) {
    return this.usersService.revokeAllSessions(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/login-history')
  getLoginHistory(@CurrentUser() user: JwtPayload) {
    return this.usersService.getLoginHistory(user.sub);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('me/delete-account')
  deleteAccount(@CurrentUser() user: JwtPayload, @Body() dto: DeleteAccountDto) {
    return this.usersService.scheduleAccountDeletion(user.sub, dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('me/cancel-deletion')
  cancelDeletion(@CurrentUser() user: JwtPayload) {
    return this.usersService.cancelAccountDeletion(user.sub);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('me/link/google')
  linkGoogle(
    @CurrentUser() user: JwtPayload,
    @Body() dto: LinkGoogleDto,
    @Req() req: Request,
  ) {
    return this.usersService.linkGoogle(user.sub, dto, req.ip, req.headers['user-agent']);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('me/link/apple')
  linkApple(
    @CurrentUser() user: JwtPayload,
    @Body() dto: LinkAppleDto,
    @Req() req: Request,
  ) {
    return this.usersService.linkApple(user.sub, dto, req.ip, req.headers['user-agent']);
  }

  @UseGuards(JwtAuthGuard)
  @Post('push-token')
  async registerPushToken(
    @Body() dto: RegisterPushTokenDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.expoPushService.registerToken(user.sub, dto.token, dto.deviceType);
    return { success: true };
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}

