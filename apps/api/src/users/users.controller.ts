import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { ExpoPushService } from '../notifications/expo-push.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly expoPushService: ExpoPushService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.sub, dto);
  }

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

