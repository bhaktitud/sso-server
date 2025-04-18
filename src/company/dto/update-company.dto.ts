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
}
