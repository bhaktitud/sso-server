import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApikeyService } from '../apikey.service';

@Injectable()
export class ApiLoggingMiddleware implements NestMiddleware {
  constructor(private readonly apikeyService: ApikeyService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Simpan waktu mulai untuk menghitung durasi request
    const startTime = Date.now();

    // Menangkap body request (opsional, untuk debugging)
    const requestBody = JSON.stringify(req.body);

    // Menggunakan event 'finish' untuk menangkap status code response
    res.on('finish', async () => {
      // Cek apakah request sudah diautentikasi dengan API key
      if (req['apiKey']) {
        const apiKey = req['apiKey'];
        const duration = Date.now() - startTime;

        // Log ke database
        await this.apikeyService.logApiUsage(
          apiKey.id,
          req.originalUrl,
          req.method,
          res.statusCode,
          requestBody,
        );

        console.log(
          `[API-KEY: ${apiKey.key.substring(0, 8)}...] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
        );
      }
    });

    next();
  }
}
