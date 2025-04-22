import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiLogEntity {
  @ApiProperty({
    description: 'ID unik API log',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID API key yang digunakan',
    example: 1,
  })
  apiKeyId: number;

  @ApiPropertyOptional({
    description: 'ID Perusahaan terkait',
    example: 1,
  })
  companyId?: number;

  @ApiProperty({
    description: 'Endpoint yang diakses',
    example: '/api/examples',
  })
  endpoint: string;

  @ApiProperty({
    description: 'HTTP method yang digunakan',
    example: 'GET',
  })
  method: string;

  @ApiProperty({
    description: 'HTTP status code dari response',
    example: 200,
  })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Request body yang dikirim (jika ada)',
    example: '{"name": "Test Data"}',
  })
  requestBody?: string;

  @ApiPropertyOptional({
    description: 'Response body yang diterima (jika ada)',
    example: '{"id": 1, "name": "Test Data", "success": true}',
  })
  responseBody?: string;

  @ApiPropertyOptional({
    description: 'Waktu respons dalam milidetik',
    example: 125,
  })
  responseTime?: number;

  @ApiPropertyOptional({
    description: 'IP address client',
    example: '192.168.1.1',
  })
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent client',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  userAgent?: string;

  @ApiProperty({
    description: 'Tanggal dan waktu request',
    example: '2023-05-20T15:45:30Z',
  })
  createdAt: Date;
}
