import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Length, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User full name (provide empty string to set as null)',
    example: 'Johnathan Doe',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional() // Nama boleh tidak diisi saat update
  @ValidateIf((o) => o.name !== '') // Validasi string jika tidak kosong
  @IsString({ message: 'Nama harus berupa string' })
  @Length(1, 100, {
    message: 'Nama harus memiliki panjang antara 1 dan 100 karakter',
  })
  name?: string | null; // Izinkan string atau null (melalui string kosong)
}
