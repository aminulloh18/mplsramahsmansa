import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Phone, BookOpen, FileText, CheckCircle2, ShieldCheck, Sparkles, Upload, Trash2, Plus, Image as ImageIcon, Link as LinkIcon, Award } from 'lucide-react';
import { Setting } from '../../types/database.types';
import { settingService } from '../../services/settingService';

interface PengaturanWebsiteProps {
  adminEmail: string;
}

export default function PengaturanWebsite({ adminEmail }: PengaturanWebsiteProps) {
  const [settings, setSettings] = useState<Setting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [schoolName, setSchoolName] = useState('SMAN 1 Bandung');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [schoolBanners, setSchoolBanners] = useState<string[]>([]);
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [mplsDate, setMplsDate] = useState('2026-07-13');
  const [committeePhone, setCommitteePhone] = useState('08123456789');
  const [guidebookUrl, setGuidebookUrl] = useState('');
  const [rulesUrl, setRulesUrl] = useState('');
  const [embedType, setEmbedType] = useState<'none' | 'youtube' | 'canva' | 'custom'>('none');
  const [embedCode, setEmbedCode] = useState('');
  const [certificateTemplateUrl, setCertificateTemplateUrl] = useState('');
  const [isCertificatePublished, setIsCertificatePublished] = useState(false);
  const [certificateNameX, setCertificateNameX] = useState(50);
  const [certificateNameY, setCertificateNameY] = useState(42);
  const [certificateNameSize, setCertificateNameSize] = useState(48);
  const [certificateNameColor, setCertificateNameColor] = useState('#FFFFFF');
  const [certificateNameFont, setCertificateNameFont] = useState('sans-serif');
  const [certificateNameBold, setCertificateNameBold] = useState(true);
  const [certificateNameItalic, setCertificateNameItalic] = useState(false);
  const [certificateNameUppercase, setCertificateNameUppercase] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await settingService.getSettings();
        setSettings(data);
        if (data) {
          setSchoolName(data.school_name || 'SMAN 1 Bandung');
          setMplsDate(data.mpls_date || '2026-07-13');
          setCommitteePhone(data.committee_phone || '08123456789');
          setGuidebookUrl(data.guidebook_url || '');
          setRulesUrl(data.rules_url || '');
          setSchoolLogo(data.school_logo || '');
          setSchoolBanners(data.school_banners || (data.school_banner ? [data.school_banner] : []));
          setEmbedType(data.embed_type || 'none');
          setEmbedCode(data.embed_code || '');
          setCertificateTemplateUrl(data.certificate_template_url || '');
          setIsCertificatePublished(!!data.is_certificate_published);
          setCertificateNameX(data.certificate_name_x !== undefined ? Number(data.certificate_name_x) : 50);
          setCertificateNameY(data.certificate_name_y !== undefined ? Number(data.certificate_name_y) : 42);
          setCertificateNameSize(data.certificate_name_size !== undefined ? Number(data.certificate_name_size) : 48);
          setCertificateNameColor(data.certificate_name_color || '#FFFFFF');
          setCertificateNameFont(data.certificate_name_font || 'sans-serif');
          setCertificateNameBold(data.certificate_name_bold !== undefined ? !!data.certificate_name_bold : true);
          setCertificateNameItalic(data.certificate_name_italic !== undefined ? !!data.certificate_name_italic : false);
          setCertificateNameUppercase(data.certificate_name_uppercase !== undefined ? !!data.certificate_name_uppercase : true);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSchoolLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCertificateTemplateUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Certificate dragging logic
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrag = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    // clamp to 0-100% and round to 1 decimal place
    setCertificateNameX(Math.round(Math.max(0, Math.min(100, x)) * 10) / 10);
    setCertificateNameY(Math.round(Math.max(0, Math.min(100, y)) * 10) / 10);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    handleDrag(e.clientX, e.clientY);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      handleDrag(moveEvent.clientX, moveEvent.clientY);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    handleDrag(e.touches[0].clientX, e.touches[0].clientY);
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length === 0) return;
      handleDrag(moveEvent.touches[0].clientX, moveEvent.touches[0].clientY);
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSchoolBanners((prev) => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const addBannerByUrl = () => {
    if (!newBannerUrl.trim()) return;
    setSchoolBanners((prev) => [...prev, newBannerUrl.trim()]);
    setNewBannerUrl('');
  };

  const removeBanner = (index: number) => {
    setSchoolBanners((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      const payload: Partial<Setting> = {
        school_name: schoolName,
        school_logo: schoolLogo,
        school_banners: schoolBanners,
        school_banner: schoolBanners[0] || '',
        mpls_date: mplsDate,
        committee_phone: committeePhone,
        guidebook_url: guidebookUrl,
        rules_url: rulesUrl,
        embed_type: embedType,
        embed_code: embedCode,
        certificate_template_url: certificateTemplateUrl,
        is_certificate_published: isCertificatePublished,
        certificate_name_x: certificateNameX,
        certificate_name_y: certificateNameY,
        certificate_name_size: certificateNameSize,
        certificate_name_color: certificateNameColor,
        certificate_name_font: certificateNameFont,
        certificate_name_bold: certificateNameBold,
        certificate_name_italic: certificateNameItalic,
        certificate_name_uppercase: certificateNameUppercase,
      };

      await settingService.updateSettings(payload, adminEmail);
      setSuccessMsg('Seluruh konfigurasi sistem berhasil diperbarui dan disinkronkan.');
      
      // Clear success message after 3s
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Gagal memperbarui pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div>
        <h2 className="text-xl font-black text-white">Konfigurasi & Pengaturan Sistem</h2>
        <p className="text-xs text-slate-500">
          Atur parameter operasional portal MPLS mulai dari tanggal countdown pembukaan, hotline panitia, hingga link download panduan resmi.
        </p>
      </div>

      {loading ? (
        <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] p-8 animate-pulse space-y-6">
          <div className="h-6 bg-slate-800 rounded w-1/4" />
          <div className="h-10 bg-slate-800 rounded w-full" />
          <div className="h-10 bg-slate-800 rounded w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Form Side (8 Columns) */}
          <form onSubmit={handleSave} className="col-span-12 lg:col-span-8 bg-[#0F172A] border border-slate-800 rounded-[2rem] p-8 space-y-6 shadow-xl">
            {successMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* School Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nama Instansi Sekolah</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              {/* Countdown Target Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Tanggal Mulai MPLS (Countdown Target)</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={mplsDate}
                    onChange={(e) => setMplsDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white"
                  />
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Hotline WhatsApp */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">No HP / Sekretariat Panitia (WhatsApp Hotline)</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Contoh: 08123456789"
                  value={committeePhone}
                  onChange={(e) => setCommitteePhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white font-mono"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Guidebook Url */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Tautan URL Buku Panduan MPLS (.pdf)</label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="Masukkan link Google Drive / Dropbox file buku panduan"
                  value={guidebookUrl}
                  onChange={(e) => setGuidebookUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white font-mono"
                />
                <BookOpen className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Rules Url */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Tautan URL Tata Tertib & Disiplin Siswa (.pdf)</label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="Masukkan link Google Drive / Dropbox file tata tertib siswa"
                  value={rulesUrl}
                  onChange={(e) => setRulesUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white font-mono"
                />
                <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Embed Media Section */}
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-900 space-y-4">
              <div>
                <span className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">Sematan Media Utama (Canva / YouTube)</span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Tampilkan presentasi Canva, slide interaktif, atau video sambutan YouTube langsung di halaman depan calon siswa baru.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEmbedType('none');
                    setEmbedCode('');
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                    embedType === 'none'
                      ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Tidak Ada
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedType('youtube')}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                    embedType === 'youtube'
                      ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  YouTube
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedType('canva')}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                    embedType === 'canva'
                      ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Canva
                </button>
              </div>

              {embedType !== 'none' && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {embedType === 'youtube' && 'Tautan URL YouTube atau Video ID'}
                    {embedType === 'canva' && 'Tautan Sematan Canva / Kode HTML Iframe'}
                  </label>
                  
                  <textarea
                    rows={3}
                    value={embedCode}
                    onChange={(e) => setEmbedCode(e.target.value)}
                    placeholder={
                      embedType === 'youtube'
                        ? 'Contoh: https://www.youtube.com/watch?v=d6t9uI0f10c ATAU d6t9uI0f10c'
                        : 'Contoh: https://www.canva.com/design/DA.../watch?embed ATAU tempel seluruh kode <iframe ...></iframe>'
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  
                  <div className="text-[10px] text-slate-500 bg-slate-950/30 p-2.5 border border-slate-900 rounded-xl leading-relaxed">
                    {embedType === 'youtube' && (
                      <span>
                        <strong>Tips YouTube:</strong> Anda bisa memasukkan URL lengkap video YouTube atau hanya memasukkan Video ID 11-karakter di belakang parameter <code>?v=</code>. Media ini akan disematkan di landing page dengan rasio video yang responsif.
                      </span>
                    )}
                    {embedType === 'canva' && (
                      <span>
                        <strong>Tips Canva:</strong> Buka presentasi Canva Anda, klik <strong>Bagikan (Share)</strong> &rarr; <strong>Lainnya (More)</strong> &rarr; <strong>Sematkan (Embed)</strong>. Salin <strong>Tautan Sematan Pintar</strong> atau seluruh kode <strong>HTML Sematan (Iframe)</strong> dan tempel di atas.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* School Logo */}
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-900 space-y-3">
              <span className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">Logo Resmi Sekolah</span>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {schoolLogo ? (
                  <img
                    src={schoolLogo}
                    alt="Logo Sekolah"
                    className="w-16 h-16 object-contain rounded-xl bg-slate-900 p-1 border border-slate-800 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-dashed border-slate-700 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  </div>
                )}
                <div className="flex-1 w-full space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Masukkan Tautan URL Logo Sekolah"
                      value={schoolLogo}
                      onChange={(e) => setSchoolLogo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white font-mono"
                    />
                    <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 rounded-lg cursor-pointer transition-colors border border-slate-700">
                      <Upload className="w-3.5 h-3.5" />
                      PILIH FILE GAMBAR LOGO
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {schoolLogo && (
                      <button
                        type="button"
                        onClick={() => setSchoolLogo('')}
                        className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

             {/* Slide Banners */}
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-900 space-y-4">
              <div>
                <span className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">Slide Banner Website</span>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                  Tambahkan beberapa gambar banner (bisa berupa foto sekolah, kegiatan, atau ucapan selamat datang). Banner ini akan ditampilkan sebagai sliding/carousel di halaman depan siswa.<br />
                  <strong className="text-blue-400">Rekomendasi ukuran gambar: 1200 x 630 piksel (Rasio 40:21)</strong> untuk tampilan terbaik di laptop & HP.
                </p>
              </div>

              {/* List of current banners */}
              <div className="space-y-2">
                {schoolBanners.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {schoolBanners.map((banner, index) => (
                      <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-[1200/630] flex items-center justify-center">
                        <img
                          src={banner}
                          alt={`Banner ${index + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeBanner(index)}
                            className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                            title="Hapus Banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-slate-400 rounded-md border border-slate-800">
                          Slide #{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-900/30 text-[11px] text-slate-500 italic">
                    Belum ada banner yang ditambahkan. Gunakan menu di bawah untuk menambahkan banner.
                  </div>
                )}
              </div>

              {/* Inputs to add a banner */}
              <div className="pt-2 border-t border-slate-900 space-y-2.5">
                <div className="text-[10px] font-bold text-slate-400">TAMBAH BANNER BARU</div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="Masukkan Tautan URL Gambar Banner"
                      value={newBannerUrl}
                      onChange={(e) => setNewBannerUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white font-mono"
                    />
                    <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>
                  <button
                    type="button"
                    onClick={addBannerByUrl}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah via Tautan
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl cursor-pointer transition-colors shadow-md">
                    <Upload className="w-4 h-4" />
                    UNGGAH FILE GAMBAR BANNER BARU
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Penerbitan Sertifikat MPLS */}
            <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-900 space-y-6">
              <div className="flex items-start gap-3 justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-2">
                    <Award className="w-3.5 h-3.5" />
                    Sertifikat Digital MPLS
                  </div>
                  <h3 className="text-sm font-bold text-white">Sertifikat Kelulusan Siswa</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Siswa yang dinyatakan <strong className="text-emerald-400 font-bold">Lulus</strong> oleh pembimbing Binkel akan dapat mencari NIS mereka dan mengunduh sertifikat ini secara otomatis dengan cetakan nama digital yang digenerate oleh sistem.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCertificatePublished(!isCertificatePublished)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isCertificatePublished ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isCertificatePublished ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Status Indicator */}
              <div className={`p-3 rounded-xl border flex items-center gap-2 text-[11px] ${
                isCertificatePublished 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isCertificatePublished ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>
                  {isCertificatePublished 
                    ? 'Status: AKTIF - Siswa saat ini sudah dapat mencari dan mengunduh sertifikat kelulusan mereka.' 
                    : 'Status: NONAKTIF - Unduhan sertifikat ditutup untuk siswa. Binkel masih dapat menilai kelulusan di panel masing-masing.'}
                </span>
              </div>

              {/* Template Upload */}
              <div className="space-y-3">
                <span className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">Desain Template Sertifikat Kosong</span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Unggah desain sertifikat kosong (tanpa nama). Pastikan menyisakan ruang kosong di bagian tengah untuk penempatan nama siswa secara otomatis. Gunakan ukuran standar kertas <strong className="text-blue-400">A4 Landscape (Rasio 1.414:1, direkomendasikan 1414 x 1000 piksel)</strong> untuk hasil cetak terbaik.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-full flex-1 space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Masukkan Tautan URL Desain Sertifikat Kosong"
                        value={certificateTemplateUrl}
                        onChange={(e) => setCertificateTemplateUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white font-mono"
                      />
                      <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 rounded-lg cursor-pointer transition-colors border border-slate-700">
                        <Upload className="w-3.5 h-3.5" />
                        PILIH FILE SERTIFIKAT KOSONG
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCertificateUpload}
                          className="hidden"
                        />
                      </label>
                      {certificateTemplateUrl && (
                        <button
                          type="button"
                          onClick={() => setCertificateTemplateUrl('')}
                          className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Gunakan Default
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Real-time Certificate Rendering Preview Box */}
                <div className="mt-4 border border-slate-900 bg-slate-950 rounded-2xl p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Preview Sertifikat & Tata Letak Nama</span>
                      <p className="text-[10px] text-slate-500">Klik & Geser nama langsung pada sertifikat di bawah, atau gunakan panel kontrol untuk mengatur posisi & gaya secara presisi.</p>
                    </div>
                    <div className="flex items-center gap-1.5 self-start">
                      <button
                        type="button"
                        onClick={() => {
                          setCertificateNameX(50);
                          setCertificateNameY(42);
                          setCertificateNameSize(48);
                          setCertificateNameColor('#FFFFFF');
                          setCertificateNameFont('sans-serif');
                          setCertificateNameBold(true);
                          setCertificateNameItalic(false);
                          setCertificateNameUppercase(true);
                        }}
                        className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded text-[9px] font-bold uppercase transition-colors"
                      >
                        Reset Posisi
                      </button>
                    </div>
                  </div>
                  
                  {/* The Workspace Container with drag handlers */}
                  <div 
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    className="relative rounded-xl overflow-hidden border border-slate-800 aspect-[1414/1000] bg-slate-900/60 select-none cursor-crosshair"
                  >
                    <img
                      src={certificateTemplateUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200'}
                      alt="Pratinjau Sertifikat"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Live Name Draggable overlay */}
                    <div 
                      style={{
                        position: 'absolute',
                        left: `${certificateNameX}%`,
                        top: `${certificateNameY}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${Math.max(8, certificateNameSize / 4)}px`, // scaled down relative to container display size
                        color: certificateNameColor,
                        fontFamily: certificateNameFont,
                        fontWeight: certificateNameBold ? 'bold' : 'normal',
                        fontStyle: certificateNameItalic ? 'italic' : 'normal',
                        pointerEvents: 'none', // let the container handle mouse drag
                        whiteSpace: 'nowrap',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      }}
                      className="transition-all duration-75 border border-dashed border-blue-500/40 px-2.5 py-1.5 rounded-lg bg-blue-500/10 backdrop-blur-[1px]"
                    >
                      {certificateNameUppercase ? '[ NAMA LENGKAP SISWA BARU ]' : '[ Nama Lengkap Siswa Baru ]'}
                    </div>
                  </div>

                  {/* Control sliders and options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-900">
                    {/* Coordinate controls */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          <span>Posisi Horisontal (X)</span>
                          <span className="text-blue-400 font-mono">{certificateNameX}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          step="0.5"
                          value={certificateNameX}
                          onChange={(e) => setCertificateNameX(Number(e.target.value))}
                          className="w-full accent-blue-500 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          <span>Posisi Vertikal (Y)</span>
                          <span className="text-blue-400 font-mono">{certificateNameY}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          step="0.5"
                          value={certificateNameY}
                          onChange={(e) => setCertificateNameY(Number(e.target.value))}
                          className="w-full accent-blue-500 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          <span>Ukuran Font Nama (px)</span>
                          <span className="text-blue-400 font-mono">{certificateNameSize}px</span>
                        </div>
                        <input 
                          type="range"
                          min="12"
                          max="120"
                          step="1"
                          value={certificateNameSize}
                          onChange={(e) => setCertificateNameSize(Number(e.target.value))}
                          className="w-full accent-blue-500 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Typography controls */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pilihan Font</span>
                          <select
                            value={certificateNameFont}
                            onChange={(e) => setCertificateNameFont(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          >
                            <option value="sans-serif">Sans-serif (Modern)</option>
                            <option value="serif">Serif (Resmi/Klasik)</option>
                            <option value="monospace">Monospace (Code)</option>
                          </select>
                        </div>

                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Warna Nama</span>
                          <div className="flex gap-1.5">
                            <input 
                              type="color"
                              value={certificateNameColor}
                              onChange={(e) => setCertificateNameColor(e.target.value)}
                              className="w-8 h-8 rounded-lg bg-transparent border border-slate-800 cursor-pointer p-0 overflow-hidden"
                            />
                            <input 
                              type="text"
                              value={certificateNameColor}
                              onChange={(e) => setCertificateNameColor(e.target.value)}
                              placeholder="#FFFFFF"
                              className="flex-1 bg-slate-950 border border-slate-900 rounded-lg px-2 py-1 text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setCertificateNameBold(!certificateNameBold)}
                          className={`py-1.5 border rounded-lg text-[10px] font-bold transition-colors ${
                            certificateNameBold 
                              ? 'bg-blue-600/10 text-blue-400 border-blue-500/30' 
                              : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Bold
                        </button>

                        <button
                          type="button"
                          onClick={() => setCertificateNameItalic(!certificateNameItalic)}
                          className={`py-1.5 border rounded-lg text-[10px] font-bold transition-colors ${
                            certificateNameItalic 
                              ? 'bg-blue-600/10 text-blue-400 border-blue-500/30' 
                              : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Italic
                        </button>

                        <button
                          type="button"
                          onClick={() => setCertificateNameUppercase(!certificateNameUppercase)}
                          className={`py-1.5 border rounded-lg text-[10px] font-bold transition-colors ${
                            certificateNameUppercase 
                              ? 'bg-blue-600/10 text-blue-400 border-blue-500/30' 
                              : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Kapital
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-900 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-xs font-bold text-white rounded-xl transition-all shadow-md cursor-pointer"
              >
                {saving ? 'Menyimpan...' : 'SIMPAN PERUBAHAN'}
              </button>
            </div>
          </form>

          {/* Right Info Card (4 Columns) */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-[#1E293B]/40 border border-slate-800 rounded-[2rem] p-6 text-center shadow-md relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-blue-500/30" />
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Sinkronisasi Realtime</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Perubahan pada halaman ini langsung memperbarui countdown timer, tombol unduh buku panduan, tata tertib, dan kontak panitia di halaman depan siswa secara instan.
              </p>
            </div>

            <div className="bg-[#1E293B]/40 border border-slate-800 rounded-[2rem] p-6 text-center shadow-md relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-emerald-500/30" />
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Tips Integrasi Berkas</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Gunakan tautan Google Drive yang sudah disetel ke "Siapa saja yang memiliki link dapat melihat" agar dokumen panduan langsung dapat diunduh oleh calon siswa baru secara aman.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
