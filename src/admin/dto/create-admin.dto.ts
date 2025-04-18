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

export class CreateAdminDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string; // Nama admin profile

  @IsInt()
  @IsOptional() // Perusahaan bisa opsional
  companyId?: number;

  @IsArray()
  @ArrayNotEmpty({ message: 'Admin harus memiliki setidaknya satu role' })
  @IsInt({ each: true, message: 'Setiap roleId harus berupa integer' })
  roleIds: number[];
}
