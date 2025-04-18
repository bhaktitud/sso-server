import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminProfileResponseDto } from './dto/admin-profile-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminProfile } from '../../generated/mysql';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@src/auth/permissions/permissions.guard';
import { RequirePermissions } from '@src/auth/permissions/permissions.decorator';

@ApiTags('Admins Management')
@Controller('admins')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new admin user and profile' })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({
    status: 201,
    description: 'Admin created successfully.',
    type: AdminProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or invalid input.',
  })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions('create:admin')
  create(@Body() createAdminDto: CreateAdminDto): Promise<AdminProfile> {
    return this.adminService.createAdmin(createAdminDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of all admin profiles' })
  @ApiResponse({
    status: 200,
    description: 'List of admin profiles.',
    type: [AdminProfileResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions('read:admin')
  findAll(): Promise<AdminProfile[]> {
    return this.adminService.findAllAdmins();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific admin profile by ID' })
  @ApiParam({ name: 'id', description: 'Admin Profile ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Admin profile details.',
    type: AdminProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Admin profile not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions('read:admin')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AdminProfile> {
    return this.adminService.findAdminById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an admin profile' })
  @ApiParam({ name: 'id', description: 'Admin Profile ID', type: Number })
  @ApiBody({ type: UpdateAdminDto })
  @ApiResponse({
    status: 200,
    description: 'Admin profile updated successfully.',
    type: AdminProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or invalid input.',
  })
  @ApiResponse({ status: 404, description: 'Admin profile not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions('update:admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<AdminProfile> {
    return this.adminService.updateAdmin(id, updateAdminDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an admin profile (and associated user)' })
  @ApiParam({ name: 'id', description: 'Admin Profile ID', type: Number })
  @ApiResponse({ status: 204, description: 'Admin deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Admin profile not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions('delete:admin')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.adminService.deleteAdmin(id);
  }

  @Post(':adminId/roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a role to an admin' })
  @ApiParam({ name: 'adminId', description: 'Admin Profile ID', type: Number })
  @ApiParam({ name: 'roleId', description: 'Role ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Role assigned successfully.',
    type: AdminProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Admin or Role not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions('assign:role:admin')
  assignRole(
    @Param('adminId', ParseIntPipe) adminId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<AdminProfile> {
    return this.adminService.assignRoleToAdmin(adminId, roleId);
  }

  @Delete(':adminId/roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a role from an admin' })
  @ApiParam({ name: 'adminId', description: 'Admin Profile ID', type: Number })
  @ApiParam({ name: 'roleId', description: 'Role ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Role removed successfully.',
    type: AdminProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Admin or Role not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Missing required permissions.',
  })
  @RequirePermissions('remove:role:admin')
  removeRole(
    @Param('adminId', ParseIntPipe) adminId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<AdminProfile> {
    return this.adminService.removeRoleFromAdmin(adminId, roleId);
  }
}
