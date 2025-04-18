import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '@src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '@src/mail/mail.service';
import { PrismaService } from '@src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  ForbiddenException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from './roles/roles.enum';
import { jwtConstants } from './constants';
import { User, Prisma, UserType } from '../../generated/mysql';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RegisterDto } from './dto/register.dto';

// Tipe lokal untuk payload user dalam test
type TestUserPayload = Omit<User, 'password'>;

// Mock implementasi untuk dependensi
const mockUserService = {
  findOneByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateRefreshToken: jest.fn(),
  updatePassword: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockMailService = {
  sendPasswordResetEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
};

// Mock PrismaService
const mockPrismaService = {
  mysql: {
    userMysql: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    }
  },
};

// Mock ConfigService jika diperlukan (tampaknya tidak secara langsung oleh AuthService)
const mockConfigService = {
  get: jest.fn(),
};

// Mock bcrypt
jest.mock('bcrypt');
// Mock crypto (tidak perlu karena built-in, tapi bisa di-spy jika perlu)
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue(Buffer.from('randombytesbuffer')),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('hashedcryptovalue'),
  })),
}));

// Pastikan mockedBcrypt didefinisikan di scope luar
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let userService: typeof mockUserService;
  let jwtService: typeof mockJwtService;
  let mailService: typeof mockMailService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
        { provide: PrismaService, useValue: mockPrismaService },
        // { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- validateUser tests ---
  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = 'hashedPassword';
    const user: User = {
      id: 1,
      email,
      password: hashedPassword,
      name: 'Test User',
      userType: UserType.APP_USER,
      isEmailVerified: true,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return user without password if validation successful', async () => {
      userService.findOneByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.validateUser(email, password);
      const { password: _, ...expectedUser } = user;
      expect(result).toEqual(expectedUser);
      expect(userService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should throw ForbiddenException if email is not verified', async () => {
      const unverifiedUser = { ...user, isEmailVerified: false };
      userService.findOneByEmail.mockResolvedValue(unverifiedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.validateUser(email, password)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.validateUser(email, password)).rejects.toThrow(
        'Akun belum diverifikasi. Silakan cek email Anda.',
      );
      expect(userService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should return null if password does not match', async () => {
      userService.findOneByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await service.validateUser(email, password);
      expect(result).toBeNull();
      expect(userService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should return null if user is not found', async () => {
      userService.findOneByEmail.mockResolvedValue(null);
      const result = await service.validateUser(email, password);
      expect(result).toBeNull();
      expect(userService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  // --- login tests ---
  describe('login', () => {
    const userPayload: TestUserPayload = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      userType: UserType.APP_USER,
      isEmailVerified: true,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const accessToken = 'mockAccessToken';
    const refreshToken = 'mockRefreshToken';
    const hashedRefreshToken = 'mockHashedRefreshToken';

    it('should generate tokens, hash refresh token, update user, and return tokens', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedRefreshToken);
      userService.updateRefreshToken.mockResolvedValue(undefined);
      const result = await service.login(userPayload);
      expect(result).toEqual({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(1, {
        email: userPayload.email,
        sub: userPayload.id,
        name: userPayload.name,
        userType: userPayload.userType,
      });
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        { sub: userPayload.id, nonce: expect.any(Number) },
        {
          secret: jwtConstants.refresh.secret,
          expiresIn: jwtConstants.refresh.expiresIn,
          algorithm: jwtConstants.refresh.algorithm,
        },
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(refreshToken, 10);
      expect(userService.updateRefreshToken).toHaveBeenCalledWith(
        userPayload.id,
        hashedRefreshToken,
      );
    });
  });

  // --- logout tests ---
  describe('logout', () => {
    const userId = 1;
    it('should call userService.updateRefreshToken with null', async () => {
      userService.updateRefreshToken.mockResolvedValue(undefined);
      await service.logout(userId);
      expect(userService.updateRefreshToken).toHaveBeenCalledWith(userId, null);
    });
  });

  // --- refreshTokens tests ---
  describe('refreshTokens', () => {
    const userId = 1;
    const oldRefreshToken = 'oldRefreshToken';
    const userFromDb = {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      userType: UserType.APP_USER,
      isEmailVerified: true,
      hashedRefreshToken: 'hashedOldRefreshToken',
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const newAccessToken = 'newAccessToken';
    const newRefreshToken = 'newRefreshToken';
    const newHashedRefreshToken = 'newHashedRefreshToken';

    it('should refresh tokens successfully if user and token are valid', async () => {
      userService.findById.mockResolvedValue(userFromDb);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce(newAccessToken)
        .mockResolvedValueOnce(newRefreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue(newHashedRefreshToken);
      userService.updateRefreshToken.mockResolvedValue(undefined);
      const result = await service.refreshTokens(userId, oldRefreshToken);
      expect(result).toEqual({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      });
      expect(userService.findById).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        oldRefreshToken,
        userFromDb.hashedRefreshToken,
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith(newRefreshToken, 10);
      expect(userService.updateRefreshToken).toHaveBeenCalledWith(
        userId,
        newHashedRefreshToken,
      );
    });

    it('should throw ForbiddenException if user is not found', async () => {
      userService.findById.mockResolvedValue(null);
      await expect(
        service.refreshTokens(userId, oldRefreshToken),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.refreshTokens(userId, oldRefreshToken),
      ).rejects.toThrow('Access Denied: User or token not found');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user has no refresh token hash', async () => {
      const userWithoutHash = { ...userFromDb, hashedRefreshToken: null };
      userService.findById.mockResolvedValue(userWithoutHash);
      await expect(
        service.refreshTokens(userId, oldRefreshToken),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.refreshTokens(userId, oldRefreshToken),
      ).rejects.toThrow('Access Denied: User or token not found');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if refresh token does not match hash', async () => {
      userService.findById.mockResolvedValue(userFromDb);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        service.refreshTokens(userId, oldRefreshToken),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.refreshTokens(userId, oldRefreshToken),
      ).rejects.toThrow('Access Denied: Invalid refresh token');
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userService.updateRefreshToken).not.toHaveBeenCalled();
    });
  });

  // --- register tests ---
  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };
    const hashedPassword = 'hashedPassword';
    const createdUser: User = {
      id: 1,
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name || null,
      userType: UserType.APP_USER,
      createdAt: new Date(),
      updatedAt: new Date(),
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      isEmailVerified: false,
      emailVerificationToken: null,
    };

    it('should register a new user successfully', async () => {
      userService.findOneByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockImplementation(() => Promise.resolve(hashedPassword));
      userService.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);
      expect(result).toEqual({ 
        message: expect.any(String) 
      });
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          name: registerDto.name,
          password: hashedPassword,
          userType: UserType.APP_USER,
        }),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      userService.findOneByEmail.mockResolvedValue(createdUser);
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(userService.create).not.toHaveBeenCalled();
    });
  });

  // --- verifyEmail tests ---
  describe('verifyEmail', () => {
    const rawToken = 'raw-token';
    const hashedToken = 'hashedcryptovalue';
    const userFromDb = {
      id: 5,
      email: 'verify@example.com',
      isEmailVerified: false,
      emailVerificationToken: hashedToken,
    };

    it('should verify email successfully if token is valid', async () => {
      prisma.mysql.user.findUnique.mockResolvedValue(userFromDb as any);
      prisma.mysql.user.update.mockResolvedValue({
        ...userFromDb,
        isEmailVerified: true,
        emailVerificationToken: null,
      } as any);

      const result = await service.verifyEmail(rawToken);
      expect(result).toEqual({ message: expect.any(String) });
      expect(prisma.mysql.user.findUnique).toHaveBeenCalledWith({
        where: { emailVerificationToken: hashedToken },
      });
      expect(prisma.mysql.user.update).toHaveBeenCalledWith({
        where: { id: userFromDb.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
        },
      });
    });

    it('should throw BadRequestException if token is invalid or used', async () => {
      prisma.mysql.user.findUnique.mockResolvedValue(null);
      await expect(service.verifyEmail(rawToken)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail(rawToken)).rejects.toThrow(
        'Token verifikasi tidak valid atau sudah digunakan.',
      );
      expect(prisma.mysql.user.findUnique).toHaveBeenCalledWith({
        where: { emailVerificationToken: hashedToken },
      });
      expect(prisma.mysql.user.update).not.toHaveBeenCalled();
    });

    it('should return message if email already verified', async () => {
      const verifiedUser = {
        ...userFromDb,
        isEmailVerified: true,
      };
      prisma.mysql.user.findUnique.mockResolvedValue(verifiedUser as any);
      const result = await service.verifyEmail(rawToken);
      expect(result).toEqual({
        message: 'Email sudah diverifikasi sebelumnya.',
      });
      expect(prisma.mysql.user.findUnique).toHaveBeenCalledWith({
        where: { emailVerificationToken: hashedToken },
      });
      expect(prisma.mysql.user.update).not.toHaveBeenCalled();
    });
  });

  // --- forgotPassword tests ---
  describe('forgotPassword', () => {
    const email = 'forgot@example.com';
    const userFromDb = {
      id: 6,
      email,
      password: 'hashedPassword',
      name: 'Forgot User',
      isEmailVerified: true,
    };
    const hashedResetToken = 'hashedcryptovalue';

    it('should update user with reset token and send email if user exists', async () => {
      userService.findOneByEmail.mockResolvedValue(userFromDb as any);
      prisma.mysql.user.update.mockResolvedValue({
        ...userFromDb,
        passwordResetToken: hashedResetToken,
        passwordResetExpires: expect.any(Date),
      } as any);

      const result = await service.forgotPassword(email);
      expect(result).toEqual({
        message: 'Jika email terdaftar, instruksi reset password akan dikirim.',
      });
      expect(userService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(prisma.mysql.user.update).toHaveBeenCalledWith({
        where: { id: userFromDb.id },
        data: {
          passwordResetToken: hashedResetToken,
          passwordResetExpires: expect.any(Date),
        },
      });
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        userFromDb.email,
        userFromDb.name,
        expect.any(String), // Raw token
      );
    });

    it('should return same message even if user does not exist', async () => {
      userService.findOneByEmail.mockResolvedValue(null);
      const result = await service.forgotPassword('exists@example.com');
      expect(result).toEqual({
        message: 'Jika email terdaftar, instruksi reset password akan dikirim.',
      });
      expect(userService.findOneByEmail).toHaveBeenCalledWith('exists@example.com');
      expect(prisma.mysql.user.update).not.toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  // --- resetPassword tests ---
  describe('resetPassword', () => {
    const rawToken = 'raw-reset-token';
    const hashedToken = 'hashedcryptovalue';
    const newPassword = 'newPassword123';
    const hashedNewPassword = 'hashedNewPassword';
    const resetPasswordDto: ResetPasswordDto = {
      token: rawToken,
      password: newPassword,
    };
    const userFromDb = {
      id: 7,
      email: 'reset@example.com',
      password: 'oldHashedPassword',
      name: 'Reset User',
      isEmailVerified: true,
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 3600000), // Valid: 1 hour from now
    };

    it('should reset password successfully if token is valid and not expired', async () => {
      prisma.mysql.user.findUnique.mockResolvedValue(userFromDb as any);
      mockedBcrypt.hash.mockImplementation(() => Promise.resolve(hashedNewPassword));
      prisma.mysql.user.update.mockResolvedValue({
        ...userFromDb,
        password: hashedNewPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      } as any);

      const result = await service.resetPassword(resetPasswordDto);
      expect(result).toEqual({ message: expect.any(String) });
      expect(prisma.mysql.user.findUnique).toHaveBeenCalledWith({
        where: { passwordResetToken: hashedToken },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(prisma.mysql.user.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if reset token is expired', async () => {
      const expiredUser = {
        ...userFromDb,
        passwordResetExpires: new Date(Date.now() - 3600000), // Expired: 1 hour ago
      };
      prisma.mysql.user.findUnique.mockResolvedValue(expiredUser as any);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.mysql.user.findUnique).toHaveBeenCalledWith({
        where: { passwordResetToken: hashedToken },
      });
      expect(prisma.mysql.user.update).toHaveBeenCalledWith({
        where: { id: expiredUser.id },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if token is invalid', async () => {
      prisma.mysql.user.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.mysql.user.findUnique).toHaveBeenCalledWith({
        where: { passwordResetToken: hashedToken },
      });
      expect(prisma.mysql.user.update).not.toHaveBeenCalled();
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('validateAdminUser', () => {
    const email = 'admin@example.com';
    const password = 'adminPass';
    const hashedPassword = 'hashedAdminPassword';
    // Lengkapi mock adminUser
    const adminUser: User = {
      id: 2,
      email: email,
      password: hashedPassword,
      name: 'Admin User',
      userType: UserType.ADMIN_USER,
      createdAt: new Date(),
      updatedAt: new Date(),
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      isEmailVerified: true, // Asumsi admin terverifikasi
      emailVerificationToken: null,
    };
    // ... (tes validateAdminUser)
  });

  describe('login (admin)', () => {
    // ... (kode tes)
  });

  describe('register (user)', () => {
    it('should register a new user successfully', async () => {
      // Menggunakan RegisterDto bukan UserCreateInput
      const createUserDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const hashedPassword = 'hashedPassword';
      const createdUser: User = {
        id: 1,
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name || null,
        userType: UserType.APP_USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        hashedRefreshToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        isEmailVerified: false,
        emailVerificationToken: null,
      };

      userService.findOneByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockImplementation(() => Promise.resolve(hashedPassword));
      userService.create.mockResolvedValue(createdUser);

      const result = await service.register(createUserDto);
      expect(result).toEqual({ 
        message: expect.any(String) 
      });
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        10,
      );
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: createUserDto.email,
          name: createUserDto.name || null,
          password: hashedPassword,
          userType: 'APP_USER',
        }),
      );
    });
    // ... (tes lain untuk register)
  });
}); // Akhir describe AuthService
