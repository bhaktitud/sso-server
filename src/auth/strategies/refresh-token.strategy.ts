import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from '../constants';

// Definisikan tipe untuk payload refresh token
interface RefreshTokenPayload {
  sub: number; // ID Pengguna
}

@Injectable()
// Gunakan nama unik untuk strategi, misal 'jwt-refresh'
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      // Ekstrak token dari header Authorization Bearer
      // Klien HARUS mengirim refresh token sebagai Bearer token ke endpoint refresh
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConstants.refresh.secret, // Gunakan secret refresh token
      ignoreExpiration: false, // Pastikan token kedaluwarsa ditolak
      passReqToCallback: true, // Agar bisa akses `req` di `validate`
      algorithms: [jwtConstants.refresh.algorithm], // Tentukan algoritma HS256
    });
  }

  /**
   * Validasi payload refresh token.
   * Method ini juga akan menerima `req` karena passReqToCallback: true.
   * Kembalikan payload beserta refresh token asli untuk validasi lebih lanjut di service.
   */
  validate(req: Request, payload: RefreshTokenPayload) {
    const authHeader = req.get('authorization');
    // Tambahkan pemeriksaan jika header tidak ada
    if (!authHeader) {
      throw new Error('Authorization header not found'); // Atau handle sesuai kebutuhan
    }
    const refreshToken = authHeader.replace('Bearer', '').trim();
    return { ...payload, refreshToken };
  }
}
