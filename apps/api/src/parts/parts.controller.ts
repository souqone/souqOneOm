import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { PartsService } from './parts.service';
import { CreatePartDto } from './dto/create-part.dto';
import { QueryPartsDto } from './dto/query-parts.dto';

@Controller('parts')
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreatePartDto, @CurrentUser() user: JwtPayload) {
    return this.partsService.create(dto, user.sub);
  }

  @Get()
  findAll(@Query() query: QueryPartsDto) {
    return this.partsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  myParts(@CurrentUser() user: JwtPayload) {
    return this.partsService.myParts(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreatePartDto>, @CurrentUser() user: JwtPayload) {
    return this.partsService.update(id, user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.partsService.remove(id, user.sub);
  }
}
