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
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma/prisma.service");
let AppService = class AppService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getHello() {
        return 'Hello World!';
    }
    async getHealth() {
        const healthStatus = {
            mysql: 'disconnected',
            mongo: 'disconnected',
            status: 'unhealthy',
        };
        try {
            await this.prisma.mysql.$queryRaw `SELECT 1`;
            healthStatus.mysql = 'connected';
        }
        catch (error) {
            console.error('MySQL connection failed:', error);
            healthStatus.mysql = `failed: ${error instanceof Error ? error.message : String(error)}`;
        }
        try {
            await this.prisma.mongo.$runCommandRaw({ ping: 1 });
            healthStatus.mongo = 'connected';
        }
        catch (error) {
            console.error('MongoDB connection failed:', error);
            healthStatus.mongo = `failed: ${error instanceof Error ? error.message : String(error)}`;
        }
        if (healthStatus.mysql === 'connected' &&
            healthStatus.mongo === 'connected') {
            healthStatus.status = 'healthy';
        }
        return healthStatus;
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppService);
//# sourceMappingURL=app.service.js.map