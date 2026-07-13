import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  BookOpen,
  FileText,
  Calendar,
  MessageCircle,
  QrCode,
  MapPin,
  User,
  ExternalLink,
  ChevronDown,
  Phone,
  HelpCircle,
  AlertTriangle,
  UserCheck,
  Building,
  Navigation,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Award,
} from 'lucide-react';
import { Student, Announcement, FAQ, Setting } from '../../types/database.types';
import { studentService } from '../../services/studentService';
import { announcementService } from '../../services/announcementService';
import { faqService } from '../../services/faqService';
import { settingService } from '../../services/settingService';
import { formatIndonesianDate } from '../../utils';

function getYouTubeEmbedUrl(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Check if it's already an embed URL
  if (trimmed.includes('youtube.com/embed/')) {
    return trimmed;
  }
  // Check if it's a standard watch URL
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : trimmed;
  return `https://www.youtube.com/embed/${videoId}`;
}

function getCanvaEmbedUrl(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Check if they pasted raw iframe or div code. Let's find src="..."
  if (trimmed.startsWith('<')) {
    const match = trimmed.match(/src="([^"]+)"/i);
    if (match && match[1]) {
      // Decode html entities like &#x2F; or &amp; to plain characters
      let src = match[1]
        .replace(/&#x2F;/gi, '/')
        .replace(/&amp;/gi, '&');
      if (src.startsWith('//')) {
        src = 'https:' + src;
      }
      return src;
    }
  }
  // If it's a link, make sure it ends with ?embed or /view?embed
  let url = trimmed;
  if (url.includes('canva.com/design/') && !url.includes('?embed') && !url.includes('&embed')) {
    if (url.includes('/view')) {
      url = url.replace('/view', '') + '?embed';
    } else {
      url = url + '?embed';
    }
  }
  return url;
}

interface LandingPageProps {
  onGoToLogin: () => void;
}

export default function LandingPage({ onGoToLogin }: LandingPageProps) {
  // Database states
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [settings, setSettings] = useState<Setting | null>(null);
  
  // Banner slide state
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Search state
  const [activeTab, setActiveTab] = useState<'reg' | 'nisn'>('nisn');
  const [regInput, setRegInput] = useState('');
  const [nisnInput, setNisnInput] = useState('');
  const [dobInput, setDobInput] = useState('');
  
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Student | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  
  // FAQ accordion state
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Countdown state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Auto-play banners
  useEffect(() => {
    const banners = settings?.school_banners || (settings?.school_banner ? [settings.school_banner] : []);
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [settings?.school_banners, settings?.school_banner]);

  // Load initial data
  useEffect(() => {
    document.title = 'Portal MPLS SMAN 1 Bandung';
    async function loadData() {
      try {
        const [annRes, faqRes, setRes] = await Promise.all([
          announcementService.getAnnouncements(),
          faqService.getFAQs(),
          settingService.getSettings(),
        ]);
        setAnnouncements(annRes);
        setFaqs(faqRes);
        setSettings(setRes);
        if (setRes?.school_name) {
          document.title = `Portal MPLS ${setRes.school_name}`;
        }
      } catch (error) {
        console.error('Failed to load landing page data', error);
      }
    }
    loadData();
  }, []);

  // Countdown effect
  useEffect(() => {
    if (!settings?.mpls_date) return;
    const target = new Date(settings.mpls_date).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settings?.mpls_date]);

  // Handle Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setSearchAttempted(true);
    setSearchResult(null);

    // Artificial tiny delay for beautiful shimmer
    setTimeout(async () => {
      try {
        let result: Student | null = null;
        if (activeTab === 'reg') {
          result = await studentService.searchStudent(regInput);
        } else {
          result = await studentService.searchStudentByNisn(nisnInput);
        }
        setSearchResult(result);
      } catch (error) {
        console.error('Error during student search', error);
      } finally {
        setSearching(false);
      }
    }, 800);
  };

  // Quick Action Search Handler
  const handleDemoSearch = (regNo: string) => {
    setActiveTab('reg');
    setRegInput(regNo);
    // Trigger automatic search
    setSearching(true);
    setSearchAttempted(true);
    setSearchResult(null);
    setTimeout(async () => {
      const result = await studentService.searchStudent(regNo);
      setSearchResult(result);
      setSearching(false);
      // Smooth scroll to results
      document.getElementById('search-result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  };

  // Generate and download high-resolution Certificate via canvas
  const handleDownloadCertificate = (student: Student) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use standard A4 Landscape High-Resolution dimensions (1.414:1 ratio)
    canvas.width = 1414;
    canvas.height = 1000;

    const drawTextOverlays = () => {
      // 1. Get typography settings from database or fallbacks
      const nameX = Number(settings?.certificate_name_x ?? 50) / 100 * canvas.width;
      const nameY = Number(settings?.certificate_name_y ?? 42) / 100 * canvas.height;
      const fontSize = Number(settings?.certificate_name_size ?? 48);
      const nameColor = settings?.certificate_name_color || '#FFFFFF';
      const fontFamily = settings?.certificate_name_font || 'sans-serif';
      const isBold = settings?.certificate_name_bold !== undefined ? !!settings.certificate_name_bold : true;
      const isItalic = settings?.certificate_name_italic !== undefined ? !!settings.certificate_name_italic : false;
      const isUppercase = settings?.certificate_name_uppercase !== undefined ? !!settings.certificate_name_uppercase : true;

      // 2. Prepare context for drawing the name
      const boldStyle = isBold ? 'bold' : 'normal';
      const italicStyle = isItalic ? 'italic' : 'normal';
      
      ctx.font = `${italicStyle} ${boldStyle} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = nameColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 3. Format name
      const displayName = isUppercase ? student.full_name.toUpperCase() : student.full_name;

      // 4. Render ONLY the name on top of the template
      ctx.fillText(displayName, nameX, nameY);

      // Trigger download
      const link = document.createElement('a');
      link.download = `Sertifikat_MPLS_${student.full_name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    const templateSrc = settings?.certificate_template_url;

    if (templateSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = templateSrc;
      
      img.onload = () => {
        // Draw image background
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Then draw the text overlays on top of the image
        drawTextOverlays();
      };

      img.onerror = () => {
        // Fallback: draw beautiful gradient backdrop instead of image if CORS or loading fails
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#0F172A'); // Deep dark
        gradient.addColorStop(0.5, '#1E293B');
        gradient.addColorStop(1, '#020617');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw premium watermark
        ctx.font = 'extrabold 180px sans-serif';
        ctx.fillStyle = 'rgba(59, 130, 246, 0.02)';
        ctx.fillText('MPLS', canvas.width / 2, canvas.height / 2 + 70);

        drawTextOverlays();
      };
    } else {
      // No template provided - draw default beautiful dark certificate background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0F172A');
      gradient.addColorStop(0.5, '#1E293B');
      gradient.addColorStop(1, '#020617');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Watermark
      ctx.font = 'extrabold 180px sans-serif';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.02)';
      ctx.fillText('MPLS', canvas.width / 2, canvas.height / 2 + 70);

      drawTextOverlays();
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans pb-16 selection:bg-school-blue selection:text-white">
      {/* Background ambient light bubbles based on school colors */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[#2d2f80]/15 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-[#e2127a]/10 rounded-full blur-[120px]" />
      </div>

      {/* Header / Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900 bg-[#020617]/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {settings?.school_logo ? (
            <img
              src={settings.school_logo}
              alt="Logo Sekolah"
              className="w-11 h-11 object-contain rounded-xl bg-slate-900/60 p-1 border border-slate-800 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-11 h-11 bg-[#2d2f80]/20 rounded-xl flex items-center justify-center border border-[#2d2f80]/30 shadow-lg shrink-0">
              <Sparkles className="w-5 h-5 text-school-lime animate-pulse" />
            </div>
          )}
          <div>
            <span className="font-black text-base md:text-lg tracking-wider block text-white uppercase leading-tight">
              {settings?.school_name ? (
                <>
                  {settings.school_name.split(' ').slice(0, 2).join(' ')}{' '}
                  <span className="text-[#ddfc06]">
                    {settings.school_name.split(' ').slice(2).join(' ')}
                  </span>
                </>
              ) : (
                <>
                  SMAN 1 <span className="text-[#ddfc06]">BANDUNG</span>
                </>
              )}
            </span>
            <span className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-black block mt-0.5">
              Portal MPLS Resmi {new Date().getFullYear()}
            </span>
          </div>
        </div>
        <button
          onClick={onGoToLogin}
          id="btn-admin-login"
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-school-magenta/40 hover:text-white rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
        >
          Administrator
        </button>
      </nav>

      {/* Hero Header Section */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#e2127a]/10 border border-[#e2127a]/20 rounded-full text-xs font-black text-school-magenta mb-6 uppercase tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5 text-school-magenta animate-pulse" />
          Selamat Datang, Calon Peserta Didik Baru!
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none"
        >
          Portal MPLS {settings?.school_name || 'SMAN 1 Bandung'} <br />
          <span className="bg-gradient-to-r from-school-lime via-school-magenta to-[#2d2f80] bg-clip-text text-transparent">
            Pembagian Kelas & Informasi
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-slate-400 max-w-2xl mx-auto text-xs md:text-base leading-relaxed"
        >
          Temukan pembagian kelas MPLS Anda, unduh tata tertib dan panduan resmi,
          serta bergabunglah dengan komunitas kelas Anda dengan mudah dan cepat.
        </motion.p>
      </header>

      {/* Dynamic Sliding Banner Carousel */}
      {settings && (
        <section className="relative z-10 max-w-7xl mx-auto px-6 mb-8">
          {(() => {
            const banners = settings.school_banners || (settings.school_banner ? [settings.school_banner] : []);
            if (banners.length === 0) return null;

            const nextSlide = () => {
              setCurrentSlide((prev) => (prev + 1) % banners.length);
            };

            const prevSlide = () => {
              setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
            };

            return (
              <div className="space-y-4">
                <div className="relative group rounded-[2rem] overflow-hidden border border-slate-900 shadow-2xl aspect-[1200/630] bg-slate-950">
                  {/* Image Slide */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 w-full h-full"
                    >
                      <img
                        src={banners[currentSlide]}
                        alt={`Banner Slide ${currentSlide + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {/* Subtler dark gradient to keep image clean */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    </motion.div>
                  </AnimatePresence>

                  {/* Top border strip matching official school brand bar */}
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-school-magenta via-school-purple to-school-lime" />

                  {/* Slider Controls (Arrow Buttons on Hover) */}
                  {banners.length > 1 && (
                    <>
                      <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 bg-black/40 hover:bg-school-blue/80 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/10 hover:border-school-magenta cursor-pointer"
                        title="Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 bg-black/40 hover:bg-school-blue/80 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/10 hover:border-school-magenta cursor-pointer"
                        title="Berikutnya"
                      >
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                      </button>

                      {/* Indicator Dots */}
                      <div className="absolute bottom-6 right-6 md:right-10 flex gap-1.5 z-20">
                        {banners.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all cursor-pointer ${
                              idx === currentSlide
                                ? 'bg-[#e2127a] w-5 md:w-7'
                                : 'bg-white/30 hover:bg-white/50'
                            }`}
                            title={`Slide ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Welcoming Text Section placed cleanly below the banner */}
                <div className="p-6 md:p-8 bg-[#0F172A]/80 border border-slate-900 rounded-[2rem] shadow-xl text-left">
                  <div className="max-w-3xl space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-school-magenta/10 border border-school-magenta/20 rounded-full text-[9px] md:text-[10px] font-black text-school-magenta uppercase tracking-widest">
                      <Sparkles className="w-3 h-3 text-school-magenta animate-pulse" />
                      Masa Pengenalan Lingkungan Sekolah (MPLS)
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                      WILUJENG SUMPING!
                    </h2>
                    <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed max-w-2xl">
                      Selamat datang calon siswa baru di portal resmi <span className="text-school-lime font-black">{settings.school_name}</span>. Bersama-sama mari wujudkan masa depan yang unggul, kreatif, dan mandiri!
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* Embedded Media Player (Canva/YouTube) */}
      {settings && settings.embed_type && settings.embed_type !== 'none' && settings.embed_code && (
        <section className="relative z-10 max-w-7xl mx-auto px-6 mb-8">
          <div className="bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-slate-900 border border-slate-800 text-slate-300">
                  <span className={`w-1.5 h-1.5 rounded-full ${settings.embed_type === 'youtube' ? 'bg-rose-500 animate-pulse' : 'bg-purple-500 animate-pulse'}`} />
                  {settings.embed_type === 'youtube' ? 'Sambutan Video' : 'Materi Interaktif'}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mt-1.5">
                  {settings.embed_type === 'youtube' ? 'Video Pengenalan & Sambutan Resmi' : 'Slide Presentasi & Informasi MPLS'}
                </h3>
              </div>
              
              <div className="text-[10px] text-slate-500 bg-slate-950/60 border border-slate-900 px-3 py-1.5 rounded-xl self-start font-mono">
                {settings.embed_type === 'youtube' ? 'YouTube Player' : 'Canva Live Slide'}
              </div>
            </div>

            {/* Responsive Iframe Wrapper */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-900 shadow-inner bg-slate-950 aspect-video">
              {(() => {
                const embedUrl = settings.embed_type === 'youtube' 
                  ? getYouTubeEmbedUrl(settings.embed_code)
                  : getCanvaEmbedUrl(settings.embed_code);

                if (!embedUrl) {
                  return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                      Gagal membuat tautan sematan. Periksa format kode sematan Anda.
                    </div>
                  );
                }

                return (
                  <iframe
                    src={embedUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full border-0"
                    title={settings.embed_type === 'youtube' ? 'Sambutan Video YouTube' : 'Canva Slide'}
                  />
                );
              })()}
            </div>
          </div>
        </section>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-12 gap-6">
        
        {/* BENTO GRID 1: COUNTDOWN */}
        <div className="col-span-12 md:col-span-5 bg-[#0F172A] border border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[10px] text-blue-400 uppercase tracking-widest font-black block mb-1">
              Hari Pembukaan MPLS
            </span>
            <h2 className="text-xl font-bold text-white mb-6">Hitung Mundur Kegiatan</h2>
            
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-2xl md:text-3xl font-black text-white block">{timeLeft.days}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Hari</span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-2xl md:text-3xl font-black text-white block">{timeLeft.hours}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Jam</span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-2xl md:text-3xl font-black text-white block">{timeLeft.minutes}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Menit</span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-2xl md:text-3xl font-black text-white block">{timeLeft.seconds}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Detik</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Tanggal Mulai:</span>
            <span className="font-mono text-slate-300 font-bold bg-slate-900/60 px-2.5 py-1 rounded-lg">
              {settings?.mpls_date ? formatIndonesianDate(settings.mpls_date) : '-'}
            </span>
          </div>
        </div>

        {/* BENTO GRID 2: SEARCH FORM */}
        <div className="col-span-12 md:col-span-7 bg-[#1E293B]/40 backdrop-blur-md border border-slate-800 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold text-white">Cek Pembagian Kelas Anda</h2>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Masukkan Nomor NISN (10 digit) Anda untuk memverifikasi alokasi regu & kelas Anda secara instan.
            </p>

            {/* SEARCH FORM INPUTS */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">
                  NISN Siswa (10 Digit)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Contoh: 0098765431"
                    value={nisnInput}
                    onChange={(e) => setNisnInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <Search className="w-4 h-4 text-slate-600 absolute left-4 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-sm font-bold text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {searching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mencari Data...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    CARI KELAS SAYA
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-2 items-center text-xs">
            <span className="text-slate-500">Pencarian Cepat Demo:</span>
            <button
              onClick={() => handleDemoSearch('MPLS-2026-001')}
              className="text-[10px] bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-md font-mono"
            >
              MPLS-2026-001 (Aditya)
            </button>
            <button
              onClick={() => handleDemoSearch('MPLS-2026-002')}
              className="text-[10px] bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-md font-mono"
            >
              MPLS-2026-002 (Bella)
            </button>
            <button
              onClick={() => handleDemoSearch('MPLS-2026-004')}
              className="text-[10px] bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-md font-mono"
            >
              MPLS-2026-004 (Farah)
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH RESULTS VIEWPORT */}
      <div id="search-result-section" className="max-w-7xl mx-auto px-6 mt-8 relative z-10">
        <AnimatePresence mode="wait">
          {searching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-8"
            >
              <div className="animate-pulse space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-800 rounded w-1/3" />
                    <div className="h-3 bg-slate-800 rounded w-1/4" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-24 bg-slate-800 rounded-2xl" />
                  <div className="h-24 bg-slate-800 rounded-2xl" />
                  <div className="h-24 bg-slate-800 rounded-2xl" />
                </div>
              </div>
            </motion.div>
          )}

          {!searching && searchAttempted && searchResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-r from-blue-950/40 to-slate-900/40 border border-blue-500/30 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative badges */}
              <div className="absolute top-6 right-6 flex gap-2">
                <span className="px-3.5 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Terverifikasi
                </span>
              </div>

              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start relative z-10">
                {/* Photo Placeholder */}
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-500/20">
                  {searchResult.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>

                <div className="flex-1 space-y-1">
                  <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider inline-block">
                    {searchResult.registration_number}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-white">{searchResult.full_name}</h3>
                  <p className="text-xs text-slate-400">
                    Asal Sekolah: <span className="text-slate-200 font-medium">{searchResult.school_origin}</span> | NISN: <span className="text-slate-200 font-mono">{searchResult.nisn}</span>
                  </p>

                  {/* Status Kelulusan & Sertifikat MPLS Banner */}
                  {settings?.is_certificate_published && (
                    <div className={`mt-6 p-6 rounded-[2rem] border relative overflow-hidden transition-all duration-300 ${
                      searchResult.graduation_status === 'Lulus'
                        ? 'bg-gradient-to-br from-emerald-950/40 via-emerald-900/10 to-slate-900/40 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                        : searchResult.graduation_status === 'Tidak Lulus'
                        ? 'bg-gradient-to-br from-rose-950/30 via-rose-900/10 to-slate-900/40 border-rose-500/20'
                        : 'bg-gradient-to-br from-slate-900 via-slate-900/50 to-slate-950 border-slate-800'
                    }`}>
                      {searchResult.graduation_status === 'Lulus' && (
                        <>
                          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
                            <Award className="w-48 h-48 text-emerald-400" />
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between relative z-10">
                            <div className="space-y-1.5 text-left">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <Award className="w-3.5 h-3.5" />
                                Hasil Kelulusan Resmi
                              </div>
                              <h4 className="text-lg md:text-xl font-black text-white">Selamat, Anda Dinyatakan LULUS MPLS!</h4>
                              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                                Selamat atas perjuangan dan kedisiplinan Anda selama mengikuti seluruh rangkaian Masa Pengenalan Lingkungan Sekolah. Anda berhak mendapatkan Sertifikat Kelulusan resmi.
                              </p>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleDownloadCertificate(searchResult)}
                              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-xs font-black text-slate-950 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                            >
                              <Award className="w-4 h-4" />
                              UNDUH SERTIFIKAT (.PNG)
                            </button>
                          </div>
                        </>
                      )}

                      {searchResult.graduation_status === 'Tidak Lulus' && (
                        <div className="flex gap-4 items-center relative z-10 text-left">
                          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1">Status Kelulusan</span>
                            <h4 className="text-sm font-bold text-white">Belum Memenuhi Syarat Kelulusan</h4>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                              Mohon maaf, berdasarkan hasil penilaian keaktifan dan kehadiran, Anda dinyatakan belum memenuhi syarat kelulusan MPLS tahun ini. Silakan hubungi kakak pendamping Binkel untuk informasi lebih lanjut.
                            </p>
                          </div>
                        </div>
                      )}

                      {!searchResult.graduation_status && (
                        <div className="flex gap-4 items-center relative z-10 text-left">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 animate-pulse">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status Kelulusan</span>
                            <h4 className="text-sm font-bold text-white">Status Kelulusan Sedang Diproses</h4>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                              Pembimbing Binkel Anda sedang melakukan rekapitulasi nilai kehadiran dan keaktifan. Status kelulusan dan sertifikat digital Anda akan segera diterbitkan secara serentak.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-800">
                    {/* Regu Card */}
                    <div className="bg-gradient-to-br from-blue-950/40 to-slate-900/60 p-5 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-500/5">
                      <span className="text-[10px] text-blue-400 uppercase tracking-widest font-black block mb-1">ALOKASI REGU MPLS</span>
                      <span className="text-xl font-black text-white block tracking-wide">
                        {searchResult.class?.regu || 'Menunggu Pembagian'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-800/60">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        {searchResult.class?.room_number || '-'} <span className="text-slate-600">•</span> <span className="text-slate-300 font-bold">{searchResult.class?.name || '-'}</span>
                      </span>
                    </div>

                    {/* Wali Kelas Card */}
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block mb-1">GURU WALI KELAS</span>
                        <span className="text-sm font-bold text-white block">
                          {searchResult.class?.teacher?.name || 'Menunggu Wali Kelas'}
                        </span>
                        {searchResult.class?.teacher?.phone ? (
                          <span className="text-xs text-slate-400 block mt-0.5">
                            HP/WA: {searchResult.class.teacher.phone}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 block">
                            NIP: {searchResult.class?.teacher?.nip || '-'}
                          </span>
                        )}
                      </div>
                      {searchResult.class?.teacher?.phone && (
                        <div className="mt-2.5">
                          <a
                            href={`https://wa.me/${searchResult.class.teacher.phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-[10px] font-bold text-white rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Phone className="w-3 h-3" />
                            Hubungi Wali Kelas
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Kakak Binkel Card */}
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block mb-1">KAKAK BINKEL (OSIS/MPK)</span>
                        <span className="text-sm font-bold text-white block">
                          {searchResult.class?.binkel_name || 'Menunggu Pendamping'}
                        </span>
                        {searchResult.class?.binkel_phone ? (
                          <span className="text-xs text-slate-400 block mt-0.5">
                            HP/WA: {searchResult.class.binkel_phone}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 italic block mt-0.5">Belum ada kontak</span>
                        )}
                      </div>
                      {searchResult.class?.binkel_phone && (
                        <div className="mt-2.5">
                          <a
                            href={`https://wa.me/${searchResult.class.binkel_phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-[10px] font-bold text-white rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Phone className="w-3 h-3" />
                            Hubungi Kakak Binkel
                          </a>
                        </div>
                      )}
                    </div>

                    {/* QR Code / WhatsApp Card */}
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block mb-1">KOMUNIKASI KELAS</span>
                        <span className="text-xs text-slate-300 block">
                          Segera gabung ke WhatsApp Group untuk informasi penting.
                        </span>
                      </div>
                      
                      {searchResult.class?.whatsapp_link ? (
                        <div className="mt-3 flex gap-2">
                          <a
                            href={searchResult.class.whatsapp_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-xs font-bold text-white rounded-lg transition-all flex items-center justify-center gap-1.5"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Gabung WhatsApp
                          </a>
                          {searchResult.class.qr_code_link && (
                            <a
                              href={searchResult.class.qr_code_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center"
                              title="Lihat QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5 text-slate-300" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic mt-2">Grup belum dirilis</span>
                      )}
                    </div>
                  </div>

                  {/* Tata Tertib & Panduan Downloads */}
                  <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a
                      href={settings?.guidebook_url || '#'}
                      onClick={(e) => {
                        if (settings?.guidebook_url === '#') {
                          e.preventDefault();
                          alert('Buku panduan sedang diunggah oleh panitia.');
                        }
                      }}
                      className="p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-slate-200 block">Download Buku Panduan MPLS</span>
                          <span className="text-[10px] text-slate-500">Panduan umum kegiatan siswa baru</span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </a>

                    <a
                      href={settings?.rules_url || '#'}
                      onClick={(e) => {
                        if (settings?.rules_url === '#') {
                          e.preventDefault();
                          alert('Dokumen tata tertib sedang diunggah oleh panitia.');
                        }
                      }}
                      className="p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-slate-200 block">Download Tata Tertib Siswa</span>
                          <span className="text-[10px] text-slate-500">Aturan berpakaian & disiplin</span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!searching && searchAttempted && !searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-rose-950/10 border border-rose-500/30 rounded-[2rem] p-8 text-center max-w-2xl mx-auto shadow-xl"
            >
              <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Data Tidak Ditemukan</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Maaf, pencarian dengan informasi yang Anda masukkan tidak menghasilkan data pembagian kelas.
                Harap periksa kembali penulisan <strong>NISN</strong> Anda.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setSearchAttempted(false);
                    setRegInput('');
                    setNisnInput('');
                    setDobInput('');
                  }}
                  className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Coba Cari Lagi
                </button>
                <a
                  href={`https://wa.me/${settings?.committee_phone || '087778358755'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-rose-600/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Hubungi Panitia (WA)
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ANNOUNCEMENT BOARD ROW */}
      <section className="max-w-7xl mx-auto px-6 mt-16 relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold text-white">Pengumuman Terbaru</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {announcements.length > 0 ? (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className={`bg-[#0F172A] border rounded-[2rem] p-6 shadow-lg flex flex-col justify-between ${
                  ann.is_pinned ? 'border-blue-500/40' : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {ann.is_pinned && (
                      <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-[9px] font-black uppercase tracking-wider">
                        PINNED
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      Diposting: {formatIndonesianDate(ann.created_at)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-3 hover:text-blue-400 transition-colors">
                    {ann.title}
                  </h3>
                  <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed line-clamp-6">
                    {ann.content}
                  </p>
                </div>
                {ann.attachment_url && (
                  <div className="mt-4 pt-4 border-t border-slate-800/60">
                    <a
                      href={ann.attachment_url}
                      className="text-xs text-blue-400 font-bold hover:underline flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Unduh Lampiran Pengumuman
                    </a>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-500 text-xs italic">
              Belum ada pengumuman yang dirilis.
            </div>
          )}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-6 mt-16 relative z-10">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <HelpCircle className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold text-white">Frequently Asked Questions (FAQ)</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left text-sm font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${
                      isOpen ? 'transform rotate-180 text-blue-500' : ''
                    }`}
                  />
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-900 pt-3">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer info school */}
      <footer className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-slate-900 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-slate-500">
          <div>
            <h5 className="font-bold text-slate-300 text-sm mb-3">SMAN 1 Bandung</h5>
            <p className="leading-relaxed">
              Alamat: Jl. Ir. H. Juanda No. 93, Dago, Kecamatan Coblong, Kota Bandung, Jawa Barat 40132
            </p>
            <p className="mt-2">
              Telepon: (022) 4205566 | Email: info@sman1bdg.sch.id
            </p>
          </div>
          <div>
            <h5 className="font-bold text-slate-300 text-sm mb-3">Kontak Panitia MPLS</h5>
            <p className="leading-relaxed">
              Jika Anda menemui masalah dalam pembagian kelas atau pencarian data, mohon hubungi sekretariat panitia:
            </p>
            <p className="mt-2 font-bold text-blue-400">
              Hotline WA: {settings?.committee_phone || '087778358755'}
            </p>
          </div>
          <div className="text-left md:text-right">
            <h5 className="font-bold text-slate-300 text-sm mb-3">Motto SMAN 1 Bandung</h5>
            <p className="font-bold text-slate-200 tracking-wider">"BERSATU"</p>
            <p className="text-[11px] text-slate-400 mt-1">Berilmu – Santun – Agamis – Tekun – Unggul</p>
            <p className="mt-4 text-[10px] text-slate-600">
              © {new Date().getFullYear()} SMAN 1 Bandung. All Rights Reserved. <br />
              Portal MPLS engineered with Local Hybrid Storage.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
