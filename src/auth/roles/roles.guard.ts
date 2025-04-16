import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';

// Definisikan ulang tipe untuk pengguna yang terautentikasi dengan role
interface UserWithRole {
  userId: number;
  email: string;
  name?: string | null;
  role: Role; // Pastikan properti role ada
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

    // Jika tidak ada @Roles decorator, izinkan akses (atau sesuaikan logika ini)
    if (!requiredRoles) {
      return true;
    }

    // Dapatkan data pengguna dari request (ditempel oleh JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserWithRole; // Asumsikan user sudah divalidasi dan memiliki role

    // Jika tidak ada user (misalnya JwtAuthGuard belum dijalankan atau gagal), tolak akses
    if (!user || !user.role) {
      return false;
    }

    // Periksa apakah peran pengguna ada dalam daftar peran yang dibutuhkan
    return requiredRoles.some((role) => user.role === role);
  }
}
