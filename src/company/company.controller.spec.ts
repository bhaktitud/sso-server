import { Test, TestingModule } from '@nestjs/testing';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

// Buat mock untuk CompanyService
const mockCompanyService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  // Tambahkan metode lain jika ada
};

describe('CompanyController', () => {
  let controller: CompanyController;
  let service: typeof mockCompanyService; // Simpan referensi mock service

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        // Sediakan mock CompanyService
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
      ],
    }).compile();

    controller = module.get<CompanyController>(CompanyController);
    service = module.get(CompanyService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // TODO: Tambahkan test case untuk setiap endpoint controller
  // Contoh:
  /*
  describe('create', () => {
    it('should call companyService.create and return the result', async () => {
      const createDto = { name: 'Test Company' };
      const expectedResult = { id: 1, ...createDto };
      mockCompanyService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(result).toEqual(expectedResult);
      expect(mockCompanyService.create).toHaveBeenCalledWith(createDto);
    });
  });
  */
});
