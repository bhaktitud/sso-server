import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RBACModule } from './rbac/rbac.module';
import { CompanyModule } from './company/company.module';
import { AdminModule } from './admin/admin.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './tasks/tasks.module';
import { ApikeyModule } from './apikey/apikey.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // CacheModule dengan konfigurasi TTL 5 menit (global)
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 menit dalam milidetik
      max: 100, // maksimum 100 item dalam cache
    }),
    // ScheduleModule untuk menjalankan tugas terjadwal
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    UserModule,
    RBACModule,
    CompanyModule,
    AdminModule,
    TasksModule,
    ApikeyModule,
    ApiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
