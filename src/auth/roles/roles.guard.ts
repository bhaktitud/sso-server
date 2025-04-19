import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';

// Definisikan ulang tipe untuk pengguna yang terautentikasi
interface UserWithRole {
  userId: number;
  email: string;
  name?: string | null;

  // Bisa menggunakan properti lama (role) atau baru (roles, userType)
  role?: Role;
  roles?: string[];
  userType?: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Dapatkan roles yang dibutuhkan dari metadata @Roles
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Jika tidak ada @Roles decorator, izinkan akses
    if (!requiredRoles) {
      return true;
    }

    // Dapatkan data pengguna dari request (ditempel oleh JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserWithRole;

    // Jika tidak ada user, tolak akses
    if (!user) {
      return false;
    }

    // Periksa apakah user adalah admin (kompatibilitas versi lama)
    if (user.role === Role.ADMIN) {
      return true;
    }

    // Periksa apakah userType adalah ADMIN_USER
    if (user.userType === 'ADMIN_USER') {
      return true;
    }

    // Periksa apakah roles array berisi ADMIN atau salah satu role yang diperlukan
    if (user.roles && Array.isArray(user.roles)) {
      // Cek apakah ada 'ADMIN' di array roles
      if (user.roles.includes('ADMIN') || user.roles.includes('Admin')) {
        return true;
      }

      // Cek apakah ada role yang dibutuhkan
      return requiredRoles.some((role) => user.roles!.includes(role));
    }

    // Jika tidak ada yang cocok, tolak akses
    return false;
  }
}
