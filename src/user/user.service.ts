import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { User, Prisma } from '../../generated/mysql';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, where, orderBy } = params;

    // Buat cache key berdasarkan parameter
    const cacheKey = `users:all:${JSON.stringify({ skip, take, where, orderBy })}`;

    // Coba ambil dari cache dulu
    const cachedUsers = await this.cacheManager.get<User[]>(cacheKey);
    if (cachedUsers) {
      return cachedUsers;
    }

    // Jika tidak ada di cache, ambil dari database
    const users = await this.prisma.mysql.user.findMany({
      skip,
      take,
      where,
      orderBy,
    });

    // Simpan ke cache dengan TTL 1 menit
    await this.cacheManager.set(cacheKey, users, 60000);

    return users;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    // Tidak menggunakan cache untuk email karena sensitif dan perlu selalu update
    return await this.prisma.mysql.user.findUnique({
      where: { email },
    });
  }

  async findById(id: number): Promise<User | null> {
    // Coba ambil dari cache dulu
    const cacheKey = `user:id:${id}`;
    const cachedUser = await this.cacheManager.get<User>(cacheKey);

    if (cachedUser) {
      return cachedUser;
    }

    // Jika tidak ada di cache, ambil dari database
    const user = await this.prisma.mysql.user.findUnique({
      where: { id },
    });

    // Simpan ke cache dengan TTL 5 menit
    if (user) {
      await this.cacheManager.set(cacheKey, user, 300000);
    }

    return user;
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    // Pastikan untuk melakukan hash pada password sebelum memanggil ini
    // dan pastikan data menyertakan userType
    const newUser = await this.prisma.mysql.user.create({
      data,
    });

    // Invalidasi cache yang mungkin terkait
    await this.cacheManager.del(`users:all:*`);

    return newUser;
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    const updatedUser = await this.prisma.mysql.user.update({
      where: { id },
      data,
    });

    // Invalidasi cache untuk user ini
    await this.cacheManager.del(`user:id:${id}`);
    // Invalidasi cache untuk semua user
    await this.cacheManager.del(`users:all:*`);

    return updatedUser;
  }

  async remove(id: number): Promise<User> {
    const deletedUser = await this.prisma.mysql.user.delete({
      where: { id },
    });

    // Invalidasi cache untuk user ini
    await this.cacheManager.del(`user:id:${id}`);
    // Invalidasi cache untuk semua user
    await this.cacheManager.del(`users:all:*`);

    return deletedUser;
  }

  async updateRefreshToken(
    userId: number,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.prisma.mysql.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });

    // Invalidasi cache untuk user ini
    await this.cacheManager.del(`user:id:${userId}`);
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

    // Invalidasi cache untuk user ini
    await this.cacheManager.del(`user:id:${userId}`);
  }

  // Tambahkan metode lain sesuai kebutuhan (findById, dll.)
}
