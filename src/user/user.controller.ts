import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpException,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User, Prisma } from '../../generated/mysql';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Mendapatkan semua pengguna dengan opsional paginasi
  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<User[]> {
    try {
      const params: {
        skip?: number;
        take?: number;
      } = {};

      if (skip) params.skip = Number(skip);
      if (take) params.take = Number(take);

      return await this.userService.findAll(params);
    } catch (error) {
      throw new HttpException(
        error.message || 'Terjadi kesalahan saat mengambil data pengguna',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Mendapatkan satu pengguna berdasarkan ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    try {
      const user = await this.userService.findById(Number(id));
      if (!user) {
        throw new HttpException(
          'Pengguna tidak ditemukan',
          HttpStatus.NOT_FOUND,
        );
      }
      return user;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Terjadi kesalahan saat mengambil data pengguna',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Membuat pengguna baru
  @Post()
  async create(@Body() data: Prisma.UserCreateInput): Promise<User> {
    try {
      return await this.userService.create(data);
    } catch (error) {
      throw new HttpException(
        error.message || 'Terjadi kesalahan saat membuat pengguna',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Memperbarui pengguna
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.UserUpdateInput,
  ): Promise<User> {
    try {
      return await this.userService.update(Number(id), data);
    } catch (error) {
      throw new HttpException(
        error.message || 'Terjadi kesalahan saat memperbarui pengguna',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Menghapus pengguna
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<User> {
    try {
      return await this.userService.remove(Number(id));
    } catch (error) {
      throw new HttpException(
        error.message || 'Terjadi kesalahan saat menghapus pengguna',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
