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
exports.UpdatePermissionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_permission_dto_1 = require("./create-permission.dto");
const swagger_1 = require("@nestjs/swagger");
class UpdatePermissionDto extends (0, mapped_types_1.PartialType)(create_permission_dto_1.CreatePermissionDto) {
    action;
    subject;
}
exports.UpdatePermissionDto = UpdatePermissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'manage',
        description: 'Updated action value',
        maxLength: 100,
        required: false,
    }),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'content',
        description: 'Updated subject/resource value',
        maxLength: 100,
        required: false,
    }),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "subject", void 0);
//# sourceMappingURL=update-permission.dto.js.map