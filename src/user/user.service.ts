import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserMysql, Prisma } from '../../generated/mysql';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string): Promise<UserMysql | null> {
    return this.prisma.mysql.userMysql.findUnique({
      where: { email },
    });
  }

  async findById(id: number): Promise<UserMysql | null> {
    return this.prisma.mysql.userMysql.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.UserMysqlCreateInput): Promise<UserMysql> {
    // Pastikan untuk melakukan hash pada password sebelum memanggil ini
    return this.prisma.mysql.userMysql.create({
      data,
    });
  }

  async updateRefreshToken(
    userId: number,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.prisma.mysql.userMysql.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  // Tambahkan metode untuk update password saja
  async updatePassword(
    userId: number,
    newHashedPassword: string,
  ): Promise<void> {
    await this.prisma.mysql.userMysql.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });
  }

  // Tambahkan metode lain sesuai kebutuhan (findById, dll.)
}
