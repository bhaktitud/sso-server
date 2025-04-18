import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from './company.service';
import { PrismaService } from '@src/prisma/prisma.service';

// Buat mock untuk PrismaService
const mockPrismaService = {
  mysql: {
    company: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // Mock model lain jika CompanyService berinteraksi dengannya
  },
};

describe('CompanyService', () => {
  let service: CompanyService;
  let prisma: typeof mockPrismaService; // Simpan referensi mock prisma

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        // Sediakan mock PrismaService
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    prisma = module.get(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO: Tambahkan test case untuk setiap metode service
  // Contoh:
  /*
  describe('create', () => {
    it('should call prisma.company.create and return the result', async () => {
      const createDto = { name: 'Test Company' };
      const expectedResult = { id: 1, ...createDto };
      mockPrismaService.mysql.company.create.mockResolvedValue(expectedResult);

      const result = await service.create(createDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.mysql.company.create).toHaveBeenCalledWith({ data: createDto });
    });
  });
  */
});
