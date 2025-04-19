import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth(): Promise<Record<string, string>> {
    const healthStatus = {
      mysql: 'disconnected',
      mongo: 'disconnected',
      status: 'unhealthy',
    };

    try {
      await this.prisma.mysql.$queryRaw`SELECT 1`;
      healthStatus.mysql = 'connected';
    } catch (error: unknown) {
      console.error('MySQL connection failed:', error);
      healthStatus.mysql = `failed: ${error instanceof Error ? error.message : String(error)}`;
    }

    // try {
    //   await this.prisma.mongo.$runCommandRaw({ ping: 1 });
    //   healthStatus.mongo = 'connected';
    // } catch (error: unknown) {
    //   console.error('MongoDB connection failed:', error);
    //   healthStatus.mongo = `failed: ${error instanceof Error ? error.message : String(error)}`;
    // }

    if (
      healthStatus.mysql === 'connected' &&
      healthStatus.mongo === 'connected'
    ) {
      healthStatus.status = 'healthy';
    }

    return healthStatus;
  }
}
