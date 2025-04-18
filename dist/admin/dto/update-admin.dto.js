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
exports.UpdateAdminDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateAdminDto {
    name;
    companyId;
    roleIds;
}
exports.UpdateAdminDto = UpdateAdminDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'John Doe Updated',
        description: 'Updated name for the admin',
        maxLength: 150,
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], UpdateAdminDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 2,
        description: 'Updated company ID (set null to remove company association)',
        nullable: true,
        required: false,
    }),
    (0, class_validator_1.ValidateIf)((o) => o.companyId !== undefined),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Object)
], UpdateAdminDto.prototype, "companyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [1, 3, 5],
        description: 'Updated array of role IDs',
        type: [Number],
        required: false,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)({ message: 'Admin harus memiliki setidaknya satu role' }),
    (0, class_validator_1.IsInt)({ each: true, message: 'Setiap roleId harus berupa integer' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateAdminDto.prototype, "roleIds", void 0);
//# sourceMappingURL=update-admin.dto.js.map