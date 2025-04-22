import { SetMetadata } from '@nestjs/common';

/**
 * Key untuk menyimpan metadata permissions yang dibutuhkan.
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator untuk menentukan permissions yang dibutuhkan oleh sebuah endpoint.
 * 
 * Catatan khusus:
 * - Pengguna dengan izin 'manage:all' dianggap sebagai superuser dan dapat mengakses 
 *   semua endpoint tanpa memeriksa izin-izin lainnya.
 * 
 * @param permissions Daftar string permission yang dibutuhkan (e.g., 'create:user', 'read:product')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
