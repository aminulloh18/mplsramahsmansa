-- SQL Script to Initialize Supabase Database for Portal MPLS SMAN 1 Bandung
-- Copy and paste this script into your Supabase SQL Editor (Dashboard > SQL Editor > New Query) and run it!

-- =========================================================================
-- MIGRASI KILAT (JALANKAN INI JIKA DATABASE SUDAH ADA / PRE-EXISTING):
-- Jika Anda sudah membuat tabel 'classes' sebelumnya dan hanya ingin mengubah
-- kolom "nama gedung" menjadi "nama regu" tanpa menghapus data, silakan
-- jalankan perintah di bawah ini saja di SQL Editor Supabase Anda:
--
-- ALTER TABLE public.classes RENAME COLUMN building TO regu;
-- =========================================================================

-- 1. Drop existing tables if they exist (to clean up)
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.faq CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- 2. Create Teachers Table
CREATE TABLE public.teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nip TEXT,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    subject TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Classes Table
CREATE TABLE public.classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    quota INTEGER DEFAULT 36,
    regu TEXT,
    floor INTEGER,
    room_number TEXT,
    whatsapp_link TEXT,
    qr_code_link TEXT,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE SET NULL,
    binkel_name TEXT,
    binkel_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Students Table
CREATE TABLE public.students (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    nisn TEXT,
    nik TEXT,
    gender TEXT CHECK (gender IN ('L', 'P')),
    birth_place TEXT,
    birth_date TEXT, -- YYYY-MM-DD
    address TEXT,
    school_origin TEXT,
    phone TEXT,
    email TEXT,
    parent_name TEXT,
    class_id TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('Aktif', 'Cadangan', 'Mengundurkan Diri')) DEFAULT 'Aktif',
    notes TEXT,
    photo_url TEXT,
    attendance_status TEXT CHECK (attendance_status IN ('Hadir', 'Sakit', 'Izin', 'Alpa')),
    attendance_history TEXT, -- Store JSON-stringified daily attendance, e.g. {"1":"Hadir","2":"Sakit"}
    tb NUMERIC,
    bb NUMERIC,
    heart_rate INTEGER,
    flexibility NUMERIC,
    imt NUMERIC,
    imt_status TEXT,
    graduation_status TEXT CHECK (graduation_status IN ('Lulus', 'Tidak Lulus')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create Announcements Table
CREATE TABLE public.announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT CHECK (status IN ('Draft', 'Published')) DEFAULT 'Published',
    is_pinned BOOLEAN DEFAULT false,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create FAQ Table
CREATE TABLE public.faq (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_num INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ALTER TABLE MIGRATION QUERIES FOR EXISTING DATABASES (Run these in your Supabase SQL Editor if you already have the settings table):
-- ALTER TABLE public.students ADD COLUMN IF NOT EXISTS attendance_history TEXT;
-- ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS certificate_name_x NUMERIC DEFAULT 50;
-- ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS certificate_name_y NUMERIC DEFAULT 42;
-- ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS certificate_name_size NUMERIC DEFAULT 48;
-- ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS certificate_name_color TEXT DEFAULT '#FFFFFF';
-- ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS certificate_name_font TEXT DEFAULT 'sans-serif';
-- ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS certificate_name_bold BOOLEAN DEFAULT true;
-- ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS certificate_name_italic BOOLEAN DEFAULT false;
-- ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS certificate_name_uppercase BOOLEAN DEFAULT true;

-- 7. Create Settings Table
CREATE TABLE public.settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    school_name TEXT NOT NULL,
    school_logo TEXT,
    school_banner TEXT,
    school_banners TEXT[], -- PostgreSQL text array
    mpls_date TEXT,
    committee_phone TEXT,
    status_publish BOOLEAN DEFAULT true,
    color_theme TEXT,
    guidebook_url TEXT,
    rules_url TEXT,
    embed_type TEXT DEFAULT 'none',
    embed_code TEXT DEFAULT '',
    certificate_template_url TEXT DEFAULT '',
    is_certificate_published BOOLEAN DEFAULT false,
    certificate_name_x NUMERIC DEFAULT 50,
    certificate_name_y NUMERIC DEFAULT 42,
    certificate_name_size NUMERIC DEFAULT 48,
    certificate_name_color TEXT DEFAULT '#FFFFFF',
    certificate_name_font TEXT DEFAULT 'sans-serif',
    certificate_name_bold BOOLEAN DEFAULT true,
    certificate_name_italic BOOLEAN DEFAULT false,
    certificate_name_uppercase BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT single_row CHECK (id = 'global')
);

-- 8. Disable Row Level Security (RLS) to ensure smooth public read/write operations from your client app
ALTER TABLE public.teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- 9. Seed Teachers Data
INSERT INTO public.teachers (id, name, nip, phone, email, subject, created_at, updated_at) VALUES
('t-1', 'Drs. H. Maman Suherman, M.Pd.', '196805121993031004', '081234567890', 'maman.suherman@sman1bdg.sch.id', 'Fisika', now(), now()),
('t-2', 'Dra. Hj. Neneng Hasanah, M.Si.', '197210151998022001', '081398765432', 'neneng.hasanah@sman1bdg.sch.id', 'Matematika Peminatan', now(), now()),
('t-3', 'Budi Raharjo, S.Pd.', '198204212009011003', '082155443322', 'budi.raharjo@sman1bdg.sch.id', 'Bahasa Inggris', now(), now()),
('t-4', 'Siti Aminah, S.Si.', '198509302011012012', '085722119988', 'siti.aminah@sman1bdg.sch.id', 'Kimia', now(), now()),
('t-5', 'Ahmad Fauzi, S.Kom.', '198902182015041002', '089677889900', 'ahmad.fauzi@sman1bdg.sch.id', 'Informatika', now(), now());

-- 10. Seed Classes Data
INSERT INTO public.classes (id, name, code, quota, regu, floor, room_number, whatsapp_link, qr_code_link, teacher_id, binkel_name, binkel_phone, created_at, updated_at) VALUES
('c-1', 'Kelas X-1', 'X-1', 36, 'Regu 1 (Ki Hajar Dewantara)', 1, 'Ruang 101', 'https://chat.whatsapp.com/ExampleGrupX1', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://chat.whatsapp.com/ExampleGrupX1', 't-1', 'Kak Farhan (OSIS)', '081234567890', now(), now()),
('c-2', 'Kelas X-2', 'X-2', 36, 'Regu 2 (Ki Hajar Dewantara)', 1, 'Ruang 102', 'https://chat.whatsapp.com/ExampleGrupX2', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://chat.whatsapp.com/ExampleGrupX2', 't-2', 'Kak Nabila (MPK)', '081298765432', now(), now()),
('c-3', 'Kelas X-3', 'X-3', 36, 'Regu 3 (R.A. Kartini)', 2, 'Ruang 201', 'https://chat.whatsapp.com/ExampleGrupX3', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://chat.whatsapp.com/ExampleGrupX3', 't-3', 'Kak Satria (OSIS)', '082155443322', now(), now()),
('c-4', 'Kelas X-4', 'X-4', 36, 'Regu 4 (R.A. Kartini)', 2, 'Ruang 202', 'https://chat.whatsapp.com/ExampleGrupX4', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://chat.whatsapp.com/ExampleGrupX4', 't-4', 'Kak Amanda (OSIS)', '085722119988', now(), now()),
('c-5', 'Kelas X-5', 'X-5', 36, 'Regu 5 (Ir. Juanda)', 1, 'Ruang 301', 'https://chat.whatsapp.com/ExampleGrupX5', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://chat.whatsapp.com/ExampleGrupX5', 't-5', 'Kak Zidan (MPK)', '089677889900', now(), now());

-- 11. Seed Students Data
INSERT INTO public.students (id, full_name, registration_number, nisn, nik, gender, birth_place, birth_date, address, school_origin, phone, email, parent_name, class_id, status, notes, created_at, updated_at) VALUES
('s-1', 'Aditya Nugraha', 'MPLS-2026-001', '0098765431', '3273012010100001', 'L', 'Bandung', '2010-05-12', 'Jl. Dago No. 12, Coblong, Bandung', 'SMPN 1 Bandung', '081211112222', 'aditya.nugraha@gmail.com', 'Heri Nugraha', 'c-1', 'Aktif', 'Siswa berprestasi jalur akademik', now(), now()),
('s-2', 'Bella Rizky Amalia', 'MPLS-2026-002', '0098765432', '3273012010100002', 'P', 'Bandung', '2010-08-22', 'Jl. Merdeka No. 45, Sumur Bandung, Bandung', 'SMP Taruna Bakti', '081322223333', 'bella.rizky@gmail.com', 'Ahmad Fauzi', 'c-2', 'Aktif', NULL, now(), now()),
('s-3', 'Dimas Hanafi', 'MPLS-2026-003', '0098765433', '3273012010100003', 'L', 'Jakarta', '2010-01-15', 'Komplek Antapani Indah Blok C-5, Bandung', 'SMPN 2 Bandung', '081233334444', 'dimas.hanafi@gmail.com', 'Subagyo Hanafi', 'c-3', 'Aktif', NULL, now(), now()),
('s-4', 'Farah Sabila Putri', 'MPLS-2026-004', '0098765434', '3273012010100004', 'P', 'Cimahi', '2010-11-03', 'Jl. Cihanjuang No. 88, Cimahi Utara', 'SMP Alfa Centauri', '081344445555', 'farah.sabila@gmail.com', 'Rudi Hermawan', 'c-1', 'Aktif', NULL, now(), now()),
('s-5', 'Gavin Rafif Pratama', 'MPLS-2026-005', '0098765435', '3273012010100005', 'L', 'Bandung', '2010-06-30', 'Jl. Buah Batu No. 120, Lengkong, Bandung', 'SMPN 5 Bandung', '081255556666', 'gavin.rafif@gmail.com', 'Tatang Pratama', 'c-4', 'Aktif', NULL, now(), now()),
('s-6', 'Hana Clarissa', 'MPLS-2026-006', '0098765436', '3273012010100006', 'P', 'Bandung', '2010-09-18', 'Jl. Dr. Setiabudi No. 202, Cidadap, Bandung', 'SMPN 12 Bandung', '081366667777', 'hana.clara@gmail.com', 'Wawan Clarissa', 'c-5', 'Aktif', NULL, now(), now()),
('s-7', 'Irfan Maulana', 'MPLS-2026-007', '0098765437', '3273012010100007', 'L', 'Tasikmalaya', '2010-03-05', 'Jl. Kopo Sayati Gg. Haji Umar No. 4, Bandung', 'SMPN 1 Tasikmalaya', '081277778888', 'irfan.maulana@gmail.com', 'Asep Maulana', 'c-2', 'Cadangan', 'Menunggu konfirmasi daftar ulang berkas fisik', now(), now()),
('s-8', 'Kezia Aurelia', 'MPLS-2026-008', '0098765438', '3273012010100008', 'P', 'Bandung', '2010-07-14', 'Kopo Permai Blok J-10, Margahayu, Bandung', 'SMP Kristen Yusuf', '081388889999', 'kezia.aurelia@gmail.com', 'Susanto Aurelia', 'c-3', 'Aktif', NULL, now(), now());

-- 12. Seed Announcements Data
INSERT INTO public.announcements (id, title, content, status, is_pinned, attachment_url, created_at, updated_at) VALUES
('a-1', 'Tata Tertib Pelaksanaan MPLS SMAN 1 Bandung Tahun Ajaran 2026/2027', 'Yth. Calon Peserta Didik Baru SMAN 1 Bandung,

Berikut adalah beberapa hal penting mengenai tata tertib yang wajib dipatuhi selama kegiatan Masa Pengenalan Lingkungan Sekolah (MPLS) berlangsung:

1. **Pakaian**: Menggunakan seragam sekolah asal (SMP/MTs) lengkap, rapi, bersih, dan memakai atribut sekolah asal.
2. **Waktu**: Seluruh peserta wajib hadir di sekolah paling lambat pukul 06.45 WIB. Kegiatan dimulai tepat pukul 07.00 WIB.
3. **Barang Bawaan**: Membawa alat tulis, buku catatan MPLS, bekal makan siang sehat, botol minum isi ulang (tumblr), obat-obatan pribadi jika memiliki riwayat penyakit tertentu.
4. **Larangan**: Dilarang membawa kendaraan bermotor, senjata tajam, rokok/vape, dan barang berharga berlebihan.

Harap dipatuhi demi kelancaran bersama. Terima kasih.

-- Panitia MPLS SMAN 1 Bandung', 'Published', true, '#tata-tertib', now(), now()),
('a-2', 'Panduan Pengisian Data & Gabung Grup WhatsApp Kelas X', 'Halo Peserta Didik Baru!

Untuk mempermudah koordinasi selama MPLS, mohon ikuti langkah-langkah berikut setelah menemukan kelas Anda:

1. Cari nama Anda di kolom pencarian di halaman utama menggunakan Nomor Pendaftaran atau NISN + Tanggal Lahir.
2. Lihat kelas, ruangan, gedung, dan nama Wali Kelas Anda.
3. Klik tombol **Gabung Grup WhatsApp** yang tertera di kartu detail siswa Anda untuk langsung masuk ke WhatsApp Grup koordinasi kelas.
4. Hubungi Wali Kelas jika Anda menemui kendala.

Selamat bergabung di keluarga besar SMAN 1 Bandung!', 'Published', false, '#panduan-mpls', now(), now()),
('a-3', 'Informasi Pembagian Buku Paket dan Seragam Olahraga', 'Diumumkan kepada seluruh siswa baru kelas X, bahwa pengambilan seragam olahraga dan buku paket pelajaran akan dilaksanakan secara terjadwal setelah upacara pembukaan MPLS pada hari Senin depan. Detail jadwal per kelas akan dibagikan oleh Wali Kelas masing-masing di grup WhatsApp kelas.', 'Draft', false, NULL, now(), now());

-- 13. Seed FAQ Data
INSERT INTO public.faq (id, question, answer, order_num, created_at, updated_at) VALUES
('faq-1', 'Bagaimana cara mengetahui kelas saya?', 'Silakan masukkan Nomor Pendaftaran Anda (format: MPLS-2026-XXX) atau kombinasikan NISN dan Tanggal Lahir Anda pada form pencarian di halaman depan. Sistem akan menampilkan kelas, gedung, ruang, dan wali kelas Anda secara lengkap.', 1, now(), now()),
('faq-2', 'Bagaimana jika nama saya belum terdaftar di kelas manapun?', 'Jika Anda telah dinyatakan diterima di SMAN 1 Bandung namun data kelas tidak ditemukan, mohon segera hubungi Panitia MPLS melalui nomor hotline yang tertera di bagian bawah website ini dengan mengirimkan bukti tanda terima kelulusan.', 2, now(), now()),
('faq-3', 'Apakah wajib bergabung dengan grup WhatsApp kelas?', 'Ya, sangat wajib. Seluruh informasi teknis harian, penugasan MPLS, serta koordinasi dengan Wali Kelas akan disampaikan secara langsung melalui grup WhatsApp kelas masing-masing.', 3, now(), now()),
('faq-4', 'Di mana saya bisa mengunduh Buku Panduan MPLS?', 'Buku Panduan MPLS dan Tata Tertib dapat diunduh langsung melalui tombol "Download Panduan MPLS" dan "Download Tata Tertib" yang muncul di hasil pencarian Anda, atau di bagian bawah landing page.', 4, now(), now());

-- 14. Seed Settings Data
INSERT INTO public.settings (id, school_name, school_logo, school_banner, school_banners, mpls_date, committee_phone, status_publish, color_theme, guidebook_url, rules_url, embed_type, embed_code, certificate_template_url, is_certificate_published, certificate_name_x, certificate_name_y, certificate_name_size, certificate_name_color, certificate_name_font, certificate_name_bold, certificate_name_italic, certificate_name_uppercase, created_at, updated_at) VALUES
('global', 'SMAN 1 Bandung', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1200', ARRAY[
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=1200'
], '2026-07-16T00:00:00.000Z', '08123456789', true, 'modern-bento', '#', '#', 'none', '', '', false, 50, 42, 48, '#FFFFFF', 'sans-serif', true, false, true, now(), now());
