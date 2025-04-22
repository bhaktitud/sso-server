import { PartialType } from '@nestjs/mapped-types';
import { CreateFeatureDto } from './create-feature.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateFeatureDto extends PartialType(CreateFeatureDto) {
  @ApiProperty({
    example: 'Dashboard Analytics Updated',
    description: 'Nama fitur yang diperbarui',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    example: 'dashboard_analytics_updated',
    description: 'Kode unik fitur yang diperbarui',
    maxLength: 50,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiProperty({
    example: 'Deskripsi fitur yang diperbarui',
    description: 'Deskripsi tentang fitur',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: false,
    description: 'Status aktif fitur yang diperbarui',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 