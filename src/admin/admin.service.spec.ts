import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '@src/prisma/prisma.service';
import { UserService } from '@src/user/user.service';
import { RbacService } from '@src/rbac/rbac.service';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  UserType,
  AdminProfile,
  User,
  Role,
  Company,
} from '../../generated/mysql'; // Import necessary types
import { CreateAdminDto } from './dto/create-admin.dto';

// Mock bcrypt
jest.mock('bcrypt');
// Kembalikan ke bentuk asli
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock Prisma Transaction
const mockTx = {
  user: {
    create: jest.fn(),
  },
  adminProfile: {
    create: jest.fn(),
    update: jest.fn(),
  },
  // Tambahkan mock lain jika perlu dalam transaksi
};

describe('AdminService', () => {
  let service: AdminService;
  // Kembalikan definisi dan penggunaan DeepMocked helper type
  type DeepMocked<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any
      ? jest.MockedFunction<T[K]>
      : DeepMocked<T[K]>;
  } & T;
  let prisma: DeepMocked<PrismaService>;
  let userService: DeepMocked<UserService>;
  let rbacService: DeepMocked<RbacService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: {
            mysql: {
              // Mock $transaction
              $transaction: jest
                .fn()
                .mockImplementation(async (callbackOrArray) => {
                  if (typeof callbackOrArray === 'function') {
                    return await callbackOrArray(mockTx);
                  } else if (Array.isArray(callbackOrArray)) {
                    return [];
                  }
                  throw new Error('Invalid $transaction usage in mock');
                }),
              // Mock direct access if needed outside transaction
              user: {
                findUnique: jest.fn(),
                delete: jest.fn(),
                // ... other user methods if used directly
              },
              adminProfile: {
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                // ... other adminProfile methods if used directly
              },
              company: {
                findUnique: jest.fn(),
                findUniqueOrThrow: jest.fn(), // Mock this too
                // ... other company methods if used directly
              },
              role: {
                // ... role methods if used directly
              },
              // ... other models
            },
          },
        },
        {
          provide: UserService,
          useValue: {
            findOneByEmail: jest.fn(),
            // Mock other UserService methods if needed
          },
        },
        {
          provide: RbacService,
          useValue: {
            findRoleById: jest.fn(),
            findPermissionsForRole: jest.fn(), // Mungkin perlu nanti
            findRoleByName: jest.fn(), // Mungkin perlu nanti
            // Mock other RbacService methods if needed
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    // Pastikan assignment menggunakan tipe DeepMocked
    prisma = module.get(PrismaService);
    userService = module.get(UserService);
    rbacService = module.get(RbacService);

    // Reset mocks before each test
    jest.clearAllMocks();
    mockedBcrypt.hash.mockClear(); // Clear bcrypt mock too
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Test Cases for createAdmin ---

  describe('createAdmin', () => {
    const createAdminDto: CreateAdminDto = {
      email: 'admin@test.com',
      password: 'Password123',
      name: 'Test Admin',
      roleIds: [1],
      companyId: 1,
    };
    const mockUser: User = {
      id: 1,
      email: 'admin@test.com',
      password: 'hashedPassword',
      userType: UserType.ADMIN_USER,
      name: 'Test Admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      hashedRefreshToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      isEmailVerified: true,
      emailVerificationToken: null,
    };
    const mockRole: Role = {
      id: 1,
      name: 'AdminRole',
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockCompany: Company = {
      id: 1,
      name: 'Test Company',
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockAdminProfile: AdminProfile = {
      id: 1,
      userId: 1,
      name: 'Test Admin',
      companyId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Mock AdminProfile with relations for return value
    const mockCreatedAdminProfile = {
      ...mockAdminProfile,
      user: mockUser,
      company: mockCompany,
      roles: [mockRole],
    };

    beforeEach(() => {
      userService.findOneByEmail.mockResolvedValue(null); // No existing user
      rbacService.findRoleById.mockResolvedValue(mockRole); // Valid role
      prisma.mysql.company.findUniqueOrThrow.mockResolvedValue(mockCompany); // Valid company
      // @ts-expect-error - Mengabaikan error tipe 'never' yang aneh
      mockedBcrypt.hash.mockResolvedValue('hashedPassword'); // Mock hashing
      mockTx.user.create.mockResolvedValue(mockUser); // Mock user creation in tx
      mockTx.adminProfile.create.mockResolvedValue(mockAdminProfile); // Mock admin profile creation in tx (base)
      mockTx.adminProfile.update.mockResolvedValue(mockCreatedAdminProfile); // Mock role connection update in tx
    });

    it('should create an admin user and profile successfully', async () => {
      const result = await service.createAdmin(createAdminDto);
      const { mysql } = prisma; // Destrukturisasi

      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        createAdminDto.email,
      );
      expect(rbacService.findRoleById).toHaveBeenCalledWith(
        createAdminDto.roleIds[0],
      );
      expect(mysql.company.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: createAdminDto.companyId },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        createAdminDto.password,
        10,
      );
      expect(prisma.mysql.$transaction).toHaveBeenCalled();
      expect(mockTx.user.create).toHaveBeenCalledWith({
        data: {
          email: createAdminDto.email,
          password: 'hashedPassword',
          name: createAdminDto.name,
          userType: UserType.ADMIN_USER,
        },
      });
      expect(mockTx.adminProfile.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          name: createAdminDto.name,
          companyId: createAdminDto.companyId,
        },
      });
      expect(mockTx.adminProfile.update).toHaveBeenCalledWith({
        where: { id: mockAdminProfile.id },
        data: {
          roles: { connect: [{ id: mockRole.id }] },
        },
        include: { user: true, company: true, roles: true },
      });
      expect(result).toEqual(mockCreatedAdminProfile);
    });

    it('should throw ConflictException if email already exists', async () => {
      userService.findOneByEmail.mockResolvedValue(mockUser);
      await expect(async () =>
        service.createAdmin(createAdminDto),
      ).rejects.toThrow(ConflictException);
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        createAdminDto.email,
      );
      expect(rbacService.findRoleById).not.toHaveBeenCalled();
      expect(prisma.mysql.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if roleId is invalid', async () => {
      rbacService.findRoleById.mockRejectedValue(new Error('Not found'));
      await expect(async () =>
        service.createAdmin(createAdminDto),
      ).rejects.toThrow(BadRequestException);
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        createAdminDto.email,
      );
      expect(rbacService.findRoleById).toHaveBeenCalledWith(
        createAdminDto.roleIds[0],
      );
      expect(prisma.mysql.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if companyId is invalid', async () => {
      const { mysql } = prisma;
      mysql.company.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));
      await expect(async () =>
        service.createAdmin(createAdminDto),
      ).rejects.toThrow(BadRequestException);
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        createAdminDto.email,
      );
      expect(rbacService.findRoleById).toHaveBeenCalledWith(
        createAdminDto.roleIds[0],
      );
      expect(mysql.company.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: createAdminDto.companyId },
      });
      expect(prisma.mysql.$transaction).not.toHaveBeenCalled();
    });

    it('should handle transaction failure', async () => {
      prisma.mysql.$transaction.mockRejectedValue(
        new Error('Transaction failed'),
      );
      await expect(service.createAdmin(createAdminDto)).rejects.toThrow(
        'Gagal membuat admin baru.',
      );
      expect(prisma.mysql.$transaction).toHaveBeenCalled();
    });

    it('should create an admin without companyId successfully', async () => {
      const { mysql } = prisma;
      const dtoWithoutCompany: CreateAdminDto = {
        ...createAdminDto,
        companyId: undefined,
      };
      mysql.company.findUniqueOrThrow.mockClear();
      mockTx.adminProfile.create.mockResolvedValue({
        ...mockAdminProfile,
        companyId: null,
      });
      mockTx.adminProfile.update.mockResolvedValue({
        ...mockCreatedAdminProfile,
        company: null,
        companyId: null,
      });

      const result = await service.createAdmin(dtoWithoutCompany);

      expect(mysql.company.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(mockTx.adminProfile.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          name: dtoWithoutCompany.name,
        },
      });
      expect((result as any).company).toBeNull();
    });
  });

  // --- Test Cases for findAllAdmins ---
  describe('findAllAdmins', () => {
    it('should return an array of admin profiles', async () => {
      const { mysql } = prisma; // Destrukturisasi
      const mockProfiles = [
        { id: 1, name: 'Admin 1', user: {}, company: {}, roles: [] },
      ];
      mysql.adminProfile.findMany.mockResolvedValue(mockProfiles as any);
      const result = await service.findAllAdmins();
      expect(result).toEqual(mockProfiles);
      expect(mysql.adminProfile.findMany).toHaveBeenCalledWith({
        include: { user: true, company: true, roles: true },
      });
    });
  });

  // --- Test Cases for findAdminById ---
  describe('findAdminById', () => {
    const adminId = 1;
    const mockProfile = { id: adminId, name: 'Test Admin' };
    it('should return the admin profile if found', async () => {
      const { mysql } = prisma;
      mysql.adminProfile.findUnique.mockResolvedValue(mockProfile as any);
      const result = await service.findAdminById(adminId);
      expect(result).toEqual(mockProfile);
      expect(mysql.adminProfile.findUnique).toHaveBeenCalledWith({
        where: { id: adminId },
        include: { user: true, company: true, roles: true },
      });
    });
    it('should throw NotFoundException if admin profile not found', async () => {
      const { mysql } = prisma;
      mysql.adminProfile.findUnique.mockResolvedValue(null);
      await expect(async () => service.findAdminById(adminId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mysql.adminProfile.findUnique).toHaveBeenCalledWith({
        where: { id: adminId },
        include: { user: true, company: true, roles: true },
      });
    });
  });

  // --- Test Cases for deleteAdmin ---
  describe('deleteAdmin', () => {
    const adminId = 1;
    const mockProfile = { id: adminId, userId: 10, name: 'Test Admin' };
    it('should delete the admin profile and associated user successfully', async () => {
      const { mysql } = prisma;
      mysql.adminProfile.findUnique.mockResolvedValue(mockProfile as any);
      mysql.adminProfile.delete.mockResolvedValue({} as any);
      mysql.user.delete.mockResolvedValue({} as any);
      await service.deleteAdmin(adminId);
      expect(mysql.adminProfile.findUnique).toHaveBeenCalledWith({
        where: { id: adminId },
        include: { user: true, company: true, roles: true },
      });
      expect(mysql.adminProfile.delete).toHaveBeenCalledWith({
        where: { id: adminId },
      });
      expect(mysql.user.delete).toHaveBeenCalledWith({
        where: { id: mockProfile.userId },
      });
    });
    it('should throw NotFoundException if admin profile not found', async () => {
      const { mysql } = prisma;
      mysql.adminProfile.findUnique.mockResolvedValue(null);
      await expect(async () => service.deleteAdmin(adminId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mysql.adminProfile.findUnique).toHaveBeenCalledWith({
        where: { id: adminId },
        include: { user: true, company: true, roles: true },
      });
      expect(mysql.adminProfile.delete).not.toHaveBeenCalled();
      expect(mysql.user.delete).not.toHaveBeenCalled();
    });
    it('should throw error if transaction fails during delete', async () => {
      const { mysql } = prisma;
      mysql.adminProfile.findUnique.mockResolvedValue(mockProfile as any);
      prisma.mysql.$transaction.mockRejectedValue(
        new Error('DB Transaction Failed'),
      );
      await expect(service.deleteAdmin(1)).rejects.toThrow(
        'Failed to delete admin.',
      );
      expect(mysql.adminProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { user: true, company: true, roles: true },
      });
      expect(prisma.mysql.$transaction).toHaveBeenCalled();
    });
  });

  // --- Test Cases for assignRoleToAdmin & removeRoleFromAdmin ---
  // ... (Tambahkan tes, terapkan pola yang sama untuk rejects.toThrow)
});
