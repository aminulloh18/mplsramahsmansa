import { useEffect, useState } from 'react';
import {
  Users,
  Grid,
  Volume2,
  AlertCircle,
  Plus,
  FileSpreadsheet,
  Calendar,
  RefreshCw,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Smartphone,
  CheckCircle,
} from 'lucide-react';
import { Student, Class, Teacher, ActivityLog } from '../../types/database.types';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import { teacherService } from '../../services/teacherService';
import { localDb } from '../../services/localDb';
import ConfirmModal from '../../components/ConfirmModal';

interface DashboardProps {
  adminEmail: string;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ adminEmail, onNavigate }: DashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Reset states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [studList, classList, teachList] = await Promise.all([
          studentService.getStudents(),
          classService.getClasses(),
          teacherService.getTeachers(),
        ]);
        setStudents(studList);
        setClasses(classList);
        setTeachers(teachList);
        setLogs(localDb.getLogs());
      } catch (err) {
        console.error('Error loading dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const totalSiswa = students.length;
  const totalLaki = students.filter((s) => s.gender === 'L').length;
  const totalPerempuan = students.filter((s) => s.gender === 'P').length;
  
  const totalClasses = classes.length;
  const totalTeachers = teachers.length;

  const totalCapacity = classes.reduce((acc, curr) => acc + curr.quota, 0);
  const occupiedCapacity = students.filter((s) => s.status === 'Aktif' && s.class_id).length;
  const utilizationRate = totalCapacity > 0 ? Math.round((occupiedCapacity / totalCapacity) * 100) : 0;

  const activeAnnouncementsCount = localDb.getAnnouncements().filter((a) => a.status === 'Published').length;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/40 to-slate-900/40 border border-blue-500/20 p-6 rounded-[2rem] relative overflow-hidden shadow-md">
        <div className="relative z-10">
          <span className="text-[10px] text-blue-400 uppercase tracking-widest font-black block mb-1">
            PANEL UTAMA PANITIA
          </span>
          <h2 className="text-xl font-bold text-white">Selamat Datang, Admin SMAN 1 Bandung!</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sistem terhubung menggunakan mode database hibrid. Logged as: <span className="text-slate-200 font-mono font-bold">{adminEmail}</span>
          </p>
        </div>
        <div className="flex gap-2.5 relative z-10">
          <button
            onClick={() => onNavigate('siswa')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Siswa Baru
          </button>
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Data
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900/50 h-28 border border-slate-800 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : (
        /* Bento Grid 1: Stat Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1 */}
          <div className="bg-[#1E293B]/60 backdrop-blur border border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between group hover:border-blue-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Peserta Didik</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between mt-4">
              <div>
                <span className="text-3xl font-black text-white block leading-none">{totalSiswa}</span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  L: {totalLaki} | P: {totalPerempuan}
                </span>
              </div>
              <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-lg flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                Aktif
              </span>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-[#1E293B]/60 backdrop-blur border border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between group hover:border-emerald-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Ruang Kelas</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Grid className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between mt-4">
              <div>
                <span className="text-3xl font-black text-white block leading-none">{totalClasses}</span>
                <span className="text-[10px] text-slate-500 block mt-1">Regu MPLS SMANSA</span>
              </div>
              <span className="text-slate-400 text-xs font-semibold font-mono">
                {utilizationRate}% Terisi
              </span>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-[#1E293B]/60 backdrop-blur border border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between group hover:border-purple-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Guru Wali Kelas</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between mt-4">
              <div>
                <span className="text-3xl font-black text-white block leading-none">{totalTeachers}</span>
                <span className="text-[10px] text-slate-500 block mt-1">Tersedia untuk pembagian</span>
              </div>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-bold">
                100% Mapel
              </span>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-[#1E293B]/60 backdrop-blur border border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between group hover:border-amber-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pengumuman Aktif</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Volume2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between mt-4">
              <div>
                <span className="text-3xl font-black text-white block leading-none">{activeAnnouncementsCount}</span>
                <span className="text-[10px] text-slate-500 block mt-1">Published di panel siswa</span>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                Info Siswa
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Bento Grid Container */}
      <div className="grid grid-cols-12 gap-4">
        {/* LEFT COMPONENT: CLASSES KUOTA PROGRESS (8 cols) */}
        <div className="col-span-12 lg:col-span-8 bg-[#1E293B]/40 border border-slate-800 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Visualisasi Distribusi & Kuota Kelas</h3>
                <p className="text-xs text-slate-500">Progress ketersediaan dan tingkat keterisian siswa per rombongan belajar.</p>
              </div>
              <button
                onClick={() => onNavigate('kelas')}
                className="text-xs text-blue-400 font-bold hover:underline"
              >
                Ubah Kelas
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-900/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : classes.length > 0 ? (
              <div className="space-y-4">
                {classes.map((cls) => {
                  const registeredCount = students.filter(
                    (s) => s.class_id === cls.id && s.status === 'Aktif'
                  ).length;
                  const ratio = cls.quota > 0 ? Math.min(100, Math.round((registeredCount / cls.quota) * 100)) : 0;
                  return (
                    <div key={cls.id} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-slate-800 transition-all">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-slate-200">{cls.name} <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded ml-1 font-mono">{cls.code}</span></span>
                        <span className="text-slate-400">
                          <strong>{registeredCount}</strong> / {cls.quota} Siswa ({ratio}%)
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden relative">
                        <div
                          style={{ width: `${ratio}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            ratio >= 100
                              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                              : ratio >= 80
                              ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                              : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                          }`}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
                        <span>Wali: <strong className="text-slate-400">{cls.teacher?.name || '-'}</strong></span>
                        <span>Ruang: <strong className="text-slate-400">{cls.room_number || '-'}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                Belum ada data kelas yang didaftarkan.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COMPONENT: RECENT LOGS & ACTIVITY (4 cols) */}
        <div className="col-span-12 lg:col-span-4 bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="text-base font-bold text-white">Log Aktivitas Terbaru</h3>
                <p className="text-[10px] text-slate-500">Audit trail tindakan administratif panitia.</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {logs.length > 0 ? (
                logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950/40 rounded-xl border border-slate-900/60 flex gap-2.5">
                    <div className="w-1.5 bg-blue-500 rounded-full shrink-0 mt-1" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[9px] text-slate-500">
                        <span className="font-mono truncate">{log.user_email}</span>
                        <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-200">{log.action}</p>
                      <p className="text-[10px] text-slate-400 leading-normal">{log.details}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-600 text-xs italic">
                  Belum ada catatan aktivitas.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('logs')}
            className="w-full mt-6 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            LIHAT SEMUA LOG AKTIVITAS
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS BENTO ROW */}
      <div className="bg-[#1E293B]/30 border border-slate-800 rounded-[2rem] p-6">
        <h3 className="text-sm font-bold text-slate-300 mb-4">Aksi Cepat Menu</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('siswa')}
            className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 hover:border-blue-500/40 transition-all flex flex-col items-center gap-2 group cursor-pointer text-center"
          >
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Kelola Siswa Baru</span>
            <span className="text-[10px] text-slate-500">CRUD & Import Excel</span>
          </button>

          <button
            onClick={() => onNavigate('kelas')}
            className="p-4 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 hover:border-emerald-500/40 transition-all flex flex-col items-center gap-2 group cursor-pointer text-center"
          >
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
              <Grid className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Alokasi Kelas & Regu</span>
            <span className="text-[10px] text-slate-500">Regu & Link Grup WA</span>
          </button>

          <button
            onClick={() => onNavigate('pengumuman')}
            className="p-4 rounded-2xl bg-amber-600/10 border border-amber-500/20 hover:bg-amber-600/20 hover:border-amber-500/40 transition-all flex flex-col items-center gap-2 group cursor-pointer text-center"
          >
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <Volume2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Publish Berita</span>
            <span className="text-[10px] text-slate-500">Draft & Pin Aturan</span>
          </button>

          <button
            onClick={() => onNavigate('pengaturan')}
            className="p-4 rounded-2xl bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 hover:border-purple-500/40 transition-all flex flex-col items-center gap-2 group cursor-pointer text-center"
          >
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Set Target Tanggal</span>
            <span className="text-[10px] text-slate-500">Logo & Kontak Panitia</span>
          </button>
        </div>
      </div>

      {/* RESET DATABASE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset Seluruh Data"
        message="Apakah Anda yakin ingin menyetel ulang seluruh data database lokal ke pengaturan awal sekolah? Tindakan ini akan menghapus semua perubahan buatan Anda."
        confirmText="Reset Data"
        cancelText="Batal"
        onConfirm={() => {
          localDb.resetAll();
          setIsResetModalOpen(false);
        }}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}
