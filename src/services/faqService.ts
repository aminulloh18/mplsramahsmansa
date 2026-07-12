import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FAQ } from '../types/database.types';
import { localDb } from './localDb';

export const faqService = {
  async getFAQs(): Promise<FAQ[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('faq')
        .select('*')
        .order('order_num', { ascending: true });

      if (error) {
        console.warn('Supabase getFAQs error:', error);
        return localDb.getFAQs();
      }
      return data as FAQ[];
    }
    return localDb.getFAQs();
  },

  async createFAQ(faq: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>, adminEmail: string): Promise<FAQ> {
    const newId = `faq-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const newFAQ: FAQ = {
      ...faq,
      id: newId,
      created_at: timestamp,
      updated_at: timestamp,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('faq')
        .insert([newFAQ])
        .select()
        .single();

      if (error) {
        console.warn('Supabase createFAQ error:', error);
      } else {
        localDb.addLog(adminEmail, 'Tambah FAQ', `Membuat FAQ baru: "${faq.question.substring(0, 40)}..." via Cloud SQL.`);
        return data as FAQ;
      }
    }

    const faqs = localDb.getFAQs();
    faqs.push(newFAQ);
    localDb.saveFAQs(faqs);
    localDb.addLog(adminEmail, 'Tambah FAQ', `Membuat FAQ baru: "${faq.question.substring(0, 40)}...".`);
    return newFAQ;
  },

  async updateFAQ(id: string, updates: Partial<FAQ>, adminEmail: string): Promise<FAQ> {
    const timestamp = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('faq')
        .update({ ...updates, updated_at: timestamp })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('Supabase updateFAQ error:', error);
      } else {
        localDb.addLog(adminEmail, 'Update FAQ', `Mengubah FAQ ID: ${id} via Cloud SQL.`);
        return data as FAQ;
      }
    }

    const faqs = localDb.getFAQs();
    const idx = faqs.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('FAQ not found');

    const updated = {
      ...faqs[idx],
      ...updates,
      updated_at: timestamp,
    };

    faqs[idx] = updated;
    localDb.saveFAQs(faqs);
    localDb.addLog(adminEmail, 'Update FAQ', `Mengubah FAQ: "${updated.question.substring(0, 40)}...".`);
    return updated;
  },

  async deleteFAQ(id: string, adminEmail: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('faq')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase deleteFAQ error:', error);
      } else {
        localDb.addLog(adminEmail, 'Hapus FAQ', `Menghapus FAQ ID: ${id} via Cloud SQL.`);
        return;
      }
    }

    const faqs = localDb.getFAQs();
    const idx = faqs.findIndex((f) => f.id === id);
    if (idx !== -1) {
      const deleted = faqs[idx];
      faqs.splice(idx, 1);
      localDb.saveFAQs(faqs);
      localDb.addLog(adminEmail, 'Hapus FAQ', `Menghapus FAQ: "${deleted.question.substring(0, 40)}...".`);
    }
  }
};
