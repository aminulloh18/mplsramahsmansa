import * as XLSX from 'xlsx';
import { Student, Class, Teacher } from '../types/database.types';

// Format Date to Indonesian format: 12 Mei 2010
export function formatIndonesianDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateString;
  }
}

// Export Students to Excel
export function exportStudentsToExcel(students: Student[]) {
  const data = students.map((s, index) => ({
    No: index + 1,
    'No Pendaftaran': s.registration_number,
    Nama: s.full_name,
    NISN: s.nisn,
    NIK: s.nik,
    'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
    'Tempat Lahir': s.birth_place,
    'Tanggal Lahir': s.birth_date,
    Alamat: s.address,
    'Asal Sekolah': s.school_origin,
    'Nomor HP': s.phone,
    Email: s.email,
    'Nama Orang Tua': s.parent_name,
    Kelas: s.class?.name || 'Belum Ditentukan',
    Status: s.status,
    Catatan: s.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa Baru');

  // Set column widths for better design
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 25 },
    { wch: 12 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 35 },
    { wch: 22 },
    { wch: 15 },
    { wch: 22 },
    { wch: 22 },
    { wch: 15 },
    { wch: 12 },
    { wch: 25 },
  ];

  XLSX.writeFile(workbook, `DATA_SISWA_MPLS_SMAN1BDG_${new Date().getFullYear()}.xlsx`);
}

// Download Excel Template for Import
export function downloadStudentTemplate() {
  const headers = [
    {
      'Nomor Pendaftaran': 'MPLS-2026-001',
      'Nama Lengkap': 'Ahmad Fauzan',
      NISN: '0098765431',
      NIK: '3273012010100001',
      'Jenis Kelamin (L/P)': 'L',
      'Tempat Lahir': 'Bandung',
      'Tanggal Lahir (YYYY-MM-DD)': '2010-05-24',
      Alamat: 'Jl. Ir. H. Juanda No. 100, Bandung',
      'Asal Sekolah': 'SMPN 1 Bandung',
      'Nomor HP': '081234567890',
      Email: 'ahmad.fauzan@gmail.com',
      'Nama Orang Tua': 'Herman Fauzan',
      'Kode Kelas': 'X-1',
      'Status (Aktif/Cadangan/Mengundurkan Diri)': 'Aktif',
      Catatan: 'Jalur zonasi reguler',
    },
    {
      'Nomor Pendaftaran': 'MPLS-2026-002',
      'Nama Lengkap': 'Siti Rahmawati',
      NISN: '0098765432',
      NIK: '3273012010100002',
      'Jenis Kelamin (L/P)': 'P',
      'Tempat Lahir': 'Cimahi',
      'Tanggal Lahir (YYYY-MM-DD)': '2010-08-12',
      Alamat: 'Jl. Gatot Subroto No. 45, Cimahi',
      'Asal Sekolah': 'SMPN 2 Cimahi',
      'Nomor HP': '081398765432',
      Email: 'siti.rahma@gmail.com',
      'Nama Orang Tua': 'Budiman',
      'Kode Kelas': 'X-2',
      'Status (Aktif/Cadangan/Mengundurkan Diri)': 'Aktif',
      Catatan: '-',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(headers);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'TEMPLATE_IMPORT');

  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 25 },
    { wch: 12 },
    { wch: 18 },
    { wch: 20 },
    { wch: 15 },
    { wch: 25 },
    { wch: 35 },
    { wch: 20 },
    { wch: 15 },
    { wch: 22 },
    { wch: 20 },
    { wch: 12 },
    { wch: 38 },
    { wch: 25 },
  ];

  XLSX.writeFile(workbook, 'TEMPLATE_IMPORT_SISWA_MPLS_SMAN1BDG.xlsx');
}
