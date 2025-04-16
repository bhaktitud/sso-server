import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken';
import { Role } from '@src/auth/roles/roles.enum';

// Definisikan tipe untuk payload JWT
interface JwtPayload {
  sub: number; // ID Pengguna (dari UserMysql.id)
  email: string;
  name?: string | null; // Nama bisa null
  role: Role;
  // Tambahkan klaim lain jika perlu (misalnya, roles)
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
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  }
}
