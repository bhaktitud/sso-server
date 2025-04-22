# Sistem Otorisasi dan Izin

## Struktur Izin

Sistem ini menggunakan pendekatan berbasis izin (permissions) untuk mengatur akses pengguna ke berbagai bagian aplikasi. Otorisasi dikelola melalui kombinasi peran (roles) yang ditetapkan ke profil admin, dan izin (permissions) yang diberikan ke peran tersebut.

### Format Izin

Izin diformat sebagai string dengan pola berikut: `action:resource`

Contoh:
- `create:user` - Izin untuk membuat pengguna baru
- `read:company` - Izin untuk melihat data perusahaan
- `update:feature` - Izin untuk memperbarui fitur
- `delete:apikey` - Izin untuk menghapus API key

### Superuser (Izin `manage:all`)

Pengguna admin yang memiliki peran dengan izin `manage:all` dianggap sebagai "superuser" dan memiliki akses penuh ke seluruh sistem. Izin ini akan melewati semua pemeriksaan izin lainnya, sehingga pengguna dapat mengakses semua endpoint API tanpa batasan.

Penggunaan izin `manage:all` harus diberikan dengan sangat hati-hati dan hanya kepada administrator tingkat tertinggi.

## Implementasi

### Decorator RequirePermissions

Untuk mengamankan endpoint API, gunakan decorator `@RequirePermissions` di controller:

```typescript
@Post()
@RequirePermissions('create:feature')
createFeature(@Body() createFeatureDto: CreateFeatureDto): Promise<Feature> {
  return this.featureService.create(createFeatureDto);
}
```

Decorator ini dapat menerima lebih dari satu izin jika diperlukan:

```typescript
@Delete(':id')
@RequirePermissions('delete:feature', 'manage:features')
async removeFeature(@Param('id', ParseIntPipe) id: number): Promise<void> {
  await this.featureService.remove(id);
}
```

### Guards

Sistem otorisasi menggunakan dua guard utama:

1. **JwtAuthGuard** - Memverifikasi token JWT dan menyediakan objek pengguna.
2. **PermissionsGuard** - Memeriksa izin yang diperlukan berdasarkan metadata yang ditetapkan oleh decorator `@RequirePermissions`.

Guard ini biasanya diterapkan secara global atau di tingkat controller, sehingga tidak perlu ditambahkan di setiap handler.

## Fitur Sistem

Fitur sistem adalah fungsi atau kemampuan tertentu dalam aplikasi. Fitur-fitur ini didefinisikan dalam tabel `Feature` dan dapat ditetapkan ke profil admin melalui relasi many-to-many.

Meskipun fitur dan izin adalah konsep yang berbeda, fitur dapat dibatasi dengan izin yang sesuai untuk mengendalikan akses.

### Pengelolaan Fitur

Fitur dapat ditambahkan, diperbarui, atau dihapus melalui endpoint API khusus (`/features`). Untuk mengakses endpoint ini, pengguna harus memiliki izin yang sesuai atau izin `manage:all`.

## Contoh Kasus Penggunaan

1. **Administrator Sistem** - Diberikan izin `manage:all` untuk akses penuh ke seluruh sistem.
2. **Manajer Perusahaan** - Diberikan izin untuk mengelola perusahaan dan pengguna tetapi tidak dapat mengakses pengaturan sistem.
3. **Staf Layanan Pelanggan** - Diberikan akses hanya-baca ke data pelanggan dan perusahaan.

## Praktik Terbaik

1. Selalu terapkan izin di tingkat endpoint API, bahkan untuk fitur internal.
2. Batasi penggunaan izin `manage:all` hanya untuk admin tingkat tertinggi.
3. Gunakan kombinasi peran dan izin untuk fleksibilitas maksimum. 