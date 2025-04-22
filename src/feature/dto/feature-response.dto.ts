import { ApiProperty } from '@nestjs/swagger';

export class FeatureResponseDto {
  @ApiProperty({
    example: 1,
    description: 'ID unik dari fitur',
  })
  id: number;

  @ApiProperty({
    example: 'Dashboard Analytics',
    description: 'Nama fitur',
  })
  name: string;

  @ApiProperty({
    example: 'dashboard_analytics',
    description: 'Kode unik untuk identifikasi fitur',
  })
  code: string;

  @ApiProperty({
    example: 'Fitur analitik dashboard yang menampilkan grafik dan statistik',
    description: 'Deskripsi tentang fitur',
    required: false,
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    example: true,
    description: 'Status aktif fitur',
  })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
} 