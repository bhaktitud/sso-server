import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

// Buat mock untuk AdminService
const mockAdminService = {
  createAdmin: jest.fn(),
  findAllAdmins: jest.fn(),
  findAdminById: jest.fn(),
  updateAdmin: jest.fn(),
  deleteAdmin: jest.fn(),
  assignRoleToAdmin: jest.fn(),
  removeRoleFromAdmin: jest.fn(),
  // Tambahkan metode lain jika ada
};

describe('AdminController', () => {
  let controller: AdminController;
  let service: typeof mockAdminService; // Simpan referensi mock service

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        // Sediakan mock AdminService
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get(AdminService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // TODO: Tambahkan test case untuk setiap endpoint controller admin
  // Contoh:
  /*
  describe('create', () => {
    it('should call adminService.createAdmin and return the result', async () => {
      const createDto = { email: 'test@admin.com', password: 'pass', name: 'Admin Test' };
      const expectedResult = { id: 1, ...createDto };
      mockAdminService.createAdmin.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(result).toEqual(expectedResult);
      expect(mockAdminService.createAdmin).toHaveBeenCalledWith(createDto);
    });
  });
  */
});
