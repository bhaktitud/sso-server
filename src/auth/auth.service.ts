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
import {
  Prisma,
  User,
  UserType,
  AdminProfile,
  Role,
} from '../../generated/mysql';
import { jwtConstants } from './constants';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PrismaService } from '@src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

// Tipe untuk pengguna tanpa password
type UserPayload = Omit<User, 'password'>;
// Definisikan tipe untuk hasil token
type Tokens = { access_token: string; refresh_token: string };

// Tipe baru untuk data admin yang divalidasi (termasuk roles)
type ValidatedAdminPayload = {
  userId: number;
  email: string;
  adminProfileId: number;
  name: string; // Bisa dari User atau AdminProfile
  roles: Pick<Role, 'id' | 'name'>[]; // Sertakan ID dan nama role
};

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
    private prisma: PrismaService,
  ) {}

  /**
   * Memvalidasi pengguna biasa berdasarkan email dan password.
   * Digunakan oleh LocalStrategy.
   */
  async validateUser(email: string, pass: string): Promise<UserPayload | null> {
    const user = await this.userService.findOneByEmail(email);

    // Cek password DAN status verifikasi email
    if (
      user &&
      user.userType === UserType.APP_USER &&
      (await bcrypt.compare(pass, user.password))
    ) {
      if (!user.isEmailVerified) {
        throw new ForbiddenException(
          'Akun belum diverifikasi. Silakan cek email Anda.',
        );
      }
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Memvalidasi kredensial admin.
   * Dipanggil oleh adminLogin.
   */
  async validateAdminUser(
    email: string,
    pass: string,
  ): Promise<ValidatedAdminPayload | null> {
    const user = await this.prisma.mysql.user.findUnique({
      where: { email },
    });

    // 1. Cek User ada, password cocok, DAN userType adalah ADMIN_USER
    if (
      user &&
      user.userType === UserType.ADMIN_USER &&
      (await bcrypt.compare(pass, user.password))
    ) {
      // 2. Ambil AdminProfile terkait beserta roles-nya
      const adminProfile = await this.prisma.mysql.adminProfile.findUnique({
        where: { userId: user.id },
        include: {
          roles: {
            // Sertakan roles
            select: { id: true, name: true }, // Hanya pilih ID dan nama role
          },
        },
      });

      if (!adminProfile) {
        console.error(
          `Admin user ${user.id} (${email}) does not have an associated AdminProfile.`,
        );
        return null;
      }

      // 3. Siapkan payload yang akan digunakan untuk JWT
      const payload: ValidatedAdminPayload = {
        userId: user.id,
        email: user.email,
        adminProfileId: adminProfile.id,
        name: adminProfile.name, // Gunakan nama dari AdminProfile
        roles: adminProfile.roles,
      };
      return payload;
    }
    return null;
  }

  /**
   * Generate Access dan Refresh Token (untuk user biasa)
   */
  private async _generateTokens(user: UserPayload): Promise<Tokens> {
    const accessTokenPayload = {
      email: user.email,
      sub: user.id,
      name: user.name,
      userType: UserType.APP_USER, // Tambahkan userType
      role: 'USER', // Tambahkan role untuk backward compatibility
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
   * Generate Access dan Refresh Token KHUSUS ADMIN
   */
  private async _generateAdminTokens(
    adminPayload: ValidatedAdminPayload,
  ): Promise<Tokens> {
    // Dapatkan permissions untuk role-role yang dimiliki admin
    const permissions = await this.prisma.mysql.permission.findMany({
      where: {
        roles: {
          some: {
            id: { in: adminPayload.roles.map((role) => role.id) },
          },
        },
      },
      select: { action: true, subject: true },
    });

    // Buat format permissions seperti 'action:subject'
    const permissionStrings = permissions.map(
      (p) => `${p.action}:${p.subject}`,
    );

    const accessTokenPayload = {
      sub: adminPayload.userId,
      email: adminPayload.email,
      userType: UserType.ADMIN_USER,
      profileId: adminPayload.adminProfileId,
      name: adminPayload.name,
      roles: adminPayload.roles.map((role) => role.name),
      permissions: permissionStrings, // Tambahkan permissions ke token
    };
    const refreshTokenPayload = {
      sub: adminPayload.userId,
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
   * Login (untuk user biasa): Validasi, generate token, simpan hash refresh token
   */
  async login(user: UserPayload): Promise<Tokens> {
    // Pastikan ini hanya dipanggil untuk APP_USER setelah validateUser
    const tokens = await this._generateTokens(user);
    await this._updateRefreshTokenHash(user.id, tokens.refresh_token);
    return tokens;
  }

  /**
   * Login khusus Admin: Validasi, generate token, simpan hash refresh token
   */
  async adminLogin(adminLoginDto: AdminLoginDto): Promise<Tokens> {
    const adminPayload = await this.validateAdminUser(
      adminLoginDto.email,
      adminLoginDto.password,
    );

    if (!adminPayload) {
      throw new ForbiddenException(
        'Akses ditolak. Kredensial admin tidak valid.',
      );
    }

    const tokens = await this._generateAdminTokens(adminPayload);
    await this._updateRefreshTokenHash(
      adminPayload.userId,
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
      await this.prisma.mysql.user.update({
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
    const user = await this.prisma.mysql.user.findUnique({
      where: { passwordResetToken: hashedToken },
    });

    if (!user) {
      throw new BadRequestException('Token reset password tidak valid.');
    }
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      // Hapus token jika expired
      await this.prisma.mysql.user.update({
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
      await this.prisma.mysql.user.update({
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
  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { email, password, name } = registerDto;

    // 1. Cek apakah email sudah ada
    const existingUser = await this.userService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar.');
    }

    // 2. Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Generate token verifikasi email
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(rawVerificationToken)
      .digest('hex');

    // 4. Buat user baru melalui UserService
    try {
      await this.userService.create({
        email: email,
        password: hashedPassword,
        name: name,
        emailVerificationToken: hashedVerificationToken,
        isEmailVerified: false,
        userType: UserType.APP_USER,
      });
    } catch (error) {
      console.error('Error creating user during registration:', error);
      throw new InternalServerErrorException('Gagal membuat pengguna baru.');
    }

    // 5. Kirim email verifikasi (jangan blokir response)
    try {
      await this.mailService.sendVerificationEmail(
        email,
        name || 'Pengguna Baru',
        rawVerificationToken,
      );
    } catch (error) {
      // Log error tapi jangan gagalkan registrasi
      console.error('Failed to send verification email:', error);
    }

    return {
      message: 'Registrasi berhasil. Silakan cek email Anda untuk verifikasi.',
    };
  }

  /**
   * Verifikasi email menggunakan token
   */
  async verifyEmail(rawToken: string): Promise<{ message: string }> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // Ganti userMysql menjadi user
    const user = await this.prisma.mysql.user.findUnique({
      where: { emailVerificationToken: hashedToken },
    });

    if (!user) {
      throw new BadRequestException(
        'Token verifikasi tidak valid atau sudah digunakan.',
      );
    }

    if (user.isEmailVerified) {
      return { message: 'Email sudah diverifikasi sebelumnya.' };
    }

    try {
      // Ganti userMysql menjadi user
      await this.prisma.mysql.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null, // Hapus token setelah digunakan
        },
      });
    } catch (error) {
      console.error('Error updating user verification status:', error);
      throw new InternalServerErrorException('Gagal memverifikasi email.');
    }

    return { message: 'Email berhasil diverifikasi.' };
  }
}
