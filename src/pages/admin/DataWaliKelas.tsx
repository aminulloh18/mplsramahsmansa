import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Phone, Mail, BookOpen } from 'lucide-react';
import { Teacher } from '../../types/database.types';
import { teacherService } from '../../services/teacherService';
import ConfirmModal from '../../components/ConfirmModal';

interface DataWaliKelasProps {
  adminEmail: string;
}

export default function DataWaliKelas({ adminEmail }: DataWaliKelasProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<Partial<Teacher> | null>(null);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teacherIdToDelete, setTeacherIdToDelete] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await teacherService.getTeachers();
      setTeachers(list);
    } catch (err) {
      console.error('Failed to load teachers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteTrigger = (id: string) => {
    setTeacherIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!teacherIdToDelete) return;
    try {
      await teacherService.deleteTeacher(teacherIdToDelete, adminEmail);
      setIsDeleteModalOpen(false);
      setTeacherIdToDelete(null);
      loadData();
    } catch (err) {
      alert('Gagal menghapus data guru.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeacher?.name || !currentTeacher?.nip) {
      alert('Mohon isi Nama Guru dan NIP.');
      return;
    }

    try {
      if (currentTeacher.id) {
        await teacherService.updateTeacher(currentTeacher.id, currentTeacher, adminEmail);
      } else {
        await teacherService.createTeacher(
          currentTeacher as Omit<Teacher, 'id' | 'created_at' | 'updated_at'>,
          adminEmail
        );
      }
      setIsModalOpen(false);
      setCurrentTeacher(null);
      loadData();
    } catch (err) {
      alert('Gagal menyimpan data guru.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Manajemen Guru Pendamping & Wali Kelas</h2>
          <p className="text-xs text-slate-500">
            Kelola data bimbingan guru pendamping kelas, kontak cepat, NIP, serta mata pelajaran yang diampu.
          </p>
        </div>

        <button
          onClick={() => {
            setCurrentTeacher({
              name: '',
              nip: '',
              phone: '',
              email: '',
              subject: '',
              photo_url: '',
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Wali Kelas
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-900/50 h-44 border border-slate-800 rounded-[2rem]" />
          ))}
        </div>
      ) : teachers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teach) => (
            <div
              key={teach.id}
              className="bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 shadow-lg flex flex-col justify-between group hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center font-bold text-lg border border-purple-500/20">
                      {teach.name.substring(0, 2).replace(/[^\w]/g, 'G')}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight">{teach.name}</h3>
                      <span className="text-[10px] text-slate-500 font-mono">NIP: {teach.nip || '-'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setCurrentTeacher(teach);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTrigger(teach.id)}
                      className="p-1.5 hover:bg-rose-950/20 rounded-lg text-rose-400 hover:text-rose-500 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs py-3 border-t border-slate-900">
                  <div className="flex items-center gap-2 text-slate-300">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span>Mengampu: <strong className="text-slate-200">{teach.subject || '-'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>WhatsApp: <strong className="text-slate-200">{teach.phone || '-'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="truncate">Email: {teach.email || '-'}</span>
                  </div>
                </div>
              </div>

              {teach.phone && (
                <a
                  href={`https://wa.me/${teach.phone.replace(/^0/, '62')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-center text-xs font-bold transition-all block"
                >
                  Hubungi via WhatsApp
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-[2rem] text-slate-500 text-xs italic">
          Belum ada guru pendamping terdaftar.
        </div>
      )}

      {/* FORM MODAL */}
      {isModalOpen && currentTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
              <div>
                <h3 className="text-base font-black text-white">
                  {currentTeacher.id ? 'Edit Data Wali Kelas' : 'Tambah Wali Kelas Baru'}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Isi data identitas pendidik secara akurat.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nama Lengkap (Lengkap Gelar)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Raharjo, S.Pd."
                    value={currentTeacher.name || ''}
                    onChange={(e) => setCurrentTeacher({ ...currentTeacher, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">NIP Guru</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 19820421..."
                    value={currentTeacher.nip || ''}
                    onChange={(e) => setCurrentTeacher({ ...currentTeacher, nip: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Mata Pelajaran Utama</label>
                  <input
                    type="text"
                    placeholder="Contoh: Matematika Peminatan"
                    value={currentTeacher.subject || ''}
                    onChange={(e) => setCurrentTeacher({ ...currentTeacher, subject: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nomor Handphone (WhatsApp)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 0812345..."
                    value={currentTeacher.phone || ''}
                    onChange={(e) => setCurrentTeacher({ ...currentTeacher, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Email Guru</label>
                  <input
                    type="email"
                    placeholder="Contoh: budi@sman1bdg.sch.id"
                    value={currentTeacher.email || ''}
                    onChange={(e) => setCurrentTeacher({ ...currentTeacher, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
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
                  Simpan Wali Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Guru Wali Kelas"
        message="Apakah Anda yakin ingin menghapus guru wali kelas ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Guru"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setTeacherIdToDelete(null);
        }}
      />
    </div>
  );
}
