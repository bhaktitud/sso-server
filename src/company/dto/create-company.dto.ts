import { IsNotEmpty, IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({
    example: 'Acme Corporation',
    description: 'Name of the company',
    maxLength: 150,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({
    example: 'A leading provider of services and products',
    description: 'Brief description about the company',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: 'a1b2c3d4e5f6',
    description: 'Client ID for OAuth authentication (auto-generated if not provided)',
    required: false,
  })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({
    example: 'secret-xyz-123',
    description: 'Client Secret for OAuth authentication (auto-generated if not provided)',
    required: false,
  })
  @IsString()
  @IsOptional()
  clientSecret?: string;

  @ApiProperty({
    example: 'basic',
    description: 'Role type for permissions (basic, premium, admin)',
    required: false,
    enum: ['basic', 'premium', 'admin'],
    default: 'basic',
  })
  @IsEnum(['basic', 'premium', 'admin'])
  @IsOptional()
  roleType?: string;
}
