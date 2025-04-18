import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The email address used during registration',
    required: true,
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Your account password',
    minLength: 8,
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  // Tidak perlu @Matches di sini karena LocalAuthGuard menangani validasi password
  // MinLength bisa ditambahkan sebagai petunjuk dasar
  @MinLength(8, {
    message: 'Password minimal harus 8 karakter (sebagai petunjuk)',
  })
  password: string;
}
