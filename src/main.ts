import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aktifkan CORS
  app.enableCors(); // Anda bisa menambahkan opsi di sini: app.enableCors({ origin: 'https://domain-frontend-anda.com' });

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('SSO Boilerplate API')
    .setDescription('API documentation for the SSO Boilerplate application')
    .setVersion('1.0')
    .addTag('auth', 'Authentication related endpoints')
    .addTag('app', 'General application endpoints')
    .addTag('api-keys', 'API Key management')
    .addTag('api-examples', 'Example API endpoints protected by API Key')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'jwt',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
        description: 'API Key untuk autentikasi akses API',
      },
      'api-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Simpan file swagger.json untuk penggunaan eksternal
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.resolve(process.cwd(), 'swagger.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
  console.log(`Swagger JSON file written to: ${outputPath}`);

  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 5001;

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}/api`);
}
bootstrap();
