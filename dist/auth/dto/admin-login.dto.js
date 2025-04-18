"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminLoginDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const login_dto_1 = require("./login.dto");
class AdminLoginDto extends (0, swagger_1.PickType)(login_dto_1.LoginDto, [
    'email',
    'password',
]) {
}
exports.AdminLoginDto = AdminLoginDto;
//# sourceMappingURL=admin-login.dto.js.map