import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    description: 'Reset token received in the password reset email link',
    required: true,
  })
  @IsNotEmpty({ message: 'Token tidak boleh kosong' })
  token: string;

  @ApiProperty({
    example: 'NewPassword123',
    description:
      'New password that meets the requirements: at least one uppercase letter, one lowercase letter, and one number',
    minLength: 8,
    required: true,
  })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password: string;
}
