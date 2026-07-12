import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, HelpCircle } from 'lucide-react';
import { FAQ } from '../../types/database.types';
import { faqService } from '../../services/faqService';
import ConfirmModal from '../../components/ConfirmModal';

interface FAQAdminProps {
  adminEmail: string;
}

export default function FAQAdmin({ adminEmail }: FAQAdminProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFaq, setCurrentFaq] = useState<Partial<FAQ> | null>(null);

  // Delete states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [faqIdToDelete, setFaqIdToDelete] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await faqService.getFAQs();
      setFaqs(res);
    } catch (err) {
      console.error('Failed to load FAQ list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteTrigger = (id: string) => {
    setFaqIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!faqIdToDelete) return;
    try {
      await faqService.deleteFAQ(faqIdToDelete, adminEmail);
      setIsDeleteModalOpen(false);
      setFaqIdToDelete(null);
      loadData();
    } catch (err) {
      alert('Gagal menghapus FAQ.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFaq?.question || !currentFaq?.answer) {
      alert('Pertanyaan dan Jawaban harus diisi.');
      return;
    }

    try {
      if (currentFaq.id) {
        await faqService.updateFAQ(currentFaq.id, currentFaq, adminEmail);
      } else {
        await faqService.createFAQ(
          currentFaq as Omit<FAQ, 'id' | 'created_at' | 'updated_at'>,
          adminEmail
        );
      }
      setIsModalOpen(false);
      setCurrentFaq(null);
      loadData();
    } catch (err) {
      alert('Gagal menyimpan FAQ.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Manajemen Frequently Asked Questions (FAQ)</h2>
          <p className="text-xs text-slate-500">
            Kelola tanya-jawab interaktif yang sering ditanyakan siswa baru seperti jalur pendaftaran, seragam, koperasi, dan pengumpulan berkas.
          </p>
        </div>

        <button
          onClick={() => {
            setCurrentFaq({
              question: '',
              answer: '',
              category: 'Umum',
              is_active: true,
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah FAQ
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-900/50 h-24 border border-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : faqs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((f) => (
            <div
              key={f.id}
              className="bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[9px] bg-slate-900 text-slate-400 border border-slate-800 px-2.5 py-0.5 rounded font-black uppercase tracking-wider">
                    {f.category || 'UMUM'}
                  </span>
                  
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setCurrentFaq(f);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTrigger(f.id)}
                      className="p-1.5 hover:bg-rose-950/20 rounded-lg text-rose-400 hover:text-rose-500 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-black text-slate-200 flex items-start gap-2 mb-2 leading-snug">
                  <HelpCircle className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
                  {f.question}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed pl-6 whitespace-pre-line">{f.answer}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-[2rem] text-slate-500 text-xs italic">
          Belum ada FAQ terdaftar.
        </div>
      )}

      {/* FORM MODAL */}
      {isModalOpen && currentFaq && (
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
                  {currentFaq.id ? 'Edit Data Tanya Jawab FAQ' : 'Tambah Tanya Jawab FAQ Baru'}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Pertanyaan yang teratur mempermudah alur informasi.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Kategori FAQ</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Seragam, Berkas, Kelas, Umum"
                    value={currentFaq.category || ''}
                    onChange={(e) => setCurrentFaq({ ...currentFaq, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Pertanyaan FAQ</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bagaimana cara join grup WA kelas?"
                    value={currentFaq.question || ''}
                    onChange={(e) => setCurrentFaq({ ...currentFaq, question: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Jawaban Detail</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tuliskan jawaban dari pertanyaan di atas secara lengkap..."
                    value={currentFaq.answer || ''}
                    onChange={(e) => setCurrentFaq({ ...currentFaq, answer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white leading-relaxed"
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
                  Simpan FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus FAQ"
        message="Apakah Anda yakin ingin menghapus tanya jawab FAQ ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus FAQ"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setFaqIdToDelete(null);
        }}
      />
    </div>
  );
}
