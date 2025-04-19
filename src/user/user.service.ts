import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { User, Prisma } from '../../generated/mysql';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, where, orderBy } = params;
    return await this.prisma.mysql.user.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

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

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return await this.prisma.mysql.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<User> {
    return await this.prisma.mysql.user.delete({
      where: { id },
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
