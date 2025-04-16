import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';
import { NotFoundException } from '@nestjs/common';
import { UserMysql as User } from '../../generated/mysql';
// import { Role as PrismaRole } from '../../generated/mysql'; // Tipe Role tidak perlu diimpor jika hanya pakai ID
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ViewProfileDto } from './dto/view-profile.dto';

// Mock UserService
const mockUserService = {
  findById: jest.fn(),
  updateUser: jest.fn(),
};

// Mock User data (sesuaikan dengan model UserMysql + relasi role)
const mockUserRoleId = 1;
const mockUserRoleName = 'USER';
const mockUser: User & {
  role: { id: number; name: string; description: string | null };
} = {
  id: 1,
  email: 'test@example.com',
  password: 'hashedpassword',
  name: 'Test User',
  roleId: mockUserRoleId, // ID tetap ada di model dasar
  companyId: null,
  isEmailVerified: true,
  hashedRefreshToken: null,
  emailVerificationToken: null,
  passwordResetToken: null,
  passwordResetExpires: null,
  // Tambahkan properti role sebagai objek relasi
  role: { id: mockUserRoleId, name: mockUserRoleName, description: null },
};

// Mock Request object dengan user
const mockRequest = (userId: number) => ({
  user: {
    userId: userId,
  },
});

describe('UserController', () => {
  let controller: UserController;
  let userService: typeof mockUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      // Override guard agar tidak perlu mock dependensi JwtAuthGuard sepenuhnya
      // Jika guard memiliki logika penting, mock secara spesifik
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Tests for getProfile --- //
  describe('getProfile', () => {
    it('should return user profile data for authenticated user', async () => {
      const req = mockRequest(mockUser.id);
      // Pastikan mock findById mengembalikan user DENGAN objek role
      userService.findById.mockResolvedValue(mockUser);

      const result = await controller.getProfile(req);

      expect(userService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUserRoleName, // Ekspektasi DTO adalah nama role (string)
        isEmailVerified: mockUser.isEmailVerified,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const req = mockRequest(999);
      // findById mengembalikan null, tidak perlu objek user
      userService.findById.mockResolvedValue(null);

      await expect(controller.getProfile(req)).rejects.toThrow(
        NotFoundException,
      );
      expect(userService.findById).toHaveBeenCalledWith(999);
    });
  });

  // --- Tests for updateProfile --- //
  describe('updateProfile', () => {
    const updateDto: UpdateProfileDto = {
      name: 'Updated Name',
    };
    // Buat mock user yang sudah terupdate DENGAN objek role
    const updatedUserResult = {
      ...mockUser, // Ambil basis dari mockUser
      name: updateDto.name,
      // Pastikan role tetap ada
      role: { id: mockUserRoleId, name: mockUserRoleName, description: null },
    };
    // Ekspektasi DTO tetap string untuk role
    const expectedProfileResult: ViewProfileDto = {
      id: updatedUserResult.id,
      email: updatedUserResult.email,
      name: updatedUserResult.name ?? null,
      role: mockUserRoleName,
      isEmailVerified: updatedUserResult.isEmailVerified,
    };

    it('should update user profile and return updated data', async () => {
      const req = mockRequest(mockUser.id);
      // Pastikan mock updateUser mengembalikan user DENGAN objek role
      userService.updateUser.mockResolvedValue(updatedUserResult);

      const result = await controller.updateProfile(req, updateDto);

      expect(userService.updateUser).toHaveBeenCalledWith(mockUser.id, {
        name: updateDto.name,
      });
      expect(result).toEqual(expectedProfileResult);
    });

    it('should set name to null if empty string is provided', async () => {
      const req = mockRequest(mockUser.id);
      const dtoWithEmptyName: UpdateProfileDto = { name: '' };
      // Buat mock user terupdate DENGAN objek role dan nama null
      const updatedUserWithNullName = {
        ...mockUser,
        name: null,
        role: { id: mockUserRoleId, name: mockUserRoleName, description: null },
      };
      userService.updateUser.mockResolvedValue(updatedUserWithNullName);

      await controller.updateProfile(req, dtoWithEmptyName);

      expect(userService.updateUser).toHaveBeenCalledWith(mockUser.id, {
        name: null,
      });
      // Anda mungkin ingin menambahkan ekspektasi untuk hasil DTO juga
      // const result = await controller.updateProfile(req, dtoWithEmptyName);
      // expect(result.name).toBeNull();
      // expect(result.role).toEqual(mockUserRoleName);
    });

    it('should not update name if dto does not contain name', async () => {
      const req = mockRequest(mockUser.id);
      const emptyDto: UpdateProfileDto = {};
      // Jika DTO kosong, updateUser di service akan memanggil findById.
      // Namun, controller tetap memanggil updateUser.
      // Kita perlu mock updateUser untuk mengembalikan user saat ini (mockUser).
      userService.updateUser.mockResolvedValue(mockUser);
      // userService.findById.mockResolvedValue(mockUser); // Mock ini tidak relevan lagi

      const result = await controller.updateProfile(req, emptyDto);

      // Verifikasi updateUser dipanggil dengan data kosong
      expect(userService.updateUser).toHaveBeenCalledWith(mockUser.id, {});
      // Verifikasi hasil adalah profil saat ini
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name, // Harusnya "Test User"
        role: mockUserRoleName,
        isEmailVerified: mockUser.isEmailVerified,
      });
    });

    it('should throw NotFoundException if user to update not found', async () => {
      const req = mockRequest(mockUser.id);
      // Mock updateUser untuk mengembalikan null (user tidak ditemukan saat proses update)
      userService.updateUser.mockResolvedValue(null);

      await expect(controller.updateProfile(req, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(userService.updateUser).toHaveBeenCalledWith(mockUser.id, {
        name: updateDto.name,
      });
    });
  });
});
