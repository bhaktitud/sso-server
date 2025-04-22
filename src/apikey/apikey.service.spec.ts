import { Test, TestingModule } from '@nestjs/testing';
import { ApikeyService } from './apikey.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateApikeyDto } from './dto/create-apikey.dto';

// Mock PrismaService
const mockPrismaService = {
  mysql: {
    company: {
      findUnique: jest.fn(),
    },
    apiKey: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    apiLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
};

describe('ApikeyService', () => {
  let service: ApikeyService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApikeyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ApikeyService>(ApikeyService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateApikeyDto = {
      name: 'Test API Key',
      description: 'Test Description',
      companyId: 1,
    };

    it('should throw NotFoundException if company not found', async () => {
      mockPrismaService.mysql.company.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.mysql.company.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.companyId },
      });
    });

    it('should throw BadRequestException if company already has 3 API keys', async () => {
      mockPrismaService.mysql.company.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Company',
      });
      mockPrismaService.mysql.apiKey.count.mockResolvedValue(3);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.mysql.company.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.companyId },
      });
      expect(mockPrismaService.mysql.apiKey.count).toHaveBeenCalledWith({
        where: { companyId: createDto.companyId },
      });
      expect(mockPrismaService.mysql.apiKey.create).not.toHaveBeenCalled();
    });

    it('should create API key if company has less than 3 API keys', async () => {
      mockPrismaService.mysql.company.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Company',
      });
      mockPrismaService.mysql.apiKey.count.mockResolvedValue(2);
      mockPrismaService.mysql.apiKey.create.mockResolvedValue({
        id: 1,
        key: 'test-key',
        name: createDto.name,
        description: createDto.description,
        companyId: createDto.companyId,
      });

      const result = await service.create(createDto);

      expect(mockPrismaService.mysql.company.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.companyId },
      });
      expect(mockPrismaService.mysql.apiKey.count).toHaveBeenCalledWith({
        where: { companyId: createDto.companyId },
      });
      expect(mockPrismaService.mysql.apiKey.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('key', 'test-key');
    });
  });
}); 