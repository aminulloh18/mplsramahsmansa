import React, { useState } from 'react';
import { UserCheck, Shield, Key, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { UserSession } from '../../services/authService';

interface ProfileProps {
  session: UserSession;
  onLogout: () => void;
}

export default function Profile({ session, onLogout }: ProfileProps) {
  const [success, setSuccess] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 5) {
      alert('Sandi baru harus minimal 5 karakter!');
      return;
    }
    setSuccess('Kata sandi simulasi administrator berhasil diperbarui.');
    setOldPassword('');
    setNewPassword('');
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div>
        <h2 className="text-xl font-black text-white">Profil & Keamanan Akun Panitia</h2>
        <p className="text-xs text-slate-500">
          Ubah kredensial masuk admin, lihat hak akses, dan lakukan sign-out sesi kerja secara aman.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* User Card */}
        <div className="col-span-12 md:col-span-6 bg-[#0F172A] border border-slate-800 rounded-[2rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[60px]" />
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {session.email.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                PANITIA UTAMA MPLS
              </span>
              <h3 className="text-base font-black text-white mt-1">{session.email}</h3>
              <p className="text-[10px] text-slate-500">Sesi ID: {(session.id || 'SESSION-LOCAL-001').substring(0, 18)}...</p>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-6 space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Status Akun:</span>
              <span className="font-bold text-green-400 flex items-center gap-1">
                <UserCheck className="w-4 h-4" /> AKTIF
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Hak Akses Tingkat:</span>
              <span className="font-bold text-slate-200 flex items-center gap-1">
                <Shield className="w-4 h-4 text-blue-400" /> FULL ADMINISTRATOR
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Waktu Login:</span>
              <span className="font-mono text-slate-300">
                {new Date(session.created_at || new Date().toISOString()).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onLogout}
              className="w-full py-2.5 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/10 hover:border-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              KELUAR DARI PANEL PANITIA
            </button>
          </div>
        </div>

        {/* Change password section */}
        <div className="col-span-12 md:col-span-6 bg-[#0F172A] border border-slate-800 rounded-[2rem] p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-white">Ubah Kata Sandi Panitia</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Kata Sandi Lama</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Kata Sandi Baru</label>
              <input
                type="password"
                required
                placeholder="Minimal 5 Karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              SIMPAN KATA SANDI
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
