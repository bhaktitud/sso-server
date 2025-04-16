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
import { UserMysql, Prisma } from '../../generated/mysql';
import { ResetPasswordDto } from './dto/reset-password.dto';

// Tipe lokal untuk payload user dalam test
type TestUserPayload = Omit<UserMysql, 'password'>;

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
    const userFromDb = {
      id: 1,
      email,
      password: hashedPassword,
      name: 'Test User',
      role: Role.USER,
      isEmailVerified: true,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return user payload if credentials are valid and email is verified', async () => {
      userService.findOneByEmail.mockResolvedValue(userFromDb);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.validateUser(email, password);
      // Omit password from expectation
      const { password: _, ...expectedResult } = userFromDb;
      expect(result).toEqual(expectedResult);
      expect(userService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should throw ForbiddenException if email is not verified', async () => {
      const unverifiedUser = { ...userFromDb, isEmailVerified: false };
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
      userService.findOneByEmail.mockResolvedValue(userFromDb);
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
      role: Role.USER,
      isEmailVerified: true,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
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
        role: userPayload.role,
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
      role: Role.USER,
      isEmailVerified: true,
      hashedRefreshToken: 'hashedOldRefreshToken',
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
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
    const createUserDto: Prisma.UserMysqlCreateInput = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
    };
    const hashedPassword = 'hashedPasswordForNewUser';
    const newUserFromDb = {
      id: 2,
      ...createUserDto,
      password: hashedPassword,
      role: Role.USER,
      isEmailVerified: false,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should register a new user successfully', async () => {
      userService.findOneByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      userService.create.mockResolvedValue(newUserFromDb);
      prisma.mysql.userMysql.update.mockResolvedValue({
        ...newUserFromDb,
        emailVerificationToken: 'hashedcryptovalue',
      });
      mailService.sendVerificationEmail.mockResolvedValue(undefined);
      const result = await service.register(createUserDto);
      expect(result).toEqual({
        message:
          'Registrasi berhasil. Silakan cek email Anda untuk verifikasi.',
      });
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(userService.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
      expect(prisma.mysql.userMysql.update).toHaveBeenCalledWith({
        where: { id: newUserFromDb.id },
        data: { emailVerificationToken: 'hashedcryptovalue' }, // Periksa hash dari mock crypto
      });
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUserFromDb.email,
        newUserFromDb.name,
        Buffer.from('randombytesbuffer').toString('hex'), // Periksa raw token dari mock crypto
      );
    });

    it('should throw ConflictException if email is already registered and verified', async () => {
      const existingVerifiedUser = {
        ...newUserFromDb,
        id: 3,
        email: createUserDto.email,
        isEmailVerified: true,
      };
      userService.findOneByEmail.mockResolvedValue(existingVerifiedUser);
      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(createUserDto)).rejects.toThrow(
        'Email sudah terdaftar dan terverifikasi.',
      );
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userService.create).not.toHaveBeenCalled();
      expect(prisma.mysql.userMysql.update).not.toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email is registered but not verified', async () => {
      const existingUnverifiedUser = {
        ...newUserFromDb,
        id: 4,
        email: createUserDto.email,
        isEmailVerified: false,
      };
      userService.findOneByEmail.mockResolvedValue(existingUnverifiedUser);
      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(createUserDto)).rejects.toThrow(
        'Email sudah terdaftar tetapi belum diverifikasi. Cek email Anda.',
      );
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userService.create).not.toHaveBeenCalled();
      expect(prisma.mysql.userMysql.update).not.toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  // --- verifyEmail tests ---
  describe('verifyEmail', () => {
    const rawToken = 'rawVerificationToken123';
    const hashedToken = 'hashedcryptovalue'; // Dari mock crypto
    const userFoundByToken = {
      id: 5,
      email: 'verify@example.com',
      password: 'hashedPassword',
      name: 'Verify User',
      role: Role.USER,
      isEmailVerified: false,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: hashedToken, // Token ada di DB
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should verify email successfully if token is valid', async () => {
      prisma.mysql.userMysql.findUnique.mockResolvedValue(userFoundByToken);
      prisma.mysql.userMysql.update.mockResolvedValue({
        ...userFoundByToken,
        isEmailVerified: true,
        emailVerificationToken: null,
      });
      const result = await service.verifyEmail(rawToken);
      expect(result).toEqual({ message: 'Email berhasil diverifikasi.' });
      expect(prisma.mysql.userMysql.findUnique).toHaveBeenCalledWith({
        where: { emailVerificationToken: hashedToken },
      });
      expect(prisma.mysql.userMysql.update).toHaveBeenCalledWith({
        where: { id: userFoundByToken.id },
        data: { isEmailVerified: true, emailVerificationToken: null },
      });
    });

    it('should throw BadRequestException if token is invalid or used', async () => {
      prisma.mysql.userMysql.findUnique.mockResolvedValue(null);
      await expect(service.verifyEmail(rawToken)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail(rawToken)).rejects.toThrow(
        'Token verifikasi tidak valid atau sudah digunakan.',
      );
      expect(prisma.mysql.userMysql.update).not.toHaveBeenCalled();
    });
  });

  // --- forgotPassword tests ---
  describe('forgotPassword', () => {
    const email = 'exists@example.com';
    const userFromDb = {
      id: 6,
      email,
      password: 'hashedPassword',
      name: 'Forgot User',
      role: Role.USER,
      isEmailVerified: true,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const rawResetToken = Buffer.from('randombytesbuffer').toString('hex');
    const hashedResetToken = 'hashedcryptovalue'; // Dari mock crypto

    it('should update user with reset token and send email if user exists', async () => {
      // Mock userService.findOneByEmail (user ditemukan)
      userService.findOneByEmail.mockResolvedValue(userFromDb);
      // Mock prisma update
      prisma.mysql.userMysql.update.mockResolvedValue(userFromDb); // Nilai return tidak terlalu penting
      // Mock mailService
      mailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword(email);

      // Ekspektasi: Pesan sukses standar
      expect(result).toEqual({
        message: 'Jika email terdaftar, instruksi reset password akan dikirim.',
      });

      // Verifikasi pemanggilan mocks
      expect(userService.findOneByEmail).toHaveBeenCalledWith(email);
      // Verifikasi prisma update dipanggil dengan ID user, hash token, dan expiry
      expect(prisma.mysql.userMysql.update).toHaveBeenCalledWith({
        where: { id: userFromDb.id },
        data: {
          passwordResetToken: hashedResetToken,
          passwordResetExpires: expect.any(Date), // Cek tipe Date
        },
      });
      // Verifikasi email dikirim dengan raw token
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        userFromDb.email,
        userFromDb.name,
        rawResetToken,
      );
    });

    it('should return success message and do nothing else if user does not exist', async () => {
      // Mock userService.findOneByEmail (user tidak ditemukan)
      userService.findOneByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword(email);

      // Ekspektasi: Pesan sukses standar
      expect(result).toEqual({
        message: 'Jika email terdaftar, instruksi reset password akan dikirim.',
      });

      // Verifikasi pemanggilan mocks
      expect(userService.findOneByEmail).toHaveBeenCalledWith(email);
      // Pastikan update dan sendEmail TIDAK dipanggil
      expect(prisma.mysql.userMysql.update).not.toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    // Opsional: Test case untuk error saat update DB atau kirim email
    // it('should handle error during database update', async () => { ... });
    // it('should handle error during email sending but still return success message', async () => { ... });
  });

  // --- resetPassword tests ---
  describe('resetPassword', () => {
    const rawToken = 'rawResetToken123';
    const hashedToken = 'hashedcryptovalue'; // Dari mock crypto
    const newPassword = 'newSecurePassword';
    const newHashedPassword = 'hashedNewPassword';
    const resetPasswordDto: ResetPasswordDto = {
      token: rawToken,
      password: newPassword,
    };
    const now = new Date();
    const futureDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 jam dari sekarang
    const userWithValidToken = {
      id: 7,
      email: 'reset@example.com',
      password: 'oldHashedPassword',
      name: 'Reset User',
      role: Role.USER,
      isEmailVerified: true,
      hashedRefreshToken: null,
      passwordResetToken: hashedToken, // Token cocok dengan yang dicari
      passwordResetExpires: futureDate, // Token belum kedaluwarsa
      emailVerificationToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should reset password successfully if token is valid and not expired', async () => {
      // Mock prisma findUnique (user ditemukan dengan token valid)
      prisma.mysql.userMysql.findUnique.mockResolvedValue(userWithValidToken);
      // Mock bcrypt hash (untuk password baru)
      (bcrypt.hash as jest.Mock).mockResolvedValue(newHashedPassword);
      // Mock userService updatePassword
      userService.updatePassword.mockResolvedValue(undefined);
      // Mock prisma update (untuk hapus token)
      prisma.mysql.userMysql.update.mockResolvedValue(userWithValidToken); // Return value tidak kritikal

      const result = await service.resetPassword(resetPasswordDto);

      // Ekspektasi: Pesan sukses
      expect(result).toEqual({ message: 'Password berhasil direset.' });

      // Verifikasi pemanggilan mocks
      expect(prisma.mysql.userMysql.findUnique).toHaveBeenCalledWith({
        where: { passwordResetToken: hashedToken },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(userService.updatePassword).toHaveBeenCalledWith(
        userWithValidToken.id,
        newHashedPassword,
      );
      // Verifikasi token dihapus
      expect(prisma.mysql.userMysql.update).toHaveBeenCalledWith({
        where: { id: userWithValidToken.id },
        data: { passwordResetToken: null, passwordResetExpires: null },
      });
    });

    it('should throw BadRequestException if reset token is expired', async () => {
      const pastDate = new Date(now.getTime() - 60 * 60 * 1000); // 1 jam lalu
      const userWithExpiredToken = {
        ...userWithValidToken,
        passwordResetExpires: pastDate,
      };
      // Mock prisma findUnique (user ditemukan dengan token kedaluwarsa)
      prisma.mysql.userMysql.findUnique.mockResolvedValue(userWithExpiredToken);
      // Mock prisma update (untuk menghapus token kedaluwarsa)
      prisma.mysql.userMysql.update.mockResolvedValue(userWithExpiredToken);

      // Ekspektasi: Melempar BadRequestException
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Token reset password sudah kedaluwarsa.',
      );

      // Verifikasi bahwa token dihapus
      expect(prisma.mysql.userMysql.update).toHaveBeenCalledWith({
        where: { id: userWithExpiredToken.id },
        data: { passwordResetToken: null, passwordResetExpires: null },
      });
      // Pastikan hash password baru dan update password utama tidak dipanggil
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userService.updatePassword).not.toHaveBeenCalled();
    });
  });
}); // Akhir describe AuthService
