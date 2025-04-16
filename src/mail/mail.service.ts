import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer'; // <-- Uncomment impor
import Mail from 'nodemailer/lib/mailer'; // <-- Impor tipe Mail

@Injectable()
export class MailService {
  private transporter: Mail; // <-- Definisikan tipe transporter

  constructor(private configService: ConfigService) {
    // Konfigurasi transporter Nodemailer
    const transportOptions = {
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'), // Port Resend
      secure: this.configService.get<boolean>('MAIL_SECURE'), // Resend pakai SSL
      auth: {
        user: this.configService.get<string>('MAIL_USER'), // User biasanya 'resend'
        pass: this.configService.get<string>('RESEND_API_KEY'), // Gunakan API Key
      },
    };

    // Periksa apakah konfigurasi dasar ada
    if (!transportOptions.host || !transportOptions.auth.user) {
      console.warn(
        'Konfigurasi Mail Service tidak lengkap (MAIL_HOST atau MAIL_USER tidak ada). Email tidak akan dikirim.',
      );
      // Buat transporter dummy jika konfigurasi tidak lengkap
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    } else {
      this.transporter = nodemailer.createTransport(transportOptions);
    }
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    // Ganti YOUR_FRONTEND_PORT dan pastikan URL ini benar
    const resetUrl = `http://localhost:YOUR_FRONTEND_PORT/reset-password?token=${token}`;
    const mailFrom = this.configService.get<string>(
      'MAIL_FROM',
      '"No Reply" <noreply@example.com>',
    );

    console.log(
      `Attempting to send password reset email to ${to} from ${mailFrom}`,
    );
    console.log(`Reset URL: ${resetUrl}`);

    try {
      // Implementasikan pengiriman email
      await this.transporter.sendMail({
        from: mailFrom,
        to: to,
        subject: 'Reset Kata Sandi Anda',
        html: `Halo ${name || 'Pengguna'},<br><br>Anda meminta reset kata sandi. Klik tautan berikut untuk melanjutkan:<br><a href="${resetUrl}" target="_blank">Reset Kata Sandi Saya</a><br><br>Tautan ini akan kedaluwarsa dalam 1 jam.<br><br>Jika Anda tidak meminta ini, abaikan email ini.`,
        // text: `Halo ${name || 'Pengguna'}, ... (versi teks)`
      });
      console.log(`Password reset email successfully sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send password reset email to ${to}`, error);
      // Lemparkan error agar bisa ditangkap di service pemanggil jika perlu
      throw new InternalServerErrorException(
        'Gagal mengirim email reset password.',
      );
    }
  }

  // --- Tambahkan metode untuk verifikasi email ---
  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    // Ganti YOUR_FRONTEND_PORT dan pastikan URL ini benar
    // Endpoint verifikasi biasanya GET
    const verificationUrl = `http://localhost:YOUR_FRONTEND_PORT/verify-email?token=${token}`;
    const mailFrom = this.configService.get<string>(
      'MAIL_FROM',
      '"No Reply" <noreply@example.com>',
    );

    console.log(
      `Attempting to send verification email to ${to} from ${mailFrom}`,
    );
    console.log(`Verification URL: ${verificationUrl}`);
    console.log(`---> (Untuk development, gunakan token: ${token})`);

    try {
      await this.transporter.sendMail({
        from: mailFrom,
        to: to,
        subject: 'Verifikasi Alamat Email Anda',
        html: `Halo ${name || 'Pengguna'},<br><br>Terima kasih telah mendaftar. Silakan klik tautan berikut untuk memverifikasi alamat email Anda:<br><a href="${verificationUrl}" target="_blank">Verifikasi Email Saya</a><br><br>Jika Anda tidak mendaftar, abaikan email ini.`,
        // text: `Halo ${name || 'Pengguna'}, ... (versi teks)`
      });
      console.log(`Verification email successfully sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send verification email to ${to}`, error);
      throw new InternalServerErrorException(
        'Gagal mengirim email verifikasi.',
      );
    }
  }

  // (Opsional) Tambahkan metode lain seperti sendPasswordResetSuccessEmail
  // async sendPasswordResetSuccessEmail(to: string, name: string): Promise<void> { ... }
}
