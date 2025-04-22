import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum StatusCodeFilter {
  SUCCESS = 'success', // 2xx
  ERROR = 'error',     // 4xx & 5xx
  ALL = 'all'
}

export class QueryApiLogsDto {
  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID perusahaan',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  companyId?: number;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan endpoint (mendukung pencarian sebagian)',
    example: '/users',
  })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan HTTP method',
    example: 'GET',
  })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan kategori status code',
    enum: StatusCodeFilter,
    default: StatusCodeFilter.ALL,
  })
  @IsOptional()
  @IsEnum(StatusCodeFilter)
  status?: StatusCodeFilter;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan IP address (mendukung pencarian sebagian)',
    example: '192.168',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan tanggal mulai (format ISO)',
    example: '2023-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan tanggal akhir (format ISO)',
    example: '2023-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Jumlah maksimum log yang dikembalikan',
    example: 100,
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Offset untuk pagination',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
} 