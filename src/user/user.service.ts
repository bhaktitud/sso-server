import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { User, Prisma } from '../../generated/mysql';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.prisma.mysql.user.findUnique({
      where: { email },
    });
  }

  async findById(id: number): Promise<User | null> {
    return await this.prisma.mysql.user.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    // Pastikan untuk melakukan hash pada password sebelum memanggil ini
    // dan pastikan data menyertakan userType
    return await this.prisma.mysql.user.create({
      data,
    });
  }

  async updateRefreshToken(
    userId: number,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.prisma.mysql.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  // Tambahkan metode untuk update password saja
  async updatePassword(
    userId: number,
    newHashedPassword: string,
  ): Promise<void> {
    await this.prisma.mysql.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });
  }

  // Tambahkan metode lain sesuai kebutuhan (findById, dll.)
}
