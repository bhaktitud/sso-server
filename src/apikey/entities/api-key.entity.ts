import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiKeyEntity {
  @ApiProperty({
    description: 'ID unik API key',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'API Key string (hanya ditampilkan saat pembuatan)',
    example: '7c8a5d69f43e5c8a94d7ec68',
  })
  key: string;

  @ApiProperty({
    description: 'Nama untuk identifikasi API key',
    example: 'Production Key',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Deskripsi tentang tujuan penggunaan API key',
    example: 'API key untuk akses ke production environment',
  })
  description?: string;

  @ApiProperty({
    description: 'Status API key (aktif/tidak aktif)',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'ID perusahaan yang memiliki API key',
    example: 1,
  })
  companyId: number;

  @ApiPropertyOptional({
    description: 'Terakhir kali API key digunakan',
    example: '2023-05-20T15:45:30Z',
  })
  lastUsedAt?: Date;

  @ApiPropertyOptional({
    description: 'Tanggal kadaluarsa API key (jika ada)',
    example: '2023-12-31T23:59:59Z',
  })
  expiresAt?: Date;

  @ApiProperty({
    description: 'Tanggal pembuatan API key',
    example: '2023-01-15T10:30:45Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Tanggal update terakhir API key',
    example: '2023-01-15T10:30:45Z',
  })
  updatedAt: Date;
}
