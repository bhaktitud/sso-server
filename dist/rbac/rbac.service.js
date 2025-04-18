"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mysql_1 = require("../../generated/mysql");
let RbacService = class RbacService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRole(createRoleDto) {
        try {
            return await this.prisma.mysql.role.create({
                data: createRoleDto,
            });
        }
        catch (error) {
            if (error instanceof mysql_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new common_1.ConflictException(`Role dengan nama '${createRoleDto.name}' sudah ada.`);
                }
            }
            throw error;
        }
    }
    async findAllRoles() {
        return await this.prisma.mysql.role.findMany();
    }
    async findRoleById(id) {
        const role = await this.prisma.mysql.role.findUnique({
            where: { id },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role dengan ID ${id} tidak ditemukan.`);
        }
        return role;
    }
    async updateRole(id, updateRoleDto) {
        await this.findRoleById(id);
        try {
            return await this.prisma.mysql.role.update({
                where: { id },
                data: updateRoleDto,
            });
        }
        catch (error) {
            if (error instanceof mysql_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new common_1.ConflictException(`Role dengan nama '${updateRoleDto.name}' sudah ada.`);
                }
            }
            throw error;
        }
    }
    async deleteRole(id) {
        await this.findRoleById(id);
        try {
            return await this.prisma.mysql.role.delete({
                where: { id },
            });
        }
        catch (error) {
            console.error('Error deleting role:', error);
            throw new Error(`Gagal menghapus role dengan ID ${id}.`);
        }
    }
    async createPermission(createPermissionDto) {
        try {
            return await this.prisma.mysql.permission.create({
                data: createPermissionDto,
            });
        }
        catch (error) {
            if (error instanceof mysql_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException(`Permission action '${createPermissionDto.action}' on subject '${createPermissionDto.subject}' already exists.`);
            }
            throw error;
        }
    }
    async findAllPermissions() {
        return await this.prisma.mysql.permission.findMany();
    }
    async findPermissionById(id) {
        const permission = await this.prisma.mysql.permission.findUnique({
            where: { id },
        });
        if (!permission) {
            throw new common_1.NotFoundException(`Permission with ID ${id} not found.`);
        }
        return permission;
    }
    async findPermissionByActionSubject(action, subject) {
        return await this.prisma.mysql.permission.findUnique({
            where: { action_subject: { action, subject } },
        });
    }
    async updatePermission(id, updatePermissionDto) {
        await this.findPermissionById(id);
        try {
            return await this.prisma.mysql.permission.update({
                where: { id },
                data: updatePermissionDto,
            });
        }
        catch (error) {
            if (error instanceof mysql_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException(`The combination action/subject is already used by another permission.`);
            }
            throw error;
        }
    }
    async deletePermission(id) {
        await this.findPermissionById(id);
        try {
            return await this.prisma.mysql.permission.delete({ where: { id } });
        }
        catch (error) {
            console.error('Error deleting permission:', error);
            throw new Error(`Failed to delete permission with ID ${id}.`);
        }
    }
    async assignPermissionToRole(roleId, permissionId) {
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
        }
        catch (error) {
            console.error(`Error assigning permission ${permissionId} to role ${roleId}:`, error);
            throw new Error(`Failed to assign permission to role.`);
        }
    }
    async removePermissionFromRole(roleId, permissionId) {
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
        }
        catch (error) {
            console.error(`Error removing permission ${permissionId} from role ${roleId}:`, error);
            throw new Error(`Failed to remove permission from role.`);
        }
    }
    async findPermissionsForRole(roleId) {
        const roleWithPermissions = await this.prisma.mysql.role.findUnique({
            where: { id: roleId },
            include: { permissions: true },
        });
        if (!roleWithPermissions) {
            throw new common_1.NotFoundException(`Role with ID ${roleId} not found.`);
        }
        return roleWithPermissions.permissions;
    }
    async findRolesForPermission(permissionId) {
        const permissionWithRoles = await this.prisma.mysql.permission.findUnique({
            where: { id: permissionId },
            include: { roles: true },
        });
        if (!permissionWithRoles) {
            throw new common_1.NotFoundException(`Permission with ID ${permissionId} not found.`);
        }
        return permissionWithRoles.roles;
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RbacService);
//# sourceMappingURL=rbac.service.js.map