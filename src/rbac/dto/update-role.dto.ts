import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { ApiProperty } from '@nestjs/swagger';

// Menggunakan PartialType agar semua field dari CreateRoleDto menjadi opsional
export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @ApiProperty({
    example: 'Content Editor',
    description: 'Updated role name',
    maxLength: 100,
    required: false,
  })
  name?: string;

  @ApiProperty({
    example: 'Updated role description',
    description: 'Updated description for the role',
    maxLength: 255,
    required: false,
  })
  description?: string;
}
// Pastikan ada newline di akhir file
