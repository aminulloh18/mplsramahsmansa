import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Volume2, Pin, Calendar, FileText } from 'lucide-react';
import { Announcement } from '../../types/database.types';
import { announcementService } from '../../services/announcementService';
import { formatIndonesianDate } from '../../utils';
import ConfirmModal from '../../components/ConfirmModal';

interface PengumumanAdminProps {
  adminEmail: string;
}

export default function PengumumanAdmin({ adminEmail }: PengumumanAdminProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAnn, setCurrentAnn] = useState<Partial<Announcement> | null>(null);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [annIdToDelete, setAnnIdToDelete] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await announcementService.getAnnouncements();
      setAnnouncements(res);
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteTrigger = (id: string) => {
    setAnnIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!annIdToDelete) return;
    try {
      await announcementService.deleteAnnouncement(annIdToDelete, adminEmail);
      setIsDeleteModalOpen(false);
      setAnnIdToDelete(null);
      loadData();
    } catch (err) {
      alert('Gagal menghapus pengumuman.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnn?.title || !currentAnn?.content) {
      alert('Mohon isi Judul dan Konten Pengumuman.');
      return;
    }

    try {
      if (currentAnn.id) {
        await announcementService.updateAnnouncement(currentAnn.id, currentAnn, adminEmail);
      } else {
        await announcementService.createAnnouncement(
          currentAnn as Omit<Announcement, 'id' | 'created_at' | 'updated_at'>,
          adminEmail
        );
      }
      setIsModalOpen(false);
      setCurrentAnn(null);
      loadData();
    } catch (err) {
      alert('Gagal menyimpan pengumuman.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Kelola Informasi & Pengumuman</h2>
          <p className="text-xs text-slate-500">
            Terbitkan aturan terbaru, tata tertib kegiatan harian MPLS, pinned status, dan link file attachment bagi calon siswa baru.
          </p>
        </div>

        <button
          onClick={() => {
            setCurrentAnn({
              title: '',
              content: '',
              status: 'Published',
              is_pinned: false,
              attachment_url: '',
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Rilis Pengumuman
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-900/50 h-32 border border-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-[#0F172A] border rounded-[2rem] p-6 shadow-md transition-all flex flex-col justify-between relative group ${
                ann.is_pinned ? 'border-blue-500/30 bg-blue-950/5' : 'border-slate-800'
              }`}
            >
              {/* Pin Indicator */}
              {ann.is_pinned && (
                <div className="absolute top-6 right-20 flex items-center gap-1 text-[9px] font-black text-blue-400 uppercase bg-blue-500/15 border border-blue-500/20 px-2.5 py-1 rounded-full">
                  <Pin className="w-3 h-3 text-blue-400" />
                  PINNED INFO
                </div>
              )}

              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Posted: {formatIndonesianDate(ann.created_at)} | Status:{' '}
                    <span className="font-bold text-slate-400">{ann.status}</span>
                  </span>

                  <div className="flex items-center gap-1.5 opacity-65 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setCurrentAnn(ann);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTrigger(ann.id)}
                      className="p-1.5 hover:bg-rose-950/20 rounded-lg text-rose-400 hover:text-rose-500 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-black text-white mb-2">{ann.title}</h3>
                <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed">{ann.content}</p>
              </div>

              {ann.attachment_url && (
                <div className="mt-4 pt-3 border-t border-slate-900 flex items-center gap-1.5 text-xs text-blue-400 font-bold">
                  <FileText className="w-4 h-4" />
                  <a href={ann.attachment_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Unduh Dokumen Lampiran Pengumuman
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-[2rem] text-slate-500 text-xs italic">
          Belum ada pengumuman terdaftar. Rilis pengumuman pertama Anda di kanan atas.
        </div>
      )}

      {/* FORM MODAL */}
      {isModalOpen && currentAnn && (
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
                  {currentAnn.id ? 'Edit Informasi Pengumuman' : 'Tulis & Rilis Pengumuman Baru'}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Berikan informasi lengkap agar mudah dipahami calon siswa.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Judul Pengumuman</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tata Tertib Seragam & Aturan Rambut MPLS"
                    value={currentAnn.title || ''}
                    onChange={(e) => setCurrentAnn({ ...currentAnn, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Konten Informasi</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Tuliskan isi pengumuman secara detail di sini..."
                    value={currentAnn.content || ''}
                    onChange={(e) => setCurrentAnn({ ...currentAnn, content: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Link URL File Lampiran (Opsional)</label>
                  <input
                    type="url"
                    placeholder="Contoh: https://drive.google.com/..."
                    value={currentAnn.attachment_url || ''}
                    onChange={(e) => setCurrentAnn({ ...currentAnn, attachment_url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Status Rilis</label>
                    <select
                      value={currentAnn.status || 'Published'}
                      onChange={(e) => setCurrentAnn({ ...currentAnn, status: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300"
                    >
                      <option value="Published">Terbitkan (Published)</option>
                      <option value="Draft">Simpan Draft</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Sematkan Informasi</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="is_pinned"
                        checked={currentAnn.is_pinned || false}
                        onChange={(e) => setCurrentAnn({ ...currentAnn, is_pinned: e.target.checked })}
                        className="rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950"
                      />
                      <label htmlFor="is_pinned" className="text-xs text-slate-300 cursor-pointer">
                        Pin di bagian atas siswa
                      </label>
                    </div>
                  </div>
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
                  Publish Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Pengumuman"
        message="Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Pengumuman"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setAnnIdToDelete(null);
        }}
      />
    </div>
  );
}
