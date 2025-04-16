"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const user_module_1 = require("../user/user.module");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const constants_1 = require("./constants");
const local_strategy_1 = require("./strategies/local.strategy");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const refresh_token_strategy_1 = require("./strategies/refresh-token.strategy");
const mail_module_1 = require("../mail/mail.module");
const prisma_module_1 = require("../prisma/prisma.module");
const config_1 = require("@nestjs/config");
const fs = require("fs");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            user_module_1.UserModule,
            passport_1.PassportModule,
            mail_module_1.MailModule,
            prisma_module_1.PrismaModule,
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: () => {
                    let privateKey;
                    let publicKey;
                    try {
                        const privateKeyPath = constants_1.jwtConstants.access.privateKeyPath;
                        const publicKeyPath = constants_1.jwtConstants.access.publicKeyPath;
                        privateKey = fs.readFileSync(privateKeyPath, 'utf8');
                        publicKey = fs.readFileSync(publicKeyPath, 'utf8');
                    }
                    catch (error) {
                        console.error('Error reading JWT keys:', error);
                        const message = error instanceof Error ? error.message : String(error);
                        throw new Error(`Could not read JWT keys. Ensure keys exist at specified paths. Original error: ${message}`);
                    }
                    return {
                        privateKey,
                        publicKey,
                        signOptions: {
                            expiresIn: constants_1.jwtConstants.access.expiresIn,
                            algorithm: constants_1.jwtConstants.access.algorithm,
                        },
                    };
                },
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, local_strategy_1.LocalStrategy, jwt_strategy_1.JwtStrategy, refresh_token_strategy_1.RefreshTokenStrategy],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map