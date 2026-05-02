import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  createConversation(@Body() dto: CreateConversationDto, @CurrentUser() user: JwtPayload) {
    return this.chatService.createOrGetConversation(dto, user.sub);
  }

  @Get('conversations')
  getConversations(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.chatService.getConversations(user.sub, search, includeArchived === 'true');
  }

  @Get('conversations/:id')
  getMessages(
    @Param('id') id: string,
    @Query() query: GetMessagesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.getMessages(id, query, user.sub);
  }

  @Get('conversations/:id/search')
  searchMessages(
    @Param('id') id: string,
    @Query('q') q: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.chatService.searchMessages(id, user!.sub, q, page);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.sendMessage(id, dto, user.sub);
  }

  @Patch('conversations/:id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.chatService.markAsRead(id, user.sub);
  }

  @Patch('conversations/:id/archive')
  archiveConversation(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body('archive') archive?: boolean) {
    return this.chatService.archiveConversation(id, user.sub, archive ?? true);
  }

  @Delete('messages/:id')
  deleteMessage(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.chatService.deleteMessage(id, user.sub);
  }

  @Post('messages/:id/react')
  toggleReaction(@Param('id') id: string, @Body('emoji') emoji: string, @CurrentUser() user: JwtPayload) {
    return this.chatService.toggleReaction(id, user.sub, emoji);
  }
}
