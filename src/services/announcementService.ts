import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Announcement } from '../types/database.types';
import { localDb } from './localDb';

export const announcementService = {
  async getAnnouncements(includeDrafts = false): Promise<Announcement[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('announcements').select('*');
      if (!includeDrafts) {
        query = query.eq('status', 'Published');
      }
      const { data, error } = await query;
      if (error) {
        console.warn('Supabase getAnnouncements error:', error);
        return this.getAnnouncementsLocal(includeDrafts);
      }
      return (data as Announcement[]).sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return this.getAnnouncementsLocal(includeDrafts);
  },

  getAnnouncementsLocal(includeDrafts = false): Announcement[] {
    const list = localDb.getAnnouncements();
    const filtered = includeDrafts ? list : list.filter((a) => a.status === 'Published');
    return filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  },

  async createAnnouncement(ann: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>, adminEmail: string): Promise<Announcement> {
    const newId = `a-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const newAnn: Announcement = {
      ...ann,
      id: newId,
      created_at: timestamp,
      updated_at: timestamp,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('announcements')
        .insert([newAnn])
        .select()
        .single();

      if (error) {
        console.warn('Supabase createAnnouncement error:', error);
      } else {
        localDb.addLog(adminEmail, 'Tambah Pengumuman', `Membuat pengumuman baru: ${ann.title} via Cloud SQL.`);
        return data as Announcement;
      }
    }

    const announcements = localDb.getAnnouncements();
    announcements.push(newAnn);
    localDb.saveAnnouncements(announcements);
    localDb.addLog(adminEmail, 'Tambah Pengumuman', `Membuat pengumuman baru: ${ann.title}.`);
    return newAnn;
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>, adminEmail: string): Promise<Announcement> {
    const timestamp = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('announcements')
        .update({ ...updates, updated_at: timestamp })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('Supabase updateAnnouncement error:', error);
      } else {
        localDb.addLog(adminEmail, 'Update Pengumuman', `Mengubah pengumuman ID: ${id} via Cloud SQL.`);
        return data as Announcement;
      }
    }

    const announcements = localDb.getAnnouncements();
    const idx = announcements.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Announcement not found');

    const updated = {
      ...announcements[idx],
      ...updates,
      updated_at: timestamp,
    };

    announcements[idx] = updated;
    localDb.saveAnnouncements(announcements);
    localDb.addLog(adminEmail, 'Update Pengumuman', `Mengubah pengumuman: ${updated.title}.`);
    return updated;
  },

  async deleteAnnouncement(id: string, adminEmail: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase deleteAnnouncement error:', error);
      } else {
        localDb.addLog(adminEmail, 'Hapus Pengumuman', `Menghapus pengumuman ID: ${id} via Cloud SQL.`);
        return;
      }
    }

    const announcements = localDb.getAnnouncements();
    const idx = announcements.findIndex((a) => a.id === id);
    if (idx !== -1) {
      const ann = announcements[idx];
      announcements.splice(idx, 1);
      localDb.saveAnnouncements(announcements);
      localDb.addLog(adminEmail, 'Hapus Pengumuman', `Menghapus pengumuman: ${ann.title}.`);
    }
  }
};
