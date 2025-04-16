import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // Menangkap semua jenis exception
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Tentukan status HTTP
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Tentukan pesan error
    let message: string | object = 'Internal server error';
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      message =
        typeof response === 'string' ? response : (response as any).message;
    } else {
      // Log semua exception yang bukan HttpException
      console.error('Unhandled Exception:', exception); // Log error asli
      // Pesan error tetap generik untuk non-HttpException
    }

    // Struktur respons error
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    };

    // Kirim respons
    response.status(status).json(errorResponse);
  }
}
