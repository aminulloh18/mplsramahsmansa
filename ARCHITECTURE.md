# PORTAL MPLS SMAN 1 BANDUNG
## Master Architectural Design and Specifications

Aplikasi Portal MPLS SMAN 1 Bandung dirancang khusus untuk memfasilitasi panitia dalam mengelola data siswa baru, pembagian kelas, pemetaan wali kelas, serta mempermudah siswa baru dalam mencari informasi pembagian kelas, jadwal kegiatan, dan bergabung ke grup komunikasi kelas secara instan dan modern.

---

## 1. Analisis Kebutuhan Aplikasi (Requirement Analysis)

### Masalah & Solusi
*   **Masalah**: Pembagian kelas secara manual sering memicu kerumunan fisik di papan pengumuman sekolah, rentan kesalahan, dan kurang efisien untuk penyebaran tautan grup koordinasi (seperti WhatsApp Kelas).
*   **Solusi**: Aplikasi web berbasis Single-Page Application (SPA) yang interaktif, responsif, dan real-time. Siswa baru dapat mencari kelas mereka dari rumah, dan panitia dapat mengimpor data masal dari Excel secara langsung.

### Kebutuhan Fungsional (Functional Requirements)
1.  **Siswa (Public Panel)**:
    *   Melihat hitung mundur (countdown) acara pembukaan MPLS.
    *   Mencari kelas berdasarkan **Nomor Pendaftaran** ATAU **NISN + Tanggal Lahir**.
    *   Melihat hasil pencarian berupa Kartu Detail Siswa yang elegan (Nama, Kelas, Gedung, Ruangan, Wali Kelas, QR Code/Link WhatsApp Grup Kelas, Jadwal MPLS khusus kelas tersebut).
    *   Membaca pengumuman terbaru yang disematkan (pinned) oleh panitia.
    *   Membaca daftar Frequently Asked Questions (FAQ) seputar MPLS SMAN 1 Bandung.
    *   Mengunduh Buku Panduan MPLS dan Tata Tertib Siswa Baru.
2.  **Administrator (Authorized Panel)**:
    *   Login aman menggunakan email dan kata sandi via Supabase Authentication.
    *   Dashboard analitik dengan indikator visual modern (Total Siswa, Total Kelas, Total Wali Kelas, Rasio Gender L/P, progress kuota kelas).
    *   Manajemen Siswa (CRUD Lengkap): Pencarian cepat, sorting kolom, filter berdasarkan kelas, status keaktifan, jenis kelamin, serta fitur Bulk Delete.
    *   Import data siswa secara masal melalui file Excel (.xlsx) dilengkapi tabel pra-tinjau (preview) dan validasi data sebelum disimpan ke database.
    *   Export data siswa ke format Excel dan dokumen cetak PDF.
    *   Manajemen Kelas (CRUD Lengkap): Pengaturan kapasitas kuota, gedung, ruangan, link WA grup, QR code, dan pemetaan ke Wali Kelas.
    *   Manajemen Wali Kelas (CRUD Lengkap): Informasi NIP, Kontak WhatsApp, Mata Pelajaran, dan foto.
    *   Manajemen Pengumuman (CRUD Lengkap): Status publish/draft, pin pengumuman di atas, serta link lampiran.
    *   Manajemen FAQ (CRUD Lengkap): Menyusun urutan pertanyaan penting.
    *   Pengaturan Website: Mengubah logo sekolah, banner portal, tanggal mulai MPLS, kontak panitia, status rilis data pembagian kelas, serta tautan unduhan dokumen panduan.
    *   Log Aktivitas Admin: Rekam jejak kronologis aktivitas administratif untuk transparansi keamanan data.

---

## 2. User Flow

### A. Alur Siswa Baru (Akses Publik)
```
[Halaman Landing] -> [Lihat Info & Countdown]
        |
        v
[Formulir Pencarian Kelas]
  - Opsi 1: Masukkan Nomor Pendaftaran
  - Opsi 2: Masukkan NISN + Tanggal Lahir
        |
        v
[Tombol Cari Ditekan]
        |
        +-----> [Data Ditemukan] -> Renders [Kartu Hasil Pencarian]
        |                           - Tampilkan Nama, Kelas, Wali Kelas
        |                           - QR Code & Tombol Join WhatsApp
        |                           - Unduh Panduan & Lihat Jadwal MPLS
        |
        +-----> [Data Tidak Ditemukan] -> Renders [Halaman Error Elegan]
                                         - Tombol "Hubungi Panitia" via WA
                                         - Tombol "Coba Lagi"
```

### B. Alur Administrator (Akses Terautentikasi)
```
[Rute: /admin/login] -> Masukkan Email & Password
        |
        v (Verifikasi Supabase Auth)
[Rute: /admin/dashboard] (Dashboard Utama)
        |
  Menu Sidebar:
  ├─> [Data Siswa] ───> List, CRUD, Filter, Bulk Delete, Import Excel, Export Excel/PDF
  ├─> [Data Kelas] ───> List, CRUD, Pemetaan Wali Kelas, Update Link Grup WA & QR Code
  ├─> [Data Wali] ────> List, CRUD, Upload Foto & Info Kontak
  ├─> [Pengumuman] ───> List, CRUD, Toggle Pinned, Toggle Draft/Publish
  ├─> [FAQ] ──────────> List, CRUD, Pengaturan Urutan Pertanyaan
  ├─> [Settings] ─────> Edit Detail Sekolah, Tanggal MPLS, Upload File Panduan & Logo
  └─> [Log Aktivitas] ─> Lihat Daftar Audit Trail System secara Kronologis
```

---

## 3. Sitemap (Arsitektur Informasi)

```
[Aplikasi Portal MPLS]
│
├── / (Halaman Publik Utama)
│   ├── Bagian Hero & Headline
│   ├── Bagian Countdown Interaktif
│   ├── Modul Pencarian Kelas (No. Pendaftaran OR NISN + Tgl Lahir)
│   │   ├── Tampilan Detail Siswa (Sukses)
│   │   └── Tampilan Pesan Error (Gagal)
│   ├── Bagian Berita / Pengumuman Terkini
│   ├── Bagian FAQ Akordeon
│   └── Bagian Footer (Kontak Panitia & Tautan Unduhan Dokumen)
│
├── /admin/login (Halaman Login Admin)
│
└── /admin (Dashboard Admin - Layout Terproteksi)
    ├── /dashboard (Analitik, Aktivitas Terbaru, Quick Actions)
    ├── /siswa (Manajemen Siswa Baru, Import, Export)
    ├── /kelas (Manajemen Kelas & Kuota)
    ├── /wali-kelas (Manajemen Guru Wali Kelas)
    ├── /pengumuman (Sistem Informasi & Pengumuman Internal/Publik)
    ├── /faq (Manajemen FAQ Editor)
    ├── /pengaturan (Logo, Banner, Tanggal Target Countdown, File Upload)
    ├── /logs (Daftar Log Aktivitas Sistem)
    └── /profile (Pengaturan Akun Admin)
```

---

## 4. Struktur Folder (Clean Architecture)

```
src/
├── assets/                 # Gambar statis, logo, SVG hiasan
├── components/             # Komponen React yang reusable
│   ├── ui/                 # Komponen atomik (Button, Card, Input, Table, Badge, Skeleton, Modal)
│   ├── shared/             # Layout global (Sidebar Admin, Topbar Admin, DarkModeToggle)
│   └── student/            # Komponen khusus siswa (SearchResultCard, CountdownTimer, SearchForm)
├── constants/              # Data statis, konfigurasi default, tema warna
│   └── index.ts
├── hooks/                  # Custom React Hooks
│   ├── useAuth.ts          # Integrasi Auth Supabase & Session Listener
│   ├── useTheme.ts         # Pengelola Dark / Light Mode
│   └── useDebounce.ts      # Debounce input pencarian
├── layouts/                # Wrapper tata letak halaman
│   ├── AdminLayout.tsx     # Layout dashboard ber-sidebar
│   └── PublicLayout.tsx    # Layout umum ber-navbar ringan
├── lib/                    # Inisialisasi library eksternal
│   └── supabase.ts         # Supabase Client Wrapper
├── pages/                  # Halaman utama aplikasi (Routed Views)
│   ├── admin/
│   │   ├── Dashboard.tsx   # Dashboard Utama Admin
│   │   ├── DataSiswa.tsx   # Panel CRUD & Excel Siswa
│   │   ├── DataKelas.tsx   # Panel Kelas & Wali Kelas
│   │   ├── DataWaliKelas.tsx # Panel Guru Wali Kelas
│   │   ├── PengumumanAdmin.tsx # Panel Pengumuman
│   │   ├── FAQAdmin.tsx    # Panel FAQ Editor
│   │   ├── PengaturanWebsite.tsx # Panel Settings Portal
│   │   ├── ActivityLog.tsx # Panel Audit Logs
│   │   └── Profile.tsx     # Profil Admin
│   ├── public/
│   │   └── LandingPage.tsx # Landing Page Siswa
│   └── Login.tsx           # Halaman Login Admin
├── services/               # Penanganan komunikasi database Supabase
│   ├── studentService.ts
│   ├── classService.ts
│   ├── teacherService.ts
│   ├── announcementService.ts
│   ├── faqService.ts
│   └── settingService.ts
├── types/                  # Deklarasi Type & Interface TypeScript
│   └── database.types.ts
├── utils/                  # Helper functions umum (format tanggal, ekspor file)
│   └── index.ts
└── App.tsx                 # Routing utama & Providers (QueryClientProvider, dll.)
```

---

## 5. Desain Database PostgreSQL

Kita akan mendesain database menggunakan tipe data Postgres yang optimal, UUID sebagai Primary Key bawaan, dan Foreign Key ber-index untuk mempercepat pencarian data relasi.

### Tabel: `settings` (Konfigurasi Global Website)
```sql
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name VARCHAR(255) NOT NULL DEFAULT 'SMAN 1 Bandung',
    school_logo TEXT,
    school_banner TEXT,
    mpls_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '30 days',
    committee_phone VARCHAR(50),
    status_publish BOOLEAN NOT NULL DEFAULT TRUE,
    color_theme VARCHAR(50) DEFAULT 'default',
    guidebook_url TEXT,
    rules_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel: `teachers` (Data Wali Kelas)
```sql
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    nip VARCHAR(50) UNIQUE,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    photo_url TEXT,
    subject VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel: `classes` (Data Kelas & Pembagian Ruang)
```sql
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    quota INTEGER NOT NULL DEFAULT 36,
    building VARCHAR(100),
    floor INTEGER DEFAULT 1,
    room_number VARCHAR(50),
    whatsapp_link TEXT,
    qr_code_link TEXT,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel: `students` (Data Siswa Baru)
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    nisn VARCHAR(10) UNIQUE NOT NULL,
    nik VARCHAR(16) UNIQUE,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('L', 'P')),
    birth_place VARCHAR(100),
    birth_date DATE NOT NULL,
    address TEXT,
    school_origin VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    parent_name VARCHAR(255),
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Cadangan', 'Mengundurkan Diri')),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Tabel: `announcements` (Pengumuman Portal)
```sql
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published')),
    is_pinned BOOLEAN DEFAULT FALSE,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel: `faq` (Frequently Asked Questions)
```sql
CREATE TABLE faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_num INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel: `activity_logs` (Log Audit Trail Keamanan)
```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 6. Relasi Database

```
- One-to-Many: `teachers.id` (1) <--- (Many) `classes.teacher_id`
  (Masing-masing kelas berelasi dengan 1 guru sebagai Wali Kelas).
  
- One-to-Many: `classes.id` (1) <--- (Many) `students.class_id`
  (Setiap siswa baru hanya dialokasikan ke 1 kelas).
```

---

## 7. Entity Relationship Diagram (ERD)

```
+------------------+         +-------------------+         +--------------------+
|     TEACHERS     |         |      CLASSES      |         |      STUDENTS      |
+------------------+         +-------------------+         +--------------------+
| PK  id           |         | PK  id            |         | PK  id             |
|     name         |         |     name          |         |     full_name      |
|     nip          | (1)     |     code          | (1)     |     registration_no|
|     phone        |---------| FK  teacher_id    |---------| FK  class_id       |
|     email        |    (0.1)|     quota         |    (0.N)|     nisn           |
|     subject      |         |     building      |         |     birth_date     |
|     photo_url    |         |     room_number   |         |     gender         |
+------------------+         |     whatsapp_link |         |     status         |
                             +-------------------+         +--------------------+
```

---

## 8. API Structure (Supabase REST API Wrapper)

Menggunakan query client SDK `@supabase/supabase-js`, pemanggilan API dibungkus rapi dalam service layer:

```typescript
// Contoh Wrapper Pemanggilan API Siswa
export const studentService = {
  getStudents: async (params: QueryParams) => {
    // Penanganan filter, sorting, pagination, dan soft delete
  },
  getStudentByRegNumber: async (regNo: string) => {
    // Pencarian cepat siswa untuk panel publik
  },
  getStudentByNisnAndDob: async (nisn: string, dob: string) => {
    // Pencarian NISN + Tanggal Lahir
  },
  createStudent: async (student: Omit<Student, 'id'>) => {
    // Tambah siswa + insert log aktivitas otomatis
  },
  updateStudent: async (id: string, updates: Partial<Student>) => {
    // Update data siswa
  },
  deleteStudent: async (id: string) => {
    // Soft-delete atau hard-delete siswa
  },
  importStudentsBulk: async (students: any[]) => {
    // Mass insert transaksional
  }
};
```

---

## 9. Daftar Halaman

### Panel Publik (Landing Page)
1.  **Halaman Utama (Landing Page)**: Modul Pencarian Kelas, Hitung Mundur Pembukaan MPLS, Carousel Profil Sekolah, Accordion FAQ, List Pengumuman, Banner Informasi.

### Panel Admin (Protected)
2.  **Halaman Login Admin**: Form otentikasi minimalis dengan validasi form instan.
3.  **Dashboard Utama**: Statistik ringkasan data, grafik kapasitas kelas saat ini, rasio siswa L/P, dan daftar aktivitas terbaru.
4.  **Halaman Data Siswa**: Tabel data interaktif, filter kelas, tombol bulk delete, tombol ekspor XLSX/PDF, dan tombol impor Excel.
5.  **Halaman Data Kelas**: Grid visual kartu kelas, menampilkan bar progress kuota terisi, tombol detail, pengeditan info link WA/QR.
6.  **Halaman Data Wali Kelas**: Manajemen profil pengajar pendamping kelas, lengkap dengan kontak cepat WA.
7.  **Halaman Pengumuman**: Daftar pengumuman dengan status draft/publish, tombol pinning, editor isi pengumuman.
8.  **Halaman FAQ**: Form manajemen FAQ untuk merespon kendala pendaftaran siswa dengan cepat.
9.  **Halaman Pengaturan Website**: Form pengaturan sekolah, logo, countdown target, file handbook panduan, dan saklar publish/unpublish data pembagian kelas.
10. **Halaman Log Aktivitas**: Audit trail read-only yang melacak aksi admin.
11. **Halaman Profil & Keamanan**: Ganti password admin secara aman.

---

## 10. Daftar Components

### Components UI Atomik (`/src/components/ui/`)
*   `Button`: Tombol modern dengan varian primary, secondary, outline, danger, glassmorphism.
*   `Card`: Pembungkus konten berbayang lembut dengan efek blur kaca (glassmorphism).
*   `Badge`: Label status berwarna (misal: 'Aktif' -> Hijau, 'Cadangan' -> Kuning).
*   `Input` / `Select` / `Textarea`: Elemen formulir berdesain konsisten dan bebas bug fokus.
*   `Table`: Tabel berkinerja tinggi dengan visual grid bersih, pagination responsif, dan header sortable.
*   `Skeleton`: Komponen shimmer untuk state loading asinkronus yang rapi.
*   `Modal`: Dialog interaktif mengambang dengan transisi animasi elegan dari `motion`.

### Components Khusus Portal (`/src/components/student/` & `/src/components/shared/`)
*   `CountdownTimer`: Widget hitung mundur interaktif berbasis detik menuju hari H MPLS SMAN 1 Bandung.
*   `SearchForm`: Form pencarian tabbed (Tab 1: Nomor Pendaftaran, Tab 2: NISN + Tanggal Lahir).
*   `SearchResultCard`: Kartu hasil pembagian kelas yang spektakuler dengan tombol Direct WhatsApp, QR Code grup WA, gedung kelas, guru wali kelas, dan rincian dokumen tata tertib.
*   `Sidebar`: Menu navigasi admin modern ber-ikon Lucide React yang dapat diciutkan (collapsible).
*   `Topbar`: Header admin yang menampilkan judul halaman, penanda profil, dan tombol Dark Mode Toggle.

---

## 11. Daftar Hooks

*   `useAuth`: Mengatur status sesi pengguna, inisialisasi login, logout, dan pengalihan otomatis rute privat.
*   `useTheme`: Sinkronisasi status mode gelap/terang (Dark/Light mode) dengan `localStorage` dan class HTML Tailwind.
*   `useDebounce`: Mencegah pemanggilan query database berulang secara berlebihan ketika user mengetik di form pencarian.

---

## 12. Daftar Services

*   `authService`: Wrapper Supabase Auth API (login, logout, getSession, updatePassword).
*   `studentService`: Komunikasi tabel `students`, join data kelas (`classes`), dan data wali kelas (`teachers`).
*   `classService`: Komunikasi tabel `classes`, kalkulasi sisa kuota, inisialisasi link WA & QR Code.
*   `teacherService`: Komunikasi tabel `teachers` (Wali Kelas).
*   `announcementService`: Mengambil daftar pengumuman publik/draft, toggle pinning status.
*   `faqService`: CRUD FAQ.
*   `settingService`: Get & Update konfigurasi website global, logo upload helper.
*   `logService`: Mengunggah log audit aktivitas panitia secara otomatis pasca aksi CRUD.

---

## 13. Routing (React Router Map)

```typescript
// Pemetaan Rute Aplikasi
<Routes>
  {/* Rute Publik */}
  <Route element={<PublicLayout />}>
    <Route path="/" element={<LandingPage />} />
  </Route>

  {/* Rute Autentikasi Admin */}
  <Route path="/admin/login" element={<Login />} />

  {/* Rute Dashboard Terproteksi */}
  <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="siswa" element={<DataSiswa />} />
    <Route path="kelas" element={<DataKelas />} />
    <Route path="wali-kelas" element={<DataWaliKelas />} />
    <Route path="pengumuman" element={<PengumumanAdmin />} />
    <Route path="faq" element={<FAQAdmin />} />
    <Route path="pengaturan" element={<PengaturanWebsite />} />
    <Route path="logs" element={<ActivityLog />} />
    <Route path="profile" element={<Profile />} />
  </Route>
</Routes>
```

---

## 14. UI Wireframe

### A. Landing Page Utama (Siswa)
```
+--------------------------------------------------------------------------+
|  [Logo] PORTAL MPLS SMAN 1 BANDUNG                          [Admin Login] |
+--------------------------------------------------------------------------+
|                                                                          |
|       SELAMAT DATANG DI PORTAL MPLS RESMI SMAN 1 BANDUNG 2026            |
|       "Berkarakter, Unggul, dan Berbudaya Lingkungan"                    |
|                                                                          |
|       [  05 Hari  ] : [  12 Jam  ] : [  30 Menit  ] : [  45 Detik  ]     |
|                                                                          |
|     +--------------------------------------------------------------+     |
|     | Cari Pembagian Kelas Anda                                    |     |
|     | +-------------------------+   +----------------------------+ |     |
|     | | Tab: No. Pendaftaran    |   | Tab: NISN + Tgl Lahir      | |     |
|     | +-------------------------+   +----------------------------+ |     |
|     |  Masukkan Nomor Pendaftaran:                                 |     |
|     |  [ MPLS-2026-001                                       ]     |     |
|     |                                                              |     |
|     |  [ CARI KELAS SAYA ]                                         |     |
|     +--------------------------------------------------------------+     |
|                                                                          |
|   ===================== PENGUMUMAN TERBARU =====================         |
|   +-------------------------------------+  +-------------------------+   |
|   | [PINNED] Jadwal Hari Pertama        |  | Tata Tertib Pakaian     |   |
|   +-------------------------------------+  +-------------------------+   |
|                                                                          |
+--------------------------------------------------------------------------+
```

### B. Admin Dashboard (Desktop Layout)
```
+--------------------------------------------------------------------------+
| [Logo] PORTAL MPLS  |  Dashboard / Ringkasan               [Admin Name]  |
+---------------------+----------------------------------------------------+
| (O) Dashboard       |                                                    |
| (•) Data Siswa      | [ Total Siswa ]   [ Total Kelas ]   [ Wali Kelas ] |
| (•) Data Kelas      |     360 Siswa         10 Kelas        10 Guru      |
| (•) Wali Kelas      |                                                    |
| (•) Pengumuman      | +-----------------------+ +----------------------+ |
| (•) FAQ             | | Grafik Kapasitas      | | Aktivitas Terbaru    | |
| (•) Settings        | | Kelas X-1 [=====] 100%| | [08:30] Import Siswa | |
| (•) Log Aktivitas   | | Kelas X-2 [==== ]  90%| | [08:15] Add Guru     | |
|                     | +-----------------------+ +----------------------+ |
+---------------------+----------------------------------------------------+
```

---

## 15. Roadmap Development (6 Tahap Sistematis)

*   **Tahap 1**: Persetujuan Arsitektur & Desain oleh User (Langkah saat ini).
*   **Tahap 2**: Persiapan Base Environment, Routing, dan Integrasi Supabase client (serta mock service untuk fallback rendering yang cepat).
*   **Tahap 3**: Desain Landing Page Publik (Formulir pencarian, hitung mundur dinamis, FAQ akordeon, berita pengumuman, dan kartu hasil pencarian kelas yang interaktif).
*   **Tahap 4**: Pembuatan Dashboard Admin & Halaman Login dengan Glassmorphic Layout (Navigasi Sidebar, Topbar Responsif, statistik interaktif, dan Mode Gelap terpadu).
*   **Tahap 5**: Implementasi CRUD Modul Inti (Data Siswa dengan pagination, pencarian, dan filtering; Data Kelas; Data Wali Kelas; FAQ; Pengumuman; Setting Web).
*   **Tahap 6**: Implementasi Fitur Unggulan (Import Excel parser, Export data siswa ke file Excel, Ekspor detail siswa ke PDF, Audit Log, final linting, compile verification, dan rilis).

---
