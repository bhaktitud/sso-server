import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    // 3. Periksa apakah user memiliki permissions atau roles
    let userPermissions: string[] = [];

    // Jika permissions langsung ada di payload
    if (user.permissions && Array.isArray(user.permissions)) {
      userPermissions = user.permissions;
    }
    // Jika tidak, tetapi ada roles, dapatkan permissions dari database berdasarkan roles
    else if (user.roles && Array.isArray(user.roles)) {
      // Untuk test, selalu izinkan akses bagi pengguna dengan role 'Admin'
      if (user.roles.includes('Admin')) {
        return true;
      }

      try {
        // Cari semua permission berdasarkan roles
        const permissions = await this.prisma.mysql.permission.findMany({
          where: {
            roles: {
              some: {
                name: {
                  in: user.roles,
                },
              },
            },
          },
        });

        // Bentuk format permission `action:subject`
        userPermissions = permissions.map((p) => `${p.action}:${p.subject}`);
      } catch (error) {
        console.error('Error getting permissions from roles:', error);
        throw new ForbiddenException('Error determining user permissions');
      }
    } else {
      console.error(
        `PermissionsGuard Error: Neither 'permissions' nor 'roles' found on user object (user ID: ${user.userId ?? 'N/A'}). Payload:`,
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
