import { PartialType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  ArrayNotEmpty,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { CreateAdminDto } from './create-admin.dto';

// Tidak bisa update email/password via endpoint ini (buat endpoint terpisah jika perlu)
export class UpdateAdminDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string; // Nama admin profile

  // Allow null to disconnect company
  @ValidateIf((o) => o.companyId !== undefined)
  @IsInt()
  companyId?: number | null;

  @IsArray()
  @ArrayNotEmpty({ message: 'Admin harus memiliki setidaknya satu role' })
  @IsInt({ each: true, message: 'Setiap roleId harus berupa integer' })
  @IsOptional() // Role opsional saat update (tidak harus selalu diubah)
  roleIds?: number[];
}
