import { AuthService } from './auth.service';
import { Prisma, UserMysql } from '../../generated/mysql';
import { Role } from './roles/roles.enum';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
declare class RegisterDto implements Prisma.UserMysqlCreateInput {
    email: string;
    password: string;
    name?: string;
}
type AuthenticatedUser = Omit<UserMysql, 'password'>;
interface AuthenticatedJwtPayload {
    userId: number;
    email: string;
    name?: string | null;
    role: Role;
}
interface ValidatedRefreshTokenPayload {
    sub: number;
    refreshToken: string;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
    }>;
    login(req: {
        user: AuthenticatedUser;
    }): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    logout(req: {
        user: AuthenticatedJwtPayload;
    }): Promise<{
        message: string;
    }>;
    refreshTokens(req: {
        user: ValidatedRefreshTokenPayload;
    }): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    getProfile(req: {
        user: AuthenticatedJwtPayload;
    }): AuthenticatedJwtPayload;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    adminOnlyEndpoint(req: {
        user: AuthenticatedJwtPayload;
    }): {
        message: string;
        user: AuthenticatedJwtPayload;
    };
}
export {};
