import { UserType } from '../../../generated/mysql'; // Import enum UserType
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsInt,
  IsArray,
  ArrayNotEmpty,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Email address for the admin user',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'AdminPass123',
    description: 'Password with minimum 8 characters',
    minLength: 8,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;

  @ApiProperty({
    example: 'John Admin',
    description: 'Full name of the admin',
    maxLength: 150,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string; // Nama admin profile

  @ApiProperty({
    example: 1,
    description: 'ID of the company this admin belongs to (optional)',
    required: false,
  })
  @IsInt()
  @IsOptional() // Perusahaan bisa opsional
  companyId?: number;

  @ApiProperty({
    example: [1, 2],
    description: 'Array of role IDs assigned to this admin',
    type: [Number],
    required: true,
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Admin harus memiliki setidaknya satu role' })
  @IsInt({ each: true, message: 'Setiap roleId harus berupa integer' })
  roleIds: number[];
}
