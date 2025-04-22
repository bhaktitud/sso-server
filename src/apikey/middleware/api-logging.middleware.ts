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

    // Menangkap informasi klien
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Fungsi untuk menyimpan respons asli
    const originalSend = res.send;
    let responseBody = '';

    // Override fungsi send untuk menangkap respons
    res.send = function (body) {
      responseBody = body;
      return originalSend.call(this, body);
    } as any;

    // Menggunakan event 'finish' untuk menangkap status code response
    res.on('finish', async () => {
      // Cek apakah request sudah diautentikasi dengan API key
      if (req['apiKey']) {
        const apiKey = req['apiKey'];
        const duration = Date.now() - startTime;

        // Mencoba mengambil sampel dari responseBody jika ada
        let responseSample = '';
        try {
          // Ambil hanya 500 karakter pertama dari respons untuk efisiensi penyimpanan
          const responseObj = JSON.parse(responseBody);
          responseSample = JSON.stringify(responseObj).substring(0, 500);
          if (JSON.stringify(responseObj).length > 500) {
            responseSample += '...';
          }
        } catch (e) {
          // Jika bukan JSON atau ada error, ambil substring biasa
          if (responseBody) {
            responseSample = responseBody.substring(0, 500);
            if (responseBody.length > 500) {
              responseSample += '...';
            }
          }
        }

        // Log ke database
        await this.apikeyService.logApiUsage(
          apiKey.id,
          req.originalUrl,
          req.method,
          res.statusCode,
          requestBody,
          responseSample,
          duration,
          ipAddress,
          userAgent,
          apiKey.companyId
        );

        console.log(
          `[API-KEY: ${apiKey.key.substring(0, 8)}...] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms) - IP: ${ipAddress}`,
        );
      }
    });

    next();
  }

  // Fungsi helper untuk mendapatkan IP klien
  private getClientIp(req: Request): string {
    // Cek header X-Forwarded-For untuk mendukung proxy
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      return Array.isArray(xForwardedFor) 
        ? xForwardedFor[0] 
        : xForwardedFor.split(',')[0].trim();
    }
    
    // Fallback ke IP koneksi langsung
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
}
