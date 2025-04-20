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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const local_auth_guard_1 = require("./guards/local-auth.guard");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const refresh_token_guard_1 = require("./guards/refresh-token.guard");
const roles_decorator_1 = require("./roles/roles.decorator");
const roles_enum_1 = require("./roles/roles.enum");
const roles_guard_1 = require("./roles/roles.guard");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const swagger_2 = require("@nestjs/swagger");
const profile_response_dto_1 = require("./dto/profile-response.dto");
const login_response_dto_1 = require("./dto/login-response.dto");
const success_message_response_dto_1 = require("../common/dto/success-message-response.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const admin_login_dto_1 = require("./dto/admin-login.dto");
const resend_verification_email_dto_1 = require("./dto/resend-verification-email.dto");
const public_decorator_1 = require("./decorators/public.decorator");
class SuccessMessageResponse {
    message;
}
__decorate([
    (0, swagger_2.ApiProperty)(),
    __metadata("design:type", String)
], SuccessMessageResponse.prototype, "message", void 0);
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async register(registerDto) {
        return this.authService.register(registerDto);
    }
    login(req) {
        return this.authService.login(req.user);
    }
    async logout(req) {
        await this.authService.logout(req.user.userId);
        return { message: 'Logged out successfully' };
    }
    async refreshTokens(req) {
        const userId = req.user.sub;
        const refreshToken = req.user.refreshToken;
        return this.authService.refreshTokens(userId, refreshToken);
    }
    getProfile(req) {
        console.log(req.user);
        const userProfile = req.user;
        return userProfile;
    }
    async verifyEmail(token) {
        return this.authService.verifyEmail(token);
    }
    adminOnlyEndpoint(req) {
        return {
            message: 'Welcome, Admin!',
            user: req.user,
        };
    }
    async forgotPassword(forgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }
    async resetPassword(resetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }
    adminLogin(adminLoginDto) {
        return this.authService.adminLogin(adminLoginDto);
    }
    async resendVerificationEmail(resendVerificationEmailDto) {
        return this.authService.resendVerificationEmail(resendVerificationEmailDto.email);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user' }),
    (0, swagger_1.ApiBody)({ type: register_dto_1.RegisterDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'User registered, verification email sent.',
        type: SuccessMessageResponse,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.UseGuards)(local_auth_guard_1.LocalAuthGuard),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Log in a user' }),
    (0, swagger_1.ApiBody)({ type: login_dto_1.LoginDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Login successful, returns tokens.',
        type: login_response_dto_1.LoginResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized (Invalid credentials)',
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (Account not verified)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Log out the current user' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Logout successful.',
        type: SuccessMessageResponse,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(refresh_token_guard_1.RefreshTokenGuard),
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access and refresh tokens' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Tokens refreshed successfully.',
        type: login_response_dto_1.LoginResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized (Invalid/Expired Refresh Token)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden (Refresh token revoked/not found)',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshTokens", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns current user profile data.',
        type: profile_response_dto_1.ProfileResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('verify-email/:token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify user email address' }),
    (0, swagger_1.ApiParam)({ name: 'token', description: 'Verification token from email' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Email verified successfully.',
        type: SuccessMessageResponse,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired token' }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Get)('admin-only'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin-only endpoint example' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Success (for admins).' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (User is not Admin)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "adminOnlyEndpoint", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Request a password reset email' }),
    (0, swagger_1.ApiBody)({ type: forgot_password_dto_1.ForgotPasswordDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Password reset instructions sent (if email exists).',
        type: success_message_response_dto_1.SuccessMessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password using token' }),
    (0, swagger_1.ApiBody)({ type: reset_password_dto_1.ResetPasswordDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Password reset successfully.',
        type: success_message_response_dto_1.SuccessMessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid/expired token or validation failed',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('admin/login'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Log in an administrator' }),
    (0, swagger_1.ApiBody)({ type: admin_login_dto_1.AdminLoginDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Admin login successful, returns tokens.',
        type: login_response_dto_1.LoginResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden (Invalid credentials or not an admin)',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_login_dto_1.AdminLoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "adminLogin", null);
__decorate([
    (0, common_1.Post)('resend-verification-email'),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 600000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Resend email verification link' }),
    (0, swagger_1.ApiBody)({ type: resend_verification_email_dto_1.ResendVerificationEmailDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Verification email resent (if email exists and not verified)',
        type: success_message_response_dto_1.SuccessMessageResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed' }),
    (0, swagger_1.ApiResponse)({
        status: 429,
        description: 'Too Many Requests - Rate limit exceeded',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resend_verification_email_dto_1.ResendVerificationEmailDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerificationEmail", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map