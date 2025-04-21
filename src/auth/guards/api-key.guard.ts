import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApikeyService } from '../../apikey/apikey.service';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRE_API_KEY } from '../decorators/require-apikey.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private apikeyService: ApikeyService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log('isPublic value:', isPublic);

    // Jika endpoint public, tidak perlu autentikasi
    if (isPublic) {
      return true;
    }

    // Periksa jika rute ini perlu API key
    const requireApiKey = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_API_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Jika rute tidak memerlukan API key, lanjutkan
    if (requireApiKey === false) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKeyFromHeader(request);

    console.log('Request path:', request.path);
    console.log('requireApiKey value:', requireApiKey);
    console.log('API Key in header:', apiKey);

    if (!apiKey) {
      throw new UnauthorizedException('API key diperlukan');
    }

    try {
      // Validasi API key
      const validApiKey = await this.apikeyService.validateApiKey(apiKey);

      // Simpan informasi API key dan perusahaan di request untuk digunakan di middleware logging
      request['apiKey'] = validApiKey;

      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  private extractApiKeyFromHeader(request: Request): string | undefined {
    // Format header: X-API-KEY: your-api-key
    const apiKey = request.headers['x-api-key'];
    return apiKey ? apiKey.toString() : undefined;
  }
}
