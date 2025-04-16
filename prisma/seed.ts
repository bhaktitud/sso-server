import { PrismaClient, Prisma, Role, Permission } from '../generated/mysql'; // Ubah path impor

const prisma = new PrismaClient();

// --- Definisikan Data Seed ---

// Izin yang tersedia
const permissionsToSeed: Prisma.PermissionCreateInput[] = [
  // Customer Management
  { code: 'VIEW_CUSTOMER_LIST', description: 'View list of customers' },
  { code: 'VIEW_CUSTOMER_DETAIL', description: 'View details of a customer' },
  { code: 'CREATE_CUSTOMER', description: 'Create a new customer' },
  { code: 'EDIT_CUSTOMER', description: 'Edit customer information' },
  { code: 'DELETE_CUSTOMER', description: 'Delete a customer' },

  // Order Management
  { code: 'VIEW_ORDER_LIST', description: 'View list of orders' },
  { code: 'VIEW_ORDER_DETAIL', description: 'View details of an order' },
  { code: 'EDIT_ORDER_STATUS', description: 'Edit the status of an order' },

  // Company/Tenant Management (untuk SUPER_ADMIN jika ada)
  // { code: 'MANAGE_COMPANIES', description: 'Manage partner companies' },

  // User Management (Admin Panel Users within a company)
  {
    code: 'MANAGE_COMPANY_USERS',
    description: 'Manage admin panel users within own company',
  },
  {
    code: 'MANAGE_COMPANY_ROLES',
    description: 'Manage admin panel roles within own company',
  },
];

// Peran yang tersedia dan izin defaultnya
const rolesToSeed = [
  {
    name: 'CUSTOMER',
    description: 'Default role for application end-users',
    permissions: [], // Customer biasanya tidak punya izin di admin panel
  },
  {
    name: 'COMPANY_ADMIN',
    description: 'Administrator for a specific company',
    permissions: [
      // Berikan hampir semua izin terkait operasional perusahaan
      'VIEW_CUSTOMER_LIST',
      'VIEW_CUSTOMER_DETAIL',
      'CREATE_CUSTOMER',
      'EDIT_CUSTOMER',
      // 'DELETE_CUSTOMER', // Mungkin tidak semua admin boleh delete? Sesuaikan.
      'VIEW_ORDER_LIST',
      'VIEW_ORDER_DETAIL',
      'EDIT_ORDER_STATUS',
      'MANAGE_COMPANY_USERS', // Bisa kelola user di perusahaannya
      'MANAGE_COMPANY_ROLES', // Bisa kelola peran di perusahaannya
    ],
  },
  {
    name: 'MARKETING_STAFF',
    description: 'Marketing staff for a specific company',
    permissions: [
      'VIEW_CUSTOMER_LIST', // Hanya lihat customer
      'VIEW_ORDER_LIST', // Hanya lihat order
    ],
  },
  // Tambahkan peran lain jika perlu, misal SUPER_ADMIN dengan semua izin
];

// --- Fungsi Seeding ---

async function main() {
  console.log(`Start seeding ...`);

  // 1. Seed Permissions (gunakan upsert agar idempotent)
  console.log('Seeding permissions...');
  for (const p of permissionsToSeed) {
    const permission = await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description }, // Update deskripsi jika sudah ada
      create: p,
    });
    console.log(`Created/Updated permission with code: ${permission.code}`);
  }
  console.log('Permissions seeding finished.');

  // 2. Seed Roles and connect Permissions (gunakan upsert agar idempotent)
  console.log('Seeding roles and connecting permissions...');
  for (const r of rolesToSeed) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {
        description: r.description,
        // Hapus koneksi lama dan buat koneksi baru (cara aman untuk update)
        permissions: {
          set: [], // Hapus semua koneksi permission dulu
          connect: r.permissions.map((permissionCode) => ({
            code: permissionCode, // Hubungkan berdasarkan 'code' unik permission
          })),
        },
      },
      create: {
        name: r.name,
        description: r.description,
        permissions: {
          connect: r.permissions.map((permissionCode) => ({
            code: permissionCode,
          })),
        },
      },
      // Include permissions untuk logging (opsional)
      // include: { permissions: true }
    });
    console.log(
      `Created/Updated role "${role.name}" with ${r.permissions.length} permissions connected.`,
    );
  }
  console.log('Roles seeding finished.');

  console.log(`Seeding finished.`);
}

// --- Eksekusi Seeding ---

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
