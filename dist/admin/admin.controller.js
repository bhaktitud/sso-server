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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const create_admin_dto_1 = require("./dto/create-admin.dto");
const update_admin_dto_1 = require("./dto/update-admin.dto");
const admin_profile_response_dto_1 = require("./dto/admin-profile-response.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions/permissions.guard");
const permissions_decorator_1 = require("../auth/permissions/permissions.decorator");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    create(createAdminDto) {
        return this.adminService.createAdmin(createAdminDto);
    }
    findAll() {
        return this.adminService.findAllAdmins();
    }
    findOne(id) {
        return this.adminService.findAdminById(id);
    }
    update(id, updateAdminDto) {
        return this.adminService.updateAdmin(id, updateAdminDto);
    }
    async remove(id) {
        await this.adminService.deleteAdmin(id);
    }
    assignRole(adminId, roleId) {
        return this.adminService.assignRoleToAdmin(adminId, roleId);
    }
    removeRole(adminId, roleId) {
        return this.adminService.removeRoleFromAdmin(adminId, roleId);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new admin user and profile' }),
    (0, swagger_1.ApiBody)({ type: create_admin_dto_1.CreateAdminDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Admin created successfully.',
        type: admin_profile_response_dto_1.AdminProfileResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation failed or invalid input.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already exists.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('create:admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_admin_dto_1.CreateAdminDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a list of all admin profiles' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of admin profiles.',
        type: [admin_profile_response_dto_1.AdminProfileResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('read:admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific admin profile by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Admin Profile ID', type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Admin profile details.',
        type: admin_profile_response_dto_1.AdminProfileResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Admin profile not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('read:admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an admin profile' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Admin Profile ID', type: Number }),
    (0, swagger_1.ApiBody)({ type: update_admin_dto_1.UpdateAdminDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Admin profile updated successfully.',
        type: admin_profile_response_dto_1.AdminProfileResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation failed or invalid input.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Admin profile not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('update:admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_admin_dto_1.UpdateAdminDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an admin profile (and associated user)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Admin Profile ID', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Admin deleted successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Admin profile not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('delete:admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':adminId/roles/:roleId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Assign a role to an admin' }),
    (0, swagger_1.ApiParam)({ name: 'adminId', description: 'Admin Profile ID', type: Number }),
    (0, swagger_1.ApiParam)({ name: 'roleId', description: 'Role ID', type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Role assigned successfully.',
        type: admin_profile_response_dto_1.AdminProfileResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Admin or Role not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('assign:role:admin'),
    __param(0, (0, common_1.Param)('adminId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('roleId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Delete)(':adminId/roles/:roleId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a role from an admin' }),
    (0, swagger_1.ApiParam)({ name: 'adminId', description: 'Admin Profile ID', type: Number }),
    (0, swagger_1.ApiParam)({ name: 'roleId', description: 'Role ID', type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Role removed successfully.',
        type: admin_profile_response_dto_1.AdminProfileResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Admin or Role not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('remove:role:admin'),
    __param(0, (0, common_1.Param)('adminId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('roleId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "removeRole", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admins Management'),
    (0, common_1.Controller)('admins'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map