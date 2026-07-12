import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  X,
  MessageCircle,
  QrCode,
  MapPin,
  Building,
  User,
  Users,
} from 'lucide-react';
import { Class, Teacher, Student } from '../../types/database.types';
import { classService } from '../../services/classService';
import { teacherService } from '../../services/teacherService';
import { studentService } from '../../services/studentService';
import ConfirmModal from '../../components/ConfirmModal';

interface DataKelasProps {
  adminEmail: string;
}

export default function DataKelas({ adminEmail }: DataKelasProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<Partial<Class> | null>(null);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classIdToDelete, setClassIdToDelete] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classList, teachList, studList] = await Promise.all([
        classService.getClasses(),
        teacherService.getTeachers(),
        studentService.getStudents(),
      ]);
      setClasses(classList);
      setTeachers(teachList);
      setStudents(studList);
    } catch (err) {
      console.error('Failed to load data in Class Panel', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteTrigger = (id: string) => {
    setClassIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!classIdToDelete) return;
    try {
      await classService.deleteClass(classIdToDelete, adminEmail);
      setIsDeleteModalOpen(false);
      setClassIdToDelete(null);
      loadData();
    } catch (err) {
      alert('Gagal menghapus kelas.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass?.name || !currentClass?.code) {
      alert('Mohon isi Nama Kelas dan Kode Kelas.');
      return;
    }

    // Auto calculate QR Code if whatsapp link provided
    let qr_code_link = currentClass.qr_code_link;
    if (currentClass.whatsapp_link && (!qr_code_link || qr_code_link === '')) {
      qr_code_link = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
        currentClass.whatsapp_link
      )}`;
    }

    const payload = {
      ...currentClass,
      quota: Number(currentClass.quota || 36),
      floor: Number(currentClass.floor || 1),
      qr_code_link,
    };

    try {
      if (currentClass.id) {
        await classService.updateClass(currentClass.id, payload, adminEmail);
      } else {
        await classService.createClass(
          payload as Omit<Class, 'id' | 'created_at' | 'updated_at'>,
          adminEmail
        );
      }
      setIsModalOpen(false);
      setCurrentClass(null);
      loadData();
    } catch (err) {
      alert('Gagal menyimpan kelas.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Alokasi & Manajemen Regu & Kelas</h2>
          <p className="text-xs text-slate-500">
            Kelola pembagian rombongan belajar, kapasitas kuota, wali kelas, link komunikasi WhatsApp, dan nama regu MPLS.
          </p>
        </div>

        <button
          onClick={() => {
            setCurrentClass({
              name: '',
              code: '',
              quota: 36,
              regu: 'Regu 1',
              floor: 1,
              room_number: '',
              whatsapp_link: '',
              qr_code_link: '',
              teacher_id: '',
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Kelas
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-900/50 h-56 border border-slate-800 rounded-[2rem]" />
          ))}
        </div>
      ) : classes.length > 0 ? (
        /* Bento Grid: Class Card Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const occupied = students.filter((s) => s.class_id === cls.id && s.status === 'Aktif').length;
            const ratio = cls.quota > 0 ? Math.min(100, Math.round((occupied / cls.quota) * 100)) : 0;
            return (
              <div
                key={cls.id}
                className="bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 shadow-lg flex flex-col justify-between group hover:border-slate-700 transition-all"
              >
                <div>
                  {/* Header Card */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <span className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                        KODE: {cls.code}
                      </span>
                      <h3 className="text-lg font-black text-white mt-1.5">{cls.name}</h3>
                    </div>
                    
                    {/* Actions dropdown */}
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setCurrentClass(cls);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTrigger(cls.id)}
                        className="p-1.5 hover:bg-rose-950/20 rounded-lg text-rose-400 hover:text-rose-500 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress seats */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Okupansi Kuota Kelas:</span>
                      <span className="font-bold text-slate-200">{occupied} / {cls.quota} Kursi</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${ratio}%` }}
                        className={`h-full rounded-full ${ratio >= 100 ? 'bg-rose-500' : 'bg-blue-500'}`}
                      />
                    </div>
                  </div>

                  {/* Class specs metadata */}
                  <div className="space-y-2 py-3 border-y border-slate-900 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>Regu: <strong className="text-slate-200">{cls.regu || '-'}</strong> (Lantai {cls.floor})</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{cls.room_number || 'Belum Ditentukan'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Wali Kelas: <strong className="text-slate-200">{cls.teacher?.name || 'Belum Di-Map'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>Binkel: <strong className="text-slate-200">{cls.binkel_name || 'Belum Di-Set'}</strong> {cls.binkel_phone ? `(${cls.binkel_phone})` : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Group Links */}
                <div className="mt-4 pt-2 flex items-center justify-between gap-2">
                  {cls.whatsapp_link ? (
                    <a
                      href={cls.whatsapp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Link Grup WA
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-600 italic">No WA Group Link</span>
                  )}

                  {cls.qr_code_link ? (
                    <a
                      href={cls.qr_code_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1"
                      title="Lihat QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                      <span className="text-[10px] font-medium px-1">QR Code</span>
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-[2rem] text-slate-500 text-xs italic">
          Belum ada kelas terdaftar. Tambahkan kelas baru di kanan atas.
        </div>
      )}

      {/* FORM MODAL (Add / Edit Class) */}
      {isModalOpen && currentClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
              <div>
                <h3 className="text-base font-black text-white">
                  {currentClass.id ? 'Edit Informasi Ruang Kelas' : 'Tambah Rombongan Belajar Baru'}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Lengkapi rincian kapasitas kuota dan pendamping kelas.</p>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nama Kelas</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kelas X-1"
                      value={currentClass.name || ''}
                      onChange={(e) => setCurrentClass({ ...currentClass, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Kode Kelas (Unique)</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: X-1"
                      value={currentClass.code || ''}
                      onChange={(e) => setCurrentClass({ ...currentClass, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Kapasitas Kursi (Kuota)</label>
                    <input
                      type="number"
                      required
                      value={currentClass.quota || 36}
                      onChange={(e) => setCurrentClass({ ...currentClass, quota: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Pendamping Wali Kelas</label>
                    <select
                      value={currentClass.teacher_id || ''}
                      onChange={(e) => setCurrentClass({ ...currentClass, teacher_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300"
                    >
                      <option value="">-- Tanpa Wali Kelas --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (Mapel: {t.subject})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nama Regu MPLS</label>
                    <input
                      type="text"
                      placeholder="Contoh: Regu 1 (Ksatria)"
                      value={currentClass.regu || ''}
                      onChange={(e) => setCurrentClass({ ...currentClass, regu: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Lantai</label>
                    <input
                      type="number"
                      value={currentClass.floor || 1}
                      onChange={(e) => setCurrentClass({ ...currentClass, floor: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nomor / Nama Ruangan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ruang 101"
                    value={currentClass.room_number || ''}
                    onChange={(e) => setCurrentClass({ ...currentClass, room_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Tautan WhatsApp Group Kelas</label>
                  <input
                    type="url"
                    placeholder="Contoh: https://chat.whatsapp.com/..."
                    value={currentClass.whatsapp_link || ''}
                    onChange={(e) => setCurrentClass({ ...currentClass, whatsapp_link: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nama Kakak Binkel (OSIS/MPK)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Kak Farhan (OSIS)"
                      value={currentClass.binkel_name || ''}
                      onChange={(e) => setCurrentClass({ ...currentClass, binkel_name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">No. HP Kakak Binkel</label>
                    <input
                      type="text"
                      placeholder="Contoh: 081234567890"
                      value={currentClass.binkel_phone || ''}
                      onChange={(e) => setCurrentClass({ ...currentClass, binkel_phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Link Custom QR Code (Opsional)</label>
                  <input
                    type="url"
                    placeholder="Biarkan kosong untuk auto-generator QR dari link WhatsApp"
                    value={currentClass.qr_code_link || ''}
                    onChange={(e) => setCurrentClass({ ...currentClass, qr_code_link: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Kelas"
        message="Apakah Anda yakin ingin menghapus kelas ini? Semua siswa yang berada di kelas ini akan kehilangan penempatan kelasnya. Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Kelas"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setClassIdToDelete(null);
        }}
      />
    </div>
  );
}
