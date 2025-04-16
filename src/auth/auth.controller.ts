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
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { Prisma, UserMysql } from '../../generated/mysql';
import { Roles } from './roles/roles.decorator';
import { Role } from './roles/roles.enum';
import { RolesGuard } from './roles/roles.guard';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// DTO untuk register dengan validasi
class RegisterDto implements Prisma.UserMysqlCreateInput {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(8, { message: 'Password minimal harus 8 karakter' })
  // Contoh Regex: minimal 1 huruf kecil, 1 huruf besar, 1 angka
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message:
      'Password harus mengandung setidaknya satu huruf besar, satu huruf kecil, dan satu angka',
  })
  password: string;

  // Nama opsional, tapi jika ada harus string
  @IsString()
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  name?: string;
}

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

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Endpoint registrasi
   * Mengembalikan pesan sukses, email verifikasi dikirim
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED) // Tetap gunakan 201 Created
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
  // Jadikan sinkron, tipe user dari LocalStrategy.validate
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
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
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
  // Tipe user dari JwtStrategy.validate
  getProfile(@Request() req: { user: AuthenticatedJwtPayload }) {
    return req.user;
  }

  @Get('verify-email/:token')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Param('token') token: string,
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('admin-only')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  adminOnlyEndpoint(@Request() req: { user: AuthenticatedJwtPayload }) {
    return {
      message: 'Welcome, Admin!',
      user: req.user,
    };
  }
}
