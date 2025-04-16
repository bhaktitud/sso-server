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
import { Prisma, UserMysql } from '../../generated/mysql';
import { jwtConstants } from './constants';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PrismaService } from '@src/prisma/prisma.service';

// Tipe untuk pengguna tanpa password
type UserPayload = Omit<UserMysql, 'password'>;
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
   * Digunakan oleh LocalStrategy.
   */
  async validateUser(email: string, pass: string): Promise<UserPayload | null> {
    const user = await this.userService.findOneByEmail(email);

    // Cek password DAN status verifikasi email
    if (user && (await bcrypt.compare(pass, user.password))) {
      // Jika password cocok, cek verifikasi
      if (!user.isEmailVerified) {
        // Lempar error spesifik jika belum verifikasi
        throw new ForbiddenException(
          'Akun belum diverifikasi. Silakan cek email Anda.',
        );
      }
      // Jika sudah diverifikasi, hapus password dan kembalikan user
      const { password, ...result } = user;
      return result;
    }
    // Jika password tidak cocok atau user tidak ditemukan
    return null;
  }

  /**
   * Generate Access dan Refresh Token
   */
  private async _generateTokens(user: UserPayload): Promise<Tokens> {
    const accessTokenPayload = {
      email: user.email,
      sub: user.id,
      name: user.name,
      role: user.role,
    };
    const refreshTokenPayload = {
      sub: user.id,
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
  async login(user: UserPayload): Promise<Tokens> {
    const tokens = await this._generateTokens(user);
    await this._updateRefreshTokenHash(user.id, tokens.refresh_token);
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
    const user = await this.userService.findById(userId);
    // Periksa apakah user ada dan punya hash refresh token
    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Access Denied: User or token not found');
    }

    // Bandingkan refresh token yang diberikan dengan hash di DB
    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );

    if (!refreshTokenMatches) {
      // Jika tidak cocok, ini mencurigakan, mungkin hapus semua token user?
      // Atau setidaknya lempar error.
      throw new ForbiddenException('Access Denied: Invalid refresh token');
    }

    // Generate token baru (Access & Refresh) - Rotasi Refresh Token
    const tokens = await this._generateTokens(user);
    // Update hash refresh token yang baru
    await this._updateRefreshTokenHash(user.id, tokens.refresh_token);

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
    createUserDto: Prisma.UserMysqlCreateInput,
  ): Promise<{ message: string }> {
    const existingUser = await this.userService.findOneByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      // Jika user sudah ada TAPI belum verifikasi, kirim ulang email verifikasi?
      // Atau cukup lempar error.
      if (!existingUser.isEmailVerified) {
        // TODO: Opsi: Kirim ulang email verifikasi daripada error
        // await this.sendVerificationEmailForUser(existingUser);
        // return { message: 'Email sudah terdaftar. Email verifikasi baru telah dikirim.' };
        throw new ConflictException(
          'Email sudah terdaftar tetapi belum diverifikasi. Cek email Anda.',
        );
      }
      throw new ConflictException('Email sudah terdaftar dan terverifikasi.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    // 1. Buat user baru (dengan isEmailVerified = false by default)
    let newUser: UserMysql;
    try {
      newUser = await this.userService.create({
        ...createUserDto,
        password: hashedPassword,
        // isEmailVerified default false dari skema
      });
    } catch (error: unknown) {
      console.error('Error during user creation in registration:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Could not create user: ${message}`,
      );
    }

    // 2. Generate token verifikasi (raw & hashed SHA256)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // 3. Simpan hash token verifikasi ke DB
    console.log(
      `---> Attempting to save verification token for user ID: ${newUser.id}`,
    );
    try {
      await this.prisma.mysql.userMysql.update({
        where: { id: newUser.id },
        data: { emailVerificationToken: hashedToken },
      });
    } catch (error) {
      console.error('Error saving email verification token:', error);
      // Mungkin hapus user yang baru dibuat? Tergantung logika bisnis.
      throw new InternalServerErrorException(
        'Gagal menyimpan token verifikasi.',
      );
    }

    // 4. Kirim email verifikasi (dengan token RAW)
    console.log(
      `---> Attempting to call sendVerificationEmail for user ID: ${newUser.id} with rawToken: ${rawToken}`,
    );
    try {
      await this.mailService.sendVerificationEmail(
        newUser.email,
        newUser.name || 'Pengguna',
        rawToken,
      );
    } catch (error) {
      console.error('Error sending verification email:', error);
      // Rollback? Log? Tergantung kebutuhan.
    }

    // 5. Kembalikan pesan sukses
    return {
      message: 'Registrasi berhasil. Silakan cek email Anda untuk verifikasi.',
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
}
