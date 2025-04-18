import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionDto } from './create-permission.dto';

// Semua field opsional saat update
export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}

// Tambahkan ini untuk mencoba mengatasi error 'is not a module'
export {};
