import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd!', // Contoh bisa disesuaikan
    description: 'User password',
    minLength: 8, // Masih relevan meskipun validasi utama di guard
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
