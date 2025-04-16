import * as path from 'path';

// Memastikan variabel lingkungan ada (opsional tapi bagus)
if (!process.env.JWT_REFRESH_TOKEN_SECRET) {
  throw new Error('Missing JWT_REFRESH_TOKEN_SECRET in .env file');
}

export const jwtConstants = {
  // Access Token (RS256)
  access: {
    privateKeyPath: path.join(__dirname, '../../keys/private.pem'),
    publicKeyPath: path.join(__dirname, '../../keys/public.pem'),
    expiresIn: '60m', // Waktu kedaluwarsa access token (misalnya, 60 menit)
    algorithm: 'RS256' as const,
  },
  // Refresh Token (HS256)
  refresh: {
    secret: process.env.JWT_REFRESH_TOKEN_SECRET, // Secret dari .env
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME || '7d', // Expire dari .env atau default 7 hari
    algorithm: 'HS256' as const,
  },
};
