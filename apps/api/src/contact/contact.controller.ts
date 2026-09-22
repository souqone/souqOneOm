import {
  Controller,
  Get,
  Param,
  UseGuards,
  Header,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { ContactService } from './contact.service';

@ApiTags('Contact')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Get contact details for an entity (owner phone / whatsapp)' })
  @Get(':entityType/:entityId')
  async getContact(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (entityType !== 'LISTING') {
      throw new NotFoundException('جهة الاتصال غير موجودة');
    }
    return this.contactService.getContact(entityType, entityId, user.sub);
  }
}
