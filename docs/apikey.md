# API Key Management

## Penjelasan Umum

API Key digunakan sebagai mekanisme otentikasi untuk memberi akses ke API dari aplikasi eksternal. Setiap API Key terhubung dengan satu perusahaan dan dapat digunakan untuk mengakses API pada behalf perusahaan tersebut.

## Pembatasan

### Jumlah Maksimum API Key

Setiap perusahaan dibatasi maksimum **3 API Key** yang dapat aktif secara bersamaan. Batasan ini diterapkan untuk alasan:

1. Keamanan - Membatasi jumlah API Key mengurangi permukaan serangan potensial
2. Pengelolaan yang lebih baik - Dengan jumlah terbatas, pengelolaan dan pemantauan API Key menjadi lebih mudah
3. Penggunaan yang terorganisir - Mendorong penggunaan yang terstruktur (misalnya, satu untuk pengembangan, satu untuk pengujian, dan satu untuk produksi)

Jika perusahaan sudah memiliki 3 API Key dan ingin membuat yang baru, mereka harus terlebih dahulu menghapus salah satu API Key yang ada.

## Manajemen API Key

### Membuat API Key

Untuk membuat API Key baru, Anda perlu:

1. Memastikan perusahaan belum memiliki 3 API Key aktif
2. Menentukan nama untuk API Key (misalnya "Production", "Development", dll.)
3. Secara opsional, memberikan deskripsi dan tanggal kedaluwarsa

### Mencabut API Key

API Key dapat dicabut dengan menghapusnya dari sistem. Hal ini akan segera mencegah API Key tersebut dapat digunakan untuk otentikasi.

### Mengelola API Key yang Ada

API Key yang ada dapat diperbarui untuk:
- Mengubah nama atau deskripsi
- Mengaktifkan atau menonaktifkan API Key tanpa menghapusnya
- Menetapkan atau memperbarui tanggal kedaluwarsa

## Penggunaan API Key

API Key digunakan dengan menyertakannya dalam header HTTP pada permintaan API:

```
X-API-KEY: your-api-key-here
```

Semua akses API yang menggunakan API Key dicatat dan dapat dilihat di dashboard admin.

## Sistem Pelacakan dan Analitik

Sistem ini menyediakan pelacakan komprehensif untuk semua penggunaan API Key, memungkinkan pemantauan dan analisis yang mendalam tentang bagaimana API digunakan.

### Informasi yang Dilacak

Untuk setiap permintaan API, sistem mencatat:

1. **Informasi Dasar**:
   - Endpoint yang diakses
   - Metode HTTP (GET, POST, PUT, DELETE, dll.)
   - Status code respons
   - Waktu permintaan

2. **Informasi Performa**:
   - Waktu respons (dalam milidetik)
   - Sampel body permintaan dan respons

3. **Informasi Client**:
   - IP address
   - User agent

4. **Informasi Konteks**:
   - API Key yang digunakan (dengan referensi ke perusahaan)
   - Perusahaan terkait

### Fitur Analitik

Sistem menyediakan beberapa endpoint untuk menganalisis data penggunaan API:

1. **Pencarian Log dengan Filter**:
   - Filter berdasarkan perusahaan, endpoint, metode, atau status
   - Filter berdasarkan rentang waktu
   - Filter berdasarkan IP address

2. **Statistik Penggunaan API**:
   - Total permintaan dalam periode waktu
   - Tingkat keberhasilan (persentase permintaan yang berhasil)
   - Distribusi status code (sukses, error client, error server)
   - Waktu respons rata-rata
   - Endpoint yang paling sering diakses

3. **Peringatan dan Notifikasi** (direncanakan):
   - Pemberitahuan untuk pola penggunaan tidak biasa
   - Peringatan ketika tingkat error tinggi
   - Notifikasi tentang kemungkinan upaya pelanggaran keamanan

### Mengakses Analitik

Data analitik dapat diakses melalui beberapa endpoint API:

- `/api-keys/logs/search` - Mencari log API dengan berbagai filter
- `/api-keys/stats` - Mendapatkan statistik umum penggunaan API
- `/api-keys/company/{companyId}/stats` - Mendapatkan statistik untuk perusahaan tertentu

## Praktik Terbaik Keamanan

1. Perlakukan API Key seperti kata sandi - jangan pernah membagikannya di tempat umum
2. Rotasi API Key secara berkala untuk keamanan yang lebih baik
3. Gunakan API Key yang berbeda untuk lingkungan yang berbeda
4. Tetapkan tanggal kedaluwarsa untuk API Key ketika memungkinkan
5. Pantau log penggunaan API secara teratur untuk mendeteksi aktivitas yang mencurigakan 