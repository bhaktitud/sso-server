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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const mysql_1 = require("../../generated/mysql");
const mongo_1 = require("../../generated/mongo");
let PrismaService = class PrismaService {
    mysql;
    mongo;
    constructor() {
        this.mysql = new mysql_1.PrismaClient();
        this.mongo = new mongo_1.PrismaClient();
    }
    async onModuleInit() {
        await this.mysql.$connect();
        await this.mongo.$connect();
        console.log('Successfully connected to MySQL and MongoDB');
    }
    async onModuleDestroy() {
        await this.mysql.$disconnect();
        await this.mongo.$disconnect();
        console.log('Disconnected from MySQL and MongoDB');
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map