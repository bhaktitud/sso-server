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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const common_2 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
let UserService = class UserService {
    prisma;
    cacheManager;
    constructor(prisma, cacheManager) {
        this.prisma = prisma;
        this.cacheManager = cacheManager;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const cacheKey = `users:all:${JSON.stringify({ skip, take, where, orderBy })}`;
        const cachedUsers = await this.cacheManager.get(cacheKey);
        if (cachedUsers) {
            return cachedUsers;
        }
        const users = await this.prisma.mysql.user.findMany({
            skip,
            take,
            where,
            orderBy,
        });
        await this.cacheManager.set(cacheKey, users, 60000);
        return users;
    }
    async findOneByEmail(email) {
        return await this.prisma.mysql.user.findUnique({
            where: { email },
        });
    }
    async findById(id) {
        const cacheKey = `user:id:${id}`;
        const cachedUser = await this.cacheManager.get(cacheKey);
        if (cachedUser) {
            return cachedUser;
        }
        const user = await this.prisma.mysql.user.findUnique({
            where: { id },
        });
        if (user) {
            await this.cacheManager.set(cacheKey, user, 300000);
        }
        return user;
    }
    async create(data) {
        const newUser = await this.prisma.mysql.user.create({
            data,
        });
        await this.cacheManager.del(`users:all:*`);
        return newUser;
    }
    async update(id, data) {
        const updatedUser = await this.prisma.mysql.user.update({
            where: { id },
            data,
        });
        await this.cacheManager.del(`user:id:${id}`);
        await this.cacheManager.del(`users:all:*`);
        return updatedUser;
    }
    async remove(id) {
        const deletedUser = await this.prisma.mysql.user.delete({
            where: { id },
        });
        await this.cacheManager.del(`user:id:${id}`);
        await this.cacheManager.del(`users:all:*`);
        return deletedUser;
    }
    async updateRefreshToken(userId, hashedRefreshToken) {
        await this.prisma.mysql.user.update({
            where: { id: userId },
            data: { hashedRefreshToken },
        });
        await this.cacheManager.del(`user:id:${userId}`);
    }
    async updatePassword(userId, newHashedPassword) {
        await this.prisma.mysql.user.update({
            where: { id: userId },
            data: { password: newHashedPassword },
        });
        await this.cacheManager.del(`user:id:${userId}`);
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], UserService);
//# sourceMappingURL=user.service.js.map