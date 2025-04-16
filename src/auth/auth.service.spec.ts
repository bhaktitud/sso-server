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
import { jwtConstants } from './constants';
import { UserMysql, Prisma, Role as RoleType } from '../../generated/mysql';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';

// Tipe lokal untuk payload user dalam test
type TestUserPayload = Omit<UserMysql, 'password'> & { role: RoleType };

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
    role: {
      findUnique: jest.fn(),
    },
  },
};

// Mock ConfigService jika diperlukan (tampaknya tidak secara langsung oleh AuthService)
const mockConfigService = {
  get: jest.fn(),
};

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: typeof mockUserService;
  let jwtService: typeof mockJwtService;
  let mailService: typeof mockMailService;
  let prisma: typeof mockPrismaService;
  let randomBytesSpy: jest.SpyInstance;
  let createHashSpy: jest.SpyInstance;

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

    // Spy dan mock crypto methods
    randomBytesSpy = jest
      .spyOn(crypto, 'randomBytes')
      .mockImplementation((): Buffer => Buffer.from('randombytesbuffer'));
    const mockHash = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hashedcryptovalue'),
    };
    createHashSpy = jest
      .spyOn(crypto, 'createHash')
      .mockReturnValue(mockHash as any);

    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original crypto functions setelah setiap test
    randomBytesSpy.mockRestore();
    createHashSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- validateUser tests ---
  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = 'hashedPassword';
    const userFromDb: TestUserPayload = {
      id: 1,
      email,
      name: 'Test User',
      role: { id: 1, name: 'USER', description: null },
      isEmailVerified: true,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
      companyId: null,
      roleId: 1,
    };

    it('should return user payload if credentials are valid and email is verified', async () => {
      const userWithPassword = { ...userFromDb, password: hashedPassword };
      userService.findOneByEmail.mockResolvedValue(userWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.validateUser(email, password);
      expect(result).toEqual(userWithPassword);
      expect(userService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should throw ForbiddenException if email is not verified', async () => {
      const unverifiedUser = {
        ...userFromDb,
        isEmailVerified: false,
        password: hashedPassword,
      };
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
      const userWithPassword = { ...userFromDb, password: hashedPassword };
      userService.findOneByEmail.mockResolvedValue(userWithPassword);
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
    const userPayloadForLogin: UserMysql & { role: RoleType } = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedPassword',
      name: 'Test User',
      role: { id: 1, name: 'USER', description: null },
      isEmailVerified: true,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
      companyId: null,
      roleId: 1,
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
      const result = await service.login(userPayloadForLogin);
      expect(result).toEqual({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(1, {
        email: userPayloadForLogin.email,
        sub: userPayloadForLogin.id,
        name: userPayloadForLogin.name,
        role: userPayloadForLogin.role.name,
        companyId: userPayloadForLogin.companyId,
      });
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        { sub: userPayloadForLogin.id, nonce: expect.any(Number) },
        {
          secret: jwtConstants.refresh.secret,
          expiresIn: jwtConstants.refresh.expiresIn,
          algorithm: jwtConstants.refresh.algorithm,
        },
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(refreshToken, 10);
      expect(userService.updateRefreshToken).toHaveBeenCalledWith(
        userPayloadForLogin.id,
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
    const userFromDb: UserMysql & { role: RoleType } = {
      id: userId,
      email: 'test@example.com',
      password: 'hashedPassword',
      name: 'Test User',
      role: { id: 1, name: 'USER', description: null },
      isEmailVerified: true,
      hashedRefreshToken: 'hashedOldRefreshToken',
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
      companyId: null,
      roleId: 1,
    };
    const newAccessToken = 'newAccessToken';
    const newRefreshToken = 'newRefreshToken';
    const newHashedRefreshToken = 'newHashedRefreshToken';

    it('should refresh tokens successfully if user and token are valid', async () => {
      prisma.mysql.userMysql.findUnique.mockResolvedValue(userFromDb);
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
      expect(prisma.mysql.userMysql.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { role: true },
      });
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

    it('should throw ForbiddenException if user not found', async () => {
      prisma.mysql.userMysql.findUnique.mockResolvedValue(null);
      await expect(
        service.refreshTokens(userId, oldRefreshToken),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user has no refresh token hash', async () => {
      const userWithoutHash = { ...userFromDb, hashedRefreshToken: null };
      prisma.mysql.userMysql.findUnique.mockResolvedValue(userWithoutHash);
      await expect(
        service.refreshTokens(userId, oldRefreshToken),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.refreshTokens(userId, oldRefreshToken),
      ).rejects.toThrow('Access Denied: User or token not found');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if refresh token does not match hash', async () => {
      prisma.mysql.userMysql.findUnique.mockResolvedValue(userFromDb);
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
    const registerDto: Omit<Prisma.UserMysqlCreateInput, 'role'> = {
      email: 'new@example.com',
      password: 'Password123',
      name: 'New User',
    };
    const hashedPassword = 'hashedPasswordForNewUser';
    const mockCustomerRole = { id: 1, name: 'CUSTOMER', description: null };
    const createdUser = {
      id: 10,
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
      role: mockCustomerRole,
      isEmailVerified: false,
      hashedRefreshToken: null,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      companyId: null,
      roleId: mockCustomerRole.id,
    };
    const rawVerificationToken = 'randombytesbuffer'; // Dari mock crypto
    const hashedVerificationToken = 'hashedcryptovalue'; // Dari mock crypto

    beforeEach(() => {
      // Mock bcrypt hash untuk register
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      // Mock prisma role findUnique
      prisma.mysql.role.findUnique.mockResolvedValue(mockCustomerRole);
      // Mock userService create
      userService.create.mockResolvedValue(createdUser);
      // Mock prisma user update (untuk token verifikasi)
      prisma.mysql.userMysql.update.mockResolvedValue(undefined); // Tidak perlu return value spesifik
      // Mock mail service
      mailService.sendVerificationEmail.mockResolvedValue(undefined);
      // Mock user service findOneByEmail (default: user tidak ditemukan)
      userService.findOneByEmail.mockResolvedValue(null);
    });

    it('should register user, assign CUSTOMER role, save token, send email successfully', async () => {
      const result = await service.register(registerDto);

      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(prisma.mysql.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'CUSTOMER' },
      });
      expect(userService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
        role: { connect: { id: mockCustomerRole.id } },
      });
      expect(randomBytesSpy).toHaveBeenCalledWith(32);
      expect(createHashSpy).toHaveBeenCalledWith('sha256');
      // Verifikasi update dipanggil untuk menyimpan HASHED token
      expect(prisma.mysql.userMysql.update).toHaveBeenCalledWith({
        where: { id: createdUser.id },
        data: { emailVerificationToken: hashedVerificationToken },
      });
      // Verifikasi email dikirim dengan RAW token versi HEX
      const expectedRawTokenHex =
        Buffer.from(rawVerificationToken).toString('hex');
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        createdUser.email,
        createdUser.name || 'Pengguna',
        expectedRawTokenHex, // Gunakan versi hex
      );
      expect(result).toEqual({
        message:
          'User registered successfully. Please check your email for verification.',
      });
    });

    it('should throw ConflictException if email already exists and is verified', async () => {
      const existingVerifiedUser = { ...createdUser, isEmailVerified: true };
      userService.findOneByEmail.mockResolvedValue(existingVerifiedUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Email sudah terdaftar dan terverifikasi.',
      );
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists but not verified', async () => {
      const existingUnverifiedUser = { ...createdUser, isEmailVerified: false };
      userService.findOneByEmail.mockResolvedValue(existingUnverifiedUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Email sudah terdaftar tetapi belum diverifikasi. Cek email Anda.',
      );
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if default CUSTOMER role not found', async () => {
      prisma.mysql.role.findUnique.mockResolvedValue(null); // Simulasikan CUSTOMER tidak ditemukan

      await expect(service.register(registerDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Konfigurasi peran default tidak ditemukan. Registrasi tidak dapat dilanjutkan.',
      );
      expect(userService.create).not.toHaveBeenCalled();
    });

    // Anda bisa menambahkan test untuk error saat userService.create, prisma.update, mailService.send
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
      role: { id: 1, name: 'USER', description: null },
      isEmailVerified: false,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: hashedToken, // Token ada di DB
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
      role: { id: 1, name: 'USER', description: null },
      isEmailVerified: true,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
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
      role: { id: 1, name: 'USER', description: null },
      isEmailVerified: true,
      hashedRefreshToken: null,
      passwordResetToken: hashedToken, // Token cocok dengan yang dicari
      passwordResetExpires: futureDate, // Token belum kedaluwarsa
      emailVerificationToken: null,
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
