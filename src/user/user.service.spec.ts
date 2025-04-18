import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '@src/prisma/prisma.service';
import { User, Prisma, UserType } from '../../generated/mysql'; // Import UserType
import { NotFoundException } from '@nestjs/common';

// Mock PrismaService dan metode yang digunakan oleh UserService
const mockPrismaService = {
  mysql: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService, // Sediakan mock PrismaService
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    // Reset mock calls sebelum setiap tes
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Test cases untuk metode findOneByEmail ---
  describe('findOneByEmail', () => {
    const email = 'test@example.com';
    const mockUser: User = {
      id: 1,
      email,
      password: 'hashedPassword',
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

    it('should call prisma.user.findUnique with correct email', async () => {
      mockPrismaService.mysql.user.findUnique.mockResolvedValue(mockUser);
      await service.findOneByEmail(email);
      expect(mockPrismaService.mysql.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should return the user found by prisma', async () => {
      mockPrismaService.mysql.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findOneByEmail(email);
      expect(result).toEqual(mockUser);
    });

    it('should return null if prisma does not find the user', async () => {
      mockPrismaService.mysql.user.findUnique.mockResolvedValue(null);
      const result = await service.findOneByEmail(email);
      expect(result).toBeNull();
    });
  });

  // --- Test cases untuk metode findById ---
  describe('findById', () => {
    const userId = 1;
    const mockUser: User = {
      id: userId,
      email: 'test@example.com',
      password: 'hashedPassword',
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

    it('should call prisma.user.findUnique with correct id', async () => {
      mockPrismaService.mysql.user.findUnique.mockResolvedValue(mockUser);
      await service.findById(userId);
      expect(mockPrismaService.mysql.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should return the user found by prisma', async () => {
      mockPrismaService.mysql.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findById(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null if prisma does not find the user', async () => {
      mockPrismaService.mysql.user.findUnique.mockResolvedValue(null);
      const result = await service.findById(userId);
      expect(result).toBeNull();
    });
  });

  // --- Test cases untuk metode create ---
  describe('create', () => {
    it('should create a user', async () => {
      const createUserData: Prisma.UserCreateInput = {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        userType: UserType.ADMIN_USER,
      };
      const createdUser: User = {
        id: 1,
        email: createUserData.email,
        password: createUserData.password,
        name: createUserData.name ?? null,
        userType: createUserData.userType,
        createdAt: new Date(),
        updatedAt: new Date(),
        hashedRefreshToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        isEmailVerified: false,
        emailVerificationToken: null,
      };
      mockPrismaService.mysql.user.create.mockResolvedValue(createdUser);

      const result = await service.create(createUserData);
      expect(result).toEqual(createdUser);
      expect(mockPrismaService.mysql.user.create).toHaveBeenCalledWith({
        data: createUserData,
      });
    });
  });

  // --- Test cases untuk metode updateRefreshToken ---
  describe('updateRefreshToken', () => {
    const userId = 1;
    const hashedToken = 'someHashedRefreshToken';

    it('should call prisma.user.update with correct userId and hashed token', async () => {
      // Mock update (tidak perlu mock return value karena return type void)
      mockPrismaService.mysql.user.update.mockResolvedValue(undefined as any);

      await service.updateRefreshToken(userId, hashedToken);

      expect(mockPrismaService.mysql.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { hashedRefreshToken: hashedToken },
      });
    });

    it('should call prisma.user.update with correct userId and null token', async () => {
      mockPrismaService.mysql.user.update.mockResolvedValue(undefined as any);
      await service.updateRefreshToken(userId, null);
      expect(mockPrismaService.mysql.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { hashedRefreshToken: null },
      });
    });

    // Opsional: Test case jika update gagal
    // it('should handle prisma update error', async () => { ... });
  });

  // --- Test cases untuk metode updatePassword ---
  describe('updatePassword', () => {
    const userId = 1;
    const newHashedPassword = 'newHashedSecurePassword';

    it('should call prisma.user.update with correct userId and new hashed password', async () => {
      // Mock update
      mockPrismaService.mysql.user.update.mockResolvedValue(undefined as any);

      await service.updatePassword(userId, newHashedPassword);

      expect(mockPrismaService.mysql.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: newHashedPassword },
      });
    });

    // Opsional: Test case jika update gagal
    // it('should handle prisma update error', async () => { ... });
  });

  // --- Test cases untuk metode-metode UserService lainnya akan ditambahkan di sini ---
});
