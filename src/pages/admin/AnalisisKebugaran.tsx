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

  const [activeSubTab, setActiveSubTab] = useState<'analisis' | 'data'>('analisis');

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
      (selectedAttendance === 'Belum' ? !s.attendance_status : s.attendance_status === selectedAttendance);

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

  // Attendance Breakdowns
  const attHadir = students.filter(s => s.attendance_status === 'Hadir').length;
  const attSakit = students.filter(s => s.attendance_status === 'Sakit').length;
  const attIzin = students.filter(s => s.attendance_status === 'Izin').length;
  const attAlpa = students.filter(s => s.attendance_status === 'Alpa').length;
  const attBelum = students.filter(s => !s.attendance_status).length;

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
      'Presensi Kehadiran': s.attendance_status || 'Belum Diisi',
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
      { wch: 18 },
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
      <div className="flex border-b border-slate-800 gap-4 mb-6">
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
                    let attBadge = 'bg-slate-900 text-slate-400 border-slate-800';
                    if (s.attendance_status === 'Hadir') attBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                    if (s.attendance_status === 'Sakit') attBadge = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
                    if (s.attendance_status === 'Izin') attBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    if (s.attendance_status === 'Alpa') attBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

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
                            {s.attendance_status || 'Belum Input'}
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
