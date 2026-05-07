# Backend — Sistem Pelaporan Pengaduan Masyarakat

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express JS
- **Database**: MySQL
- **Auth**: JWT (JSON Web Token)
- **Upload**: Multer

---

## Struktur Folder

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Koneksi MySQL
│   ├── middleware/
│   │   ├── auth.js              # Verifikasi JWT
│   │   ├── role.js              # Cek role pengguna
│   │   └── upload.js            # Konfigurasi Multer
│   ├── controllers/
│   │   ├── authController.js    # Login & Register
│   │   ├── laporanController.js # CRUD Laporan
│   │   ├── commentController.js # CRUD Komentar
│   │   ├── userController.js    # CRUD User (super admin)
│   │   └── categoryController.js# CRUD Kategori
│   ├── routes/
│   │   ├── auth.js
│   │   ├── laporan.js
│   │   ├── comment.js
│   │   ├── user.js
│   │   └── category.js
│   ├── uploads/                 # Folder gambar laporan
│   └── app.js                   # Entry point
├── database.sql                 # Schema + seed data
├── .env.example
└── package.json
```

---

## Cara Menjalankan

### 1. Install dependensi
```bash
npm install
```

### 2. Buat file `.env`
```bash
cp .env.example .env
# Lalu isi sesuai konfigurasi database kamu
```

### 3. Import database
```bash
mysql -u root -p < database.sql
```

### 4. Jalankan server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server berjalan di: `http://localhost:3000`

---

## Daftar Endpoint API

### 🔐 Auth
| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Daftar akun baru | ❌ |
| POST | `/api/auth/login` | Login & dapat token | ❌ |
| GET  | `/api/auth/profile` | Lihat profil sendiri | ✅ |

### 📋 Laporan
| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET    | `/api/laporan` | Lihat semua laporan | user+ |
| GET    | `/api/laporan/:id` | Detail laporan | user+ |
| POST   | `/api/laporan` | Buat laporan baru | user+ |
| PUT    | `/api/laporan/:id` | Edit laporan | owner/admin |
| PATCH  | `/api/laporan/:id/status` | Ubah status | admin+ |
| DELETE | `/api/laporan/:id` | Hapus laporan | owner/admin |

### 💬 Komentar
| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET    | `/api/comments/laporan/:laporanId` | Lihat komentar | user+ |
| POST   | `/api/comments` | Tambah komentar | user+ |
| DELETE | `/api/comments/:id` | Hapus komentar | owner/admin |

### 👥 User (Super Admin Only)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET    | `/api/users` | Lihat semua user |
| GET    | `/api/users/:id` | Detail user |
| POST   | `/api/users` | Buat user baru |
| PUT    | `/api/users/:id` | Edit user |
| DELETE | `/api/users/:id` | Hapus user |

### 🏷️ Kategori
| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET    | `/api/categories` | Lihat semua kategori | user+ |
| POST   | `/api/categories` | Tambah kategori | admin+ |
| PUT    | `/api/categories/:id` | Edit kategori | admin+ |
| DELETE | `/api/categories/:id` | Hapus kategori | admin+ |

---

## Cara Kirim Token (Authorization)
Tambahkan header berikut di setiap request yang butuh autentikasi:
```
Authorization: Bearer <token_dari_login>
```

---

## Default Akun (Seed)
| Email | Password | Role |
|-------|----------|------|
| superadmin@pengaduan.com | admin123 | super_admin |
| admin@pengaduan.com | admin123 | admin |