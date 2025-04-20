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

  /**
   * Daftar negara (contoh)
   * Pada implementasi nyata bisa diambil dari database
   */
  getCountries() {
    // Contoh data negara
    return [
      { code: 'ID', name: 'Indonesia' },
      { code: 'MY', name: 'Malaysia' },
      { code: 'SG', name: 'Singapore' },
      { code: 'US', name: 'United States' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'AU', name: 'Australia' },
      { code: 'JP', name: 'Japan' },
      // ... dan seterusnya
    ];
  }

  /**
   * Daftar timezone (contoh)
   * Pada implementasi nyata bisa diambil dari database
   */
  getTimezones() {
    // Contoh data timezone
    return [
      { id: 'Asia/Jakarta', offset: '+07:00', name: 'Jakarta' },
      { id: 'Asia/Singapore', offset: '+08:00', name: 'Singapore' },
      { id: 'Asia/Tokyo', offset: '+09:00', name: 'Tokyo' },
      { id: 'Europe/London', offset: '+00:00', name: 'London' },
      { id: 'America/New_York', offset: '-05:00', name: 'New York' },
      { id: 'Australia/Sydney', offset: '+10:00', name: 'Sydney' },
      // ... dan seterusnya
    ];
  }
}
