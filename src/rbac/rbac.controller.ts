// src/rbac/rbac.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role, Permission } from '../../generated/mysql';
import { RoleResponseDto } from './dto/role-response.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@src/auth/permissions/permissions.guard';
import { RequirePermissions } from '@src/auth/permissions/permissions.decorator';
import { PERMISSIONS_KEY } from '@src/const/permissions';
import { RequireApiKey } from '@src/auth/decorators/require-apikey.decorator';
@ApiTags('RBAC (Roles & Permissions)')
@Controller('rbac') // Base path bisa disesuaikan (misal /admin/rbac)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@ApiBearerAuth('jwt')
@RequireApiKey(false)
@UseGuards(JwtAuthGuard)
// TODO: Tambahkan Guard di level controller untuk memastikan hanya admin yang bisa akses
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // --- Roles Endpoints ---

  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({
    status: 201,
    description: 'Role created.',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions(PERMISSIONS_KEY.ROLE_CREATE)
  createRole(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.rbacService.createRole(createRoleDto);
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'List of roles.',
    type: [RoleResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions(PERMISSIONS_KEY.ROLE_READ)
  findAllRoles(): Promise<Role[]> {
    return this.rbacService.findAllRoles();
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Role details.',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions(PERMISSIONS_KEY.ROLE_READ)
  findRoleById(@Param('id', ParseIntPipe) id: number): Promise<Role> {
    return this.rbacService.findRoleById(id);
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({
    status: 200,
    description: 'Role updated.',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions(PERMISSIONS_KEY.ROLE_UPDATE)
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Role> {
    return this.rbacService.updateRole(id, updateRoleDto);
  }

  @Delete('roles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Role deleted.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions(PERMISSIONS_KEY.ROLE_DELETE)
  async deleteRole(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.rbacService.deleteRole(id);
  }

  // --- Permissions Endpoints ---

  @Post('permissions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiBody({ type: CreatePermissionDto })
  @ApiResponse({
    status: 201,
    description: 'Permission created.',
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions(PERMISSIONS_KEY.PERMISSION_CREATE)
  createPermission(
    @Body() createPermissionDto: CreatePermissionDto,
  ): Promise<Permission> {
    return this.rbacService.createPermission(createPermissionDto);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({
    status: 200,
    description: 'List of permissions.',
    type: [PermissionResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions(PERMISSIONS_KEY.PERMISSION_READ)
  findAllPermissions(): Promise<Permission[]> {
    return this.rbacService.findAllPermissions();
  }

  @Get('permissions/:id')
  @ApiOperation({ summary: 'Get a permission by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Permission details.',
    type: PermissionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Permission not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions(PERMISSIONS_KEY.PERMISSION_READ)
  findPermissionById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Permission> {
    return this.rbacService.findPermissionById(id);
  }

  @Patch('permissions/:id')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdatePermissionDto })
  @ApiResponse({
    status: 200,
    description: 'Permission updated.',
    type: PermissionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Permission not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions(PERMISSIONS_KEY.PERMISSION_UPDATE)
  updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    return this.rbacService.updatePermission(id, updatePermissionDto);
  }

  @Delete('permissions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Permission deleted.' })
  @ApiResponse({ status: 404, description: 'Permission not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions(PERMISSIONS_KEY.PERMISSION_DELETE)
  async deletePermission(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.rbacService.deletePermission(id);
  }

  // --- Role-Permission Assignment Endpoints ---

  @Post('roles/:roleId/permissions/:permissionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a permission to a role' })
  @ApiParam({ name: 'roleId', type: Number })
  @ApiParam({ name: 'permissionId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Permission assigned.',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Role or Permission not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions(PERMISSIONS_KEY.PERMISSION_ASSIGN_ROLE)
  assignPermissionToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ): Promise<Role> {
    return this.rbacService.assignPermissionToRole(roleId, permissionId);
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  @HttpCode(HttpStatus.OK) // Atau 204
  @ApiOperation({ summary: 'Remove a permission from a role' })
  @ApiParam({ name: 'roleId', type: Number })
  @ApiParam({ name: 'permissionId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Permission removed.',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Role or Permission not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions(PERMISSIONS_KEY.PERMISSION_REMOVE_ROLE)
  removePermissionFromRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ): Promise<Role> {
    return this.rbacService.removePermissionFromRole(roleId, permissionId);
  }

  @Get('roles/:roleId/permissions')
  @ApiOperation({ summary: 'Get permissions for a specific role' })
  @ApiParam({ name: 'roleId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of permissions.',
    type: [PermissionResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions(
    PERMISSIONS_KEY.ROLE_READ,
    PERMISSIONS_KEY.PERMISSION_READ,
  )
  findPermissionsForRole(
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<Permission[]> {
    return this.rbacService.findPermissionsForRole(roleId);
  }
}
