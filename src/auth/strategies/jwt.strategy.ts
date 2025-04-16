import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from '../constants';
import * as fs from 'fs';
import { Role } from '../roles/roles.enum';

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
  constructor() {
    let publicKey: string;
    try {
      // Baca kunci publik dari jwtConstants.access
      publicKey = fs.readFileSync(jwtConstants.access.publicKeyPath, 'utf8');
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
      // Gunakan algoritma dari jwtConstants.access
      algorithms: [jwtConstants.access.algorithm],
    });
  }

  /**
   * Validasi payload token.
   * Nilai yang dikembalikan akan ditambahkan ke objek Request sebagai `req.user`.
   */
  // Metode ini bisa sinkron jika tidak ada operasi async di dalamnya
  validate(payload: JwtPayload) {
    // Payload sudah divalidasi oleh passport-jwt berdasarkan secret dan expiration
    // Kembalikan data yang ingin Anda ekspos di req.user
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  }
}
