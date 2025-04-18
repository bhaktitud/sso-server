import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';

// Menggunakan PartialType agar semua field dari CreateRoleDto menjadi opsional
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
// Pastikan ada newline di akhir file
