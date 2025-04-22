import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyDto } from './create-company.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  @ApiProperty({
    example: 'Acme Corporation Updated',
    description: 'Updated company name',
    maxLength: 150,
    required: false,
  })
  name?: string;

  @ApiProperty({
    example: 'Updated description for the company',
    description: 'Updated company description',
    maxLength: 500,
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 'a1b2c3d4e5f6',
    description: 'Updated Client ID for OAuth authentication',
    required: false,
  })
  clientId?: string;

  @ApiProperty({
    example: 'secret-xyz-123',
    description: 'Updated Client Secret for OAuth authentication',
    required: false,
  })
  clientSecret?: string;
}
