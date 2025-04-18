import { UserService } from '@src/user/user.service';
import { MailService } from '@src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../generated/mysql';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PrismaService } from '@src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
type UserPayload = Omit<User, 'password'>;
type Tokens = {
    access_token: string;
    refresh_token: string;
};
export declare class AuthService {
    private userService;
    private jwtService;
    private mailService;
    private prisma;
    constructor(userService: UserService, jwtService: JwtService, mailService: MailService, prisma: PrismaService);
    validateUser(email: string, pass: string): Promise<UserPayload | null>;
    private _generateTokens;
    private _updateRefreshTokenHash;
    login(user: UserPayload): Promise<Tokens>;
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
}
export {};
