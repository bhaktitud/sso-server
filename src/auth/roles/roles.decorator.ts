import { SetMetadata } from '@nestjs/common';
import { Role } from './roles.enum';

export const ROLES_KEY = 'roles';
// Decorator @Roles(...roles) yang menerima daftar peran
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
