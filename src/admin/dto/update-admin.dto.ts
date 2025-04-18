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
import { ApiProperty } from '@nestjs/swagger';

// Tidak bisa update email/password via endpoint ini (buat endpoint terpisah jika perlu)
export class UpdateAdminDto {
  @ApiProperty({
    example: 'John Doe Updated',
    description: 'Updated name for the admin',
    maxLength: 150,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string; // Nama admin profile

  @ApiProperty({
    example: 2,
    description: 'Updated company ID (set null to remove company association)',
    nullable: true,
    required: false,
  })
  // Allow null to disconnect company
  @ValidateIf((o) => o.companyId !== undefined)
  @IsInt()
  companyId?: number | null;

  @ApiProperty({
    example: [1, 3, 5],
    description: 'Updated array of role IDs',
    type: [Number],
    required: false,
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Admin harus memiliki setidaknya satu role' })
  @IsInt({ each: true, message: 'Setiap roleId harus berupa integer' })
  @IsOptional() // Role opsional saat update (tidak harus selalu diubah)
  roleIds?: number[];
}
