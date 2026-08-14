import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('governorates')
  async getGovernorates() {
    return this.locationsService.getGovernorates();
  }

  @Get('wilayas')
  async getWilayas(@Query('governorateId', ParseIntPipe) governorateId: number) {
    return this.locationsService.getWilayas(governorateId);
  }
}
