import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '@src/prisma/prisma.module';
import { UserModule } from '@src/user/user.module';
import { RBACModule } from '@src/rbac/rbac.module';

@Module({
  imports: [PrismaModule, UserModule, RBACModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
