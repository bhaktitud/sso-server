// Set dummy env var before imports that might use it
// process.env.JWT_REFRESH_TOKEN_SECRET = 'test-secret'; // Tidak perlu lagi karena di-mock

import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenStrategy } from './refresh-token.strategy';
import { Request } from 'express';

// Mock constants.ts SEBELUM modul lain mengimpornya
// Pindahkan definisi konstanta ke dalam factory function
// const mockJwtConstants = { ... }; // Hapus definisi di sini
jest.mock('../constants', () => {
  // Definisikan konstanta di dalam factory function
  const mockJwtConstantsInsideMock = {
    refresh: {
      secret: 'mock-refresh-secret', // Tidak perlu env var lagi
      expiresIn: '7d',
      algorithm: 'HS256',
    },
    // Objek access bisa kosong jika tidak digunakan di strategy ini
    access: {},
  };
  return {
    jwtConstants: mockJwtConstantsInsideMock, // Kembalikan objek mock
  };
});

// Definisikan ulang tipe payload untuk test
interface TestRefreshTokenPayload {
  sub: number;
  // Tambahkan klaim lain jika ada di payload asli
}

describe('RefreshTokenStrategy', () => {
  let strategy: RefreshTokenStrategy;

  beforeEach(async () => {
    // Tidak ada provider eksternal yang perlu di-mock
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefreshTokenStrategy],
    }).compile();

    strategy = module.get<RefreshTokenStrategy>(RefreshTokenStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const userId = 1;
    const refreshToken = 'someValidRefreshToken';
    const payload: TestRefreshTokenPayload = { sub: userId };

    // Buat mock Request object
    const mockRequest = {
      get: jest.fn((headerName: string) => {
        if (headerName.toLowerCase() === 'authorization') {
          return `Bearer ${refreshToken}`;
        }
        return undefined;
      }),
    } as unknown as Request; // Type assertion untuk simplicity

    it('should extract refresh token from header and return with payload', () => {
      const result = strategy.validate(mockRequest, payload);

      // Ekspektasi: Hasil berisi payload asli DAN refreshToken yang diekstrak
      expect(result).toEqual({
        ...payload,
        refreshToken: refreshToken,
      });
      // Verifikasi req.get dipanggil untuk 'authorization'
      expect(mockRequest.get).toHaveBeenCalledWith('authorization');
    });

    it('should throw error if authorization header is missing', () => {
      // Buat mock Request tanpa header authorization
      const requestWithoutHeader = {
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as Request;

      // Ekspektasi: Melempar error saat validate dipanggil
      // Bungkus pemanggilan dalam arrow function untuk linter
      expect(() => strategy.validate(requestWithoutHeader, payload)).toThrow(
        'Authorization header not found',
      );
    });
  });
});
