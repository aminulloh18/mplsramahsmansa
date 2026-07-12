import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  CheckCircle2,
  Heart,
  Activity,
  Scale,
  Ruler,
  Save,
  Search,
  Check,
  AlertCircle,
  Sparkles,
  Info,
  ChevronRight,
  Smile,
  LogOut
} from 'lucide-react';
import { Student, Class } from '../../types/database.types';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import { localDb } from '../../services/localDb';
import { UserSession } from '../../services/authService';

interface BinkelDashboardProps {
  session: UserSession;
  onLogout?: () => void;
}

export default function BinkelDashboard({ session, onLogout }: BinkelDashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [classDetail, setClassDetail] = useState<Class | null>(null);

  // Modal State for Fitness Assessment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [tb, setTb] = useState<string>('');
  const [bb, setBb] = useState<string>('');
  const [heartRate, setHeartRate] = useState<string>('');
  const [flexibility, setFlexibility] = useState<string>('');

  // Auto-calculated IMT preview in modal
  const [imtPreview, setImtPreview] = useState<{ value: number; status: string } | null>(null);

  // Success Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const allStudents = await studentService.getStudents();
      const allClasses = await classService.getClasses();

      // Find the specific class this Binkel mentors
      const targetClass = allClasses.find(c => c.id === session.classId);
      if (targetClass) {
        setClassDetail(targetClass);
      }

      // Filter students who are active and belong to this class
      const classStudents = allStudents.filter(
        s => s.class_id === session.classId && s.status === 'Aktif'
      );
      setStudents(classStudents);
    } catch (err) {
      console.error('Gagal mengambil data Binkel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session.classId]);

  // Live IMT calculation in the form
  useEffect(() => {
    const w = parseFloat(bb);
    const h = parseFloat(tb);
    if (!isNaN(w) && !isNaN(h) && h > 0) {
      const heightM = h / 100;
      const imt = Number((w / (heightM * heightM)).toFixed(1));
      let status = 'Normal';
      if (imt < 17.0) {
        status = 'Sangat Kurus';
      } else if (imt >= 17.0 && imt < 18.5) {
        status = 'Kurus';
      } else if (imt >= 18.5 && imt <= 25.0) {
        status = 'Normal';
      } else if (imt > 25.0 && imt <= 27.0) {
        status = 'Gemuk';
      } else {
        status = 'Obesitas';
      }
      setImtPreview({ value: imt, status });
    } else {
      setImtPreview(null);
    }
  }, [tb, bb]);

  // Handle live Attendance Status update
  const handleAttendanceChange = async (studentId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | null) => {
    try {
      // Find current student object
      const currentStudent = students.find(s => s.id === studentId);
      if (!currentStudent) return;

      // Update in state locally for instant feedback
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, attendance_status: status } : s));

      // Call service to update
      await studentService.updateStudent(studentId, { attendance_status: status }, session.email);
      showToast(`Berhasil memperbarui presensi ${currentStudent.full_name}.`);
    } catch (err) {
      console.error('Gagal memperbarui presensi:', err);
      alert('Gagal menyimpan perubahan presensi.');
    }
  };

  // Handle live Graduation Status update
  const handleGraduationChange = async (studentId: string, status: 'Lulus' | 'Tidak Lulus' | null) => {
    try {
      const currentStudent = students.find(s => s.id === studentId);
      if (!currentStudent) return;

      // Update local state instantly
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, graduation_status: status } : s));

      // Save to DB
      await studentService.updateStudent(studentId, { graduation_status: status }, session.email);
      showToast(`Berhasil memperbarui status kelulusan ${currentStudent.full_name} menjadi ${status || 'Belum Set'}.`);
    } catch (err) {
      console.error('Gagal memperbarui status kelulusan:', err);
      alert('Gagal menyimpan perubahan status kelulusan.');
    }
  };

  // Open Modal for Fitness Assessment
  const openFitnessModal = (student: Student) => {
    setSelectedStudent(student);
    setTb(student.tb ? student.tb.toString() : '');
    setBb(student.bb ? student.bb.toString() : '');
    setHeartRate(student.heart_rate ? student.heart_rate.toString() : '');
    setFlexibility(student.flexibility ? student.flexibility.toString() : '');
    setIsModalOpen(true);
  };

  // Save Fitness Assessment
  const handleSaveFitness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const w = parseFloat(bb);
      const h = parseFloat(tb);
      const hr = parseInt(heartRate);
      const flex = parseFloat(flexibility);

      const updates: Partial<Student> = {
        tb: isNaN(h) ? null : h,
        bb: isNaN(w) ? null : w,
        heart_rate: isNaN(hr) ? null : hr,
        flexibility: isNaN(flex) ? null : flex,
        imt: imtPreview ? imtPreview.value : null,
        imt_status: imtPreview ? imtPreview.status : null,
      };

      // Update local state instantly
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, ...updates } : s));

      // Call service to update
      await studentService.updateStudent(selectedStudent.id, updates, session.email);
      
      setIsModalOpen(false);
      setSelectedStudent(null);
      showToast(`Asesmen kebugaran ${selectedStudent.full_name} berhasil disimpan.`);
    } catch (err) {
      console.error('Gagal menyimpan data kebugaran:', err);
      alert('Gagal menyimpan data kebugaran.');
    }
  };

  // Filters students based on search input
  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.registration_number.toLowerCase().includes(q) ||
      (s.nisn && s.nisn.includes(q))
    );
  });

  // Calculate Attendance Stats for display
  const totalStudents = students.length;
  const attendedCount = students.filter(s => s.attendance_status === 'Hadir').length;
  const sickCount = students.filter(s => s.attendance_status === 'Sakit').length;
  const permissionCount = students.filter(s => s.attendance_status === 'Izin').length;
  const alphaCount = students.filter(s => s.attendance_status === 'Alpa').length;
  const notFilledCount = students.filter(s => !s.attendance_status).length;

  const fitnessCompletedCount = students.filter(s => s.tb && s.bb).length;

  // IMT Colors map
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

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-emerald-500/20 animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Welcome & Info Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900/40 border border-emerald-500/20 p-6 rounded-[2rem] relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black block mb-1">
              PANEL PENDAMPING KELAS (BINKEL)
            </span>
            <h2 className="text-xl font-bold text-white">Selamat Bekerja, {session.binkelName}!</h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Silakan input Kehadiran (Presensi) dan Asesmen Kebugaran siswa baru di kelas binaan Anda: <strong className="text-emerald-400 font-bold">{session.className}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Ruang Kelas</span>
              <span className="font-bold text-slate-200">{classDetail?.room_number || '-'}</span>
            </div>
            <div className="px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Wali Kelas</span>
              <span className="font-bold text-slate-200 truncate max-w-[120px] block">{classDetail?.teacher?.name || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Class Statistics Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Students */}
        <div className="bg-[#1E293B]/60 border border-slate-800/80 rounded-[1.5rem] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Siswa Binaan</span>
            <Users className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-white leading-none block">{totalStudents}</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Total Aktif di {session.className}</span>
          </div>
        </div>

        {/* Attendance - Hadir */}
        <div className="bg-[#1E293B]/60 border border-slate-800/80 rounded-[1.5rem] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Hadir</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-emerald-400 leading-none block">{attendedCount}</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">{totalStudents > 0 ? Math.round((attendedCount / totalStudents) * 100) : 0}% Tingkat Kehadiran</span>
          </div>
        </div>

        {/* Attendance - Sakit / Izin */}
        <div className="bg-[#1E293B]/60 border border-slate-800/80 rounded-[1.5rem] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Sakit / Izin</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-amber-400 leading-none block">{sickCount + permissionCount}</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Sakit: {sickCount} | Izin: {permissionCount}</span>
          </div>
        </div>

        {/* Attendance - Alpa / Belum Diisi */}
        <div className="bg-[#1E293B]/60 border border-slate-800/80 rounded-[1.5rem] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Alpa & Belum Set</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-rose-400 leading-none block">{alphaCount + notFilledCount}</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Alpa: {alphaCount} | Belum: {notFilledCount}</span>
          </div>
        </div>

        {/* Fitness assessment progress */}
        <div className="bg-[#1E293B]/60 border border-slate-800/80 rounded-[1.5rem] p-4 col-span-2 md:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Asesmen Kebugaran</span>
            <Heart className="w-3.5 h-3.5 text-pink-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-pink-400 leading-none block">{fitnessCompletedCount} / {totalStudents}</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">{totalStudents > 0 ? Math.round((fitnessCompletedCount / totalStudents) * 100) : 0}% Data Lengkap</span>
          </div>
        </div>
      </div>

      {/* Interactive Student Attendance & Fitness Panel */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 shadow-xl space-y-4">
        {/* Search and control bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Input Presensi & Kebugaran</h3>
            <p className="text-xs text-slate-500">Hasil input presensi dan kebugaran akan langsung otomatis tersimpan.</p>
          </div>
          
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Cari nama atau No. Reg..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
          </div>
        </div>

        {/* Interactive list table */}
        {loading ? (
          <div className="space-y-3 py-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-900/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pl-4">Siswa</th>
                  <th className="pb-3">NISN / Gender</th>
                  <th className="pb-3 text-center">Presensi Kehadiran</th>
                  <th className="pb-3 text-center">Asesmen Kebugaran & IMT</th>
                  <th className="pb-3 text-center">Kelulusan MPLS</th>
                  <th className="pb-3 pr-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredStudents.map((student) => {
                  return (
                    <tr key={student.id} className="hover:bg-slate-900/30 transition-colors group">
                      {/* Siswa column */}
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center font-bold text-xs text-emerald-400 border border-slate-800/60">
                            {student.full_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-200 text-xs block">{student.full_name}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">{student.registration_number}</span>
                          </div>
                        </div>
                      </td>

                      {/* NISN / Gender column */}
                      <td className="py-4 text-xs text-slate-400">
                        <span className="block font-mono">{student.nisn || '-'}</span>
                        <span className="text-[10px] text-slate-500">{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                      </td>

                      {/* Presensi Kehadiran column */}
                      <td className="py-4">
                        <div className="flex items-center justify-center gap-1">
                          {(['Hadir', 'Sakit', 'Izin', 'Alpa'] as const).map((status) => {
                            const isSelected = student.attendance_status === status;
                            let btnClass = 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-300';
                            
                            if (isSelected) {
                              if (status === 'Hadir') btnClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                              if (status === 'Sakit') btnClass = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
                              if (status === 'Izin') btnClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                              if (status === 'Alpa') btnClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                            }

                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleAttendanceChange(student.id, isSelected ? null : status)}
                                className={`px-2.5 py-1.5 border text-[10px] font-bold rounded-lg transition-all cursor-pointer ${btnClass}`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Kebugaran details column */}
                      <td className="py-4 text-center">
                        {student.tb && student.bb ? (
                          <div className="inline-flex flex-col items-center">
                            <div className="flex gap-2.5 text-[10px] text-slate-400">
                              <span>TB: <strong className="text-slate-200">{student.tb} cm</strong></span>
                              <span>BB: <strong className="text-slate-200">{student.bb} kg</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-slate-500">
                                IMT: <strong className="text-slate-300 font-mono">{student.imt}</strong>
                              </span>
                              <span className={`px-1.5 py-0.5 border text-[9px] font-bold rounded-md ${getImtBadgeClass(student.imt_status)}`}>
                                {student.imt_status}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600 italic">Belum diasesmen</span>
                        )}
                      </td>

                      {/* Kelulusan MPLS column */}
                      <td className="py-4">
                        <div className="flex items-center justify-center gap-1">
                          {([null, 'Lulus', 'Tidak Lulus'] as const).map((gStatus) => {
                            const isSelected = (student.graduation_status || null) === gStatus;
                            let btnClass = 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-300';
                            
                            if (isSelected) {
                              if (gStatus === null) btnClass = 'bg-slate-800 text-slate-300 border-slate-700';
                              if (gStatus === 'Lulus') btnClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                              if (gStatus === 'Tidak Lulus') btnClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                            }

                            return (
                              <button
                                key={gStatus || 'belum'}
                                type="button"
                                onClick={() => handleGraduationChange(student.id, gStatus)}
                                className={`px-2 py-1.5 border text-[10px] font-bold rounded-lg transition-all cursor-pointer ${btnClass}`}
                              >
                                {gStatus === null ? 'Belum Set' : gStatus}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Action column */}
                      <td className="py-4 pr-4 text-right">
                        <button
                          type="button"
                          onClick={() => openFitnessModal(student)}
                          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
                        >
                          {student.tb && student.bb ? 'Ubah Kebugaran' : 'Asesmen Kebugaran'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-600 text-xs italic">
            {searchQuery ? 'Tidak ada siswa yang cocok dengan pencarian Anda.' : 'Belum ada data siswa di kelas binaan Anda.'}
          </div>
        )}
      </div>

      {/* FITNESS ASSESSMENT INPUT MODAL */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Glass line effect */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50" />

            {/* Header */}
            <div className="mb-6">
              <span className="text-[9px] text-pink-400 font-black uppercase tracking-widest block mb-1">
                INPUT ASESMEN FISIK & KEBUGARAN
              </span>
              <h3 className="text-base font-bold text-white truncate">{selectedStudent.full_name}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{selectedStudent.registration_number}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveFitness} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* TB */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Tinggi Badan (TB)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={tb}
                      onChange={(e) => setTb(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                    <Ruler className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3" />
                    <span className="text-[10px] text-slate-500 absolute right-3.5 top-3">cm</span>
                  </div>
                </div>

                {/* BB */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Berat Badan (BB)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={bb}
                      onChange={(e) => setBb(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                    <Scale className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3" />
                    <span className="text-[10px] text-slate-500 absolute right-3.5 top-3">kg</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Denyut Jantung */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Denyut Jantung
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                    <Activity className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3" />
                    <span className="text-[10px] text-slate-500 absolute right-3.5 top-3">bpm</span>
                  </div>
                </div>

                {/* Fleksibilitas */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Fleksibilitas
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={flexibility}
                      onChange={(e) => setFlexibility(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3" />
                    <span className="text-[10px] text-slate-500 absolute right-3.5 top-3">cm</span>
                  </div>
                </div>
              </div>

              {/* IMT Preview Output Box */}
              {imtPreview ? (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">
                      Perhitungan IMT (BMI) Otomatis
                    </span>
                    <span className="text-xl font-mono font-black text-white">
                      {imtPreview.value}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 block mb-1">Status Kebugaran</span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getImtBadgeClass(imtPreview.status)}`}>
                      {imtPreview.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-900 flex items-center gap-2.5 text-[11px] text-slate-500">
                  <Info className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Masukkan data Tinggi Badan dan Berat Badan untuk menghitung IMT secara real-time.</span>
                </div>
              )}

              {/* Form buttons */}
              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedStudent(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-800 hover:bg-slate-950 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl transition-all shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Simpan Asesmen
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
