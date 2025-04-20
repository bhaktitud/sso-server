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
  Request,
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
import { AdminProfile, User, ApiKey, Prisma } from '../../generated/mysql';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@src/auth/permissions/permissions.guard';
import { RequirePermissions } from '@src/auth/permissions/permissions.decorator';
import { PERMISSIONS_KEY } from '@src/const/permissions';
import { Public } from '@src/auth/decorators/public.decorator';
import { RequireApiKey } from '@src/auth/decorators/require-apikey.decorator';

// Definisikan tipe yang mencakup hasil query findAdminProfileWithDetails
type AdminProfileWithDetails = AdminProfile & {
  user: Partial<User>;
  company?: {
    apiKeys: ApiKey[];
  } | null;
  roles: any[];
};

@ApiTags('Admins Management')
@Controller('admins')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @Public()
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
  @RequirePermissions(PERMISSIONS_KEY.ADMIN_CREATE)
  create(@Body() createAdminDto: CreateAdminDto): Promise<AdminProfile> {
    return this.adminService.createAdmin(createAdminDto);
  }

  @Get('profile')
  @RequireApiKey(false)
  @ApiOperation({ summary: 'Mendapatkan profil admin yang sedang login' })
  @ApiResponse({
    status: 200,
    description: 'Detail profil admin, termasuk perusahaan dan API keys',
    type: AdminProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: any) {
    const userId = req.user.userId;
    const adminProfile = (await this.adminService.findAdminProfileWithDetails(
      userId,
    )) as AdminProfileWithDetails;

    // Extract api keys from company if available
    const apiKeys = adminProfile.company?.apiKeys || [];

    // Map to response DTO format
    const response = {
      ...adminProfile,
      email: adminProfile.user.email,
      apiKeys,
    };

    return response;
  }

  @Get()
  @Public()
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
  @RequirePermissions(PERMISSIONS_KEY.ADMIN_READ)
  findAll(): Promise<AdminProfile[]> {
    return this.adminService.findAllAdmins();
  }

  @Get(':id')
  @Public()
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
  @RequirePermissions(PERMISSIONS_KEY.ADMIN_READ)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AdminProfile> {
    return this.adminService.findAdminById(id);
  }

  @Patch(':id')
  @Public()
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
  @RequirePermissions(PERMISSIONS_KEY.ADMIN_UPDATE)
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
  @RequirePermissions(PERMISSIONS_KEY.ADMIN_DELETE)
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
  @RequirePermissions(PERMISSIONS_KEY.PERMISSION_ASSIGN_ROLE)
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
  @RequirePermissions(PERMISSIONS_KEY.PERMISSION_REMOVE_ROLE)
  removeRole(
    @Param('adminId', ParseIntPipe) adminId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<AdminProfile> {
    return this.adminService.removeRoleFromAdmin(adminId, roleId);
  }
}
