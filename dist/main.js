"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('SSO Boilerplate API')
        .setDescription('API documentation for the SSO Boilerplate application')
        .setVersion('1.0')
        .addTag('auth', 'Authentication related endpoints')
        .addTag('app', 'General application endpoints')
        .addTag('api-keys', 'API Key management')
        .addTag('api-examples', 'Example API endpoints protected by API Key')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'jwt')
        .addApiKey({
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
        description: 'API Key untuk autentikasi akses API',
    }, 'api-key')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.resolve(process.cwd(), 'swagger.json');
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
    console.log(`Swagger JSON file written to: ${outputPath}`);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = process.env.PORT || 5001;
    await app.listen(port);
    console.log(`Application is running on: ${await app.getUrl()}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map