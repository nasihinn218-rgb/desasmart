# DesaSmart — Platform Pelayanan Publik & SKTM Digital Terintegrasi AI Berbasis QR Code
### Tugas Proyek Akhir Mandiri Mata Kuliah Rekayasa Perangkat Lunak (TIKB2503021)
**Program Studi S1 Teknik Informatika — STMIK IKMI Cirebon (Semester 3)**  
**Dosen Pengampu: Yudhistira Arie Wijaya, M.Kom., CDS.**

---

## 📌 Identitas Mahasiswa & Pengembang
- **Nama Mahasiswa**: Nasihin
- **NIM**: 41257143
- **Kelas / Kelompok**: 1B 2025 (DEVLIN)
- **Tema Topik Kelompok**: *Smart Public Service & Public Health Intelligence (Layanan Administrasi Desa Cerdas Berbasis AI)*
- **Nama Sistem**: **DesaSmart Desa Silihasih**

---

## 📺 Tautan Video Presentasi Progres & Demo Final
Sesuai panduan rubrik penilaian OBE STMIK IKMI Cirebon (video mandatori dengan webcam/wajah di pojok, resolusi ≥ 720p/1080p, dan audio jelas):

| Tahapan Video | Durasi Acuan | Fokus Konten | Tautan Video (YouTube / GDrive) |
| :--- | :--- | :--- | :--- |
| **Video 1 (Progres 1)** | 3 – 5 Menit | Latar Belakang Masalah, Urgensi Solusi, User Stories, PRD/SRS Mandiri (IEEE 830), dan Kebutuhan Non-Fungsional | [Link Video 1](https://youtu.be/placeholder-video-1) |
| **Video 2 (Progres 2)** | 5 – 7 Menit | Arsitektur Sistem (Use Case, Activity, Class, Sequence Diagram), ERD Database 17 Tabel, & Live Demo Prototipe Interaktif Figma | [Link Video 2](https://youtu.be/placeholder-video-2) |
| **Video Final (Demo Akhir)** | 8 – 12 Menit | End-to-End Live Walkthrough (4 Peran Pengguna), Fitur AI OCR & Contextual Assistant, Validasi TTE QR Code, dan Hasil Automated Testing | [Link Video Final](https://youtu.be/placeholder-video-final) |

---

## 🎨 Prototipe Interaktif UI/UX (Figma)
- **Tautan Figma Live Prototype**: [DesaSmart Interactive Figma Prototype](https://www.figma.com/design/Ee6uIT2jdObNWwX8PZ3KqX)
- **Frame Utama Desain**:
  1. `00_Cover`: Cover & Spesifikasi Identitas Proyek Akademik STMIK IKMI Cirebon
  2. `01_Design_Tokens`: Sistem Warna, Tipografi, Radius, dan Status Chips
  3. `02_Landing`: Halaman Publik dengan Hero Section, FAQ, dan Alur Layanan
  4. `03_Dashboard_Staf`: Loket Pemeriksaan Berkas Tahap Pertama Staf Loket
  5. `04_Dashboard_Masyarakat`: Formulir Pengajuan SKTM, OCR KTP/KK, & Pelacakan
  6. `05_Dashboard_KepalaDesa`: Meja Kerja Persetujuan & Penandatanganan Elektronik (TTE) Kuwu
  7. `06_Cek_Keaslian_SKTM`: Verifikasi Publik Dokumen Sah via Pemindaian QR Code SHA-256
- **Smart Animate Floating Navigator**: Tersedia pada setiap frame untuk navigasi interaktif instan.

---

## 🌟 Ringkasan Sistem & Arsitektur Fitur AI
**DesaSmart** adalah solusi transformasi digital birokrasi desa di Desa Silihasih, Kecamatan Pabedilan, Kabupaten Cirebon. Sistem memangkas birokrasi pengurusan Surat Keterangan Tidak Mampu (SKTM) dari 2–3 hari tatap muka menjadi hitungan menit dengan keamanan kriptografi dan kecerdasan buatan.

### ✨ 4 Peran Aktor (Role-Based Access Control):
1. **Masyarakat / Pemohon**: Mengajukan SKTM, upload KTP/KK, auto-ekstraksi formulir via OCR, dan memantau status secara *real-time*.
2. **Staf Pelayanan Desa (Loket)**: Memeriksa kelengkapan fisik berkas, skor kelengkapan AI, dan meneruskan/mengembalikan pengajuan.
3. **Superadmin / Kasi Pelayanan**: Memvalidasi data sosial ekonomi, verifikasi kelayakan bantuan, dan tata kelola master data.
4. **Kepala Desa (Kuwu)**: Memberikan persetujuan akhir dan menandatangani dokumen secara digital (TTE ber-QR Code dengan tanda tangan SHA-256).

### 🤖 Fitur AI Unggulan:
1. **AI OCR & Document Intelligence**: Ekstraksi otomatis NIK, Nama, dan Nomor KK dari foto identitas untuk mencegah salah ketik.
2. **DesaSmart AI Real-Time Assistant**: Chatbot asisten kontekstual terintegrasi database desa (mengetahui data demografi 12 RT, 5 RW, 3 Dusun, pejabat desa, status antrean, dan panduan SKTM).
3. **TTE Digital & Verifikasi Keaslian QR Code**: Penerbitan berkas PDF SKTM berstempel digital dengan cryptographic hash SHA-256 yang dapat diverifikasi publik tanpa login di `/verify`.

---

## 🛠️ Panduan Instalasi & Eksekusi Lokal

### Prasyarat:
- Node.js versi 18.x atau 20.x LTS
- NPM atau PNPM

### 1. Kloning Repositori & Masuk Direktori
```bash
git clone https://github.com/nasihinn218-rgb/desasmart.git
cd desasmart
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variable (`.env`)
Buat atau pastikan file `.env` memiliki nilai berikut:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="desasmart-super-secret-jwt-key-2026-cirebon"
AI_PROVIDER="rule" # atau "groq" bila menyertakan GROQ_API_KEY
```

### 4. Migrasi Database & Seeding Data Awal
```bash
npx prisma generate
npm run db:seed
```

### 5. Menjalankan Server Pengembangan (Localhost)
```bash
npm run dev
```
Aplikasi dapat diakses melalui browser di: **`http://localhost:3000`**

### 6. Menjalankan Pengujian Unit Otomatis (Automated Testing)
```bash
npm test
```
*Seluruh 9 subtest pengujian logika bisnis SKTM, validasi NIK/KK, transisi status berjenjang, dan validasi SHA-256 akan dieksekusi secara otomatis.*

---

## 📂 Struktur Direktori Proyek
```text
desasmart/
├── .github/workflows/       # CI/CD Automated Workflow (GitHub Actions)
│   └── ci.yml
├── prisma/                  # Skema Database & Skrip Seeding (17 Model)
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/                 # Next.js App Router Pages & API Endpoints
│   │   ├── api/             # RESTful APIs (Auth, Applications, Stats, AI, Wilayah)
│   │   ├── dashboard/       # Dashboard per Peran (Masyarakat, Staf, Superadmin, Kades)
│   │   ├── login/           # Autentikasi Pengguna Terpadu
│   │   ├── register/        # Pendaftaran Akun Warga & Validasi OTP
│   │   └── verify/          # Verifikasi Publik Keaslian SKTM via QR Code
│   ├── components/          # Komponen UI Modular (Header, Sidebar, Modals, AI Widget)
│   └── lib/                 # Core Business Logic, AI Context, Auth, TTE & PDF Generator
└── tests/                   # Automated Unit Testing Suite
    └── sktm-business-logic.test.ts
```

---

## 📜 Lisensi & Standar Akademik
Proyek ini dikembangkan secara mandiri untuk pemenuhan Tugas Proyek Akhir Mata Kuliah **Rekayasa Perangkat Lunak** Semester 3 S1 Teknik Informatika STMIK IKMI Cirebon Tahun Akademik 2026/2027. Mengikuti standar dokumentasi IEEE 830 / ISO 29148 dan prinsip perancangan Clean Architecture / SOLID.
