import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  // UnauthorizedException, // Jika diperlukan
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@src/prisma/prisma.service'; // Impor PrismaService
import { PERMISSIONS_KEY } from './require-permission.decorator';

// Tipe payload user dari JWT (sesuai JwtStrategy)
interface RequestUser {
  userId: number;
  email: string;
  name?: string | null;
  role: string; // Nama peran (string)
  companyId: number | null;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService, // Inject PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Dapatkan izin yang dibutuhkan dari decorator @RequirePermission
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Jika tidak ada decorator @RequirePermission, izinkan akses
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 2. Dapatkan objek user dari request (setelah JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user: RequestUser | undefined = request.user;

    // Jika tidak ada user (misalnya JwtAuthGuard gagal atau tidak dipakai), tolak akses
    if (!user) {
      // Sebaiknya lempar UnauthorizedException jika user tidak ada,
      // tapi karena ini biasanya dijalankan SETELAH JwtAuthGuard,
      // Forbidden lebih masuk akal (user ada tapi tidak punya izin).
      // throw new UnauthorizedException();
      return false; // Atau throw ForbiddenException
    }

    // 3. Dapatkan nama peran user
    const userRoleName = user.role;
    if (!userRoleName) {
      console.error(
        `User with ID ${user.userId} has no role name in JWT payload.`,
      );
      return false;
    }

    // 4. Cari peran di DB dan izin yang dimilikinya
    const roleWithPermissions = await this.prisma.mysql.role.findUnique({
      where: { name: userRoleName },
      include: {
        permissions: {
          select: { code: true }, // Hanya butuh kode permission
        },
      },
    });

    // Jika peran tidak ditemukan di DB, tolak akses
    if (!roleWithPermissions) {
      console.warn(`Role "${userRoleName}" found in JWT but not in database.`);
      return false;
    }

    // 5. Ekstrak daftar kode izin yang dimiliki user
    const userPermissions = roleWithPermissions.permissions.map((p) => p.code);

    // 6. Periksa apakah user memiliki SEMUA izin yang dibutuhkan
    const hasAllPermissions = requiredPermissions.every((requiredPermission) =>
      userPermissions.includes(requiredPermission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'You do not have the required permissions to access this resource.',
      );
    }

    return true; // Izinkan akses jika semua izin terpenuhi
  }
}
