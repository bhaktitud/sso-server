import { SetMetadata } from '@nestjs/common';

/**
 * Key untuk menyimpan metadata permissions yang dibutuhkan.
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator untuk menentukan permissions yang dibutuhkan oleh sebuah endpoint.
 * @param permissions Daftar string permission yang dibutuhkan (e.g., 'create:user', 'read:product')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
