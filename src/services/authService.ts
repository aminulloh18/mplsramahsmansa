import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { localDb } from './localDb';
import { classService } from './classService';

export interface UserSession {
  id?: string;
  email: string;
  role: 'Administrator' | 'Binkel';
  binkelName?: string;
  binkelPhone?: string;
  classId?: string;
  className?: string;
  created_at?: string;
}

const SESSION_KEY = 'mpls_session';

export const authService = {
  getCurrentSession(): UserSession | null {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as UserSession;
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  async getSession(): Promise<UserSession | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        return {
          email: session.user.email || 'admin@sman1bdg.sch.id',
          role: 'Administrator',
        };
      }
    }
    
    // Local session
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as UserSession;
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  async login(email: string, password: string): Promise<UserSession> {
    const cleanEmail = email.trim().toLowerCase();
    const AUTHORIZED_ADMINS = ['aminulloh18@gmail.com', 'admin@sman1bdg.sch.id'];
    
    if (isSupabaseConfigured && supabase) {
      if (!AUTHORIZED_ADMINS.includes(cleanEmail)) {
        throw new Error('Email Anda tidak terdaftar sebagai Panitia SMAN 1 Bandung.');
      }

      // 1. Try to sign in via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data.user) {
        const sessionObj: UserSession = {
          email: data.user.email || cleanEmail,
          role: 'Administrator',
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionObj));
        localDb.addLog(sessionObj.email, 'Login', 'Berhasil login administrator via Supabase Auth.');
        return sessionObj;
      }

      // 2. If user not found or invalid credentials on Supabase, try to auto-register them ONLY if the password is correct
      const errMsg = error?.message?.toLowerCase() || '';
      if (error && (errMsg.includes('invalid login') || errMsg.includes('not found') || error.status === 400)) {
        if (password === 'panitiampls') {
          try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: cleanEmail,
              password: password,
            });

            if (!signUpError && signUpData.user) {
              const sessionObj: UserSession = {
                email: signUpData.user.email || cleanEmail,
                role: 'Administrator',
              };
              localStorage.setItem(SESSION_KEY, JSON.stringify(sessionObj));
              localDb.addLog(sessionObj.email, 'Registrasi Otomatis', 'Berhasil mendaftarkan & masuk akun panitia baru via Supabase.');
              return sessionObj;
            }
          } catch (signUpErr) {
            console.warn('Supabase auto signup fallback failed:', signUpErr);
          }
        }
      }
    }

    // 3. Fallback to Local simulation login (strictly restricted to authorized emails with 'panitiampls')
    if (
      (cleanEmail === 'aminulloh18@gmail.com' && password === 'panitiampls') ||
      (cleanEmail === 'admin@sman1bdg.sch.id' && password === 'panitiampls')
    ) {
      const sessionObj: UserSession = {
        email: cleanEmail,
        role: 'Administrator',
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionObj));
      localDb.addLog(sessionObj.email, 'Login', 'Berhasil login administrator (Mode Hybrid Simposium/Lokal Fallback).');
      return sessionObj;
    } else {
      throw new Error('Kredensial salah atau email Anda tidak terdaftar sebagai administrator.');
    }
  },

  async loginBinkel(phone: string): Promise<UserSession> {
    const normalizePhone = (p: string) => {
      let cleaned = p.replace(/[^0-9]/g, '');
      if (cleaned.startsWith('62')) {
        cleaned = '0' + cleaned.slice(2);
      }
      if (cleaned.startsWith('8')) {
        cleaned = '0' + cleaned;
      }
      return cleaned;
    };

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const normalizedInput = normalizePhone(phone);
    
    if (!cleanPhone) {
      throw new Error('Nomor HP tidak boleh kosong.');
    }
    
    console.log('--- PROSES LOGIN BINKEL ---');
    console.log('Supabase Terkonfigurasi:', isSupabaseConfigured);
    console.log('Input HP Asli:', phone);
    console.log('Input HP Clean:', cleanPhone);
    console.log('Input HP Normalisasi:', normalizedInput);

    const classes = await classService.getClasses();
    console.log('Total Kelas Ditemukan:', classes.length);
    console.log('Daftar Kelas & HP Binkel dari DB:', classes.map(c => ({
      name: c.name,
      binkel_name: c.binkel_name,
      binkel_phone_raw: c.binkel_phone,
      binkel_phone_normalized: c.binkel_phone ? normalizePhone(c.binkel_phone) : null
    })));
    
    // Find class with this binkel phone using normalized comparison or suffix match
    const matchingClass = classes.find(c => {
      if (!c.binkel_phone) return false;
      const normalizedClassPhone = normalizePhone(c.binkel_phone);
      
      const matchNormalized = normalizedClassPhone === normalizedInput;
      const matchSuffix = normalizedClassPhone.endsWith(cleanPhone) || cleanPhone.endsWith(normalizedClassPhone);
      
      return matchNormalized || matchSuffix;
    });

    if (!matchingClass) {
      console.warn('❌ LOGIN GAGAL: Tidak ada kelas yang cocok untuk nomor:', phone);
      throw new Error('Nomor HP Pendamping (Binkel) tidak terdaftar di kelas manapun. Silakan hubungi Administrator.');
    }

    console.log('✅ LOGIN BERHASIL: Menemukan Kelas:', matchingClass.name, 'untuk Binkel:', matchingClass.binkel_name);

    const sessionObj: UserSession = {
      email: `${cleanPhone}@binkel.mpls`,
      role: 'Binkel',
      binkelName: matchingClass.binkel_name || 'Pendamping',
      binkelPhone: matchingClass.binkel_phone,
      classId: matchingClass.id,
      className: matchingClass.name,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionObj));
    localDb.addLog(sessionObj.email, 'Login Binkel', `Binkel ${sessionObj.binkelName} berhasil masuk untuk kelas ${sessionObj.className}.`);
    return sessionObj;
  },

  async logout(): Promise<void> {
    const sessionObj = await this.getSession();
    const email = sessionObj ? sessionObj.email : 'unknown';

    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }

    localStorage.removeItem(SESSION_KEY);
    localDb.addLog(email, 'Logout', 'Sesi administrator berakhir.');
  }
};
