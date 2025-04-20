import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApikeyDto {
  @ApiProperty({
    description:
      'Nama untuk identifikasi API key (contoh: "Production", "Development")',
    example: 'Production Key',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Deskripsi tentang tujuan penggunaan API key',
    example: 'API key untuk akses ke production environment',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'ID perusahaan yang memiliki API key',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  companyId: number;

  @ApiPropertyOptional({
    description: 'Tanggal kadaluarsa API key (opsional)',
    example: '2023-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDate()
  expiresAt?: Date;
}
