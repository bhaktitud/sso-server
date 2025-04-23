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
const uuid_1 = require("uuid");
let CompanyService = class CompanyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCompanyDto) {
        try {
            const { name, description, clientId, clientSecret, roleType = 'basic', } = createCompanyDto;
            const generatedClientId = clientId || this.generateClientId(name, roleType);
            const generatedClientSecret = clientSecret || this.generateClientSecret();
            return await this.prisma.mysql.company.create({
                data: {
                    name,
                    description,
                    clientId: generatedClientId,
                    clientSecret: generatedClientSecret,
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Client ID or company name already exists');
            }
            throw error;
        }
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
        let roleType = 'basic';
        if (company.clientId) {
            const parts = company.clientId.split('_');
            if (parts.length >= 3) {
                roleType = parts[2];
            }
        }
        const clientId = this.generateClientId(company.name, roleType);
        return await this.prisma.mysql.company.update({
            where: { id },
            data: {
                clientId,
                clientSecret: this.generateClientSecret(),
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
    generateClientId(companyName, roleType) {
        const companyPrefix = companyName
            .toLowerCase()
            .replace(/\s+/g, '_')
            .substring(0, 10);
        let permissionCode;
        switch (roleType.toLowerCase()) {
            case 'admin':
                permissionCode = 'adm-rwx';
                break;
            case 'premium':
                permissionCode = 'prm-rw';
                break;
            default:
                permissionCode = 'bsc-r';
                break;
        }
        const timestamp = new Date().getTime().toString().substring(0, 10);
        const randomId = (0, uuid_1.v4)().substring(0, 8);
        return `comp_${companyPrefix}_${permissionCode}_${timestamp}_${randomId}`;
    }
    extractPermissionsFromClientId(clientId) {
        if (!clientId)
            return 'bsc-r';
        const parts = clientId.split('_');
        if (parts.length >= 3) {
            return parts[2];
        }
        return 'bsc-r';
    }
    extractCompanyInfoFromClientId(clientId) {
        if (!clientId)
            return null;
        const parts = clientId.split('_');
        if (parts.length >= 2) {
            return {
                companyPrefix: parts[1]
            };
        }
        return null;
    }
    generateClientSecret() {
        return `cs_${(0, crypto_1.randomUUID)()}`;
    }
};
exports.CompanyService = CompanyService;
exports.CompanyService = CompanyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompanyService);
//# sourceMappingURL=company.service.js.map