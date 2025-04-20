import { Module } from '@nestjs/common';
import { ApikeyService } from './apikey.service';
import { ApikeyController } from './apikey.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ApikeyController],
  providers: [ApikeyService],
  exports: [ApikeyService],
})
export class ApikeyModule {}
