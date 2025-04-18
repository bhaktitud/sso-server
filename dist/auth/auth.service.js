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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("../user/user.service");
const mail_service_1 = require("../mail/mail.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mysql_1 = require("../../generated/mysql");
const constants_1 = require("./constants");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    userService;
    jwtService;
    mailService;
    prisma;
    constructor(userService, jwtService, mailService, prisma) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.prisma = prisma;
    }
    async validateUser(email, pass) {
        const user = await this.userService.findOneByEmail(email);
        if (user &&
            user.userType === mysql_1.UserType.APP_USER &&
            (await bcrypt.compare(pass, user.password))) {
            if (!user.isEmailVerified) {
                throw new common_1.ForbiddenException('Akun belum diverifikasi. Silakan cek email Anda.');
            }
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async validateAdminUser(email, pass) {
        const user = await this.prisma.mysql.user.findUnique({
            where: { email },
        });
        if (user &&
            user.userType === mysql_1.UserType.ADMIN_USER &&
            (await bcrypt.compare(pass, user.password))) {
            const adminProfile = await this.prisma.mysql.adminProfile.findUnique({
                where: { userId: user.id },
                include: {
                    roles: {
                        select: { id: true, name: true },
                    },
                },
            });
            if (!adminProfile) {
                console.error(`Admin user ${user.id} (${email}) does not have an associated AdminProfile.`);
                return null;
            }
            const payload = {
                userId: user.id,
                email: user.email,
                adminProfileId: adminProfile.id,
                name: adminProfile.name,
                roles: adminProfile.roles,
            };
            return payload;
        }
        return null;
    }
    async _generateTokens(user) {
        const accessTokenPayload = {
            email: user.email,
            sub: user.id,
            name: user.name,
            userType: mysql_1.UserType.APP_USER,
        };
        const refreshTokenPayload = {
            sub: user.id,
            nonce: Date.now(),
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(accessTokenPayload),
            this.jwtService.signAsync(refreshTokenPayload, {
                secret: constants_1.jwtConstants.refresh.secret,
                expiresIn: constants_1.jwtConstants.refresh.expiresIn,
                algorithm: constants_1.jwtConstants.refresh.algorithm,
            }),
        ]);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }
    async _generateAdminTokens(adminPayload) {
        const accessTokenPayload = {
            sub: adminPayload.userId,
            email: adminPayload.email,
            userType: mysql_1.UserType.ADMIN_USER,
            profileId: adminPayload.adminProfileId,
            name: adminPayload.name,
            roles: adminPayload.roles.map((role) => role.name),
        };
        const refreshTokenPayload = {
            sub: adminPayload.userId,
            nonce: Date.now(),
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(accessTokenPayload),
            this.jwtService.signAsync(refreshTokenPayload, {
                secret: constants_1.jwtConstants.refresh.secret,
                expiresIn: constants_1.jwtConstants.refresh.expiresIn,
                algorithm: constants_1.jwtConstants.refresh.algorithm,
            }),
        ]);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }
    async _updateRefreshTokenHash(userId, refreshToken) {
        const saltRounds = 10;
        const hashedRefreshToken = await bcrypt.hash(refreshToken, saltRounds);
        await this.userService.updateRefreshToken(userId, hashedRefreshToken);
    }
    async login(user) {
        const tokens = await this._generateTokens(user);
        await this._updateRefreshTokenHash(user.id, tokens.refresh_token);
        return tokens;
    }
    async adminLogin(adminLoginDto) {
        const adminPayload = await this.validateAdminUser(adminLoginDto.email, adminLoginDto.password);
        if (!adminPayload) {
            throw new common_1.ForbiddenException('Akses ditolak. Kredensial admin tidak valid.');
        }
        const tokens = await this._generateAdminTokens(adminPayload);
        await this._updateRefreshTokenHash(adminPayload.userId, tokens.refresh_token);
        return tokens;
    }
    async logout(userId) {
        await this.userService.updateRefreshToken(userId, null);
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.userService.findById(userId);
        if (!user || !user.hashedRefreshToken) {
            throw new common_1.ForbiddenException('Access Denied: User or token not found');
        }
        const refreshTokenMatches = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
        if (!refreshTokenMatches) {
            throw new common_1.ForbiddenException('Access Denied: Invalid refresh token');
        }
        const tokens = await this._generateTokens(user);
        await this._updateRefreshTokenHash(user.id, tokens.refresh_token);
        return tokens;
    }
    async forgotPassword(email) {
        const user = await this.userService.findOneByEmail(email);
        if (!user) {
            console.warn(`Password reset attempt for non-existent email: ${email}`);
            return {
                message: 'Jika email terdaftar, instruksi reset password akan dikirim.',
            };
        }
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);
        try {
            await this.prisma.mysql.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: hashedToken,
                    passwordResetExpires: expires,
                },
            });
        }
        catch (error) {
            console.error('Error updating user for password reset:', error);
            throw new common_1.InternalServerErrorException('Gagal menyimpan token reset password.');
        }
        try {
            await this.mailService.sendPasswordResetEmail(user.email, user.name || 'Pengguna', rawToken);
        }
        catch (error) {
            console.error('Error sending password reset email:', error);
        }
        return {
            message: 'Jika email terdaftar, instruksi reset password akan dikirim.',
        };
    }
    async resetPassword(resetPasswordDto) {
        const { token: rawToken, password: newPassword } = resetPasswordDto;
        const hashedToken = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');
        const user = await this.prisma.mysql.user.findUnique({
            where: { passwordResetToken: hashedToken },
        });
        if (!user) {
            throw new common_1.BadRequestException('Token reset password tidak valid.');
        }
        if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
            await this.prisma.mysql.user.update({
                where: { id: user.id },
                data: { passwordResetToken: null, passwordResetExpires: null },
            });
            throw new common_1.BadRequestException('Token reset password sudah kedaluwarsa.');
        }
        const saltRounds = 10;
        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
        try {
            await this.userService.updatePassword(user.id, newHashedPassword);
            await this.prisma.mysql.user.update({
                where: { id: user.id },
                data: { passwordResetToken: null, passwordResetExpires: null },
            });
        }
        catch (error) {
            console.error('Error updating password after reset:', error);
            throw new common_1.InternalServerErrorException('Gagal memperbarui password.');
        }
        return { message: 'Password berhasil direset.' };
    }
    async register(registerDto) {
        const { email, password, name } = registerDto;
        const existingUser = await this.userService.findOneByEmail(email);
        if (existingUser) {
            throw new common_1.ConflictException('Email sudah terdaftar.');
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const rawVerificationToken = crypto.randomBytes(32).toString('hex');
        const hashedVerificationToken = crypto
            .createHash('sha256')
            .update(rawVerificationToken)
            .digest('hex');
        try {
            await this.userService.create({
                email: email,
                password: hashedPassword,
                name: name,
                emailVerificationToken: hashedVerificationToken,
                isEmailVerified: false,
                userType: mysql_1.UserType.APP_USER,
            });
        }
        catch (error) {
            console.error('Error creating user during registration:', error);
            throw new common_1.InternalServerErrorException('Gagal membuat pengguna baru.');
        }
        try {
            await this.mailService.sendVerificationEmail(email, name || 'Pengguna Baru', rawVerificationToken);
        }
        catch (error) {
            console.error('Failed to send verification email:', error);
        }
        return {
            message: 'Registrasi berhasil. Silakan cek email Anda untuk verifikasi.',
        };
    }
    async verifyEmail(rawToken) {
        const hashedToken = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');
        const user = await this.prisma.mysql.user.findUnique({
            where: { emailVerificationToken: hashedToken },
        });
        if (!user) {
            throw new common_1.BadRequestException('Token verifikasi tidak valid atau sudah digunakan.');
        }
        if (user.isEmailVerified) {
            return { message: 'Email sudah diverifikasi sebelumnya.' };
        }
        try {
            await this.prisma.mysql.user.update({
                where: { id: user.id },
                data: {
                    isEmailVerified: true,
                    emailVerificationToken: null,
                },
            });
        }
        catch (error) {
            console.error('Error updating user verification status:', error);
            throw new common_1.InternalServerErrorException('Gagal memverifikasi email.');
        }
        return { message: 'Email berhasil diverifikasi.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService,
        mail_service_1.MailService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map