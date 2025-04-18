import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Dapatkan permissions yang dibutuhkan dari metadata decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Jika tidak ada permission yang dibutuhkan, izinkan akses
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 2. Dapatkan objek user dari request (diasumsikan sudah ada dari JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Jika tidak ada user (misalnya guard JWT gagal atau tidak dipasang), tolak akses
    // Seharusnya tidak terjadi jika JwtAuthGuard berjalan benar sebelum ini
    if (!user) {
      console.error(
        'PermissionsGuard Error: User object not found on request. Ensure JwtAuthGuard runs first.',
      );
      throw new ForbiddenException(
        'User not authenticated for permission check.',
      );
    }

    // 3. Dapatkan permissions yang dimiliki user dari payload
    // --- SESUAIKAN BAGIAN INI JIKA STRUKTUR PAYLOAD USER BERBEDA ---
    const userPermissions: string[] | undefined = user.permissions;

    if (!userPermissions || !Array.isArray(userPermissions)) {
      console.error(
        `PermissionsGuard Error: 'permissions' array not found or invalid on user object (user ID: ${user.userId ?? 'N/A'}). Payload:`,
        user,
      );
      throw new ForbiddenException('Could not determine user permissions.');
    }

    // 4. Periksa apakah user memiliki SEMUA permission yang dibutuhkan
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (hasAllPermissions) {
      return true; // Izinkan akses jika semua terpenuhi
    } else {
      // Tolak akses jika ada permission yang kurang
      throw new ForbiddenException(
        'You do not have the required permissions to access this resource.',
      );
    }
  }
}
