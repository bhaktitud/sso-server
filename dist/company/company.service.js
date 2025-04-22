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
exports.CompanyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mysql_1 = require("../../generated/mysql");
const crypto_1 = require("crypto");
let CompanyService = class CompanyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCompanyDto) {
        const data = {
            ...createCompanyDto,
            clientId: createCompanyDto.clientId || `cid_${(0, crypto_1.randomUUID)()}`,
            clientSecret: createCompanyDto.clientSecret || `cs_${(0, crypto_1.randomUUID)()}`,
        };
        return await this.prisma.mysql.company.create({
            data,
        });
    }
    async findAll() {
        return await this.prisma.mysql.company.findMany();
    }
    async findOne(id) {
        const company = await this.prisma.mysql.company.findUnique({
            where: { id },
        });
        if (!company) {
            throw new common_1.NotFoundException(`Company with ID ${id} not found.`);
        }
        return company;
    }
    async update(id, updateCompanyDto) {
        await this.findOne(id);
        return await this.prisma.mysql.company.update({
            where: { id },
            data: updateCompanyDto,
        });
    }
    async regenerateClientCredentials(id) {
        const company = await this.findOne(id);
        return await this.prisma.mysql.company.update({
            where: { id },
            data: {
                clientId: `cid_${(0, crypto_1.randomUUID)()}`,
                clientSecret: `cs_${(0, crypto_1.randomUUID)()}`,
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        try {
            return await this.prisma.mysql.company.delete({ where: { id } });
        }
        catch (error) {
            if (error instanceof mysql_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003') {
                throw new common_1.ConflictException(`Cannot delete company with ID ${id}. It still has associated admins.`);
            }
            console.error(`Error deleting company ${id}:`, error);
            throw new Error(`Failed to delete company with ID ${id}.`);
        }
    }
};
exports.CompanyService = CompanyService;
exports.CompanyService = CompanyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompanyService);
//# sourceMappingURL=company.service.js.map