import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApikeyService } from './apikey.service';
import { CreateApikeyDto } from './dto/create-apikey.dto';
import { UpdateApikeyDto } from './dto/update-apikey.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyEntity } from './entities/api-key.entity';
import { ApiLogEntity } from './entities/api-log.entity';
import { RequireApiKey } from '@src/auth/decorators/require-apikey.decorator';
import { PERMISSIONS_KEY } from '@src/const/permissions';
import { RequirePermissions } from '@src/auth/permissions/permissions.decorator';
import { Public } from '@src/auth/decorators/public.decorator';
@ApiTags('api-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
@Public()
@RequireApiKey(false)
export class ApikeyController {
  constructor(private readonly apikeyService: ApikeyService) {}

  @Post()
  @ApiOperation({ summary: 'Membuat API key baru' })
  @ApiResponse({
    status: 201,
    description: 'API key berhasil dibuat',
    type: ApiKeyEntity,
  })
  @ApiResponse({ status: 400, description: 'Data tidak valid' })
  @ApiResponse({ status: 404, description: 'Perusahaan tidak ditemukan' })
  @RequirePermissions(PERMISSIONS_KEY.API_KEY_CREATE)
  create(@Body() createApikeyDto: CreateApikeyDto) {
    console.log(createApikeyDto);
    return this.apikeyService.create(createApikeyDto);
  }

  @Get('company/:companyId')
  @ApiOperation({
    summary: 'Mendapatkan semua API key untuk perusahaan tertentu',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar API key berhasil diambil',
    type: [ApiKeyEntity],
  })
  @ApiResponse({ status: 404, description: 'API key tidak ditemukan' })
  @RequirePermissions(PERMISSIONS_KEY.API_KEY_READ)
  findAllByCompany(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.apikeyService.findAllByCompany(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan API key berdasarkan ID' })
  @ApiResponse({
    status: 200,
    description: 'API key berhasil diambil',
    type: ApiKeyEntity,
  })
  @ApiResponse({ status: 404, description: 'API key tidak ditemukan' })
  @RequirePermissions(PERMISSIONS_KEY.API_KEY_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.apikeyService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mengupdate API key' })
  @ApiResponse({
    status: 200,
    description: 'API key berhasil diupdate',
    type: ApiKeyEntity,
  })
  @ApiResponse({ status: 404, description: 'API key tidak ditemukan' })
  @RequirePermissions(PERMISSIONS_KEY.API_KEY_UPDATE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApikeyDto: UpdateApikeyDto,
  ) {
    return this.apikeyService.update(id, updateApikeyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Menghapus API key' })
  @ApiResponse({
    status: 200,
    description: 'API key berhasil dihapus',
    type: ApiKeyEntity,
  })
  @ApiResponse({ status: 404, description: 'API key tidak ditemukan' })
  @RequirePermissions(PERMISSIONS_KEY.API_KEY_DELETE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.apikeyService.remove(id);
  }

  @Get(':id/logs')
  @ApiOperation({
    summary: 'Mendapatkan log penggunaan API untuk API key tertentu',
  })
  @ApiResponse({
    status: 200,
    description: 'Log API berhasil diambil',
    type: [ApiLogEntity],
  })
  @ApiResponse({ status: 404, description: 'API key tidak ditemukan' })
  @RequirePermissions(PERMISSIONS_KEY.API_KEY_READ)
  getApiLogs(@Param('id', ParseIntPipe) id: number) {
    return this.apikeyService.getApiLogs(id);
  }
}
