import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Role, Permission } from '../../generated/mysql';
export declare class RbacController {
    private readonly rbacService;
    constructor(rbacService: RbacService);
    createRole(createRoleDto: CreateRoleDto): Promise<Role>;
    findAllRoles(): Promise<Role[]>;
    findRoleById(id: number): Promise<Role>;
    updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<Role>;
    deleteRole(id: number): Promise<void>;
    createPermission(createPermissionDto: CreatePermissionDto): Promise<Permission>;
    findAllPermissions(): Promise<Permission[]>;
    findPermissionById(id: number): Promise<Permission>;
    updatePermission(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission>;
    deletePermission(id: number): Promise<void>;
    assignPermissionToRole(roleId: number, permissionId: number): Promise<Role>;
    removePermissionFromRole(roleId: number, permissionId: number): Promise<Role>;
    findPermissionsForRole(roleId: number): Promise<Permission[]>;
}
