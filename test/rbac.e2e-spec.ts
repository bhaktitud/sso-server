// test/rbac.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest'; // Import supertest
import { AppModule } from './../src/app.module'; // Import AppModule utama
import { PrismaService } from './../src/prisma/prisma.service'; // Untuk setup/cleanup data jika perlu
import { CreateRoleDto } from './../src/rbac/dto/create-role.dto';
import { CreatePermissionDto } from './../src/rbac/dto/create-permission.dto';
import { UserType } from '../generated/mysql';
import * as bcrypt from 'bcrypt';

describe('RBACController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService; // Opsional: untuk interaksi DB langsung
  let adminToken: string; // Untuk menyimpan token admin yang valid
  let createdRoleId: number; // Untuk menyimpan ID role yang dibuat
  let createdPermissionId: number; // Untuk menyimpan ID permission yang dibuat

  // --- Konfigurasi Pengguna Admin Pengujian ---
  // Ganti dengan kredensial admin yang ADA di database pengujian Anda
  const TEST_ADMIN_EMAIL = 'test-admin-e2e@example.com';
  const TEST_ADMIN_PASSWORD = 'PasswordE2E123'; // Ganti dengan password yang benar

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Import AppModule utama
    }).compile();

    app = moduleFixture.createNestApplication();
    // Terapkan ValidationPipe secara global seperti di main.ts
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService); // Dapatkan instance Prisma

    // Memastikan user admin tersedia untuk testing
    try {
      // Cek apakah admin sudah ada
      const adminUser = await prisma.mysql.user.findUnique({
        where: { email: TEST_ADMIN_EMAIL },
      });

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(TEST_ADMIN_PASSWORD, saltRounds);

      let userId: number;

      // Jika tidak ada, buat admin baru
      if (!adminUser) {
        const newAdmin = await prisma.mysql.user.create({
          data: {
            email: TEST_ADMIN_EMAIL,
            password: hashedPassword,
            userType: UserType.ADMIN_USER,
            isEmailVerified: true,
            name: 'E2E Test Admin',
          },
        });
        userId = newAdmin.id;
        console.log('Created admin user for E2E tests');
      } else {
        // Update password untuk memastikan sesuai dengan yang digunakan di test
        await prisma.mysql.user.update({
          where: { id: adminUser.id },
          data: { password: hashedPassword },
        });
        console.log('Updated admin user password');
        userId = adminUser.id;
      }

      // Periksa apakah AdminProfile sudah ada
      const adminProfile = await prisma.mysql.adminProfile.findUnique({
        where: { userId: userId },
      });

      // Jika tidak ada, buat AdminProfile
      if (!adminProfile) {
        await prisma.mysql.adminProfile.create({
          data: {
            userId: userId,
            name: 'E2E Test Admin Profile',
          },
        });
        console.log('Created admin profile for E2E tests');
      }

      // Buat role admin jika belum ada
      const adminRole = await prisma.mysql.role.findUnique({
        where: { name: 'Admin' },
      });

      let roleId: number;
      if (!adminRole) {
        const newRole = await prisma.mysql.role.create({
          data: {
            name: 'Admin',
            description: 'Administrator role with full access',
          },
        });
        roleId = newRole.id;
        console.log('Created admin role for E2E tests');
      } else {
        roleId = adminRole.id;
      }

      // Tambahkan role ke admin profile
      await prisma.mysql.adminProfile.update({
        where: { userId: userId },
        data: {
          roles: {
            connect: { id: roleId },
          },
        },
      });
      console.log('Assigned admin role to admin profile');

    } catch (error) {
      console.error('Failed to prepare admin user', error);
    }

    // --- Login Admin untuk Mendapatkan Token ---
    try {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/admin/login')
        .send({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD })
        .expect(200); // Harapkan login sukses

      adminToken = loginResponse.body.access_token;
      if (!adminToken) {
        throw new Error('Failed to retrieve admin token during login.');
      }
      console.log('Admin token obtained for E2E tests.');
    } catch (error) {
      console.error(
        `FATAL: Could not log in admin user (${TEST_ADMIN_EMAIL}) for E2E tests. Ensure the user exists and credentials are correct.`,
        error,
      );
      // Hentikan tes jika login gagal
      throw new Error('Admin login failed, cannot proceed with E2E tests.');
    }

    // --- Opsional: Setup Data Awal ---
    try {
      // Membuat beberapa permission dasar jika belum ada
      const basicPermissions = [
        { action: 'read', subject: 'role' },
        { action: 'create', subject: 'role' },
        { action: 'update', subject: 'role' },
        { action: 'delete', subject: 'role' },
        { action: 'read', subject: 'permission' },
        { action: 'create', subject: 'permission' },
        { action: 'update', subject: 'permission' },
        { action: 'delete', subject: 'permission' },
        { action: 'assign', subject: 'permission:role' },
        { action: 'remove', subject: 'permission:role' },
      ];
      
      // Membuat semua permission dasar
      for (const perm of basicPermissions) {
        const existingPerm = await prisma.mysql.permission.findFirst({
          where: { 
            action: perm.action,
            subject: perm.subject
          }
        });
        
        if (!existingPerm) {
          await prisma.mysql.permission.create({
            data: perm
          });
          console.log(`Created permission: ${perm.action}:${perm.subject}`);
        }
      }

      // Dapatkan adminRole dan semua permission
      const adminRole = await prisma.mysql.role.findUnique({
        where: { name: 'Admin' },
      });
      
      if (adminRole) {
        const allPermissions = await prisma.mysql.permission.findMany();
        
        // Assign semua permission ke admin role
        await prisma.mysql.role.update({
          where: { id: adminRole.id },
          data: {
            permissions: {
              connect: allPermissions.map(p => ({ id: p.id }))
            }
          }
        });
        
        console.log('Assigned all permissions to Admin role');
      }
    } catch (error) {
      console.error('Failed initial permission setup', error);
    }
  });

  afterAll(async () => {
    // --- Opsional: Cleanup Data ---
    try {
      if (createdRoleId) {
        await prisma.mysql.role.deleteMany({ where: { id: createdRoleId } });
      }
      if (createdPermissionId) {
        await prisma.mysql.permission.deleteMany({
          where: { id: createdPermissionId },
        });
      }
      // Hapus data lain...
    } catch (error) {
      console.error('Cleanup failed:', error);
    }

    await app.close(); // Tutup aplikasi NestJS
  });

  // --- Test Suite untuk Roles ---
  describe('/rbac/roles', () => {
    it('POST /roles - Should create a new role (requires create:role permission)', () => {
      const dto: CreateRoleDto = {
        name: 'E2E Test Role',
        description: 'Created by E2E test',
      };
      return request(app.getHttpServer())
        .post('/rbac/roles')
        .set('Authorization', `Bearer ${adminToken}`) // Sertakan token
        .send(dto)
        .expect(201) // Harapkan CREATED
        .then((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toEqual(dto.name);
          createdRoleId = res.body.id; // Simpan ID untuk cleanup/tes lain
        });
    });

    it('POST /roles - Should fail without token', () => {
      const dto: CreateRoleDto = { name: 'E2E No Token Role' };
      return request(app.getHttpServer())
        .post('/rbac/roles')
        .send(dto)
        .expect(401); // Harapkan UNAUTHORIZED
    });

    // TODO: Tambahkan tes untuk kasus permission tidak cukup (jika Anda punya token dengan izin terbatas)

    it('GET /roles - Should get all roles (requires read:role permission)', () => {
      return request(app.getHttpServer())
        .get('/rbac/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // Harapkan setidaknya role yang baru dibuat ada di daftar
          expect(res.body.some((role: any) => role.id === createdRoleId)).toBe(
            true,
          );
        });
    });

    it('GET /roles/:id - Should get a specific role (requires read:role permission)', () => {
      if (!createdRoleId)
        throw new Error('Cannot run test: createdRoleId not set');
      return request(app.getHttpServer())
        .get(`/rbac/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body.id).toEqual(createdRoleId);
          expect(res.body.name).toEqual('E2E Test Role');
        });
    });

    // TODO: Tambahkan tes untuk GET /roles/:id dengan ID tidak valid (harapkan 404)
    // TODO: Tambahkan tes untuk PATCH /roles/:id
    // TODO: Tambahkan tes untuk DELETE /roles/:id
  });

  // --- Test Suite untuk Permissions ---
  describe('/rbac/permissions', () => {
    it('POST /permissions - Should create a new permission (requires create:permission)', () => {
      const dto: CreatePermissionDto = {
        action: 'testAction',
        subject: 'testSubject',
      };
      return request(app.getHttpServer())
        .post('/rbac/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dto)
        .expect(201)
        .then((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.action).toEqual(dto.action);
          expect(res.body.subject).toEqual(dto.subject);
          createdPermissionId = res.body.id;
        });
    });

    it('GET /permissions - Should get all permissions (requires read:permission)', () => {
      return request(app.getHttpServer())
        .get('/rbac/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.some((p: any) => p.id === createdPermissionId)).toBe(
            true,
          );
        });
    });
    // TODO: Tambahkan tes CRUD lainnya untuk permissions
  });

  // --- Test Suite untuk Role-Permission Assignment ---
  describe('/rbac/roles/:roleId/permissions/:permissionId', () => {
    it('POST - Should assign a permission to a role (requires assign:permission:role)', () => {
      if (!createdRoleId || !createdPermissionId)
        throw new Error('Cannot run test: role/permission ID not set');
      return request(app.getHttpServer())
        .post(`/rbac/roles/${createdRoleId}/permissions/${createdPermissionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200) // Atau 201 jika Anda memilih itu
        .then((res) => {
          // Verifikasi bahwa role sekarang memiliki permission (mungkin perlu GET lagi)
          expect(res.body).toHaveProperty('id', createdRoleId);
          // Anda mungkin perlu include permissions di response assign agar lebih mudah diverifikasi
        });
    });

    it('GET /roles/:roleId/permissions - Should retrieve permissions for a role', async () => {
      if (!createdRoleId || !createdPermissionId)
        throw new Error('Cannot run test: role/permission ID not set');
      // Pastikan permission sudah di-assign (dari tes sebelumnya atau assign di sini)
      await request(app.getHttpServer())
        .post(`/rbac/roles/${createdRoleId}/permissions/${createdPermissionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      return request(app.getHttpServer())
        .get(`/rbac/roles/${createdRoleId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.some((p: any) => p.id === createdPermissionId)).toBe(
            true,
          );
        });
    });

    it('DELETE - Should remove a permission from a role (requires remove:permission:role)', () => {
      if (!createdRoleId || !createdPermissionId)
        throw new Error('Cannot run test: role/permission ID not set');
      return request(app.getHttpServer())
        .delete(
          `/rbac/roles/${createdRoleId}/permissions/${createdPermissionId}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200) // Atau 204
        .then(async () => {
          // Verifikasi bahwa permission sudah tidak ada lagi untuk role tersebut
          const getRes = await request(app.getHttpServer())
            .get(`/rbac/roles/${createdRoleId}/permissions`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
          expect(
            getRes.body.some((p: any) => p.id === createdPermissionId),
          ).toBe(false);
        });
    });
    // TODO: Tambahkan tes untuk kasus error (misal ID tidak valid)
  });
});
