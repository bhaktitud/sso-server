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
exports.ViewProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const roles_enum_1 = require("../../auth/roles/roles.enum");
class ViewProfileDto {
    id;
    email;
    name;
    role;
    isEmailVerified;
}
exports.ViewProfileDto = ViewProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User ID',
        example: 1,
    }),
    __metadata("design:type", Number)
], ViewProfileDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User email address',
        example: 'user@example.com',
    }),
    __metadata("design:type", String)
], ViewProfileDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User full name (can be null)',
        example: 'John Doe',
        nullable: true,
    }),
    __metadata("design:type", Object)
], ViewProfileDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User role',
        enum: roles_enum_1.Role,
        example: roles_enum_1.Role.USER,
    }),
    __metadata("design:type", String)
], ViewProfileDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indicates if the user email address has been verified',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ViewProfileDto.prototype, "isEmailVerified", void 0);
//# sourceMappingURL=view-profile.dto.js.map