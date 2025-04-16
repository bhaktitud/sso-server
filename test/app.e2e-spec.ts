import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserMysql } from '../generated/mysql';
import { MailService } from '../src/mail/mail.service';

// Definisikan tipe untuk response body
type RegisterResponse = Omit<UserMysql, 'password' | 'roleId' | 'companyId'>;
// Pastikan tipe Tokens diekspor atau didefinisikan di sini jika digunakan secara luas
// Atau gunakan inline type jika hanya di sini
type Tokens = { access_token: string; refresh_token: string };
interface ProfileResponse {
  userId: number;
  email: string;
  name?: string | null;
  role: string;
  companyId?: number | null;
}

// --- Mock Mail Service ---
// Objek untuk menyimpan token yang "dikirim"
const mailTestData: { verificationToken: string | null } = {
  verificationToken: null,
};
const mockMailService = {
  // Implementasi mock untuk metode yang dipanggil oleh AuthService
  sendVerificationEmail: jest
    .fn()
    .mockImplementation(async (to, name, token) => {
      console.log(
        `---> MOCK sending verification email to ${to} with token ${token}`,
      );
      mailTestData.verificationToken = token; // Simpan token untuk tes
      return Promise.resolve();
    }),
  // Tambahkan mock untuk metode lain jika dipanggil dalam alur lain yg diuji
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};

describe('AppController & AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdUser: RegisterResponse;
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123',
    name: 'Test User E2E',
  };
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Override MailService SEBELUM compile
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .compile();

    app = moduleFixture.createNestApplication();
    // Terapkan ValidationPipe secara global (penting untuk tes validasi DTO)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await prisma.onModuleInit();
    await prisma.mysql.userMysql.deleteMany({
      where: { email: testUser.email },
    });
  });

  afterAll(async () => {
    await prisma.mysql.userMysql.deleteMany({
      where: { email: testUser.email },
    });
    await prisma.mysql.$disconnect();
    await prisma.mongo.$disconnect();
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('/auth', () => {
    it('POST /register - should register user but require verification', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.message).toEqual(
        'User registered successfully. Please check your email for verification.',
      );
      // Verifikasi bahwa mock mail service dipanggil
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalled();
      expect(mailTestData.verificationToken).toBeDefined(); // Token harusnya sudah disimpan
      expect(mailTestData.verificationToken).not.toBeNull(); // Lebih eksplisit

      // Ambil user dari DB dengan menyertakan relasi role
      const dbUser = await prisma.mysql.userMysql.findUnique({
        where: { email: testUser.email },
        include: { role: true },
      });
      expect(dbUser).toBeDefined();
      if (!dbUser) throw new Error('User not found after registration');
      expect(dbUser.isEmailVerified).toBe(false);
      createdUser = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
      } as unknown as RegisterResponse;
    });

    it('POST /register - should fail if email already exists', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('POST /login - should fail with incorrect password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('POST /login - should fail with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nosuchuser@example.com', password: testUser.password })
        .expect(401);
    });

    it('POST /login - should fail if email is not verified', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Akun belum diverifikasi');
        });
    });

    it('GET /verify-email/:token - should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/verify-email/invalidtoken123')
        .expect(400);
    });

    it('GET /verify-email/:token - should verify email successfully', () => {
      expect(mailTestData.verificationToken).toBeDefined();
      expect(mailTestData.verificationToken).not.toBeNull();
      // Pastikan token tidak null sebelum digunakan
      const tokenToVerify = mailTestData.verificationToken as string;
      return request(app.getHttpServer())
        .get(`/auth/verify-email/${tokenToVerify}`)
        .expect(200)
        .expect({ message: 'Email berhasil diverifikasi.' });
    });

    it('GET /verify-email/:token - should fail if token already used', () => {
      expect(mailTestData.verificationToken).toBeDefined();
      expect(mailTestData.verificationToken).not.toBeNull();
      const tokenToVerify = mailTestData.verificationToken as string;
      return request(app.getHttpServer())
        .get(`/auth/verify-email/${tokenToVerify}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Token verifikasi tidak valid atau sudah digunakan',
          );
        });
    });

    it('POST /login - should login successfully after email verification', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      const body = response.body as Tokens;
      expect(body.access_token).toBeDefined();
      expect(body.refresh_token).toBeDefined();
      accessToken = body.access_token;
      refreshToken = body.refresh_token;
    });

    it('GET /profile - should return user profile with role', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as ProfileResponse;
      expect(body).toBeDefined();
      expect(body.userId).toBeDefined();
      expect(body.email).toEqual(testUser.email);
      expect(body.role).toEqual('CUSTOMER');
    });

    it('GET /admin-only - should forbid access for default CUSTOMER role', () => {
      return request(app.getHttpServer())
        .get('/auth/admin-only')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('POST /refresh - should fail without refresh token', () => {
      return request(app.getHttpServer()).post('/auth/refresh').expect(401);
    });

    it('POST /refresh - should fail with invalid (non-bearer) refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', refreshToken)
        .expect(401);
    });

    it('POST /refresh - should fail with invalid (bearer) refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalidtokenstring')
        .expect(401);
    });

    it('POST /refresh - should successfully refresh tokens', async () => {
      // Simpan token lama sebelum refresh
      const oldAccessToken = accessToken;
      const oldRefreshToken = refreshToken;

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${oldRefreshToken}`) // Gunakan refresh token lama
        .expect(200);

      const body = response.body as Tokens;
      expect(body).toBeDefined();
      expect(body.access_token).toBeDefined();
      expect(body.refresh_token).toBeDefined();
      // Bandingkan token baru dengan token LAMA
      expect(body.access_token).not.toEqual(oldAccessToken);
      expect(body.refresh_token).not.toEqual(oldRefreshToken);

      // Update token untuk test selanjutnya
      accessToken = body.access_token;
      refreshToken = body.refresh_token;
    });

    it('POST /logout - should fail without access token', () => {
      return request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('POST /logout - should successfully logout user', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect({ message: 'Logged out successfully' });
    });

    it('POST /refresh - should fail after logout', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(403);
    });
  });
});
