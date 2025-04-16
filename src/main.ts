import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/permissions/permissions.guard';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const reflector = new Reflector();

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new PermissionsGuard(reflector, app.get(PrismaService)),
  );

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
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 5001;

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}/api`);
}
bootstrap();
