import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionDto } from './create-permission.dto';
import { ApiProperty } from '@nestjs/swagger';

// Semua field opsional saat update
export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  @ApiProperty({
    example: 'manage',
    description: 'Updated action value',
    maxLength: 100,
    required: false,
  })
  action?: string;

  @ApiProperty({
    example: 'content',
    description: 'Updated subject/resource value',
    maxLength: 100,
    required: false,
  })
  subject?: string;
}

// Tambahkan ini untuk mencoba mengatasi error 'is not a module'
export {};
