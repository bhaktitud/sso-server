import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { RolesGuard } from './roles/roles.guard';
import { CanActivate } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from './roles/roles.enum'; // Import Role

// Mock AuthService
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  refreshTokens: jest.fn(),
  verifyEmail: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  // Tambahkan metode lain jika ada
};

// Mock Guard generik yang selalu mengizinkan
const mockGuard: CanActivate = {
  canActivate: jest.fn(() => true),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: typeof mockAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      // Override semua guard yang digunakan di controller ini
      .overrideGuard(LocalAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RefreshTokenGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);

    // Reset mocks sebelum setiap tes
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Test cases untuk endpoint controller akan ditambahkan di sini ---

  // --- Test cases untuk endpoint POST /logout ---
  describe('logout', () => {
    // Mock payload user dari JWT
    const mockJwtPayload = {
      userId: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: Role.USER,
    };
    // Mock request object
    const mockRequest = { user: mockJwtPayload };
    const expectedResult = { message: 'Logged out successfully' };

    it('should call AuthService.logout with the userId from JWT payload', async () => {
      // Mock service method (async)
      service.logout.mockResolvedValue(undefined);

      await controller.logout(mockRequest as any);

      // Verifikasi service.logout dipanggil dengan userId yang benar
      expect(service.logout).toHaveBeenCalledWith(mockJwtPayload.userId);
    });

    it('should return the success message', async () => {
      service.logout.mockResolvedValue(undefined);

      const result = await controller.logout(mockRequest as any);

      // Verifikasi hasilnya adalah pesan sukses
      expect(result).toEqual(expectedResult);
    });
  });

  // --- Test cases untuk endpoint POST /refresh ---
  describe('refreshTokens', () => {
    // Mock payload dari RefreshTokenStrategy
    const mockRefreshTokenPayload = {
      sub: 1,
      refreshToken: 'validRefreshToken',
    };
    // Mock request object
    const mockRequest = { user: mockRefreshTokenPayload };
    const expectedResult = {
      access_token: 'newAccess',
      refresh_token: 'newRefresh',
    };

    it('should call AuthService.refreshTokens with userId and refreshToken', async () => {
      // Mock service method (async)
      service.refreshTokens.mockResolvedValue(expectedResult);

      await controller.refreshTokens(mockRequest as any);

      // Verifikasi service.refreshTokens dipanggil dengan argumen yang benar
      expect(service.refreshTokens).toHaveBeenCalledWith(
        mockRefreshTokenPayload.sub,
        mockRefreshTokenPayload.refreshToken,
      );
    });

    it('should return the new tokens from AuthService.refreshTokens', async () => {
      service.refreshTokens.mockResolvedValue(expectedResult);

      const result = await controller.refreshTokens(mockRequest as any);

      // Verifikasi hasilnya sama dengan yang dikembalikan service
      expect(result).toEqual(expectedResult);
    });
  });

  // --- Test cases untuk endpoint GET /profile ---
  describe('getProfile', () => {
    // Mock payload user dari JWT
    const mockJwtPayload = {
      userId: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: Role.USER,
    };
    // Mock request object
    const mockRequest = { user: mockJwtPayload };
    // Hasil yang diharapkan (sesuai implementasi controller)
    const expectedResult = {
      userId: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: Role.USER,
    };

    it('should return the user profile data from the request payload', () => {
      // Tidak perlu mock service karena controller langsung mengembalikan req.user
      const result = controller.getProfile(mockRequest as any);

      // Verifikasi hasilnya sesuai dengan payload (setelah mapping di controller)
      expect(result).toEqual(expectedResult);
    });
  });

  // --- Test cases untuk endpoint GET /verify-email/:token ---
  describe('verifyEmail', () => {
    const token = 'validVerificationToken';
    const expectedResult = { message: 'Email berhasil diverifikasi.' };

    it('should call AuthService.verifyEmail with the correct token', async () => {
      // Mock service method (async)
      service.verifyEmail.mockResolvedValue(expectedResult);

      await controller.verifyEmail(token);

      // Verifikasi service.verifyEmail dipanggil dengan token yang benar
      expect(service.verifyEmail).toHaveBeenCalledWith(token);
    });

    it('should return the result from AuthService.verifyEmail', async () => {
      service.verifyEmail.mockResolvedValue(expectedResult);

      const result = await controller.verifyEmail(token);

      // Verifikasi hasilnya sama dengan yang dikembalikan service
      expect(result).toEqual(expectedResult);
    });
  });

  // --- Test cases untuk endpoint POST /forgot-password ---
  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'forgot@example.com',
    };
    const expectedResult = {
      message: 'Jika email terdaftar, instruksi reset password akan dikirim.',
    };

    it('should call AuthService.forgotPassword with the correct email', async () => {
      // Mock service method (async)
      service.forgotPassword.mockResolvedValue(expectedResult);

      await controller.forgotPassword(forgotPasswordDto);

      // Verifikasi service.forgotPassword dipanggil dengan email yang benar
      expect(service.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto.email,
      );
    });

    it('should return the result from AuthService.forgotPassword', async () => {
      service.forgotPassword.mockResolvedValue(expectedResult);

      const result = await controller.forgotPassword(forgotPasswordDto);

      // Verifikasi hasilnya sama dengan yang dikembalikan service
      expect(result).toEqual(expectedResult);
    });
  });

  // --- Test cases untuk endpoint POST /reset-password ---
  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: 'validResetToken',
      password: 'newSecurePassword123',
    };
    const expectedResult = { message: 'Password berhasil direset.' };

    it('should call AuthService.resetPassword with the correct DTO', async () => {
      // Mock service method (async)
      service.resetPassword.mockResolvedValue(expectedResult);

      await controller.resetPassword(resetPasswordDto);

      // Verifikasi service.resetPassword dipanggil dengan DTO yang benar
      expect(service.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });

    it('should return the result from AuthService.resetPassword', async () => {
      service.resetPassword.mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(resetPasswordDto);

      // Verifikasi hasilnya sama dengan yang dikembalikan service
      expect(result).toEqual(expectedResult);
    });
  });

  // --- Test cases untuk endpoint controller lainnya akan ditambahkan di sini ---
});
