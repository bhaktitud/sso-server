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
import { UpdateAdminDto } from './dto/update-admin.dto';

// Mock bcrypt
jest.mock('bcrypt');
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
  let prisma: DeepMocked<PrismaService>;
  let userService: DeepMocked<UserService>;
  let rbacService: DeepMocked<RbacService>;

  // Helper type for deep mocking
  type DeepMocked<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any
      ? jest.MockedFunction<T[K]>
      : DeepMocked<T[K]>;
  } & T;

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
                .mockImplementation(async (callback) => callback(mockTx)),
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
    // Assign mocks for easier access in tests
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
      adminProfile: null, // adminProfile will be linked later
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
      // Default mock implementations for success case
      userService.findOneByEmail.mockResolvedValue(null); // No existing user
      rbacService.findRoleById.mockResolvedValue(mockRole); // Valid role
      prisma.mysql.company.findUniqueOrThrow.mockResolvedValue(mockCompany); // Valid company
      mockedBcrypt.hash.mockResolvedValue('hashedPassword'); // Mock hashing
      mockTx.user.create.mockResolvedValue(mockUser); // Mock user creation in tx
      mockTx.adminProfile.create.mockResolvedValue(mockAdminProfile); // Mock admin profile creation in tx (base)
      mockTx.adminProfile.update.mockResolvedValue(mockCreatedAdminProfile); // Mock role connection update in tx
    });

    it('should create an admin user and profile successfully', async () => {
      const result = await service.createAdmin(createAdminDto);

      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        createAdminDto.email,
      );
      expect(rbacService.findRoleById).toHaveBeenCalledWith(
        createAdminDto.roleIds[0],
      );
      expect(prisma.mysql.company.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: createAdminDto.companyId },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        createAdminDto.password,
        10,
      ); // Assuming saltRounds=10
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
        // Create without roles first
        data: {
          userId: mockUser.id,
          name: createAdminDto.name,
          companyId: createAdminDto.companyId,
        },
      });
      expect(mockTx.adminProfile.update).toHaveBeenCalledWith({
        // Update to connect roles
        where: { id: mockAdminProfile.id },
        data: {
          roles: { connect: [{ id: mockRole.id }] },
        },
        include: { user: true, company: true, roles: true },
      });
      expect(result).toEqual(mockCreatedAdminProfile);
    });

    it('should throw ConflictException if email already exists', async () => {
      userService.findOneByEmail.mockResolvedValue(mockUser); // Simulate existing user

      await expect(service.createAdmin(createAdminDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        createAdminDto.email,
      );
      expect(rbacService.findRoleById).not.toHaveBeenCalled();
      expect(prisma.mysql.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if roleId is invalid', async () => {
      rbacService.findRoleById.mockRejectedValue(new Error('Not found')); // Simulate role not found

      await expect(service.createAdmin(createAdminDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        createAdminDto.email,
      );
      expect(rbacService.findRoleById).toHaveBeenCalledWith(
        createAdminDto.roleIds[0],
      );
      expect(prisma.mysql.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if companyId is invalid', async () => {
      prisma.mysql.company.findUniqueOrThrow.mockRejectedValue(
        new Error('Not found'),
      ); // Simulate company not found

      await expect(service.createAdmin(createAdminDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        createAdminDto.email,
      );
      expect(rbacService.findRoleById).toHaveBeenCalledWith(
        createAdminDto.roleIds[0],
      );
      expect(prisma.mysql.company.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: createAdminDto.companyId },
      });
      expect(prisma.mysql.$transaction).not.toHaveBeenCalled();
    });

    it('should handle errors during transaction', async () => {
      const transactionError = new Error('Transaction failed');
      prisma.mysql.$transaction.mockRejectedValue(transactionError); // Simulate transaction failure

      await expect(service.createAdmin(createAdminDto)).rejects.toThrow(
        'Gagal membuat admin baru.',
      );
      expect(prisma.mysql.$transaction).toHaveBeenCalled();
    });

    // Tambahkan test case untuk companyId opsional
    it('should create an admin without companyId successfully', async () => {
      const dtoWithoutCompany: CreateAdminDto = {
        ...createAdminDto,
        companyId: undefined,
      };
      // Reset mock for company check
      prisma.mysql.company.findUniqueOrThrow.mockClear();
      // Adjust mock for admin profile creation without companyId
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

      expect(prisma.mysql.company.findUniqueOrThrow).not.toHaveBeenCalled(); // Should not be called
      expect(mockTx.adminProfile.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          name: dtoWithoutCompany.name,
          // companyId should not be present
        },
      });
      expect(result.company).toBeNull();
    });
  });

  // TODO: Tambahkan describe blok untuk metode lain (findAllAdmins, findAdminById, updateAdmin, deleteAdmin, assignRoleToAdmin, removeRoleFromAdmin)
  // dengan test case yang relevan dan mock yang sesuai.
});
