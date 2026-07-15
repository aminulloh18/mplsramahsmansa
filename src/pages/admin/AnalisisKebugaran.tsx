import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Activity,
  Heart,
  Scale,
  Ruler,
  Search,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Filter,
  Smile
} from 'lucide-react';
import { Student, Class } from '../../types/database.types';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import * as XLSX from 'xlsx';

// Helper structures and interpretation functions for School Analytics
export interface ImtInterpretation {
  status: string;
  hasil: string;
  tindakLanjut: string;
  rekSiswa: string;
  rekSekolah: string;
  rekOrangTua: string;
  color: string;
}

export function interpretImt(imt: number | null | undefined): ImtInterpretation | null {
  if (imt === null || imt === undefined || isNaN(imt)) return null;
  if (imt < 17.0) {
    return {
      status: 'Gizi Buruk',
      hasil: 'Kekurangan berat badan tingkat berat',
      tindakLanjut: 'Diperlukan intervensi medis dan perbaikan asupan gizi segera melalui kerja sama dengan fasilitas kesehatan, sekolah, dan orang tua.',
      rekSiswa: 'Makan makanan bergizi lengkap 3x sehari. Konsumsi protein setiap hari (telur, ikan, tahu, tempe). Minum susu jika tersedia.',
      rekSekolah: 'Rujuk ke puskesmas atau dokter segera. Lakukan pemberian makanan tambahan (PMT). Pantau berat badan setiap 2 minggu.',
      rekOrangTua: 'Pastikan anak mendapat makan bergizi cukup di rumah. Konsultasikan ke dokter atau ahli gizi untuk penanganan lebih lanjut.',
      color: 'rose'
    };
  } else if (imt >= 17.0 && imt <= 18.4) {
    return {
      status: 'Gizi Kurang',
      hasil: 'Kekurangan berat badan tingkat ringan',
      tindakLanjut: 'Memerlukan peningkatan porsi dan variasi asupan gizi harian serta pemantauan berat badan secara berkala.',
      rekSiswa: 'Tambah porsi makan dan variasi lauk bergizi. Konsumsi camilan sehat (buah, kacang, susu) di antara jam makan.',
      rekSekolah: 'Monitor berat badan bulanan. Berikan edukasi gizi di kelas. Koordinasi dengan orang tua terkait pola makan di rumah.',
      rekOrangTua: 'Sediakan makanan bergizi dan bervariasi di rumah. Pastikan anak sarapan setiap hari sebelum berangkat sekolah.',
      color: 'amber'
    };
  } else if (imt >= 18.5 && imt <= 25.0) {
    return {
      status: 'Gizi Baik',
      hasil: 'Normal',
      tindakLanjut: 'Mempertahankan kebiasaan pola makan sehat, gizi seimbang, dan aktivitas fisik secara rutin.',
      rekSiswa: 'Pertahankan pola makan gizi seimbang. Tetap aktif bergerak minimal 60 menit per hari.',
      rekSekolah: 'Pertahankan program kantin sehat. Lakukan skrining ulang setiap semester sebagai pemantauan rutin.',
      rekOrangTua: 'Dukung pola makan sehat dan aktivitas fisik anak. Batasi makanan olahan dan minuman manis.',
      color: 'emerald'
    };
  } else if (imt > 25.0 && imt <= 27.0) {
    return {
      status: 'Gizi Lebih',
      hasil: 'Gizi Lebih',
      tindakLanjut: 'Memerlukan penyesuaian asupan kalori (pengurangan gula/lemak) dan peningkatan rutinitas aktivitas fisik harian.',
      rekSiswa: 'Kurangi makanan tinggi gula, lemak, dan makanan cepat saji. Tingkatkan aktivitas fisik minimal 60 menit per hari. Perbanyak minum air putih.',
      rekSekolah: 'Dorong partisipasi aktif dalam olahraga. Berikan edukasi pola makan sehat. Pantau perkembangan berat badan tiap bulan.',
      rekOrangTua: 'Batasi screen time anak. Sediakan makanan rumahan yang sehat. Dampingi anak dalam berolahraga secara rutin.',
      color: 'blue'
    };
  } else {
    return {
      status: 'Obesitas',
      hasil: 'Kelebihan berat badan tingkat berat (obesitas)',
      tindakLanjut: 'Memerlukan penanganan medis ahli gizi, modifikasi gaya hidup komprehensif, dan dukungan emosional dari lingkungan sekitar.',
      rekSiswa: 'Hindari minuman manis dan junk food. Aktif berolahraga setiap hari. Makan dalam porsi teratur dan tidak berlebihan.',
      rekSekolah: 'Rujuk ke dokter atau ahli gizi. Libatkan konselor sekolah jika perlu. Ciptakan lingkungan sekolah yang mendukung gaya hidup aktif.',
      rekOrangTua: 'Konsultasi ke dokter atau ahli gizi. Terapkan pola makan sehat seluruh keluarga. Dukung anak secara emosional tanpa menyudutkan penampilan fisik.',
      color: 'purple'
    };
  }
}

export interface HeartRateInterpretation {
  kategori: string;
  multiplied: number;
  interpretasi: string;
  tindakLanjut: string;
  color: string;
  isDanger: boolean;
}

export function interpretHeartRate(hr: number | null | undefined): HeartRateInterpretation | null {
  if (hr === null || hr === undefined || isNaN(hr)) return null;
  const multiplied = hr * 4;
  if (multiplied < 60) {
    return {
      kategori: 'Bradikardia',
      multiplied,
      interpretasi: 'Di bawah normal',
      tindakLanjut: 'Siswa memiliki detak jantung yang lambat. Silakan konsultasi kepada guru Penjaskes / medis sekolah.',
      color: 'blue',
      isDanger: false
    };
  } else if (multiplied >= 60 && multiplied <= 100) {
    return {
      kategori: 'Normal',
      multiplied,
      interpretasi: 'Kondisi sehat dan prima',
      tindakLanjut: 'Siswa dalam kondisi sangat baik untuk berkegiatan. Lanjutkan aktivitas fisik.',
      color: 'emerald',
      isDanger: false
    };
  } else if (multiplied > 100 && multiplied <= 120) {
    return {
      kategori: 'Takikardia Ringan',
      multiplied,
      interpretasi: 'Perlu pemantauan lanjut',
      tindakLanjut: 'Detak jantung tergolong cepat. Istirahat dan amati 10 menit.',
      color: 'amber',
      isDanger: false
    };
  } else {
    return {
      kategori: 'Takikardia',
      multiplied,
      interpretasi: 'Di atas batas aman',
      tindakLanjut: 'HENTIKAN AKTIVITAS! Siswa dilarang mengikuti Senam Anak Indonesia Hebat ataupun aktivitas fisik berat lainnya sampai detak jantung berada dalam kategori normal.',
      color: 'rose',
      isDanger: true
    };
  }
}

export interface FlexibilityInterpretation {
  kategori: string;
  rekSiswa: string;
  rekSekolah: string;
  rekOrangTua: string;
  color: string;
}

export function interpretFlexibility(flex: number | null | undefined, gender: 'L' | 'P' | string): FlexibilityInterpretation | null {
  if (flex === null || flex === undefined || isNaN(flex)) return null;
  
  let kategori = 'Sedang';
  const isMale = gender === 'L' || gender === 'l' || gender === 'Laki-laki' || gender === 'Laki-Laki';
  
  if (isMale) {
    if (flex >= 27) kategori = 'Baik Sekali';
    else if (flex >= 22) kategori = 'Baik';
    else if (flex >= 11) kategori = 'Sedang';
    else if (flex >= 5) kategori = 'Kurang';
    else kategori = 'Kurang Sekali';
  } else { // P
    if (flex >= 29) kategori = 'Baik Sekali';
    else if (flex >= 25) kategori = 'Baik';
    else if (flex >= 14) kategori = 'Sedang';
    else if (flex >= 9) kategori = 'Kurang';
    else kategori = 'Kurang Sekali';
  }

  switch (kategori) {
    case 'Baik Sekali':
      return {
        kategori,
        rekSiswa: 'Pertahankan latihan peregangan 3-5 kali per minggu. Ikuti ekstrakurikuler olahraga yang disukai.',
        rekSekolah: 'Jadikan murid sebagai peer motivator. Pertahankan program Penjaskes yang sudah berjalan.',
        rekOrangTua: 'Dukung kegiatan olahraga anak di luar sekolah. Apresiasi pencapaian anak agar tetap termotivasi.',
        color: 'emerald'
      };
    case 'Baik':
      return {
        kategori,
        rekSiswa: 'Lanjutkan peregangan rutin. Tambahkan yoga atau senam ringan 3 kali per minggu.',
        rekSekolah: 'Pertahankan program pemanasan wajib sebelum olahraga. Monitor di skrining berikutnya.',
        rekOrangTua: 'Dukung kebiasaan peregangan anak di rumah. Ajak olahraga bersama di akhir pekan.',
        color: 'teal'
      };
    case 'Sedang':
      return {
        kategori,
        rekSiswa: 'Tingkatkan peregangan menjadi 5 kali per minggu. Latih hip flexor dan punggung bawah secara rutin.',
        rekSekolah: 'Tambahkan porsi latihan fleksibilitas dalam pelajaran Penjaskes. Target naik kategori dalam 1 semester.',
        rekOrangTua: 'Ingatkan anak untuk peregangan setiap hari. Dukung dengan menyediakan ruang gerak di rumah.',
        color: 'blue'
      };
    case 'Kurang':
      return {
        kategori,
        rekSiswa: 'Lakukan peregangan setiap 10-15 menit. Duduk dan raih ujung kaki secara perlahan.',
        rekSekolah: 'Berikan program latihan fleksibilitas terstruktur. Skrining ulang dalam 3 bulan.',
        rekOrangTua: 'Dampingi anak berlatih peregangan di rumah. Konsultasikan ke guru Penjaskes untuk panduan latihan.',
        color: 'amber'
      };
    case 'Kurang Sekali':
    default:
      return {
        kategori,
        rekSiswa: 'Wajib peregangan intensif setiap hari. Ikuti bimbingan khusus dari guru Penjaskes.',
        rekSekolah: 'Rujuk ke program remedial Penjaskes. Koordinasi dengan orang tua untuk latihan di rumah. Skrining ulang dalam 2 bulan.',
        rekOrangTua: 'Sertakan anak dalam kegiatan fisik terstruktur di luar sekolah. Konsultasikan ke dokter jika ada keterbatasan fisik.',
        color: 'rose'
      };
  }
}

interface AnalisisKebugaranProps {
  adminEmail: string;
}

export default function AnalisisKebugaran({ adminEmail }: AnalisisKebugaranProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedImtStatus, setSelectedImtStatus] = useState('all');
  const [selectedAttendance, setSelectedAttendance] = useState('all');
  const [activeDay, setActiveDay] = useState<string>('1'); // '1', '2', '3', '4', '5'

  const [activeSubTab, setActiveSubTab] = useState<'analisis' | 'interpretasi' | 'data'>('analisis');

  // Interpretation tab states
  const [interpretType, setInterpretType] = useState<'siswa' | 'kelas' | 'kasus'>('siswa');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedInterpretClass, setSelectedInterpretClass] = useState<string>('all');
  const [selectedSpecialFilter, setSelectedSpecialFilter] = useState<'jantung' | 'gizi' | 'kelenturan'>('jantung');

  // Get attendance status of student on a specific day
  const getAttendanceForDay = (student: Student, day: string) => {
    if (!student.attendance_history) {
      if (day === '1' && student.attendance_status) {
        return student.attendance_status;
      }
      return null;
    }
    try {
      const history = JSON.parse(student.attendance_history);
      return history[day] || null;
    } catch (e) {
      if (day === '1' && student.attendance_status) {
        return student.attendance_status;
      }
      return null;
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [studList, classList] = await Promise.all([
          studentService.getStudents(),
          classService.getClasses()
        ]);
        setStudents(studList);
        setClasses(classList);
      } catch (err) {
        console.error('Error loading fitness analysis data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-select first assessed student for individual interpretation
  useEffect(() => {
    if (activeSubTab === 'interpretasi' && !selectedStudentId) {
      const assessed = students.filter(s => s.tb || s.bb || s.heart_rate || s.flexibility);
      if (assessed.length > 0) {
        setSelectedStudentId(assessed[0].id);
      }
    }
  }, [activeSubTab, students, selectedStudentId]);

  // Filter students
  const filteredStudents = students.filter(s => {
    // Search
    const matchesSearch = 
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nisn && s.nisn.includes(searchQuery));
    
    // Class filter
    const matchesClass = selectedClass === 'all' || s.class_id === selectedClass;

    // IMT filter
    const matchesImt = selectedImtStatus === 'all' || s.imt_status === selectedImtStatus;

    // Attendance filter
    const matchesAttendance = selectedAttendance === 'all' || 
      (selectedAttendance === 'Belum' ? !getAttendanceForDay(s, activeDay) : getAttendanceForDay(s, activeDay) === selectedAttendance);

    return matchesSearch && matchesClass && matchesImt && matchesAttendance;
  });

  // Calculate Metrics
  const totalSiswa = students.length;
  const totalWithFitness = students.filter(s => s.tb && s.bb).length;
  const pctFitness = totalSiswa > 0 ? Math.round((totalWithFitness / totalSiswa) * 100) : 0;

  // IMT Breakdowns
  const imtNormal = students.filter(s => s.imt_status === 'Normal').length;
  const imtKurus = students.filter(s => s.imt_status === 'Kurus').length;
  const imtSangatKurus = students.filter(s => s.imt_status === 'Sangat Kurus').length;
  const imtGemuk = students.filter(s => s.imt_status === 'Gemuk').length;
  const imtObesitas = students.filter(s => s.imt_status === 'Obesitas').length;

  const getImtPct = (count: number) => {
    return totalWithFitness > 0 ? Math.round((count / totalWithFitness) * 100) : 0;
  };

  // Attendance Breakdowns based on activeDay
  const attHadir = students.filter(s => getAttendanceForDay(s, activeDay) === 'Hadir').length;
  const attSakit = students.filter(s => getAttendanceForDay(s, activeDay) === 'Sakit').length;
  const attIzin = students.filter(s => getAttendanceForDay(s, activeDay) === 'Izin').length;
  const attAlpa = students.filter(s => getAttendanceForDay(s, activeDay) === 'Alpa').length;
  const attBelum = students.filter(s => !getAttendanceForDay(s, activeDay)).length;

  const getAttPct = (count: number) => {
    return totalSiswa > 0 ? Math.round((count / totalSiswa) * 100) : 0;
  };

  // Averages (using valid values)
  const validTbs = students.filter(s => s.tb).map(s => s.tb as number);
  const avgTb = validTbs.length > 0 ? Number((validTbs.reduce((a, b) => a + b, 0) / validTbs.length).toFixed(1)) : 0;

  const validBbs = students.filter(s => s.bb).map(s => s.bb as number);
  const avgBb = validBbs.length > 0 ? Number((validBbs.reduce((a, b) => a + b, 0) / validBbs.length).toFixed(1)) : 0;

  const validHeartRates = students.filter(s => s.heart_rate).map(s => s.heart_rate as number);
  const avgHeartRate = validHeartRates.length > 0 ? Number((validHeartRates.reduce((a, b) => a + b, 0) / validHeartRates.length).toFixed(0)) : 0;

  const validFlexibility = students.filter(s => s.flexibility).map(s => s.flexibility as number);
  const avgFlexibility = validFlexibility.length > 0 ? Number((validFlexibility.reduce((a, b) => a + b, 0) / validFlexibility.length).toFixed(1)) : 0;

  // IMT badge styles helper
  const getImtBadgeClass = (status: string | null | undefined) => {
    if (!status) return 'bg-slate-900 text-slate-500 border-slate-800';
    switch (status) {
      case 'Normal':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Kurus':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Sangat Kurus':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Gemuk':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Obesitas':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Export to Excel function
  const handleExportExcel = () => {
    const dataToExport = filteredStudents.map((s, index) => ({
      'No': index + 1,
      'No. Registrasi': s.registration_number,
      'Nama Lengkap': s.full_name,
      'NISN': s.nisn || '-',
      'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      'Kelas': s.class?.name || 'Belum Ditentukan',
      'Presensi H1': getAttendanceForDay(s, '1') || '-',
      'Presensi H2': getAttendanceForDay(s, '2') || '-',
      'Presensi H3': getAttendanceForDay(s, '3') || '-',
      'Presensi H4': getAttendanceForDay(s, '4') || '-',
      'Presensi H5': getAttendanceForDay(s, '5') || '-',
      'Tinggi Badan (cm)': s.tb || '-',
      'Berat Badan (kg)': s.bb || '-',
      'Denyut Jantung (bpm)': s.heart_rate || '-',
      'Fleksibilitas (cm)': s.flexibility || '-',
      'IMT (BMI)': s.imt || '-',
      'Status Kebugaran': s.imt_status || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Kebugaran');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 18 },
      { wch: 25 },
      { wch: 12 },
      { wch: 15 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 12 },
      { wch: 18 }
    ];

    XLSX.writeFile(workbook, `REKAP_KEHADIRAN_KEBUGARAN_MPLS_${new Date().getFullYear()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Selector */}
      <div className="flex border-b border-slate-800 gap-4 mb-6 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveSubTab('analisis')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'analisis'
              ? 'border-blue-500 text-blue-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Statistik & Analisis Kebugaran
        </button>
        <button
          onClick={() => setActiveSubTab('interpretasi')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'interpretasi'
              ? 'border-blue-500 text-blue-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Interpretasi & Rekomendasi (Analisis Sekolah)
        </button>
        <button
          onClick={() => setActiveSubTab('data')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'data'
              ? 'border-blue-500 text-blue-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Rekap Data Presensi & Kebugaran Siswa
        </button>
      </div>

      {activeSubTab === 'analisis' ? (
        /* ANALISIS TAB VIEW */
        <div className="space-y-6">
          {/* Averages Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Avg TB */}
            <div className="bg-[#1E293B]/60 border border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Rata-rata Tinggi</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Ruler className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-white block leading-none font-mono">
                  {loading ? '...' : `${avgTb} cm`}
                </span>
                <span className="text-[9px] text-slate-500 block mt-1.5">
                  Berdasarkan {totalWithFitness} siswa yang diasesmen
                </span>
              </div>
            </div>

            {/* Avg BB */}
            <div className="bg-[#1E293B]/60 border border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Rata-rata Berat</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-white block leading-none font-mono">
                  {loading ? '...' : `${avgBb} kg`}
                </span>
                <span className="text-[9px] text-slate-500 block mt-1.5">
                  Berdasarkan {totalWithFitness} siswa yang diasesmen
                </span>
              </div>
            </div>

            {/* Avg Heart Rate */}
            <div className="bg-[#1E293B]/60 border border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Rata-rata Denyut Jantung</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-white block leading-none font-mono">
                  {loading ? '...' : `${avgHeartRate} bpm`}
                </span>
                <span className="text-[9px] text-slate-500 block mt-1.5">
                  Nilai denyut jantung normal istirahat
                </span>
              </div>
            </div>

            {/* Avg Flexibility */}
            <div className="bg-[#1E293B]/60 border border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Rata-rata Fleksibilitas</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Heart className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-white block leading-none font-mono">
                  {loading ? '...' : `${avgFlexibility} cm`}
                </span>
                <span className="text-[9px] text-slate-500 block mt-1.5">
                  Kelenturan otot & sendi tubuh siswa
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* IMT Status Breakdown (7 cols) */}
            <div className="col-span-12 lg:col-span-7 bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white">Distribusi Indeks Massa Tubuh (IMT)</h3>
                    <p className="text-xs text-slate-500">Persentase status kebugaran fisik siswa terdaftar.</p>
                  </div>
                  <div className="px-3 py-1 bg-slate-950/60 border border-slate-850 rounded-xl text-[10px] text-slate-400">
                    Progres: <strong className="text-blue-400">{pctFitness}%</strong> Terasesmen
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-4 py-8">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-8 bg-slate-900/50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : totalWithFitness > 0 ? (
                  <div className="space-y-4">
                    {/* Normal */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">Normal (Ideal)</span>
                        <span className="text-emerald-400 font-bold font-mono">{imtNormal} Siswa ({getImtPct(imtNormal)}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                        <div style={{ width: `${getImtPct(imtNormal)}%` }} className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                      </div>
                    </div>

                    {/* Kurus */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">Kurus</span>
                        <span className="text-sky-400 font-bold font-mono">{imtKurus} Siswa ({getImtPct(imtKurus)}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                        <div style={{ width: `${getImtPct(imtKurus)}%` }} className="h-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
                      </div>
                    </div>

                    {/* Sangat Kurus */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">Sangat Kurus</span>
                        <span className="text-blue-400 font-bold font-mono">{imtSangatKurus} Siswa ({getImtPct(imtSangatKurus)}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                        <div style={{ width: `${getImtPct(imtSangatKurus)}%` }} className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                      </div>
                    </div>

                    {/* Gemuk */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">Gemuk</span>
                        <span className="text-amber-400 font-bold font-mono">{imtGemuk} Siswa ({getImtPct(imtGemuk)}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                        <div style={{ width: `${getImtPct(imtGemuk)}%` }} className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                      </div>
                    </div>

                    {/* Obesitas */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">Obesitas</span>
                        <span className="text-rose-400 font-bold font-mono">{imtObesitas} Siswa ({getImtPct(imtObesitas)}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                        <div style={{ width: `${getImtPct(imtObesitas)}%` }} className="h-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-600 text-xs italic">
                    Belum ada data kebugaran siswa yang diinput oleh binkel pendamping.
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Status (5 cols) */}
            <div className="col-span-12 lg:col-span-5 bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-6">Rekap Presensi Kehadiran Sekolah</h3>
                
                {loading ? (
                  <div className="space-y-4 py-8">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-8 bg-slate-900/50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Hadir */}
                    <div className="flex items-center justify-between p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                        <span className="text-xs font-bold text-slate-300">Hadir</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-emerald-400">{attHadir} Siswa ({getAttPct(attHadir)}%)</span>
                    </div>

                    {/* Sakit */}
                    <div className="flex items-center justify-between p-3.5 bg-sky-500/5 border border-sky-500/10 rounded-2xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 bg-sky-500 rounded-full" />
                        <span className="text-xs font-bold text-slate-300">Sakit</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-sky-400">{attSakit} Siswa ({getAttPct(attSakit)}%)</span>
                    </div>

                    {/* Izin */}
                    <div className="flex items-center justify-between p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                        <span className="text-xs font-bold text-slate-300">Izin</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-amber-400">{attIzin} Siswa ({getAttPct(attIzin)}%)</span>
                    </div>

                    {/* Alpa */}
                    <div className="flex items-center justify-between p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                        <span className="text-xs font-bold text-slate-300">Alpa</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-rose-400">{attAlpa} Siswa ({getAttPct(attAlpa)}%)</span>
                    </div>

                    {/* Belum Diisi */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-900/40 border border-slate-900 rounded-2xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 bg-slate-600 rounded-full" />
                        <span className="text-xs font-bold text-slate-400">Belum Input</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-500">{attBelum} Siswa ({getAttPct(attBelum)}%)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'interpretasi' ? (
        /* INTERPRETASI & REKOMENDASI VIEW */
        <div className="space-y-6">
          {/* Sub-selectors for Interpretation Type */}
          <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 gap-2 max-w-lg">
            <button
              onClick={() => setInterpretType('siswa')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                interpretType === 'siswa'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Analisis Per Siswa
            </button>
            <button
              onClick={() => setInterpretType('kelas')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                interpretType === 'kelas'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Analisis Per Kelas
            </button>
            <button
              onClick={() => setInterpretType('kasus')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                interpretType === 'kasus'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kasus Khusus & Perhatian
            </button>
          </div>

          {/* RENDERING INTERPRETATION CHUNKS BASED ON TYPE */}
          {interpretType === 'siswa' && (() => {
            const assessedStudents = students.filter(s => s.tb || s.bb || s.heart_rate || s.flexibility);
            const selectedStudent = students.find(s => s.id === selectedStudentId);
            const selectedClassData = selectedStudent ? classes.find(c => c.id === selectedStudent.class_id) : null;

            const imtData = selectedStudent ? interpretImt(selectedStudent.imt) : null;
            const hrData = selectedStudent ? interpretHeartRate(selectedStudent.heart_rate) : null;
            const flexData = selectedStudent ? interpretFlexibility(selectedStudent.flexibility, selectedStudent.gender) : null;

            if (assessedStudents.length === 0) {
              return (
                <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] p-12 text-center">
                  <Activity className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-sm font-bold text-slate-300">Belum Ada Data Kebugaran</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Data kebugaran siswa belum diisi oleh binkel pendamping. Silakan hubungi pendamping kelas untuk menginput data kebugaran siswa terlebih dahulu.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {/* Selector Header */}
                <div className="bg-[#0F172A] p-6 border border-slate-800 rounded-[2rem] flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full sm:w-80 bg-slate-950 border border-slate-800 text-slate-200 py-2 px-4 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">-- Pilih Siswa --</option>
                      {assessedStudents.map((s) => {
                        const cls = classes.find(c => c.id === s.class_id);
                        return (
                          <option key={s.id} value={s.id}>
                            {s.full_name} ({cls?.name || 'Tanpa Kelas'}) - NISN: {s.nisn || '-'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {selectedStudent && (
                    <div className="flex gap-4 self-stretch sm:self-auto text-xs font-mono text-slate-400 items-center justify-between sm:justify-start bg-slate-950 px-4 py-2 rounded-xl border border-slate-900">
                      <span>Kelas: <strong className="text-white">{selectedClassData?.name || '-'}</strong></span>
                      <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                      <span>Gender: <strong className="text-white">{selectedStudent.gender || '-'}</strong></span>
                    </div>
                  )}
                </div>

                {selectedStudent ? (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                    {/* IMT Analysis Card */}
                    <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col h-full hover:border-slate-700/60 transition-all">
                      <div className="p-6 border-b border-slate-800/60 bg-slate-900/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Scale className="w-4.5 h-4.5 text-blue-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Indeks Massa Tubuh (IMT)</h4>
                        </div>
                        {imtData && (
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-${imtData.color}-500/10 text-${imtData.color}-400 border border-${imtData.color}-500/10`}>
                            {imtData.status}
                          </span>
                        )}
                      </div>
                      <div className="p-6 space-y-5 flex-1">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-900">
                            <span className="text-[10px] text-slate-500 font-bold block mb-1">Tinggi</span>
                            <span className="text-sm font-bold font-mono text-white">{selectedStudent.tb || '-'} <span className="text-[10px] font-normal text-slate-400">cm</span></span>
                          </div>
                          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-900">
                            <span className="text-[10px] text-slate-500 font-bold block mb-1">Berat</span>
                            <span className="text-sm font-bold font-mono text-white">{selectedStudent.bb || '-'} <span className="text-[10px] font-normal text-slate-400">kg</span></span>
                          </div>
                          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-900">
                            <span className="text-[10px] text-slate-500 font-bold block mb-1">IMT</span>
                            <span className="text-sm font-bold font-mono text-white">{selectedStudent.imt || '-'}</span>
                          </div>
                        </div>

                        {imtData ? (
                          <div className="space-y-4">
                            <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-2xl">
                              <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block mb-1">Keterangan Hasil:</span>
                              <p className="text-xs text-slate-300 font-bold leading-relaxed">{imtData.hasil}</p>
                            </div>
                            <div className={`p-4 bg-${imtData.color}-500/5 border border-${imtData.color}-500/10 rounded-2xl`}>
                              <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block mb-1">Tindak Lanjut Sekolah:</span>
                              <p className="text-xs text-slate-300 leading-relaxed font-bold">{imtData.tindakLanjut}</p>
                            </div>
                            <div className="space-y-3 pt-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Rekomendasi Edukasi:</span>
                              <div className="space-y-2.5">
                                <div className="text-xs">
                                  <span className="font-bold text-blue-400 block mb-0.5">Siswa:</span>
                                  <p className="text-slate-400 leading-relaxed">{imtData.rekSiswa}</p>
                                </div>
                                <div className="text-xs">
                                  <span className="font-bold text-emerald-400 block mb-0.5">Sekolah / Guru:</span>
                                  <p className="text-slate-400 leading-relaxed">{imtData.rekSekolah}</p>
                                </div>
                                <div className="text-xs">
                                  <span className="font-bold text-purple-400 block mb-0.5">Orang Tua:</span>
                                  <p className="text-slate-400 leading-relaxed">{imtData.rekOrangTua}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 text-center py-6">Data tinggi/berat belum diinput dengan benar.</p>
                        )}
                      </div>
                    </div>

                    {/* Heart Rate Analysis Card */}
                    <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col h-full hover:border-slate-700/60 transition-all">
                      <div className="p-6 border-b border-slate-800/60 bg-slate-900/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Heart className="w-4.5 h-4.5 text-rose-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Denyut Jantung (HR)</h4>
                        </div>
                        {hrData && (
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-${hrData.color}-500/10 text-${hrData.color}-400 border border-${hrData.color}-500/10`}>
                            {hrData.kategori}
                          </span>
                        )}
                      </div>
                      <div className="p-6 space-y-5 flex-1">
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-900">
                            <span className="text-[10px] text-slate-500 font-bold block mb-1">Input Nadi (15 Detik)</span>
                            <span className="text-sm font-bold font-mono text-white">{selectedStudent.heart_rate || '-'} <span className="text-[10px] font-normal text-slate-400">kali</span></span>
                          </div>
                          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-900">
                            <span className="text-[10px] text-slate-500 font-bold block mb-1">Denyut Jantung (1 Menit)</span>
                            <span className="text-sm font-bold font-mono text-white">
                              {hrData ? `${selectedStudent.heart_rate} x 4 = ` : ''}
                              <strong className="text-rose-400">{hrData ? `${hrData.multiplied}` : '-'}</strong> <span className="text-[10px] font-normal text-slate-400">bpm</span>
                            </span>
                          </div>
                        </div>

                        {hrData ? (
                          <div className="space-y-4">
                            <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-2xl">
                              <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block mb-1">Interpretasi Kondisi:</span>
                              <p className="text-xs text-slate-300 font-bold leading-relaxed">{hrData.interpretasi}</p>
                            </div>
                            <div className={`p-4 rounded-2xl relative overflow-hidden ${
                              hrData.isDanger 
                                ? 'bg-rose-500/10 border border-rose-500/20 animate-pulse' 
                                : 'bg-slate-950 border border-slate-900'
                            }`}>
                              <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block mb-1">Tindak Lanjut & Keamanan:</span>
                              <p className="text-xs text-slate-200 leading-relaxed font-bold">{hrData.tindakLanjut}</p>
                            </div>
                            
                            <div className="pt-4 border-t border-slate-900 text-xs text-slate-400 space-y-2.5">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Acuan Klasifikasi Jantung (Nadi x 4):</span>
                              <div className="space-y-1 font-mono text-[10px] bg-slate-950 p-3 rounded-2xl border border-slate-900">
                                <div className="flex justify-between border-b border-slate-900 pb-1">
                                  <span>&lt; 60 bpm</span>
                                  <span className="text-blue-400 font-bold">Bradikardia</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-900 py-1">
                                  <span>60 - 100 bpm</span>
                                  <span className="text-emerald-400 font-bold">Normal</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-900 py-1">
                                  <span>101 - 120 bpm</span>
                                  <span className="text-amber-400 font-bold">Takikardia Ringan</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                  <span>&gt; 120 bpm</span>
                                  <span className="text-rose-400 font-bold">Takikardia</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 text-center py-6">Data denyut jantung belum diinput dengan benar.</p>
                        )}
                      </div>
                    </div>

                    {/* Flexibility Analysis Card */}
                    <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col h-full hover:border-slate-700/60 transition-all">
                      <div className="p-6 border-b border-slate-800/60 bg-slate-900/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Ruler className="w-4.5 h-4.5 text-teal-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Kelenturan (Sit & Reach)</h4>
                        </div>
                        {flexData && (
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-${flexData.color}-500/10 text-${flexData.color}-400 border border-${flexData.color}-500/10`}>
                            {flexData.kategori}
                          </span>
                        )}
                      </div>
                      <div className="p-6 space-y-5 flex-1">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 text-center">
                          <span className="text-[10px] text-slate-500 font-bold block mb-1">Hasil Jangkauan Kelenturan</span>
                          <span className="text-xl font-black font-mono text-white">
                            {selectedStudent.flexibility !== null && selectedStudent.flexibility !== undefined ? `${selectedStudent.flexibility} cm` : '-'}
                          </span>
                        </div>

                        {flexData ? (
                          <div className="space-y-4">
                            <div className="space-y-3">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Rekomendasi Latihan Kelenturan:</span>
                              <div className="space-y-2.5">
                                <div className="text-xs">
                                  <span className="font-bold text-blue-400 block mb-0.5">Siswa:</span>
                                  <p className="text-slate-400 leading-relaxed">{flexData.rekSiswa}</p>
                                </div>
                                <div className="text-xs">
                                  <span className="font-bold text-emerald-400 block mb-0.5">Sekolah / Guru:</span>
                                  <p className="text-slate-400 leading-relaxed">{flexData.rekSekolah}</p>
                                </div>
                                <div className="text-xs">
                                  <span className="font-bold text-purple-400 block mb-0.5">Orang Tua:</span>
                                  <p className="text-slate-400 leading-relaxed">{flexData.rekOrangTua}</p>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-slate-900 text-xs text-slate-400 space-y-2.5">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Standar Klasifikasi Kelenturan (Gender {selectedStudent.gender}):</span>
                              <div className="space-y-1 font-mono text-[10px] bg-slate-950 p-3 rounded-2xl border border-slate-900">
                                {selectedStudent.gender === 'L' ? (
                                  <>
                                    <div className="flex justify-between border-b border-slate-900 pb-1"><span>&gt;= 27 cm</span><span className="text-emerald-400">Baik Sekali</span></div>
                                    <div className="flex justify-between border-b border-slate-900 py-1"><span>22 - 26 cm</span><span className="text-teal-400">Baik</span></div>
                                    <div className="flex justify-between border-b border-slate-900 py-1"><span>11 - 21 cm</span><span className="text-blue-400">Sedang</span></div>
                                    <div className="flex justify-between border-b border-slate-900 py-1"><span>5 - 10 cm</span><span className="text-amber-400">Kurang</span></div>
                                    <div className="flex justify-between pt-1"><span>&lt; 5 cm</span><span className="text-rose-400">Kurang Sekali</span></div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex justify-between border-b border-slate-900 pb-1"><span>&gt;= 29 cm</span><span className="text-emerald-400">Baik Sekali</span></div>
                                    <div className="flex justify-between border-b border-slate-900 py-1"><span>25 - 28 cm</span><span className="text-teal-400">Baik</span></div>
                                    <div className="flex justify-between border-b border-slate-900 py-1"><span>14 - 24 cm</span><span className="text-blue-400">Sedang</span></div>
                                    <div className="flex justify-between border-b border-slate-900 py-1"><span>9 - 13 cm</span><span className="text-amber-400">Kurang</span></div>
                                    <div className="flex justify-between pt-1"><span>&lt; 9 cm</span><span className="text-rose-400">Kurang Sekali</span></div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 text-center py-6">Data kelenturan belum diinput dengan benar.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-12">Pilih siswa pada dropdown untuk memuat analisis.</p>
                )}
              </div>
            );
          })()}

          {interpretType === 'kelas' && (() => {
            const classStudents = students.filter(s => selectedInterpretClass === 'all' || s.class_id === selectedInterpretClass);
            const classAssessed = classStudents.filter(s => s.tb || s.bb || s.heart_rate || s.flexibility);
            const totalAssessed = classAssessed.length;

            // IMT aggregations
            const giziBuruk = classStudents.filter(s => s.imt !== null && s.imt !== undefined && s.imt < 17.0).length;
            const giziKurang = classStudents.filter(s => s.imt !== null && s.imt !== undefined && s.imt >= 17.0 && s.imt <= 18.4).length;
            const giziBaik = classStudents.filter(s => s.imt !== null && s.imt !== undefined && s.imt >= 18.5 && s.imt <= 25.0).length;
            const giziLebih = classStudents.filter(s => s.imt !== null && s.imt !== undefined && s.imt > 25.0 && s.imt <= 27.0).length;
            const giziObesitas = classStudents.filter(s => s.imt !== null && s.imt !== undefined && s.imt > 27.0).length;
            const totalImt = giziBuruk + giziKurang + giziBaik + giziLebih + giziObesitas;

            // HR aggregations
            const hrBradikardia = classStudents.filter(s => s.heart_rate !== null && s.heart_rate !== undefined && (s.heart_rate * 4) < 60).length;
            const hrNormal = classStudents.filter(s => s.heart_rate !== null && s.heart_rate !== undefined && (s.heart_rate * 4) >= 60 && (s.heart_rate * 4) <= 100).length;
            const hrTakikardiaRingan = classStudents.filter(s => s.heart_rate !== null && s.heart_rate !== undefined && (s.heart_rate * 4) > 100 && (s.heart_rate * 4) <= 120).length;
            const hrTakikardia = classStudents.filter(s => s.heart_rate !== null && s.heart_rate !== undefined && (s.heart_rate * 4) > 120).length;
            const totalHr = hrBradikardia + hrNormal + hrTakikardiaRingan + hrTakikardia;

            // Flexibility aggregations
            const flexBaikSekali = classStudents.filter(s => {
              if (s.flexibility === null || s.flexibility === undefined) return false;
              const isMale = s.gender === 'L' || s.gender === 'l' || s.gender === 'Laki-laki' || s.gender === 'Laki-Laki';
              return isMale ? s.flexibility >= 27 : s.flexibility >= 29;
            }).length;
            const flexBaik = classStudents.filter(s => {
              if (s.flexibility === null || s.flexibility === undefined) return false;
              const isMale = s.gender === 'L' || s.gender === 'l' || s.gender === 'Laki-laki' || s.gender === 'Laki-Laki';
              return isMale ? (s.flexibility >= 22 && s.flexibility < 27) : (s.flexibility >= 25 && s.flexibility < 29);
            }).length;
            const flexSedang = classStudents.filter(s => {
              if (s.flexibility === null || s.flexibility === undefined) return false;
              const isMale = s.gender === 'L' || s.gender === 'l' || s.gender === 'Laki-laki' || s.gender === 'Laki-Laki';
              return isMale ? (s.flexibility >= 11 && s.flexibility < 22) : (s.flexibility >= 14 && s.flexibility < 25);
            }).length;
            const flexKurang = classStudents.filter(s => {
              if (s.flexibility === null || s.flexibility === undefined) return false;
              const isMale = s.gender === 'L' || s.gender === 'l' || s.gender === 'Laki-laki' || s.gender === 'Laki-Laki';
              return isMale ? (s.flexibility >= 5 && s.flexibility < 11) : (s.flexibility >= 9 && s.flexibility < 14);
            }).length;
            const flexKurangSekali = classStudents.filter(s => {
              if (s.flexibility === null || s.flexibility === undefined) return false;
              const isMale = s.gender === 'L' || s.gender === 'l' || s.gender === 'Laki-laki' || s.gender === 'Laki-Laki';
              return isMale ? s.flexibility < 5 : s.flexibility < 9;
            }).length;
            const totalFlex = flexBaikSekali + flexBaik + flexSedang + flexKurang + flexKurangSekali;

            const getPct = (val: number, tot: number) => {
              if (!tot) return '0%';
              return `${Math.round((val / tot) * 100)}%`;
            };

            return (
              <div className="space-y-6">
                {/* Select Class Header */}
                <div className="bg-[#0F172A] p-6 border border-slate-800 rounded-[2rem] flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Pilih Ruang Kelas Analisis:</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Analisis agregat status gizi, denyut nadi harian, dan kelenturan seluruh siswa.</p>
                  </div>
                  <div className="relative w-full sm:w-60">
                    <select
                      value={selectedInterpretClass}
                      onChange={(e) => setSelectedInterpretClass(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-2 px-4 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="all">Semua Kelas</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          Kelas {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Distributions grids */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* IMT Status Distributions */}
                  <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                      <Scale className="w-4 h-4 text-blue-400" />
                      <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Distribusi Gizi (IMT)</h5>
                    </div>
                    {totalImt > 0 ? (
                      <div className="space-y-3">
                        {/* Gizi Baik */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-emerald-400">Gizi Baik</span>
                            <span className="text-slate-300 font-mono">{giziBaik} Siswa ({getPct(giziBaik, totalImt)})</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: getPct(giziBaik, totalImt) }} />
                          </div>
                        </div>
                        {/* Gizi Kurang */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-amber-400">Gizi Kurang</span>
                            <span className="text-slate-300 font-mono">{giziKurang} Siswa ({getPct(giziKurang, totalImt)})</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: getPct(giziKurang, totalImt) }} />
                          </div>
                        </div>
                        {/* Gizi Buruk */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-rose-400">Gizi Buruk</span>
                            <span className="text-slate-300 font-mono">{giziBuruk} Siswa ({getPct(giziBuruk, totalImt)})</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500" style={{ width: getPct(giziBuruk, totalImt) }} />
                          </div>
                        </div>
                        {/* Gizi Lebih */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-blue-400">Gizi Lebih</span>
                            <span className="text-slate-300 font-mono">{giziLebih} Siswa ({getPct(giziLebih, totalImt)})</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: getPct(giziLebih, totalImt) }} />
                          </div>
                        </div>
                        {/* Obesitas */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-purple-400">Obesitas</span>
                            <span className="text-slate-300 font-mono">{giziObesitas} Siswa ({getPct(giziObesitas, totalImt)})</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: getPct(giziObesitas, totalImt) }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-10">Belum ada data IMT untuk dianalisis.</p>
                    )}
                  </div>

                  {/* Heart Rate distributions */}
                  <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                      <Heart className="w-4 h-4 text-rose-400" />
                      <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Distribusi Detak Jantung</h5>
                    </div>
                    {totalHr > 0 ? (
                      <div className="space-y-3">
                        {/* Normal */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-emerald-400">Normal (60-100)</span>
                            <span className="text-slate-300 font-mono">{hrNormal} Siswa ({getPct(hrNormal, totalHr)})</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: getPct(hrNormal, totalHr) }} />
                          </div>
                        </div>
                        {/* Takikardia Ringan */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-amber-400">Takikardia Ringan (101-120)</span>
                            <span className="text-slate-300 font-mono">{hrTakikardiaRingan} Siswa ({getPct(hrTakikardiaRingan, totalHr)})</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: getPct(hrTakikardiaRingan, totalHr) }} />
                          </div>
                        </div>
                        {/* Takikardia */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-rose-400">
                            <span>Takikardia (&gt; 120)</span>
                            <span className="text-slate-300 font-mono">{hrTakikardia} Siswa ({getPct(hrTakikardia, totalHr)})</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500" style={{ width: getPct(hrTakikardia, totalHr) }} />
                          </div>
                        </div>
                        {/* Bradikardia */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-blue-400">Bradikardia (&lt; 60)</span>
                            <span className="text-slate-300 font-mono">{hrBradikardia} Siswa ({getPct(hrBradikardia, totalHr)})</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: getPct(hrBradikardia, totalHr) }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-10">Belum ada data denyut jantung untuk dianalisis.</p>
                    )}
                  </div>

                  {/* Flexibility distributions */}
                  <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                      <Ruler className="w-4 h-4 text-teal-400" />
                      <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Distribusi Kelenturan</h5>
                    </div>
                    {totalFlex > 0 ? (
                      <div className="space-y-3">
                        {/* Baik Sekali */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-emerald-400">Baik Sekali</span>
                            <span className="text-slate-300 font-mono">{flexBaikSekali} Siswa ({getPct(flexBaikSekali, totalFlex)})</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: getPct(flexBaikSekali, totalFlex) }} />
                          </div>
                        </div>
                        {/* Baik */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-teal-400">Baik</span>
                            <span className="text-slate-300 font-mono">{flexBaik} Siswa ({getPct(flexBaik, totalFlex)})</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500" style={{ width: getPct(flexBaik, totalFlex) }} />
                          </div>
                        </div>
                        {/* Sedang */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-blue-400">Sedang</span>
                            <span className="text-slate-300 font-mono">{flexSedang} Siswa ({getPct(flexSedang, totalFlex)})</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: getPct(flexSedang, totalFlex) }} />
                          </div>
                        </div>
                        {/* Kurang */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-amber-400">Kurang</span>
                            <span className="text-slate-300 font-mono">{flexKurang} Siswa ({getPct(flexKurang, totalFlex)})</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: getPct(flexKurang, totalFlex) }} />
                          </div>
                        </div>
                        {/* Kurang Sekali */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-rose-400">
                            <span>Kurang Sekali</span>
                            <span className="text-slate-300 font-mono">{flexKurangSekali} Siswa ({getPct(flexKurangSekali, totalFlex)})</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500" style={{ width: getPct(flexKurangSekali, totalFlex) }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-10">Belum ada data kelenturan untuk dianalisis.</p>
                    )}
                  </div>
                </div>

                {/* General action list recommendation */}
                <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 space-y-3">
                  <h5 className="text-xs font-black uppercase text-slate-300 tracking-wider">Rencana Tindakan Umum Sekolah (Agregat):</h5>
                  <div className="space-y-2 text-xs leading-relaxed text-slate-400">
                    {giziObesitas + giziLebih > totalImt * 0.3 && (
                      <div className="flex gap-2.5 items-start p-3 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                        <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <p><strong>REKOMENDASI GIZI LEBIH/OBESITAS:</strong> Lebih dari 30% siswa dalam kelas/sekolah berada di kategori Gizi Lebih atau Obesitas. Kantin sekolah sangat disarankan untuk menyajikan pilihan makanan yang lebih rendah lemak dan gula serta perbanyak aktivitas fisik harian.</p>
                      </div>
                    )}
                    {giziBuruk + giziKurang > totalImt * 0.2 && (
                      <div className="flex gap-2.5 items-start p-3 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <p><strong>REKOMENDASI GIZI KURANG/BURUK:</strong> Lebih dari 20% siswa memiliki berat badan di bawah normal. Sekolah dapat menginisiasi Program PMT (Pemberian Makanan Tambahan) berupa susu atau biskuit bergizi serta berkolaborasi dengan puskesmas untuk deteksi dini.</p>
                      </div>
                    )}
                    {flexKurang + flexKurangSekali > totalFlex * 0.3 && (
                      <div className="flex gap-2.5 items-start p-3 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p><strong>REKOMENDASI FLEKSIBILITAS:</strong> Sebagian besar siswa (&gt;30%) memiliki tingkat kelenturan Kurang / Kurang Sekali. Guru PJOK wajib memberikan bimbingan khusus gerakan peregangan (Stretching) sebelum kelas olahraga harian untuk menghindari cedera.</p>
                    </div>
                    )}
                    {hrTakikardia > 0 && (
                      <div className="flex gap-2.5 items-start p-3 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <p><strong>REKOMENDASI KESELAMATAN AKTIVITAS:</strong> Terdapat siswa dengan detak jantung di atas batas aman (Takikardia). Mohon wali kelas dan binkel pendamping segera membebaskan siswa bersangkutan dari kegiatan Senam Anak Indonesia Hebat harian atau olahraga intensif lainnya demi keselamatan.</p>
                      </div>
                    )}
                    {totalAssessed > 0 && (
                      <div className="flex gap-2.5 items-start p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <p><strong>PEMANTAUAN UMUM:</strong> SMAN 1 Bandung berkomitmen menjaga kebugaran jasmani siswa baru. Lakukan evaluasi berkala setiap akhir semester menggunakan instrumen Tes Kebugaran yang sama untuk mengukur efektivitas program olahraga sekolah.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table list of students in the class with dynamic status */}
                <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
                  <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/10">
                    <div>
                      <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Rapor Kebugaran Siswa Kelas</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Daftar siswa beserta rangkuman status kesehatan kebugaran jasmani.</p>
                    </div>
                    <span className="text-xs font-mono bg-slate-950 px-3 py-1 border border-slate-800 rounded-xl text-slate-400 font-bold">
                      Assessed: {totalAssessed} / {classStudents.length} Siswa
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950/80 border-b border-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                          <th className="py-4 px-6 font-black">Nama Siswa</th>
                          <th className="py-4 px-6 font-black">Kelas</th>
                          <th className="py-4 px-4 font-black">Status Gizi</th>
                          <th className="py-4 px-4 font-black">Detak Jantung (HR x 4)</th>
                          <th className="py-4 px-4 font-black">Kelenturan (cm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {classStudents.map((s) => {
                          const cls = classes.find(c => c.id === s.class_id);
                          const imtInt = interpretImt(s.imt);
                          const hrInt = interpretHeartRate(s.heart_rate);
                          const flexInt = interpretFlexibility(s.flexibility, s.gender);

                          return (
                            <tr key={s.id} className="hover:bg-slate-900/20 text-slate-300 font-bold">
                              <td className="py-3.5 px-6 font-bold text-white">
                                <div>{s.full_name}</div>
                                <div className="text-[10px] text-slate-500 font-normal font-mono">NISN: {s.nisn || '-'}</div>
                              </td>
                              <td className="py-3.5 px-6 text-slate-400">{cls?.name || '-'}</td>
                              <td className="py-3.5 px-4">
                                {imtInt ? (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-${imtInt.color}-500/10 text-${imtInt.color}-400 border border-${imtInt.color}-500/10`}>
                                    {imtInt.status} ({s.imt})
                                  </span>
                                ) : (
                                  <span className="text-slate-600 font-normal text-[10px]">-</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                {hrInt ? (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-${hrInt.color}-500/10 text-${hrInt.color}-400 border border-${hrInt.color}-500/10`}>
                                    {hrInt.kategori} ({hrInt.multiplied} bpm)
                                  </span>
                                ) : (
                                  <span className="text-slate-600 font-normal text-[10px]">-</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                {flexInt ? (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-${flexInt.color}-500/10 text-${flexInt.color}-400 border border-${flexInt.color}-500/10`}>
                                    {flexInt.kategori} ({s.flexibility} cm)
                                  </span>
                                ) : (
                                  <span className="text-slate-600 font-normal text-[10px]">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {interpretType === 'kasus' && (() => {
            let specialList: Student[] = [];
            let bannerTitle = '';
            let bannerContent = '';
            let colorTheme = 'rose';

            if (selectedSpecialFilter === 'jantung') {
              specialList = students.filter(s => s.heart_rate !== null && s.heart_rate !== undefined && (s.heart_rate * 4) > 120);
              bannerTitle = 'RISIKO JANTUNG / TAKIKARDIA';
              bannerContent = 'Siswa dalam daftar ini memiliki denyut nadi x 4 melebihi 120 bpm. Demi keselamatan, binkel pendamping Wajib membebaskan siswa ini dari Senam Anak Indonesia Hebat harian dan aktivitas fisik berat lainnya sampai memperoleh rekomendasi medis dokter.';
              colorTheme = 'rose';
            } else if (selectedSpecialFilter === 'gizi') {
              specialList = students.filter(s => s.imt !== null && s.imt !== undefined && (s.imt < 17.0 || s.imt > 27.0));
              bannerTitle = 'INTERVENSI GIZI (GIZI BURUK & OBESITAS)';
              bannerContent = 'Siswa dalam daftar ini mengalami masalah gizi berat (Gizi Buruk < 17.0 atau Obesitas > 27.0). Sekolah menyarankan bimbingan berkala dengan guru UKS, edukasi porsi makan teratur, koordinasi orang tua, serta rujukan ke ahli gizi / puskesmas.';
              colorTheme = 'purple';
            } else { // kelenturan
              specialList = students.filter(s => {
                if (s.flexibility === null || s.flexibility === undefined) return false;
                const isMale = s.gender === 'L' || s.gender === 'l' || s.gender === 'Laki-laki' || s.gender === 'Laki-Laki';
                return isMale ? s.flexibility < 5 : s.flexibility < 9;
              });
              bannerTitle = 'BIMBINGAN FLEXIBILITAS SANGAT KURANG';
              bannerContent = 'Siswa dalam daftar ini memiliki jangkauan kelenturan di bawah batas minimum kategori Kurang Sekali. Guru PJOK disarankan membimbing latihan peregangan secara mandiri, lembut, dan bertahap untuk menghindari kaku otot harian.';
              colorTheme = 'amber';
            }

            return (
              <div className="space-y-6">
                {/* Special cases selector header */}
                <div className="bg-[#0F172A] p-6 border border-slate-800 rounded-[2rem] flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Kategori Perhatian Khusus & Remedi:</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Daftar skrining otomatis siswa yang membutuhkan pemantauan intensif kesehatan sekolah.</p>
                  </div>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 w-full sm:w-auto">
                    <button
                      onClick={() => setSelectedSpecialFilter('jantung')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer ${
                        selectedSpecialFilter === 'jantung'
                          ? 'bg-rose-500/15 text-rose-400 font-extrabold border border-rose-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Risiko Jantung
                    </button>
                    <button
                      onClick={() => setSelectedSpecialFilter('gizi')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer ${
                        selectedSpecialFilter === 'gizi'
                          ? 'bg-purple-500/15 text-purple-400 font-extrabold border border-purple-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Intervensi Gizi
                    </button>
                    <button
                      onClick={() => setSelectedSpecialFilter('kelenturan')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer ${
                        selectedSpecialFilter === 'kelenturan'
                          ? 'bg-amber-500/15 text-amber-400 font-extrabold border border-amber-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Remedi Fleksibilitas
                    </button>
                  </div>
                </div>

                {/* Banner Callout */}
                <div className={`p-5 rounded-[2rem] bg-${colorTheme}-500/5 border border-${colorTheme}-500/10 flex gap-3.5 items-start`}>
                  <AlertCircle className={`w-5 h-5 text-${colorTheme}-400 shrink-0 mt-0.5`} />
                  <div className="space-y-1">
                    <h5 className={`text-xs font-black uppercase text-${colorTheme}-400 tracking-wider`}>{bannerTitle}</h5>
                    <p className="text-xs leading-relaxed text-slate-300 font-bold">{bannerContent}</p>
                  </div>
                </div>

                {/* List Box */}
                <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/10">
                    <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Hasil Skrining ({specialList.length} Siswa Terdeteksi)</h5>
                  </div>
                  {specialList.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-950/80 border-b border-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                            <th className="py-4 px-6 font-black">Nama Siswa</th>
                            <th className="py-4 px-6 font-black">Kelas</th>
                            <th className="py-4 px-6 font-black">Gender</th>
                            <th className="py-4 px-4 font-black">Nilai Terkait</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {specialList.map((s) => {
                            const cls = classes.find(c => c.id === s.class_id);
                            let metricVal = '';
                            if (selectedSpecialFilter === 'jantung') {
                              metricVal = `${s.heart_rate} bpm (Nadi 15s) -> ${s.heart_rate ? s.heart_rate * 4 : 0} bpm (HR)`;
                            } else if (selectedSpecialFilter === 'gizi') {
                              metricVal = `IMT: ${s.imt || '-'} (${s.bb} kg / ${s.tb} cm)`;
                            } else {
                              metricVal = `${s.flexibility} cm (Kelenturan)`;
                            }

                            return (
                              <tr key={s.id} className="hover:bg-slate-900/20 text-slate-300 font-bold">
                                <td className="py-4 px-6 font-bold text-white">
                                  <div>{s.full_name}</div>
                                  <div className="text-[10px] text-slate-500 font-normal font-mono">NISN: {s.nisn || '-'}</div>
                                </td>
                                <td className="py-4 px-6 text-slate-400">{cls?.name || '-'}</td>
                                <td className="py-4 px-6 text-slate-400">{s.gender || '-'}</td>
                                <td className={`py-4 px-4 font-bold font-mono text-${colorTheme}-400`}>{metricVal}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <Smile className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                      <h3 className="text-sm font-bold text-slate-300">Semua Kondisi Aman</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Tidak ada siswa terdeteksi dalam kategori perhatian khusus ini harian. Kondisi siswa terpantau sangat baik!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* REKAP DATA DETAIL TAB VIEW */
        <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Database Presensi & Kebugaran SMAN 1 Bandung</h3>
              <p className="text-xs text-slate-500">Hasil rekap input pendamping (binkel) untuk semua ruang kelas.</p>
            </div>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              EKSPOR REKAP EXCEL
            </button>
          </div>

          {/* Day selection tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-900 mb-4">
            <div className="px-3 py-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Hari MPLS (Filter Data Presensi):
            </div>
            {(['1', '2', '3', '4', '5'] as const).map((day) => {
              const isSelected = activeDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow shadow-blue-500/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Hari {day}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block animate-pulse" />}
                </button>
              );
            })}
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari siswa atau reg..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 pl-9 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3" />
            </div>

            {/* Class filter */}
            <div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Semua Ruang Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* IMT Status filter */}
            <div>
              <select
                value={selectedImtStatus}
                onChange={(e) => setSelectedImtStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Semua Kebugaran (IMT)</option>
                <option value="Normal">Normal (Ideal)</option>
                <option value="Kurus">Kurus</option>
                <option value="Sangat Kurus">Sangat Kurus</option>
                <option value="Gemuk">Gemuk</option>
                <option value="Obesitas">Obesitas</option>
              </select>
            </div>

            {/* Attendance filter */}
            <div>
              <select
                value={selectedAttendance}
                onChange={(e) => setSelectedAttendance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Semua Presensi</option>
                <option value="Hadir">Hadir</option>
                <option value="Sakit">Sakit</option>
                <option value="Izin">Izin</option>
                <option value="Alpa">Alpa</option>
                <option value="Belum">Belum Diinput</option>
              </select>
            </div>
          </div>

          {/* Main Table */}
          {loading ? (
            <div className="space-y-3 py-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-900/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pl-4">Siswa</th>
                    <th className="pb-3">Kelas & NISN</th>
                    <th className="pb-3 text-center">Kehadiran</th>
                    <th className="pb-3 text-center">Fisik (TB/BB)</th>
                    <th className="pb-3 text-center">Jantung / Sendi</th>
                    <th className="pb-3 pr-4 text-right">Hasil IMT (Status)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredStudents.map((s) => {
                    const statusVal = getAttendanceForDay(s, activeDay);
                    let attBadge = 'bg-slate-900 text-slate-400 border-slate-800';
                    if (statusVal === 'Hadir') attBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                    if (statusVal === 'Sakit') attBadge = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
                    if (statusVal === 'Izin') attBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    if (statusVal === 'Alpa') attBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                    return (
                      <tr key={s.id} className="hover:bg-slate-900/20 transition-colors text-xs text-slate-300">
                        {/* Student Name */}
                        <td className="py-3.5 pl-4">
                          <div>
                            <span className="font-bold text-slate-200 block">{s.full_name}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">{s.registration_number}</span>
                          </div>
                        </td>

                        {/* Class and NISN */}
                        <td className="py-3.5">
                          <span className="font-bold text-slate-400 block">{s.class?.name || 'Belum Masuk Kelas'}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">{s.nisn || '-'}</span>
                        </td>

                        {/* Kehadiran */}
                        <td className="py-3.5 text-center">
                          <span className={`px-2 py-1 border text-[10px] font-bold rounded-lg ${attBadge}`}>
                            {statusVal || 'Belum Input'}
                          </span>
                        </td>

                        {/* Fisik */}
                        <td className="py-3.5 text-center">
                          {s.tb && s.bb ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span>TB: <strong className="text-slate-200 font-mono">{s.tb} cm</strong></span>
                              <span>BB: <strong className="text-slate-200 font-mono">{s.bb} kg</strong></span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-600 italic">Belum Diasesmen</span>
                          )}
                        </td>

                        {/* Jantung & Sendi */}
                        <td className="py-3.5 text-center">
                          {s.heart_rate || s.flexibility ? (
                            <div className="flex flex-col items-center gap-0.5">
                              {s.heart_rate && <span>Nadi: <strong className="text-slate-200 font-mono">{s.heart_rate} bpm</strong></span>}
                              {s.flexibility && <span>Lentur: <strong className="text-slate-200 font-mono">{s.flexibility} cm</strong></span>}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-600 italic">-</span>
                          )}
                        </td>

                        {/* IMT Status */}
                        <td className="py-3.5 pr-4 text-right">
                          {s.imt ? (
                            <div className="inline-flex flex-col items-end">
                              <span className="text-xs font-bold text-slate-200 font-mono">{s.imt}</span>
                              <span className={`px-2 py-0.5 mt-0.5 border text-[9px] font-bold rounded-md ${getImtBadgeClass(s.imt_status)}`}>
                                {s.imt_status}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-600 italic">Belum Diisi</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-600 text-xs italic">
              Tidak ada data siswa yang cocok dengan filter yang dipilih.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
