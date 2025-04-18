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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacController = void 0;
const common_1 = require("@nestjs/common");
const rbac_service_1 = require("./rbac.service");
const create_role_dto_1 = require("./dto/create-role.dto");
const update_role_dto_1 = require("./dto/update-role.dto");
const create_permission_dto_1 = require("./dto/create-permission.dto");
const update_permission_dto_1 = require("./dto/update-permission.dto");
const swagger_1 = require("@nestjs/swagger");
const role_response_dto_1 = require("./dto/role-response.dto");
const permission_response_dto_1 = require("./dto/permission-response.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions/permissions.guard");
const permissions_decorator_1 = require("../auth/permissions/permissions.decorator");
let RbacController = class RbacController {
    rbacService;
    constructor(rbacService) {
        this.rbacService = rbacService;
    }
    createRole(createRoleDto) {
        return this.rbacService.createRole(createRoleDto);
    }
    findAllRoles() {
        return this.rbacService.findAllRoles();
    }
    findRoleById(id) {
        return this.rbacService.findRoleById(id);
    }
    updateRole(id, updateRoleDto) {
        return this.rbacService.updateRole(id, updateRoleDto);
    }
    async deleteRole(id) {
        await this.rbacService.deleteRole(id);
    }
    createPermission(createPermissionDto) {
        return this.rbacService.createPermission(createPermissionDto);
    }
    findAllPermissions() {
        return this.rbacService.findAllPermissions();
    }
    findPermissionById(id) {
        return this.rbacService.findPermissionById(id);
    }
    updatePermission(id, updatePermissionDto) {
        return this.rbacService.updatePermission(id, updatePermissionDto);
    }
    async deletePermission(id) {
        await this.rbacService.deletePermission(id);
    }
    assignPermissionToRole(roleId, permissionId) {
        return this.rbacService.assignPermissionToRole(roleId, permissionId);
    }
    removePermissionFromRole(roleId, permissionId) {
        return this.rbacService.removePermissionFromRole(roleId, permissionId);
    }
    findPermissionsForRole(roleId) {
        return this.rbacService.findPermissionsForRole(roleId);
    }
};
exports.RbacController = RbacController;
__decorate([
    (0, common_1.Post)('roles'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new role' }),
    (0, swagger_1.ApiBody)({ type: create_role_dto_1.CreateRoleDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Role created.',
        type: role_response_dto_1.RoleResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('create:role'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_role_dto_1.CreateRoleDto]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "createRole", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all roles' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of roles.',
        type: [role_response_dto_1.RoleResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('read:role'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "findAllRoles", null);
__decorate([
    (0, common_1.Get)('roles/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a role by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Role details.',
        type: role_response_dto_1.RoleResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('read:role'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "findRoleById", null);
__decorate([
    (0, common_1.Patch)('roles/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a role' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiBody)({ type: update_role_dto_1.UpdateRoleDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Role updated.',
        type: role_response_dto_1.RoleResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('update:role'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_role_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)('roles/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a role' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Role deleted.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('delete:role'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Post)('permissions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new permission' }),
    (0, swagger_1.ApiBody)({ type: create_permission_dto_1.CreatePermissionDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Permission created.',
        type: permission_response_dto_1.PermissionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('create:permission'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_permission_dto_1.CreatePermissionDto]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "createPermission", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all permissions' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of permissions.',
        type: [permission_response_dto_1.PermissionResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('read:permission'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "findAllPermissions", null);
__decorate([
    (0, common_1.Get)('permissions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a permission by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Permission details.',
        type: permission_response_dto_1.PermissionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Permission not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('read:permission'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "findPermissionById", null);
__decorate([
    (0, common_1.Patch)('permissions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a permission' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiBody)({ type: update_permission_dto_1.UpdatePermissionDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Permission updated.',
        type: permission_response_dto_1.PermissionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Permission not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('update:permission'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_permission_dto_1.UpdatePermissionDto]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "updatePermission", null);
__decorate([
    (0, common_1.Delete)('permissions/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a permission' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Permission deleted.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Permission not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('delete:permission'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "deletePermission", null);
__decorate([
    (0, common_1.Post)('roles/:roleId/permissions/:permissionId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Assign a permission to a role' }),
    (0, swagger_1.ApiParam)({ name: 'roleId', type: Number }),
    (0, swagger_1.ApiParam)({ name: 'permissionId', type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Permission assigned.',
        type: role_response_dto_1.RoleResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role or Permission not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('assign:permission:role'),
    __param(0, (0, common_1.Param)('roleId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('permissionId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "assignPermissionToRole", null);
__decorate([
    (0, common_1.Delete)('roles/:roleId/permissions/:permissionId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a permission from a role' }),
    (0, swagger_1.ApiParam)({ name: 'roleId', type: Number }),
    (0, swagger_1.ApiParam)({ name: 'permissionId', type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Permission removed.',
        type: role_response_dto_1.RoleResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role or Permission not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('remove:permission:role'),
    __param(0, (0, common_1.Param)('roleId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('permissionId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "removePermissionFromRole", null);
__decorate([
    (0, common_1.Get)('roles/:roleId/permissions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get permissions for a specific role' }),
    (0, swagger_1.ApiParam)({ name: 'roleId', type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of permissions.',
        type: [permission_response_dto_1.PermissionResponseDto],
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Role not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('read:role', 'read:permission'),
    __param(0, (0, common_1.Param)('roleId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "findPermissionsForRole", null);
exports.RbacController = RbacController = __decorate([
    (0, swagger_1.ApiTags)('RBAC (Roles & Permissions)'),
    (0, common_1.Controller)('rbac'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [rbac_service_1.RbacService])
], RbacController);
//# sourceMappingURL=rbac.controller.js.map