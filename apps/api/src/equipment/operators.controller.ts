import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { OperatorsService } from './operators.service';
import { CreateOperatorListingDto } from './dto/create-operator-listing.dto';
import { UpdateOperatorListingDto } from './dto/update-operator-listing.dto';
import { QueryOperatorListingsDto } from './dto/query-operator-listings.dto';

@Controller('operators')
export class OperatorsController {
  constructor(private readonly svc: OperatorsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateOperatorListingDto, @CurrentUser() user: JwtPayload) {
    return this.svc.create(dto, user.sub);
  }

  @Get()
  findAll(@Query() query: QueryOperatorListingsDto) {
    return this.svc.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  my(@CurrentUser() user: JwtPayload) {
    return this.svc.my(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOperatorListingDto, @CurrentUser() user: JwtPayload) {
    return this.svc.update(id, user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.remove(id, user.sub);
  }
}
