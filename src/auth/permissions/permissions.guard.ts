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
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: RequestUser | undefined = request.user;

    if (!user) {
      return false;
    }

    const userRoleName = user.role;
    if (!userRoleName) {
      console.error(
        `User with ID ${user.userId} has no role name in JWT payload, denying access.`,
      );
      return false;
    }

    const roleWithPermissions = await this.prisma.mysql.role.findUnique({
      where: { name: userRoleName },
      include: {
        permissions: { select: { code: true } },
      },
    });

    if (!roleWithPermissions) {
      console.warn(
        `Role "${userRoleName}" found in JWT but not in DB, denying access.`,
      );
      return false;
    }

    const userPermissions = roleWithPermissions.permissions.map((p) => p.code);

    const hasAllPermissions = requiredPermissions.every((requiredPermission) =>
      userPermissions.includes(requiredPermission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'You do not have the required permissions to access this resource.',
      );
    }

    return true;
  }
}
