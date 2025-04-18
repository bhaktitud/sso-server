import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { Role, Prisma, Permission } from '../../generated/mysql'; // Import tipe Role dan Prisma
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class RbacService {
  // Inject PrismaService
  constructor(private prisma: PrismaService) {}

  // --- Role CRUD ---

  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    try {
      return await this.prisma.mysql.role.create({
        data: createRoleDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Role dengan nama '${createRoleDto.name}' sudah ada.`,
          );
        }
      }
      throw error;
    }
  }

  async findAllRoles(): Promise<Role[]> {
    return await this.prisma.mysql.role.findMany();
  }

  async findRoleById(id: number): Promise<Role> {
    const role = await this.prisma.mysql.role.findUnique({
      where: { id },
    });
    if (!role) {
      throw new NotFoundException(`Role dengan ID ${id} tidak ditemukan.`);
    }
    return role;
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return await this.prisma.mysql.role.findUnique({
      where: { name },
    });
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    await this.findRoleById(id);
    try {
      return await this.prisma.mysql.role.update({
        where: { id },
        data: updateRoleDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Role dengan nama '${updateRoleDto.name}' sudah ada.`,
          );
        }
      }
      throw error;
    }
  }

  async deleteRole(id: number): Promise<Role> {
    await this.findRoleById(id);
    try {
      return await this.prisma.mysql.role.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      throw new Error(`Gagal menghapus role dengan ID ${id}.`);
    }
  }

  // --- Permission CRUD ---

  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<Permission> {
    try {
      return await this.prisma.mysql.permission.create({
        data: createPermissionDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Permission action '${createPermissionDto.action}' on subject '${createPermissionDto.subject}' already exists.`,
        );
      }
      throw error;
    }
  }

  async findAllPermissions(): Promise<Permission[]> {
    return await this.prisma.mysql.permission.findMany();
  }

  async findPermissionById(id: number): Promise<Permission> {
    const permission = await this.prisma.mysql.permission.findUnique({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found.`);
    }
    return permission;
  }

  async findPermissionByActionSubject(
    action: string,
    subject: string,
  ): Promise<Permission | null> {
    return await this.prisma.mysql.permission.findUnique({
      where: { action_subject: { action, subject } },
    });
  }

  async updatePermission(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    await this.findPermissionById(id);
    try {
      return await this.prisma.mysql.permission.update({
        where: { id },
        data: updatePermissionDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `The combination action/subject is already used by another permission.`,
        );
      }
      throw error;
    }
  }

  async deletePermission(id: number): Promise<Permission> {
    await this.findPermissionById(id);
    try {
      return await this.prisma.mysql.permission.delete({ where: { id } });
    } catch (error) {
      console.error('Error deleting permission:', error);
      throw new Error(`Failed to delete permission with ID ${id}.`);
    }
  }

  // --- Role-Permission Management ---

  async assignPermissionToRole(
    roleId: number,
    permissionId: number,
  ): Promise<Role> {
    await this.findRoleById(roleId);
    await this.findPermissionById(permissionId);

    try {
      return await this.prisma.mysql.role.update({
        where: { id: roleId },
        data: {
          permissions: {
            connect: { id: permissionId },
          },
        },
        include: { permissions: true },
      });
    } catch (error) {
      console.error(
        `Error assigning permission ${permissionId} to role ${roleId}:`,
        error,
      );
      throw new Error(`Failed to assign permission to role.`);
    }
  }

  async removePermissionFromRole(
    roleId: number,
    permissionId: number,
  ): Promise<Role> {
    await this.findRoleById(roleId);
    await this.findPermissionById(permissionId);

    try {
      return await this.prisma.mysql.role.update({
        where: { id: roleId },
        data: {
          permissions: {
            disconnect: { id: permissionId },
          },
        },
        include: { permissions: true },
      });
    } catch (error) {
      console.error(
        `Error removing permission ${permissionId} from role ${roleId}:`,
        error,
      );
      throw new Error(`Failed to remove permission from role.`);
    }
  }

  async findPermissionsForRole(roleId: number): Promise<Permission[]> {
    const roleWithPermissions = await this.prisma.mysql.role.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    });

    if (!roleWithPermissions) {
      throw new NotFoundException(`Role with ID ${roleId} not found.`);
    }

    return roleWithPermissions.permissions;
  }

  async findRolesForPermission(permissionId: number): Promise<Role[]> {
    const permissionWithRoles = await this.prisma.mysql.permission.findUnique({
      where: { id: permissionId },
      include: { roles: true },
    });

    if (!permissionWithRoles) {
      throw new NotFoundException(
        `Permission with ID ${permissionId} not found.`,
      );
    }

    return permissionWithRoles.roles;
  }
}
