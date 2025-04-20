import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@src/prisma/prisma.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Pekerjaan terjadwal untuk membersihkan token reset password yang kedaluwarsa
   * Dijalankan setiap hari pada tengah malam
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredPasswordResetTokens() {
    this.logger.log(
      'Menjalankan pembersihan token reset password yang kedaluwarsa',
    );

    try {
      const now = new Date();
      // Hapus token reset password yang sudah kedaluwarsa
      const result = await this.prisma.mysql.user.updateMany({
        where: {
          passwordResetExpires: {
            lt: now,
          },
          passwordResetToken: {
            not: null,
          },
        },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      this.logger.log(
        `Berhasil membersihkan ${result.count} token reset password yang kedaluwarsa`,
      );
    } catch (error) {
      this.logger.error(
        'Gagal membersihkan token reset password yang kedaluwarsa',
        error,
      );
    }
  }

  /**
   * Pekerjaan terjadwal untuk membersihkan email verification token yang tidak terpakai
   * dan terlalu lama, dijalankan setiap minggu pada hari Senin jam 1 pagi
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldVerificationTokens() {
    this.logger.log('Menjalankan pembersihan token verifikasi email yang lama');

    try {
      // Ambil semua user yang belum diverifikasi lebih dari 30 hari
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.mysql.user.findMany({
        where: {
          isEmailVerified: false,
          emailVerificationToken: {
            not: null,
          },
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
        select: {
          id: true,
          email: true,
        },
      });

      if (result.length > 0) {
        this.logger.log(
          `Ditemukan ${result.length} token verifikasi email yang lama`,
        );
        // Catat user yang akan dihapus tokennya
        const userIds = result.map((user) => user.id);

        // Update email verification token menjadi null
        await this.prisma.mysql.user.updateMany({
          where: {
            id: {
              in: userIds,
            },
          },
          data: {
            emailVerificationToken: null,
          },
        });

        this.logger.log(
          `Berhasil membersihkan ${result.length} token verifikasi email yang lama`,
        );
      } else {
        this.logger.log(
          'Tidak ada token verifikasi email yang perlu dibersihkan',
        );
      }
    } catch (error) {
      this.logger.error(
        'Gagal membersihkan token verifikasi email yang lama',
        error,
      );
    }
  }
}
