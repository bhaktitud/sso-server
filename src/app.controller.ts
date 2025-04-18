import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get a simple hello message' })
  @ApiResponse({
    status: 200,
    description: 'Returns hello message.',
    type: String,
  })
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
}
