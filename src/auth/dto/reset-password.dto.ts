import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abcdef123456',
    description: 'Reset token received via email',
  })
  @IsNotEmpty({ message: 'Token tidak boleh kosong' })
  token: string;

  @ApiProperty({
    example: 'NewSecureP@ssw0rd',
    description: 'New password for the user account (min. 8 characters)',
  })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password: string;
}
