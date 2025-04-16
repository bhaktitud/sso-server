import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ViewProfileDto } from './dto/view-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserMysql as User } from '../../generated/mysql';
import { Role as AppRole } from '@src/auth/roles/roles.enum';

@ApiTags('User') // Group endpoints under 'User' tag in Swagger
@ApiBearerAuth() // Indicate that endpoints require Bearer token
@Controller('users') // Base path for user related endpoints
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me') // Endpoint GET /users/me
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current user profile data.',
    type: ViewProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Request() req): Promise<ViewProfileDto> {
    const userId = req.user.userId;
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Buat DTO secara eksplisit dengan field yang dibutuhkan
    const result: ViewProfileDto = {
      id: user.id,
      email: user.email,
      name: user.name,
      // Pastikan tipe user.role bisa di-cast ke AppRole
      role: user.role as AppRole,
      isEmailVerified: user.isEmailVerified,
    };

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me') // Endpoint PATCH /users/me
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully.',
    type: ViewProfileDto, // Kembalikan profil yang sudah diupdate
  })
  @ApiResponse({ status: 400, description: 'Bad Request (validation error)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ViewProfileDto> {
    const userId = req.user.userId;

    // Handle name update
    const updateData: Partial<User> = {};
    if (updateProfileDto.name !== undefined) {
      updateData.name =
        updateProfileDto.name === '' ? null : updateProfileDto.name;
    }

    const updatedUser = await this.userService.updateUser(userId, updateData);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    // Buat DTO secara eksplisit dengan field yang dibutuhkan
    const result: ViewProfileDto = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      // Pastikan tipe updatedUser.role bisa di-cast ke AppRole
      role: updatedUser.role as AppRole,
      isEmailVerified: updatedUser.isEmailVerified,
    };

    return result;
  }
}
