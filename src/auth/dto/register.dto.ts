import { Prisma } from '../../../generated/mysql'; // Sesuaikan path jika perlu
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  name?: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Unique email address for the user',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd!',
    description: 'User password, minimum 8 characters',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(8, { message: 'Password minimal harus 8 karakter' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'Password harus mengandung setidaknya satu huruf besar, satu huruf kecil, dan satu angka, dengan panjang minimal 8 karakter',
  })
  password: string;
}
