import { PrismaService } from '@src/prisma/prisma.service';
import { Role, Permission } from '../../generated/mysql';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
export declare class RbacService {
    private prisma;
    constructor(prisma: PrismaService);
    createRole(createRoleDto: CreateRoleDto): Promise<Role>;
    findAllRoles(): Promise<Role[]>;
    findRoleById(id: number): Promise<Role>;
    findRoleByName(name: string): Promise<Role | null>;
    updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<Role>;
    deleteRole(id: number): Promise<Role>;
    createPermission(createPermissionDto: CreatePermissionDto): Promise<Permission>;
    findAllPermissions(): Promise<Permission[]>;
    findPermissionById(id: number): Promise<Permission>;
    findPermissionByActionSubject(action: string, subject: string): Promise<Permission | null>;
    updatePermission(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission>;
    deletePermission(id: number): Promise<Permission>;
    assignPermissionToRole(roleId: number, permissionId: number): Promise<Role>;
    removePermissionFromRole(roleId: number, permissionId: number): Promise<Role>;
    findPermissionsForRole(roleId: number): Promise<Permission[]>;
    findRolesForPermission(permissionId: number): Promise<Role[]>;
}
