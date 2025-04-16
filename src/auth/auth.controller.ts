import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { UserMysql } from '../../generated/mysql';
import { Roles } from './roles/roles.decorator';
import { Role } from './roles/roles.enum';
import { RolesGuard } from './roles/roles.guard';
import { RegisterDto } from './dto/register.dto';
import { ApiProperty } from '@nestjs/swagger';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { SuccessMessageResponseDto } from '@src/common/dto/success-message-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// Tipe untuk req.user setelah LocalAuthGuard
type AuthenticatedUser = Omit<UserMysql, 'password'>;

// Tipe untuk req.user setelah JwtAuthGuard (dari JwtPayload)
interface AuthenticatedJwtPayload {
  userId: number;
  email: string;
  name?: string | null;
  role: Role;
}

// Tipe untuk payload yang divalidasi oleh RefreshTokenStrategy
interface ValidatedRefreshTokenPayload {
  sub: number;
  refreshToken: string;
}

// Tipe untuk response message generik
class SuccessMessageResponse {
  @ApiProperty()
  message: string;
}

@ApiTags('auth') // Tag untuk mengelompokkan di Swagger UI
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Endpoint registrasi
   * Mengembalikan pesan sukses, email verifikasi dikirim
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered, verification email sent.',
    type: SuccessMessageResponse,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ message: string }> {
    return this.authService.register(registerDto);
  }

  /**
   * Endpoint login
   * POST /auth/login
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns tokens.',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (Invalid credentials)',
  })
  @ApiResponse({ status: 403, description: 'Forbidden (Account not verified)' })
  login(@Request() req: { user: AuthenticatedUser }) {
    return this.authService.login(req.user);
  }

  /**
   * Endpoint Logout
   * POST /auth/logout
   * Memerlukan access token valid untuk identifikasi user
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('jwt') // Menandakan perlu Bearer token (cocokkan nama 'jwt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out the current user' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful.',
    type: SuccessMessageResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Request() req: { user: AuthenticatedJwtPayload }) {
    await this.authService.logout(req.user.userId);
    // Tidak perlu mengembalikan apa pun atau kembalikan pesan sukses
    return { message: 'Logged out successfully' };
  }

  /**
   * Endpoint Refresh Token
   * POST /auth/refresh
   * Memerlukan refresh token valid di header Authorization Bearer
   */
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @ApiBearerAuth('jwt') // Refresh token dikirim sebagai Bearer token
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully.',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (Invalid/Expired Refresh Token)',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Refresh token revoked/not found)',
  })
  async refreshTokens(@Request() req: { user: ValidatedRefreshTokenPayload }) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;
    return this.authService.refreshTokens(userId, refreshToken);
  }

  /**
   * Contoh endpoint terproteksi
   * GET /auth/profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns current user profile data.',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  // Tipe user dari JwtStrategy.validate
  getProfile(
    @Request() req: { user: AuthenticatedJwtPayload },
  ): ProfileResponseDto {
    // Buat objek baru yang sesuai dengan DTO untuk memastikan tipe
    const userProfile: ProfileResponseDto = {
      userId: req.user.userId,
      email: req.user.email,
      name: req.user.name ?? null, // Pastikan null jika undefined/null
      role: req.user.role,
    };
    return userProfile;
  }

  @Get('verify-email/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email address' })
  @ApiParam({ name: 'token', description: 'Verification token from email' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully.',
    type: SuccessMessageResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(
    @Param('token') token: string,
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(token);
  }

  @Get('admin-only')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Admin-only endpoint example' })
  @ApiResponse({ status: 200, description: 'Success (for admins).' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (User is not Admin)' })
  adminOnlyEndpoint(@Request() req: { user: AuthenticatedJwtPayload }) {
    return {
      message: 'Welcome, Admin!',
      user: req.user,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset instructions sent (if email exists).', type: SuccessMessageResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<SuccessMessageResponseDto> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully.', type: SuccessMessageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid/expired token or validation failed' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<SuccessMessageResponseDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
