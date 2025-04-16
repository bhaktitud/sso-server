"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let MailService = class MailService {
    configService;
    transporter;
    constructor(configService) {
        this.configService = configService;
        const transportOptions = {
            host: this.configService.get('MAIL_HOST'),
            port: this.configService.get('MAIL_PORT'),
            secure: this.configService.get('MAIL_SECURE'),
            auth: {
                user: this.configService.get('MAIL_USER'),
                pass: this.configService.get('RESEND_API_KEY'),
            },
        };
        if (!transportOptions.host || !transportOptions.auth.user) {
            console.warn('Konfigurasi Mail Service tidak lengkap (MAIL_HOST atau MAIL_USER tidak ada). Email tidak akan dikirim.');
            this.transporter = nodemailer.createTransport({ jsonTransport: true });
        }
        else {
            this.transporter = nodemailer.createTransport(transportOptions);
        }
    }
    async sendPasswordResetEmail(to, name, token) {
        const frontendBaseUrl = this.configService.get('FRONTEND_BASE_URL', 'http://localhost:3001');
        const resetUrl = `${frontendBaseUrl}/reset-password?token=${token}`;
        const mailFrom = this.configService.get('MAIL_FROM', '"No Reply" <noreply@example.com>');
        console.log(`Attempting to send password reset email to ${to} from ${mailFrom}`);
        console.log(`Reset URL: ${resetUrl}`);
        try {
            await this.transporter.sendMail({
                from: mailFrom,
                to: to,
                subject: 'Reset Kata Sandi Anda',
                html: `Halo ${name || 'Pengguna'},<br><br>Anda meminta reset kata sandi. Klik tautan berikut untuk melanjutkan:<br><a href="${resetUrl}" target="_blank">Reset Kata Sandi Saya</a><br><br>Tautan ini akan kedaluwarsa dalam 1 jam.<br><br>Jika Anda tidak meminta ini, abaikan email ini.`,
            });
            console.log(`Password reset email successfully sent to ${to}`);
        }
        catch (error) {
            console.error(`Failed to send password reset email to ${to}`, error);
            throw new common_1.InternalServerErrorException('Gagal mengirim email reset password.');
        }
    }
    async sendVerificationEmail(to, name, token) {
        const frontendBaseUrl = this.configService.get('FRONTEND_BASE_URL', 'http://localhost:3001');
        const verificationUrl = `${frontendBaseUrl}/verify-email?token=${token}`;
        const mailFrom = this.configService.get('MAIL_FROM', '"No Reply" <noreply@example.com>');
        console.log(`Attempting to send verification email to ${to} from ${mailFrom}`);
        console.log(`Verification URL: ${verificationUrl}`);
        console.log(`---> (Untuk development, gunakan token: ${token})`);
        try {
            await this.transporter.sendMail({
                from: mailFrom,
                to: to,
                subject: 'Verifikasi Alamat Email Anda',
                html: `Halo ${name || 'Pengguna'},<br><br>Terima kasih telah mendaftar. Silakan klik tautan berikut untuk memverifikasi alamat email Anda:<br><a href="${verificationUrl}" target="_blank">Verifikasi Email Saya</a><br><br>Jika Anda tidak mendaftar, abaikan email ini.`,
            });
            console.log(`Verification email successfully sent to ${to}`);
        }
        catch (error) {
            console.error(`Failed to send verification email to ${to}`, error);
            throw new common_1.InternalServerErrorException('Gagal mengirim email verifikasi.');
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map