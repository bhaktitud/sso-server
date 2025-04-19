import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from '@src/auth/constants';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { UserType } from '../../../generated/mysql';

// Definisikan tipe untuk payload JWT (lebih fleksibel)
interface JwtPayload {
  sub: number; // User ID
  email: string;
  userType: UserType; // Tipe user (APP_USER atau ADMIN_USER)
  name?: string | null;
  role?: string; // Role untuk backward compatibility

  // Admin specific (opsional)
  profileId?: number; // AdminProfile ID
  roles?: string[]; // Array nama role
  permissions?: string[]; // Array nama permissions
}

// Tipe untuk objek req.user yang dihasilkan
interface RequestUser {
  userId: number; // Ganti nama dari sub
  email: string;
  userType: UserType;
  name?: string | null;
  role?: string; // Role untuk backward compatibility
  profileId?: number;
  roles?: string[];
  permissions?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    let publicKey: string;
    try {
      // Baca path dari konstanta (atau bisa dari configService)
      const publicKeyPath = jwtConstants.access.publicKeyPath;
      // const publicKeyPath = configService.get<string>('JWT_PUBLIC_KEY_PATH');

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
      // Algoritma dari konstanta
      algorithms: [jwtConstants.access.algorithm],
    });
  }

  /**
   * Validasi payload token.
   * Nilai yang dikembalikan akan ditambahkan ke objek Request sebagai `req.user`.
   */
  validate(payload: JwtPayload): RequestUser {
    // Payload sudah divalidasi oleh passport-jwt berdasarkan secret dan expiration
    // Kembalikan semua data yang relevan dari payload
    // Guard nanti akan memeriksa field spesifik seperti userType atau roles
    return {
      userId: payload.sub,
      email: payload.email,
      userType: payload.userType,
      name: payload.name,
      role: payload.role,
      profileId: payload.profileId,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  }
}
