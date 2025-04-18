import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'create',
    description:
      'Action that can be performed (e.g., create, read, update, delete, manage)',
    maxLength: 100,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  action: string; // e.g., read, create, manage

  @ApiProperty({
    example: 'article',
    description:
      'Resource or subject on which the action is performed (e.g., user, article, product)',
    maxLength: 100,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  subject: string; // e.g., Order, User, Product
}

// Tambahkan ini untuk mencoba mengatasi error 'is not a module'
export {};
