import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from '@src/auth/constants';

// Definisikan tipe untuk payload refresh token
interface RefreshTokenPayload {
  sub: number; // ID Pengguna
}

// Fungsi untuk mengekstrak token dari request body atau header
const extractTokenFromRequest = (req: Request) => {
  // Coba dapatkan dari body.refreshToken
  if (req.body?.refreshToken) {
    return req.body.refreshToken;
  }

  // Fallback ke Authorization header
  const authHeader = req.get('authorization');
  if (authHeader) {
    return authHeader.replace('Bearer', '').trim();
  }

  return null;
};

@Injectable()
// Gunakan nama unik untuk strategi, misal 'jwt-refresh'
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      // Menggunakan custom extractor untuk mendukung token dari body atau header
      jwtFromRequest: (req) => extractTokenFromRequest(req),
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
    // Dapatkan token dari request body atau header
    const refreshToken = extractTokenFromRequest(req);

    if (!refreshToken) {
      throw new Error('Refresh token not found'); // Atau handle sesuai kebutuhan
    }

    return { ...payload, refreshToken };
  }
}
