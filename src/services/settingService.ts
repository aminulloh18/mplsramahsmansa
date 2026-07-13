import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Setting } from '../types/database.types';
import { localDb } from './localDb';

export const settingService = {
  async getSettings(): Promise<Setting> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Supabase getSettings error:', error);
        return localDb.getSettings();
      }
      const settings = (data as Setting) || localDb.getSettings();
      if (settings && (settings.committee_phone === '08123456789' || !settings.committee_phone)) {
        settings.committee_phone = '087778358755';
      }
      return settings;
    }
    return localDb.getSettings();
  },

  async updateSettings(updates: Partial<Setting>, adminEmail: string): Promise<Setting> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('settings')
        .update({ ...updates })
        .eq('id', 'global') // Assuming a single record with ID 'global'
        .select()
        .single();

      if (error) {
        console.warn('Supabase updateSettings error:', error);
      } else {
        localDb.addLog(adminEmail, 'Update Pengaturan', `Memperbarui konfigurasi portal MPLS via Cloud SQL.`);
        return data as Setting;
      }
    }

    const current = localDb.getSettings();
    const updated = {
      ...current,
      ...updates,
    };
    localDb.saveSettings(updated);
    localDb.addLog(adminEmail, 'Update Pengaturan', `Memperbarui konfigurasi portal MPLS.`);
    return updated;
  }
};
