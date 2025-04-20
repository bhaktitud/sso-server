import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ApikeyModule } from '../apikey/apikey.module';
import { ApiLoggingMiddleware } from '../apikey/middleware/api-logging.middleware';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { ExampleController } from './controllers/example.controller';

@Module({
  imports: [ApikeyModule],
  controllers: [ExampleController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
      // ApiKeyGuard sekarang menggunakan dekorator @RequireApiKey
      // Gunakan @RequireApiKey(true) untuk memerlukan API key
      // Gunakan @RequireApiKey(false) untuk mengabaikan pemeriksaan API key
      // Jika tidak ada dekorator, default-nya adalah memerlukan API key
    },
  ],
})
export class ApiModule {
  configure(consumer: MiddlewareConsumer) {
    // Terapkan middleware logging ke semua rute API
    consumer
      .apply(ApiLoggingMiddleware)
      .forRoutes({ path: 'api/*', method: RequestMethod.ALL });
  }
}
