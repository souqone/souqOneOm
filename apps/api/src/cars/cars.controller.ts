import { Controller, Get, Param, Query } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarFilterDto } from './dto/car-filter.dto';
import { BrandSearchDto } from './dto/brand-search.dto';

@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  /**
   * GET /cars/brands
   * Query: ?popular=true
   */
  @Get('brands')
  async getBrands(@Query('popular') popular?: string) {
    const isPopular = popular === 'true' ? true : popular === 'false' ? false : undefined;
    return this.carsService.findAllBrands(isPopular);
  }

  /**
   * GET /cars/brands/search?q=toyo&limit=10
   */
  @Get('brands/search')
  async searchBrands(@Query() dto: BrandSearchDto) {
    return this.carsService.searchBrands(dto.q, dto.limit);
  }

  /**
   * GET /cars/brands/:brandId/models
   */
  @Get('brands/:brandId/models')
  async getModelsByBrand(@Param('brandId') brandId: string) {
    return this.carsService.findModelsByBrand(brandId);
  }

  /**
   * GET /cars/models/:modelId/years
   */
  @Get('models/:modelId/years')
  async getYearsByModel(@Param('modelId') modelId: string) {
    return this.carsService.findYearsByModel(modelId);
  }

  /**
   * GET /cars/models/:modelId/trims
   */
  @Get('models/:modelId/trims')
  async getTrimsByModel(@Param('modelId') modelId: string) {
    return this.carsService.findTrimsByModel(modelId);
  }

  /**
   * GET /cars/filter?brandId=...&modelId=...&year=2024&page=1&limit=50
   */
  @Get('filter')
  async filterCars(@Query() dto: CarFilterDto) {
    return this.carsService.filterCars(dto);
  }

  /**
   * GET /cars/full — Full brand → model → year tree
   */
  @Get('full')
  async getFullTree() {
    return this.carsService.getFullTree();
  }

  /**
   * GET /cars/stats — Quick count
   */
  @Get('stats')
  async getStats() {
    return this.carsService.getStats();
  }

}
