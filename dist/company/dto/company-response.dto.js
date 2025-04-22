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
exports.CompanyResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const api_key_entity_1 = require("../../apikey/entities/api-key.entity");
class CompanyResponseDto {
    id;
    name;
    description;
    clientId;
    clientSecret;
    apiKeys;
    createdAt;
    updatedAt;
}
exports.CompanyResponseDto = CompanyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1,
        description: 'The unique identifier of the company',
    }),
    __metadata("design:type", Number)
], CompanyResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Acme Corp',
        description: 'The name of the company',
    }),
    __metadata("design:type", String)
], CompanyResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Leading provider of innovative solutions',
        description: 'Company description',
        required: false,
        nullable: true,
    }),
    __metadata("design:type", Object)
], CompanyResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'a1b2c3d4e5f6',
        description: 'Client ID for OAuth authentication',
        required: false,
        nullable: true,
    }),
    __metadata("design:type", Object)
], CompanyResponseDto.prototype, "clientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'secret-xyz-123',
        description: 'Client Secret for OAuth authentication',
        required: false,
        nullable: true,
    }),
    __metadata("design:type", Object)
], CompanyResponseDto.prototype, "clientSecret", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: () => [api_key_entity_1.ApiKeyEntity],
        description: 'API keys belonging to the company',
        required: false,
    }),
    __metadata("design:type", Array)
], CompanyResponseDto.prototype, "apiKeys", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CompanyResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CompanyResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=company-response.dto.js.map