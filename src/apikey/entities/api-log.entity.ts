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

  @ApiProperty({
    description: 'Tanggal dan waktu request',
    example: '2023-05-20T15:45:30Z',
  })
  createdAt: Date;
}
