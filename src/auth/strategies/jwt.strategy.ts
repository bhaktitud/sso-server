import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken';

// Definisikan tipe untuk payload JWT (sesuai dengan yang dibuat AuthService)
interface JwtPayload {
  sub: number;
  email: string;
  name?: string | null;
  role: string; // <<< Nama peran dari database (string)
  companyId: number | null; // <<< ID Perusahaan (bisa null)
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const publicKeyPath = configService.get<string>('JWT_PUBLIC_KEY_PATH');
    const algorithm = configService.get<string>(
      'JWT_ACCESS_ALGORITHM',
      'RS256', // Default
    );

    if (
      ![
        'RS256',
        'HS256',
        'ES256' /* tambahkan algo lain jika perlu */,
      ].includes(algorithm)
    ) {
      throw new Error(`Unsupported JWT algorithm specified: ${algorithm}`);
    }

    let publicKey: string;
    try {
      if (!publicKeyPath) {
        throw new Error('JWT_PUBLIC_KEY_PATH not found in configuration.');
      }
      publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    } catch (error) {
      console.error(
        'FATAL: Could not read JWT public key for verification.',
        error,
      );
      throw new Error('Could not read JWT public key.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: [algorithm as Algorithm],
    });
  }

  /**
   * Validasi payload token.
   * Nilai yang dikembalikan akan ditambahkan ke objek Request sebagai `req.user`.
   */
  validate(payload: JwtPayload) {
    // Kembalikan semua data dari payload yang relevan untuk req.user
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role, // Sertakan nama peran
      companyId: payload.companyId, // Sertakan companyId
    };
  }
}
