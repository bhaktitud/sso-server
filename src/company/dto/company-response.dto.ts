import { ApiProperty } from '@nestjs/swagger';
import { ApiKeyEntity } from '@src/apikey/entities/api-key.entity';

export class CompanyResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the company',
  })
  id: number;

  @ApiProperty({
    example: 'Acme Corp',
    description: 'The name of the company',
  })
  name: string;

  @ApiProperty({
    example: 'Leading provider of innovative solutions',
    description: 'Company description',
    required: false,
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    type: () => [ApiKeyEntity],
    description: 'API keys belonging to the company',
    required: false,
  })
  apiKeys?: ApiKeyEntity[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
