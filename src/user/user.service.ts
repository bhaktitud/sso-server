import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { UserMysql, Prisma, Role /*, Company*/ } from '../../generated/mysql';

// Definisikan tipe baru yang menyertakan relasi role
type UserWithRole = UserMysql & { role: Role };

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string): Promise<UserWithRole | null> {
    return await this.prisma.mysql.userMysql.findUnique({
      where: { email },
      include: {
        role: true,
        // company: true, // Hapus include company sementara
      },
    });
  }

  async findById(id: number): Promise<UserWithRole | null> {
    return await this.prisma.mysql.userMysql.findUnique({
      where: { id },
      include: { role: true },
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
    data: Partial<UserMysql>,
  ): Promise<UserWithRole | null> {
    // Hapus properti yang tidak boleh diubah langsung
    delete data.email;
    // delete data.role; // Hapus baris ini
    delete data.id;
    delete data.password;
    delete data.hashedRefreshToken;
    delete data.isEmailVerified;
    delete data.emailVerificationToken;
    delete data.passwordResetToken;
    delete data.passwordResetExpires;
    // Juga hapus roleId dan companyId karena tidak boleh diubah di sini
    delete data.roleId;
    delete data.companyId;

    if (Object.keys(data).length === 0) {
      // findById sudah kita modifikasi untuk include role
      const currentUser = await this.findById(userId);
      if (!currentUser) {
        // Sebaiknya throw NotFoundException dari NestJS
        console.error(`Update failed: User with ID ${userId} not found.`);
        return null; // Atau throw error
      }
      return currentUser;
    }

    try {
      return await this.prisma.mysql.userMysql.update({
        where: { id: userId },
        data,
        include: { role: true }, // Tambahkan include: { role: true }
      });
    } catch (error) {
      // Handle potential error (misal PrismaClientKnownRequestError jika user tidak ditemukan P2025)
      // Atau biarkan error propagate
      console.error(`Error updating user ${userId}:`, error);
      return null; // Atau throw error
    }
  }

  // Tambahkan metode lain sesuai kebutuhan (findById, dll.)
}
