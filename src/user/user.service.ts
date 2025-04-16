import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { UserMysql, Prisma } from '../../generated/mysql';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string): Promise<UserMysql | null> {
    return await this.prisma.mysql.userMysql.findUnique({
      where: { email },
    });
  }

  async findById(id: number): Promise<UserMysql | null> {
    return await this.prisma.mysql.userMysql.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.UserMysqlCreateInput): Promise<UserMysql> {
    // Pastikan untuk melakukan hash pada password sebelum memanggil ini
    return await this.prisma.mysql.userMysql.create({
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

  async updateUser(
    userId: number,
    data: Partial<UserMysql>, // Gunakan tipe UserMysql langsung
  ): Promise<UserMysql> {
    // Hapus properti yang tidak boleh diubah langsung (misal: email, role)
    // Ini adalah contoh, sesuaikan dengan field yang ada di UserMysql
    delete data.email;
    delete data.role;
    delete data.id;
    delete data.password; // Password diubah via endpoint/metode terpisah
    delete data.hashedRefreshToken; // Diubah via logout/refresh
    delete data.isEmailVerified; // Hanya diubah via verifikasi
    delete data.emailVerificationToken;
    delete data.passwordResetToken;
    delete data.passwordResetExpires;

    // Pastikan hanya data yang valid yang tersisa
    if (Object.keys(data).length === 0) {
      // Jika tidak ada data valid untuk diupdate, kembalikan user asli
      // atau lempar error jika lebih sesuai
      const currentUser = await this.findById(userId);
      if (!currentUser) throw new Error('User not found during update.'); // Safety check
      return currentUser;
    }

    return await this.prisma.mysql.userMysql.update({
      where: { id: userId },
      data,
    });
  }

  // Tambahkan metode lain sesuai kebutuhan (findById, dll.)
}
