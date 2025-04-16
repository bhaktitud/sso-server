import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

// Definisikan mock sederhana untuk PrismaService
const mockPrismaService = {
  // Tambahkan mock untuk metode yang mungkin dipanggil oleh AppService/AppController jika ada
  // Contoh:
  // mysql: {
  //   $queryRaw: jest.fn(),
  // },
  // mongo: {
  //   $runCommandRaw: jest.fn(),
  // }
};

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService; // Kita juga bisa mem-mock AppService jika perlu pengujian terisolasi Controller

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService, // Sediakan AppService asli (atau mock)
        { provide: PrismaService, useValue: mockPrismaService }, // <-- Sediakan mock PrismaService
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService); // Dapatkan instance AppService
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  // Tambahkan describe block untuk endpoint /health jika perlu
  // describe('health', () => {
  //   it('should return health status', async () => {
  //     const healthStatus = { mysql: 'connected', mongo: 'connected', status: 'healthy' };
  //     // Mock metode getHealth di AppService jika perlu
  //     jest.spyOn(appService, 'getHealth').mockResolvedValue(healthStatus);
  //     expect(await appController.getHealth()).toEqual(healthStatus);
  //   });
  // });
});
