import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { CanActivate } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import {
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

// Mock AuthService
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  refreshTokens: jest.fn(),
  verifyEmail: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  validateUser: jest.fn(),
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
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RefreshTokenGuard)
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

  // --- Test cases untuk endpoint POST /register ---
  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'NewPassword123',
      name: 'New User', // Nama bersifat opsional di DTO kita
    };
    const expectedResult = {
      message:
        'User registered successfully. Please check your email for verification.',
    };

    it('should call AuthService.register with the correct DTO', async () => {
      // Mock service method
      service.register.mockResolvedValue(expectedResult);

      await controller.register(registerDto);

      // Verifikasi service.register dipanggil dengan DTO yang benar
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });

    it('should return the result from AuthService.register', async () => {
      service.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      // Verifikasi hasilnya sama dengan yang dikembalikan service
      expect(result).toEqual(expectedResult);
    });

    // Anda bisa menambahkan test case lain untuk error, misalnya ConflictException
    it('should let ConflictException from AuthService bubble up', async () => {
      const conflictError = new ConflictException('Email already exists');
      service.register.mockRejectedValue(conflictError);

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.register(registerDto)).rejects.toThrow(
        'Email already exists',
      );
    });
  });

  // --- Test cases untuk endpoint POST /login ---
  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const mockUser = {
      // Objek user lengkap seperti yang dikembalikan validateUser
      id: 1,
      email: 'test@example.com',
      password: 'hashedPassword',
      name: 'Test User',
      role: { id: 1, name: 'USER' }, // Sesuaikan dengan struktur Role Anda
      companyId: null,
      isEmailVerified: true,
      hashedRefreshToken: null,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const expectedTokens = {
      access_token: 'accessToken',
      refresh_token: 'refreshToken',
    };

    it('should call validateUser and login on success', async () => {
      // Mock service methods
      service.validateUser.mockResolvedValue(mockUser);
      service.login.mockResolvedValue(expectedTokens);

      const result = await controller.login(loginDto);

      expect(service.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(service.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(expectedTokens);
    });

    it('should throw UnauthorizedException if validateUser returns null', async () => {
      // Mock validateUser untuk gagal
      service.validateUser.mockResolvedValue(null);

      // Harapkan controller melempar error
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
      // Pastikan service.login tidak dipanggil
      expect(service.login).not.toHaveBeenCalled();
    });

    it('should let ForbiddenException from validateUser bubble up', async () => {
      const forbiddenError = new ForbiddenException('Account not verified');
      service.validateUser.mockRejectedValue(forbiddenError);

      await expect(controller.login(loginDto)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Account not verified',
      );
      expect(service.login).not.toHaveBeenCalled();
    });
  });

  // --- Test cases untuk endpoint POST /logout ---
  describe('logout', () => {
    const mockJwtPayload = {
      userId: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      companyId: null,
    };
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
    const mockRefreshTokenPayload = {
      sub: 1,
      refreshToken: 'validRefreshToken',
    };
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
    const mockJwtPayload = {
      userId: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      companyId: null,
    };
    const mockRequest = { user: mockJwtPayload };
    const expectedResult = {
      userId: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
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

  // --- Test cases untuk endpoint GET /admin-only ---
  describe('adminOnlyEndpoint', () => {
    const mockAdminPayload = {
      userId: 2,
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN', // Gunakan string 'ADMIN'
      companyId: null,
    };
    const mockRequest = { user: mockAdminPayload };
    const expectedResult = {
      message: 'Welcome, Admin!',
      user: mockAdminPayload,
    };

    it('should return the admin message and user payload', () => {
      // Karena guard di-mock, kita hanya perlu memanggil method
      const result = controller.adminOnlyEndpoint(mockRequest as any);

      // Verifikasi hasilnya sesuai ekspektasi
      expect(result).toEqual(expectedResult);
    });

    // Note: Test ini tidak menguji PermissionsGuard karena guard di-mock.
    // Untuk menguji guard, perlu setup test yang berbeda.
  });
});
