import { Test, TestingModule } from '@nestjs/testing';
import { RbacService } from './rbac.service';
import { PrismaService } from '@src/prisma/prisma.service';

// Buat mock untuk PrismaService
const mockPrismaService = {
  mysql: {
    role: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findUnique: jest.fn(), // Tambahkan jika digunakan
      update: jest.fn(),
      delete: jest.fn(),
    },
    permission: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findUnique: jest.fn(), // Tambahkan jika digunakan
      update: jest.fn(),
      delete: jest.fn(),
    },
    // Mock model lain jika RbacService berinteraksi dengannya
  },
};

describe('RbacService', () => {
  let service: RbacService;
  let prisma: typeof mockPrismaService; // Simpan referensi mock prisma

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        // Sediakan mock PrismaService
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RbacService>(RbacService);
    prisma = module.get(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO: Tambahkan test case untuk setiap metode service RBAC
  // Contoh: findRoleById, createRole, assignPermissionToRole, dll.
});
