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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOneByEmail(email) {
        return await this.prisma.mysql.userMysql.findUnique({
            where: { email },
        });
    }
    async findById(id) {
        return await this.prisma.mysql.userMysql.findUnique({
            where: { id },
        });
    }
    async create(data) {
        return await this.prisma.mysql.userMysql.create({
            data,
        });
    }
    async updateRefreshToken(userId, hashedRefreshToken) {
        await this.prisma.mysql.userMysql.update({
            where: { id: userId },
            data: { hashedRefreshToken },
        });
    }
    async updatePassword(userId, newHashedPassword) {
        await this.prisma.mysql.userMysql.update({
            where: { id: userId },
            data: { password: newHashedPassword },
        });
    }
    async updateUser(userId, data) {
        delete data.email;
        delete data.role;
        delete data.id;
        delete data.password;
        delete data.hashedRefreshToken;
        delete data.isEmailVerified;
        delete data.emailVerificationToken;
        delete data.passwordResetToken;
        delete data.passwordResetExpires;
        if (Object.keys(data).length === 0) {
            const currentUser = await this.findById(userId);
            if (!currentUser)
                throw new Error('User not found during update.');
            return currentUser;
        }
        return await this.prisma.mysql.userMysql.update({
            where: { id: userId },
            data,
        });
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map