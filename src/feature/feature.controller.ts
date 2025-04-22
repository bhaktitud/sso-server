import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FeatureService } from './feature.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { FeatureResponseDto } from './dto/feature-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Feature } from '../../generated/mysql';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@src/auth/permissions/permissions.guard';
import { RequirePermissions } from '@src/auth/permissions/permissions.decorator';
import { RequireApiKey } from '@src/auth/decorators/require-apikey.decorator';

@ApiTags('Features Management')
@Controller('features')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@ApiBearerAuth('jwt')
@RequireApiKey(false)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Membuat fitur baru' })
  @ApiBody({ type: CreateFeatureDto })
  @ApiResponse({
    status: 201,
    description: 'Fitur berhasil dibuat.',
    type: FeatureResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validasi gagal.' })
  @ApiResponse({
    status: 409,
    description: 'Fitur dengan nama atau kode tersebut sudah ada.',
  })
  @ApiResponse({
    status: 403,
    description: 'Dilarang. Tidak memiliki izin yang diperlukan.',
  })
  @RequirePermissions('create:feature')
  create(@Body() createFeatureDto: CreateFeatureDto): Promise<Feature> {
    return this.featureService.create(createFeatureDto);
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar semua fitur' })
  @ApiResponse({
    status: 200,
    description: 'Daftar fitur.',
    type: [FeatureResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Dilarang. Tidak memiliki izin yang diperlukan.',
  })
  @RequirePermissions('read:feature')
  findAll(): Promise<Feature[]> {
    return this.featureService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan fitur berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID Fitur', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Detail fitur.',
    type: FeatureResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fitur tidak ditemukan.' })
  @ApiResponse({
    status: 403,
    description: 'Dilarang. Tidak memiliki izin yang diperlukan.',
  })
  @RequirePermissions('read:feature')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Feature> {
    return this.featureService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Memperbarui fitur' })
  @ApiParam({ name: 'id', description: 'ID Fitur', type: Number })
  @ApiBody({ type: UpdateFeatureDto })
  @ApiResponse({
    status: 200,
    description: 'Fitur berhasil diperbarui.',
    type: FeatureResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validasi gagal.' })
  @ApiResponse({ status: 404, description: 'Fitur tidak ditemukan.' })
  @ApiResponse({
    status: 409,
    description: 'Fitur dengan nama atau kode tersebut sudah ada.',
  })
  @ApiResponse({
    status: 403,
    description: 'Dilarang. Tidak memiliki izin yang diperlukan.',
  })
  @RequirePermissions('update:feature')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFeatureDto: UpdateFeatureDto,
  ): Promise<Feature> {
    return this.featureService.update(id, updateFeatureDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Menghapus fitur' })
  @ApiParam({ name: 'id', description: 'ID Fitur', type: Number })
  @ApiResponse({ status: 204, description: 'Fitur berhasil dihapus.' })
  @ApiResponse({ status: 404, description: 'Fitur tidak ditemukan.' })
  @ApiResponse({
    status: 409,
    description:
      'Konflik (misalnya, fitur masih terhubung dengan profil admin).',
  })
  @ApiResponse({
    status: 403,
    description: 'Dilarang. Tidak memiliki izin yang diperlukan.',
  })
  @RequirePermissions('delete:feature')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.featureService.remove(id);
  }

  @Post(':featureId/admin/:adminId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Menetapkan fitur ke admin' })
  @ApiParam({ name: 'featureId', description: 'ID Fitur', type: Number })
  @ApiParam({ name: 'adminId', description: 'ID Admin', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Fitur berhasil ditetapkan ke admin.',
  })
  @ApiResponse({
    status: 404,
    description: 'Fitur atau admin tidak ditemukan.',
  })
  @ApiResponse({
    status: 403,
    description: 'Dilarang. Tidak memiliki izin yang diperlukan.',
  })
  @RequirePermissions('update:feature')
  async assignToAdmin(
    @Param('featureId', ParseIntPipe) featureId: number,
    @Param('adminId', ParseIntPipe) adminId: number,
  ): Promise<void> {
    await this.featureService.assignToAdmin(featureId, adminId);
  }

  @Delete(':featureId/admin/:adminId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Menghapus fitur dari admin' })
  @ApiParam({ name: 'featureId', description: 'ID Fitur', type: Number })
  @ApiParam({ name: 'adminId', description: 'ID Admin', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Fitur berhasil dihapus dari admin.',
  })
  @ApiResponse({
    status: 404,
    description: 'Fitur atau admin tidak ditemukan.',
  })
  @ApiResponse({
    status: 403,
    description: 'Dilarang. Tidak memiliki izin yang diperlukan.',
  })
  @RequirePermissions('update:feature')
  async removeFromAdmin(
    @Param('featureId', ParseIntPipe) featureId: number,
    @Param('adminId', ParseIntPipe) adminId: number,
  ): Promise<void> {
    await this.featureService.removeFromAdmin(featureId, adminId);
  }
}
