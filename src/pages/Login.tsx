import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowLeft, ShieldAlert, Sparkles, Phone } from 'lucide-react';
import { authService, UserSession } from '../services/authService';

interface LoginProps {
  onLoginSuccess: (session: UserSession) => void;
  onGoBack: () => void;
}

export default function Login({ onLoginSuccess, onGoBack }: LoginProps) {
  const [loginMode, setLoginMode] = useState<'admin' | 'binkel'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [binkelPhone, setBinkelPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (loginMode === 'binkel') {
        const session = await authService.loginBinkel(binkelPhone);
        onLoginSuccess(session);
      } else {
        const session = await authService.login(email, password);
        onLoginSuccess(session);
      }
    } catch (err: any) {
      setError(err?.message || 'Login gagal. Periksa kembali kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center p-6 relative selection:bg-blue-600 selection:text-white">
      {/* Decorative background gradients */}
      <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Back Button */}
        <button
          onClick={onGoBack}
          className="mb-8 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          KEMBALI KE PORTAL UTAMA
        </button>

        {/* Card Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0F172A]/80 backdrop-blur-md border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Card Glass Accent */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-black text-white">LOGIN PORTAL MPLS</h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Silakan masuk untuk mengelola portal atau mengisi presensi dan kebugaran siswa.
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="flex border-b border-slate-800/80 mb-6 gap-2">
            <button
              type="button"
              onClick={() => {
                setLoginMode('admin');
                setError(null);
              }}
              className={`flex-1 pb-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                loginMode === 'admin'
                  ? 'border-blue-500 text-blue-400 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Panitia / Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('binkel');
                setError(null);
              }}
              className={`flex-1 pb-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                loginMode === 'binkel'
                  ? 'border-emerald-500 text-emerald-400 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Pendamping (Binkel)
            </button>
          </div>

          {/* Warning or Error Status */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-400"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {loginMode === 'admin' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    Email Panitia
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="admin@sman1bdg.sch.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <Mail className="w-4 h-4 text-slate-600 absolute left-4 top-3.5" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Kata Sandi
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <Lock className="w-4 h-4 text-slate-600 absolute left-4 top-3.5" />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider">
                  Nomor HP Pendamping (Binkel)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 081234567890"
                    value={binkelPhone}
                    onChange={(e) => setBinkelPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-900/30 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <Phone className="w-4 h-4 text-emerald-600 absolute left-4 top-3.5" />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  Masukkan nomor HP yang terdaftar pada menu Data Kelas di Administrator.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 active:scale-98 text-sm font-bold text-white rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 mt-2 ${
                loginMode === 'admin'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses Masuk...
                </>
              ) : loginMode === 'admin' ? (
                'MASUK KE DASHBOARD ADMIN'
              ) : (
                'MASUK SEBAGAI BINKEL'
              )}
            </button>
          </form>

          {/* Quick Info Box */}
          <div className="mt-8 pt-6 border-t border-slate-800/60 text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
            <p className="font-bold text-slate-400">Petunjuk Simulasi Sandbox:</p>
            {loginMode === 'admin' ? (
              <>
                <p>1. Masukkan email panitia apa saja (contoh: <code className="text-blue-400 font-mono">aminulloh18@gmail.com</code> atau <code className="text-blue-400 font-mono">admin@sman1bdg.sch.id</code>).</p>
                <p>2. Gunakan kata sandi simulasi: <code className="text-blue-400 font-mono">admin</code> atau <code className="text-blue-400 font-mono">123456</code>.</p>
              </>
            ) : (
              <>
                <p>1. Gunakan No HP Pendamping dari data kelas yang ada, contoh: <code className="text-emerald-400 font-mono">081234567890</code> (Farhan) atau <code className="text-emerald-400 font-mono">081298765432</code> (Nabila).</p>
                <p>2. Tekan tombol <strong className="text-slate-300">MASUK SEBAGAI BINKEL</strong> untuk langsung mengakses panel presensi & kebugaran kelas tersebut.</p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
