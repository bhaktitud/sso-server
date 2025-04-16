import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '@src/prisma/prisma.service';
import { UserMysql, Prisma } from '../../generated/mysql'; // Impor tipe yang relevan
import { Role } from '@src/auth/roles/roles.enum'; // Impor Role jika diperlukan untuk data contoh

// Mock PrismaService dan metode yang digunakan oleh UserService
const mockPrismaService = {
  mysql: {
    userMysql: {
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
    const mockUser: UserMysql = {
      id: 1,
      email,
      password: 'hashedPassword',
      name: 'Test User',
      role: Role.USER,
      isEmailVerified: true,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
    };

    it('should call prisma.userMysql.findUnique with correct email', async () => {
      mockPrismaService.mysql.userMysql.findUnique.mockResolvedValue(mockUser);
      await service.findOneByEmail(email);
      expect(mockPrismaService.mysql.userMysql.findUnique).toHaveBeenCalledWith(
        {
          where: { email },
        },
      );
    });

    it('should return the user found by prisma', async () => {
      mockPrismaService.mysql.userMysql.findUnique.mockResolvedValue(mockUser);
      const result = await service.findOneByEmail(email);
      expect(result).toEqual(mockUser);
    });

    it('should return null if prisma does not find the user', async () => {
      mockPrismaService.mysql.userMysql.findUnique.mockResolvedValue(null);
      const result = await service.findOneByEmail(email);
      expect(result).toBeNull();
    });
  });

  // --- Test cases untuk metode findById ---
  describe('findById', () => {
    const userId = 1;
    // Gunakan mockUser yang sama, hapus createdAt/updatedAt jika perlu
    const mockUser: UserMysql = {
      id: userId,
      email: 'test@example.com',
      password: 'hashedPassword',
      name: 'Test User',
      role: Role.USER,
      isEmailVerified: true,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
    };

    it('should call prisma.userMysql.findUnique with correct id', async () => {
      mockPrismaService.mysql.userMysql.findUnique.mockResolvedValue(mockUser);
      await service.findById(userId);
      expect(mockPrismaService.mysql.userMysql.findUnique).toHaveBeenCalledWith(
        {
          where: { id: userId },
        },
      );
    });

    it('should return the user found by prisma', async () => {
      mockPrismaService.mysql.userMysql.findUnique.mockResolvedValue(mockUser);
      const result = await service.findById(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null if prisma does not find the user', async () => {
      mockPrismaService.mysql.userMysql.findUnique.mockResolvedValue(null);
      const result = await service.findById(userId);
      expect(result).toBeNull();
    });
  });

  // --- Test cases untuk metode create ---
  describe('create', () => {
    const createUserData: Prisma.UserMysqlCreateInput = {
      email: 'create@example.com',
      password: 'hashedPasswordForCreate',
      name: 'Create User',
      role: Role.USER,
    };
    const createdUser: UserMysql = {
      id: 3,
      email: 'create@example.com',
      password: 'hashedPasswordForCreate',
      name: 'Create User',
      role: Role.USER,
      isEmailVerified: false,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
    };

    it('should call prisma.userMysql.create with correct data', async () => {
      mockPrismaService.mysql.userMysql.create.mockResolvedValue(createdUser);
      await service.create(createUserData);
      expect(mockPrismaService.mysql.userMysql.create).toHaveBeenCalledWith({
        data: createUserData,
      });
    });

    it('should return the created user', async () => {
      mockPrismaService.mysql.userMysql.create.mockResolvedValue(createdUser);
      const result = await service.create(createUserData);
      expect(result).toEqual(createdUser);
    });

    // Opsional: Test case jika create gagal (misal, karena constraint unik)
    // it('should handle prisma create error', async () => { ... });
  });

  // --- Test cases untuk metode updateRefreshToken ---
  describe('updateRefreshToken', () => {
    const userId = 1;
    const hashedToken = 'someHashedRefreshToken';

    it('should call prisma.userMysql.update with correct userId and hashed token', async () => {
      // Mock update (tidak perlu mock return value karena return type void)
      mockPrismaService.mysql.userMysql.update.mockResolvedValue(
        undefined as any,
      );

      await service.updateRefreshToken(userId, hashedToken);

      expect(mockPrismaService.mysql.userMysql.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { hashedRefreshToken: hashedToken },
      });
    });

    it('should call prisma.userMysql.update with correct userId and null token', async () => {
      mockPrismaService.mysql.userMysql.update.mockResolvedValue(
        undefined as any,
      );
      await service.updateRefreshToken(userId, null);
      expect(mockPrismaService.mysql.userMysql.update).toHaveBeenCalledWith({
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

    it('should call prisma.userMysql.update with correct userId and new hashed password', async () => {
      // Mock update
      mockPrismaService.mysql.userMysql.update.mockResolvedValue(
        undefined as any,
      );

      await service.updatePassword(userId, newHashedPassword);

      expect(mockPrismaService.mysql.userMysql.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: newHashedPassword },
      });
    });

    // Opsional: Test case jika update gagal
    // it('should handle prisma update error', async () => { ... });
  });

  // --- Test cases untuk metode updateUser ---
  describe('updateUser', () => {
    const userId = 1;
    const currentUser: UserMysql = {
      id: userId,
      email: 'current@example.com',
      password: 'hashedPassword',
      name: 'Current Name',
      role: Role.USER,
      isEmailVerified: true,
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerificationToken: null,
    };

    it('should call prisma.update with filtered data (only name)', async () => {
      const updateData: Partial<UserMysql> = {
        name: 'Updated Name',
        email: 'new@example.com', // Field ilegal
        role: Role.ADMIN, // Field ilegal
      };
      const expectedUpdatePayload = { name: 'Updated Name' }; // Hanya name
      const updatedUser = { ...currentUser, name: 'Updated Name' };

      mockPrismaService.mysql.userMysql.update.mockResolvedValue(updatedUser);

      await service.updateUser(userId, updateData);

      expect(mockPrismaService.mysql.userMysql.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expectedUpdatePayload,
      });
    });

    it('should return the updated user from prisma', async () => {
      const updateData: Partial<UserMysql> = { name: 'Updated Name Again' };
      const updatedUser = { ...currentUser, name: 'Updated Name Again' };
      mockPrismaService.mysql.userMysql.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(userId, updateData);

      expect(result).toEqual(updatedUser);
    });

    it('should not call prisma.update and return current user if data is empty after filtering', async () => {
      const updateData: Partial<UserMysql> = {
        email: 'new@example.com', // Hanya field ilegal
        role: Role.ADMIN,
        password: 'newPassword',
      };

      // Mock findById yang akan dipanggil jika data kosong
      mockPrismaService.mysql.userMysql.findUnique.mockResolvedValue(
        currentUser,
      );

      const result = await service.updateUser(userId, updateData);

      expect(mockPrismaService.mysql.userMysql.update).not.toHaveBeenCalled();
      // Verifikasi findById dipanggil
      expect(mockPrismaService.mysql.userMysql.findUnique).toHaveBeenCalledWith(
        {
          where: { id: userId },
        },
      );
      expect(result).toEqual(currentUser);
    });

    it('should not call prisma.update and return current user if input data is empty', async () => {
      const updateData: Partial<UserMysql> = {};

      // Mock findById
      mockPrismaService.mysql.userMysql.findUnique.mockResolvedValue(
        currentUser,
      );

      const result = await service.updateUser(userId, updateData);

      expect(mockPrismaService.mysql.userMysql.update).not.toHaveBeenCalled();
      expect(mockPrismaService.mysql.userMysql.findUnique).toHaveBeenCalledWith(
        {
          where: { id: userId },
        },
      );
      expect(result).toEqual(currentUser);
    });

    it('should throw error from findById if user not found when data is empty', async () => {
      const updateData: Partial<UserMysql> = {};
      // Mock findById mengembalikan null
      mockPrismaService.mysql.userMysql.findUnique.mockResolvedValue(null);

      await expect(service.updateUser(userId, updateData)).rejects.toThrow(
        'User not found during update.',
      );
      expect(mockPrismaService.mysql.userMysql.update).not.toHaveBeenCalled();
    });

    // Opsional: Tes jika prisma.update gagal
    // it('should handle prisma update error', async () => { ... });
  });

  // --- Test cases untuk metode-metode UserService lainnya akan ditambahkan di sini ---
});
