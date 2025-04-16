import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '@src/user/user.service';
import { MailService } from '@src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Prisma, UserMysql, Role } from '../../generated/mysql';
import { jwtConstants } from './constants';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PrismaService } from '@src/prisma/prisma.service';

// Definisikan tipe untuk hasil token
type Tokens = { access_token: string; refresh_token: string };

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
    private prisma: PrismaService,
  ) {}

  /**
   * Memvalidasi pengguna berdasarkan email dan password.
   * Mengembalikan user DENGAN password dan relasi role.
   */
  async validateUser(
    email: string,
    pass: string,
  ): Promise<(UserMysql & { role: Role }) | null> {
    const userWithRole = await this.userService.findOneByEmail(email);

    if (userWithRole && (await bcrypt.compare(pass, userWithRole.password))) {
      if (!userWithRole.isEmailVerified) {
        throw new ForbiddenException(
          'Akun belum diverifikasi. Silakan cek email Anda.',
        );
      }
      // Kembalikan objek asli (dengan password)
      return userWithRole;
    }
    return null;
  }

  /**
   * Generate Access dan Refresh Token
   */
  private async _generateTokens(payload: {
    id: number;
    email: string;
    name: string | null;
    role: string; // Hanya nama role
    companyId: number | null;
  }): Promise<Tokens> {
    // Payload sudah sesuai untuk accessToken
    const accessTokenPayload = {
      sub: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      companyId: payload.companyId,
    };
    const refreshTokenPayload = {
      sub: payload.id,
      nonce: Date.now(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: jwtConstants.refresh.secret,
        expiresIn: jwtConstants.refresh.expiresIn,
        algorithm: jwtConstants.refresh.algorithm,
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Update hash refresh token di database
   */
  private async _updateRefreshTokenHash(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    const saltRounds = 10;
    const hashedRefreshToken = await bcrypt.hash(refreshToken, saltRounds);
    await this.userService.updateRefreshToken(userId, hashedRefreshToken);
  }

  /**
   * Login: Validasi, generate token, simpan hash refresh token
   */
  async login(
    userWithPasswordAndRole: UserMysql & { role: Role },
  ): Promise<Tokens> {
    // Buat payload baru secara manual untuk _generateTokens
    const tokenGenerationPayload = {
      id: userWithPasswordAndRole.id,
      email: userWithPasswordAndRole.email,
      name: userWithPasswordAndRole.name,
      role: userWithPasswordAndRole.role.name,
      companyId: userWithPasswordAndRole.companyId,
    };
    const tokens = await this._generateTokens(tokenGenerationPayload);
    // Gunakan ID user asli untuk update refresh token hash
    await this._updateRefreshTokenHash(
      userWithPasswordAndRole.id,
      tokens.refresh_token,
    );
    return tokens;
  }

  /**
   * Logout: Hapus hash refresh token dari DB
   */
  async logout(userId: number): Promise<void> {
    // Update hash jadi null
    await this.userService.updateRefreshToken(userId, null);
  }

  /**
   * Refresh Tokens: Validasi refresh token, bandingkan hash, terbitkan token baru
   */
  async refreshTokens(userId: number, refreshToken: string): Promise<Tokens> {
    // Cari user DENGAN relasi role (dan company jika perlu)
    // Kita perlu memodifikasi userService.findById atau menggunakan prisma langsung
    // Mari gunakan prisma langsung di sini untuk menyertakan relasi
    const userWithRole = await this.prisma.mysql.userMysql.findUnique({
      where: { id: userId },
      include: { role: true /*, company: true*/ },
    });

    if (!userWithRole || !userWithRole.hashedRefreshToken) {
      throw new ForbiddenException('Access Denied: User or token not found');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      userWithRole.hashedRefreshToken,
    );

    if (!refreshTokenMatches) {
      throw new ForbiddenException('Access Denied: Invalid refresh token');
    }

    // Buat payload eksplisit untuk _generateTokens
    const tokenGenerationPayload = {
      id: userWithRole.id,
      email: userWithRole.email,
      name: userWithRole.name,
      role: userWithRole.role.name,
      companyId: userWithRole.companyId,
    };

    const tokens = await this._generateTokens(tokenGenerationPayload);
    await this._updateRefreshTokenHash(userWithRole.id, tokens.refresh_token);

    return tokens;
  }

  /**
   * Memulai alur lupa password
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      console.warn(`Password reset attempt for non-existent email: ${email}`);
      return {
        message: 'Jika email terdaftar, instruksi reset password akan dikirim.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    // Hash token dengan SHA256 untuk disimpan di DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token berlaku 1 jam

    try {
      // Gunakan PrismaService langsung untuk update token reset
      await this.prisma.mysql.userMysql.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: expires,
        },
      });
    } catch (error) {
      console.error('Error updating user for password reset:', error);
      throw new InternalServerErrorException(
        'Gagal menyimpan token reset password.',
      );
    }

    try {
      await this.mailService.sendPasswordResetEmail(
        user.email,
        user.name || 'Pengguna',
        rawToken,
      );
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }

    return {
      message: 'Jika email terdaftar, instruksi reset password akan dikirim.',
    };
  }

  /**
   * Mereset password menggunakan token
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token: rawToken, password: newPassword } = resetPasswordDto;

    // Hash token mentah dari user dengan SHA256 untuk dicari
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // Cari user berdasarkan HASH SHA256
    const user = await this.prisma.mysql.userMysql.findUnique({
      where: { passwordResetToken: hashedToken },
    });

    if (!user) {
      throw new BadRequestException('Token reset password tidak valid.');
    }
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      // Hapus token jika expired
      await this.prisma.mysql.userMysql.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetExpires: null },
      });
      throw new BadRequestException('Token reset password sudah kedaluwarsa.');
    }

    // Hash password baru (bcrypt)
    const saltRounds = 10;
    const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

    try {
      // Panggil UserService untuk update password
      await this.userService.updatePassword(user.id, newHashedPassword);
      // Hapus token reset langsung via Prisma
      await this.prisma.mysql.userMysql.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetExpires: null },
      });
    } catch (error) {
      console.error('Error updating password after reset:', error);
      throw new InternalServerErrorException('Gagal memperbarui password.');
    }

    return { message: 'Password berhasil direset.' };
  }

  /**
   * Registrasi: Buat user, simpan token verifikasi, kirim email.
   * Tidak langsung login.
   */
  async register(
    registerDto: Omit<Prisma.UserMysqlCreateInput, 'role'>,
  ): Promise<{ message: string }> {
    const existingUser = await this.userService.findOneByEmail(
      registerDto.email,
    );
    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        throw new ConflictException(
          'Email sudah terdaftar tetapi belum diverifikasi. Cek email Anda.',
        );
      }
      throw new ConflictException('Email sudah terdaftar dan terverifikasi.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // --- Penambahan Logika Peran Default ---
    const defaultRoleName = 'ADMIN';
    const adminRole = await this.prisma.mysql.role.findUnique({
      where: { name: defaultRoleName },
    });

    if (!adminRole) {
      console.error(`Default role '${defaultRoleName}' not found in database.`);
      throw new InternalServerErrorException(
        `Konfigurasi peran default tidak ditemukan. Registrasi tidak dapat dilanjutkan.`,
      );
    }
    // ----------------------------------------

    let newUser: UserMysql;
    try {
      const createData: Prisma.UserMysqlCreateInput = {
        ...registerDto,
        password: hashedPassword,
        role: {
          connect: { id: adminRole.id },
        },
      };
      newUser = await this.userService.create(createData);
    } catch (error: unknown) {
      console.error('Error during user creation in registration:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Could not create user: ${message}`,
      );
    }

    // Logika untuk email verifikasi (ASUMSI NAMA FIELD: emailVerificationToken)
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(rawVerificationToken)
      .digest('hex');

    try {
      await this.prisma.mysql.userMysql.update({
        where: { id: newUser.id },
        data: { emailVerificationToken: hashedVerificationToken },
      });
      await this.mailService.sendVerificationEmail(
        newUser.email,
        newUser.name || 'Pengguna',
        rawVerificationToken,
      );
    } catch (error) {
      console.error('Error saving/sending verification email:', error);
    }

    return {
      message:
        'User registered successfully. Please check your email for verification.',
    };
  }

  /**
   * Verifikasi email menggunakan token
   */
  async verifyEmail(rawToken: string): Promise<{ message: string }> {
    // 1. Hash token mentah dari user
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // 2. Cari user berdasarkan HASH token verifikasi
    const user = await this.prisma.mysql.userMysql.findUnique({
      where: { emailVerificationToken: hashedToken },
    });

    // 3. Validasi user dan token
    if (!user) {
      throw new BadRequestException(
        'Token verifikasi tidak valid atau sudah digunakan.',
      );
    }

    // 4. Update user: set isEmailVerified true, hapus token
    try {
      await this.prisma.mysql.userMysql.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null, // Hapus token setelah digunakan
        },
      });
    } catch (error) {
      console.error('Error verifying email:', error);
      throw new InternalServerErrorException('Gagal memverifikasi email.');
    }

    return { message: 'Email berhasil diverifikasi.' };
  }

  /**
   * Mengirim ulang email verifikasi.
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      return {
        message:
          'Jika email terdaftar dan belum diverifikasi, email verifikasi akan dikirim.',
      };
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email sudah diverifikasi.');
    }

    // Logika sama seperti di register untuk generate & save token, lalu kirim email
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    try {
      await this.prisma.mysql.userMysql.update({
        where: { id: user.id },
        data: { emailVerificationToken: hashedToken },
      });
      await this.mailService.sendVerificationEmail(
        user.email,
        user.name || 'Pengguna',
        rawToken,
      );
      return { message: 'Email verifikasi baru telah dikirim.' };
    } catch (error) {
      console.error('Error resending verification email:', error);
      throw new InternalServerErrorException(
        'Gagal mengirim ulang email verifikasi.',
      );
    }
  }
}
