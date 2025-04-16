import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
// Decorator akan menerima satu atau lebih permission code (string)
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
