import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Hello World endpoint' })
  @ApiResponse({ status: 200, description: 'Returns hello message' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({
    status: 200,
    description: 'Returns application health status.',
    type: Object,
  })
  async getHealth(): Promise<Record<string, string>> {
    return this.appService.getHealth();
  }

  /**
   * Endpoint ini menggunakan caching untuk menyimpan respons
   * selama 1 jam untuk mengurangi beban database
   */
  @Get('countries')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('all_countries_list')
  @CacheTTL(3600000) // 1 jam dalam milidetik
  @ApiOperation({ summary: 'Get list of countries (cached for 1 hour)' })
  @ApiResponse({ status: 200, description: 'List of countries' })
  getCountries() {
    return this.appService.getCountries();
  }

  /**
   * Endpoint ini menggunakan caching untuk menyimpan respons
   * selama 1 hari karena data timezone jarang berubah
   */
  @Get('timezones')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('all_timezones_list')
  @CacheTTL(86400000) // 24 jam dalam milidetik
  @ApiOperation({ summary: 'Get list of timezones (cached for 24 hours)' })
  @ApiResponse({ status: 200, description: 'List of timezones' })
  getTimezones() {
    return this.appService.getTimezones();
  }
}
