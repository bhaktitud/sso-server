import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFeatureDto {
  @ApiProperty({
    example: 'Dashboard Analytics',
    description: 'Nama fitur',
    maxLength: 100,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'dashboard_analytics',
    description: 'Kode unik untuk identifikasi fitur',
    maxLength: 50,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    example: 'Fitur analitik dashboard yang menampilkan grafik dan statistik',
    description: 'Deskripsi tentang fitur',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Status aktif fitur',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 