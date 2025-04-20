import { UserService } from '@src/user/user.service';
import { MailService } from '@src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { User, Role } from '../../generated/mysql';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PrismaService } from '@src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
type UserPayload = Omit<User, 'password'>;
type Tokens = {
    access_token: string;
    refresh_token: string;
};
type ValidatedAdminPayload = {
    userId: number;
    email: string;
    adminProfileId: number;
    name: string;
    roles: Pick<Role, 'id' | 'name'>[];
};
export declare class AuthService {
    private userService;
    private jwtService;
    private mailService;
    private prisma;
    constructor(userService: UserService, jwtService: JwtService, mailService: MailService, prisma: PrismaService);
    validateUser(email: string, pass: string): Promise<UserPayload | null>;
    validateAdminUser(email: string, pass: string): Promise<ValidatedAdminPayload | null>;
    private _generateTokens;
    private _generateAdminTokens;
    private _updateRefreshTokenHash;
    login(user: UserPayload): Promise<Tokens>;
    adminLogin(adminLoginDto: AdminLoginDto): Promise<Tokens>;
    logout(userId: number): Promise<void>;
    refreshTokens(userId: number, refreshToken: string): Promise<Tokens>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    register(registerDto: RegisterDto): Promise<{
        message: string;
    }>;
    verifyEmail(rawToken: string): Promise<{
        message: string;
    }>;
    resendVerificationEmail(email: string): Promise<{
        message: string;
    }>;
}
export {};
