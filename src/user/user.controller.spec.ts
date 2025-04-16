import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';
import { NotFoundException } from '@nestjs/common';
import { UserMysql as User } from '../../generated/mysql';
import { Role as PrismaRole } from '../../generated/mysql'; // Ambil tipe Role dari Prisma
import { Role as AppRole } from '@src/auth/roles/roles.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ViewProfileDto } from './dto/view-profile.dto';

// Mock UserService
const mockUserService = {
  findById: jest.fn(),
  updateUser: jest.fn(),
};

// Mock User data
const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  password: 'hashedpassword', // Nama field password sesuai tebakan sebelumnya
  name: 'Test User',
  role: PrismaRole.USER, // Gunakan tipe Role dari Prisma
  isEmailVerified: true,
  hashedRefreshToken: null,
  emailVerificationToken: null,
  passwordResetToken: null,
  passwordResetExpires: null,
  // Tambahkan field lain jika ada di model UserMysql
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
      userService.findById.mockResolvedValue(mockUser);

      const result = await controller.getProfile(req);

      expect(userService.findById).toHaveBeenCalledWith(mockUser.id);
      // Ekspektasi hasil sesuai ViewProfileDto (tanpa field sensitif)
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: AppRole.USER, // Pastikan role sudah terpetakan ke AppRole
        isEmailVerified: mockUser.isEmailVerified,
      });
      // Pastikan field sensitif tidak ada
      expect(result['password']).toBeUndefined();
      expect(result['hashedRefreshToken']).toBeUndefined();
      expect(result['emailVerificationToken']).toBeUndefined();
      expect(result['passwordResetToken']).toBeUndefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      const req = mockRequest(999); // ID tidak valid
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
    const updatedUserResult = {
      ...mockUser,
      name: updateDto.name, // Nama sudah diupdate
    };
    const expectedProfileResult: ViewProfileDto = {
      id: updatedUserResult.id,
      email: updatedUserResult.email,
      name: updatedUserResult.name ?? null,
      role: AppRole.USER, // Mapping role
      isEmailVerified: updatedUserResult.isEmailVerified,
    };

    it('should update user profile and return updated data', async () => {
      const req = mockRequest(mockUser.id);
      userService.updateUser.mockResolvedValue(updatedUserResult);

      const result = await controller.updateProfile(req, updateDto);

      expect(userService.updateUser).toHaveBeenCalledWith(mockUser.id, {
        name: updateDto.name, // Hanya field yang boleh diubah
      });
      expect(result).toEqual(expectedProfileResult);
    });

    it('should set name to null if empty string is provided', async () => {
      const req = mockRequest(mockUser.id);
      const dtoWithEmptyName: UpdateProfileDto = { name: '' };
      const updatedUserWithNullName = { ...mockUser, name: null };
      userService.updateUser.mockResolvedValue(updatedUserWithNullName);

      await controller.updateProfile(req, dtoWithEmptyName);

      expect(userService.updateUser).toHaveBeenCalledWith(mockUser.id, {
        name: null, // Pastikan null dikirim ke service
      });
    });

    it('should not update name if dto does not contain name', async () => {
      const req = mockRequest(mockUser.id);
      const emptyDto: UpdateProfileDto = {}; // Tidak ada field name
      // Asumsikan updateUser mengembalikan user saat ini jika data kosong
      userService.updateUser.mockResolvedValue(mockUser);

      await controller.updateProfile(req, emptyDto);

      expect(userService.updateUser).toHaveBeenCalledWith(mockUser.id, {
        // Objek data harus kosong
      });
    });

    it('should throw NotFoundException if user to update not found', async () => {
      const req = mockRequest(mockUser.id);
      userService.updateUser.mockResolvedValue(null); // Simulasi user tidak ditemukan saat update

      await expect(controller.updateProfile(req, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(userService.updateUser).toHaveBeenCalledWith(mockUser.id, {
        name: updateDto.name,
      });
    });
  });
});
