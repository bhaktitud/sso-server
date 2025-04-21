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
exports.CompanyController = void 0;
const common_1 = require("@nestjs/common");
const company_service_1 = require("./company.service");
const create_company_dto_1 = require("./dto/create-company.dto");
const update_company_dto_1 = require("./dto/update-company.dto");
const company_response_dto_1 = require("./dto/company-response.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions/permissions.guard");
const permissions_decorator_1 = require("../auth/permissions/permissions.decorator");
const require_apikey_decorator_1 = require("../auth/decorators/require-apikey.decorator");
let CompanyController = class CompanyController {
    companyService;
    constructor(companyService) {
        this.companyService = companyService;
    }
    create(createCompanyDto) {
        return this.companyService.create(createCompanyDto);
    }
    findAll() {
        return this.companyService.findAll();
    }
    findOne(id) {
        return this.companyService.findOne(id);
    }
    update(id, updateCompanyDto) {
        return this.companyService.update(id, updateCompanyDto);
    }
    async remove(id) {
        await this.companyService.remove(id);
    }
};
exports.CompanyController = CompanyController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new company' }),
    (0, swagger_1.ApiBody)({ type: create_company_dto_1.CreateCompanyDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Company created successfully.',
        type: company_response_dto_1.CompanyResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('create:company'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_company_dto_1.CreateCompanyDto]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a list of all companies' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of companies.',
        type: [company_response_dto_1.CompanyResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('read:company'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific company by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Company ID', type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Company details.',
        type: company_response_dto_1.CompanyResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Company not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('read:company'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a company' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Company ID', type: Number }),
    (0, swagger_1.ApiBody)({ type: update_company_dto_1.UpdateCompanyDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Company updated successfully.',
        type: company_response_dto_1.CompanyResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Company not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('update:company'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_company_dto_1.UpdateCompanyDto]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a company' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Company ID', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Company deleted successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Company not found.' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Conflict (e.g., company still has admins).',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden. Missing required permissions.',
    }),
    (0, permissions_decorator_1.RequirePermissions)('delete:company'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "remove", null);
exports.CompanyController = CompanyController = __decorate([
    (0, swagger_1.ApiTags)('Companies Management'),
    (0, common_1.Controller)('companies'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, require_apikey_decorator_1.RequireApiKey)(false),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [company_service_1.CompanyService])
], CompanyController);
//# sourceMappingURL=company.controller.js.map