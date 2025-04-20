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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const swagger_1 = require("@nestjs/swagger");
const cache_manager_1 = require("@nestjs/cache-manager");
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    getHello() {
        return this.appService.getHello();
    }
    async getHealth() {
        return this.appService.getHealth();
    }
    getCountries() {
        return this.appService.getCountries();
    }
    getTimezones() {
        return this.appService.getTimezones();
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Hello World endpoint' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns hello message' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Check application health' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns application health status.',
        type: Object,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('countries'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheKey)('all_countries_list'),
    (0, cache_manager_1.CacheTTL)(3600000),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of countries (cached for 1 hour)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of countries' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getCountries", null);
__decorate([
    (0, common_1.Get)('timezones'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheKey)('all_timezones_list'),
    (0, cache_manager_1.CacheTTL)(86400000),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of timezones (cached for 24 hours)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of timezones' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getTimezones", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)('app'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map